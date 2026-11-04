"""The look-back checker. scan() is a pure function: no I/O, no clock, no mutation of its inputs.

Rules 1, 2 and 5 map to Mastiff's three live holds (bank details changed, payee not on file,
amount out of range) and read "would have held". Rules 3, 4, 6 and 7 are cautions and read
"worth checking". Mastiff flags; the firm makes every payment decision.
"""
from __future__ import annotations

import difflib
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from typing import Dict, Iterable, List, Optional, Sequence

from .normalize import normalize_name

HELD = "would have held"
CHECK = "worth checking"

WEIGHTS = {1: 100, 2: 90, 3: 80, 4: 70, 5: 60, 6: 50, 7: 40}
VERDICTS = {1: HELD, 2: HELD, 3: CHECK, 4: CHECK, 5: HELD, 6: CHECK, 7: CHECK}
RULE_NAMES = {
    1: "Bank details changed",
    2: "Paid once, never again",
    3: "Possible duplicate",
    4: "Lookalike vendor names",
    5: "Amount out of range",
    6: "Just under the approval line",
    7: "No matching bill",
}


@dataclass(frozen=True)
class Payment:
    row: int
    date: date
    payee: str
    amount: Decimal
    method: str = ""
    check_or_ref: str = ""
    invoice_no: str = ""
    memo: str = ""
    account_last4: str = ""
    routing_last4: str = ""


@dataclass(frozen=True)
class Bill:
    date: date
    payee: str
    amount: Decimal
    invoice_no: str = ""
    terms: str = ""  # raw payment terms text, e.g. "2/10 net 30"; empty when the file has none
    discount_date: Optional[date] = None
    discount_percent: Optional[Decimal] = None


@dataclass(frozen=True)
class Settings:
    payment_line: Decimal = Decimal("5000")
    duplicate_days: int = 14
    lookalike_ratio: float = 0.88
    lookalike_min_name_len: int = 5
    lookalike_clean_history: int = 6  # both vendors this long with different accounts: not a lookalike
    range_multiple: Decimal = Decimal("2")
    min_history: int = 3  # prior payments needed before the trailing average is trusted
    trailing_n: int = 12
    round_unit: Decimal = Decimal("100")
    round_min: Decimal = Decimal("1000")
    cluster_days: int = 30
    cluster_under_pct: Decimal = Decimal("0.05")
    cluster_min: int = 3
    bill_window_days: int = 120
    bill_amount_tolerance: Decimal = Decimal("0.01")
    recent_days: int = 30


@dataclass(frozen=True)
class Flag:
    rule: int
    weight: int
    verdict: str
    row: int
    date: date
    payee: str
    amount: Decimal
    reason: str
    check: str


def _m(d: Decimal) -> str:
    return f"${d:,.2f}"


def _d(d: date) -> str:
    return d.strftime("%b %d, %Y").replace(" 0", " ")


def _flag(rule: int, p: Payment, reason: str, check: str) -> Flag:
    return Flag(rule, WEIGHTS[rule], VERDICTS[rule], p.row, p.date, p.payee, p.amount, reason, check)


def _rule1(groups: Dict[str, List[Payment]]) -> List[Flag]:
    out = []
    for g in groups.values():
        prev: Optional[Payment] = None
        for p in g:
            if not (p.account_last4 or p.routing_last4):
                continue
            if prev is not None:
                parts = []
                if p.account_last4 and prev.account_last4 and p.account_last4 != prev.account_last4:
                    parts.append(f"account ending {p.account_last4} (was {prev.account_last4})")
                if p.routing_last4 and prev.routing_last4 and p.routing_last4 != prev.routing_last4:
                    parts.append(f"routing ending {p.routing_last4} (was {prev.routing_last4})")
                if parts:
                    out.append(_flag(
                        1, p,
                        f"Bank details changed: paid to {' and '.join(parts)}; last paid on {_d(prev.date)}.",
                        "Call the vendor on the number already on file, not one from an email, "
                        "and confirm they asked for the change.",
                    ))
            prev = p
    return out


def _rule2(groups: Dict[str, List[Payment]], s: Settings) -> List[Flag]:
    out = []
    for g in groups.values():
        if len(g) != 1:
            continue
        p = g[0]
        why = []
        if p.amount >= s.round_min and p.amount % s.round_unit == 0:
            why.append("a round amount")
        if p.amount > s.payment_line:
            why.append(f"a first payment over the {_m(s.payment_line)} line")
        if why:
            out.append(_flag(
                2, p,
                f"Paid once and not again: {_m(p.amount)} on {_d(p.date)}, {' and '.join(why)}.",
                "Confirm this payee was an expected vendor and that the goods or work were received.",
            ))
    return out


def _dup_match(g: List[Payment], i: int, s: Settings):
    """The earlier payment in group g (sorted by date) that payment g[i] repeats, or None.

    Returns (earlier, by_invoice). Shared by rule 3 and the money findings.
    """
    p = g[i]
    inv = p.invoice_no.strip().lower()
    for q in g[:i]:
        if inv and q.invoice_no.strip().lower() == inv:
            return q, True
        if q.amount == p.amount and 0 <= (p.date - q.date).days <= s.duplicate_days:
            return q, False
    return None


def duplicate_pairs(payments: Iterable[Payment], settings: Optional[Settings] = None):
    """Rule 3's detection as (earlier, later, by_invoice) tuples, ordered by the later payment's date."""
    s = settings or Settings()
    groups: Dict[str, List[Payment]] = defaultdict(list)
    for p in sorted(payments, key=lambda p: (p.date, p.row)):
        groups[normalize_name(p.payee)].append(p)
    out = []
    for g in groups.values():
        for i in range(len(g)):
            m = _dup_match(g, i, s)
            if m:
                out.append((m[0], g[i], m[1]))
    return sorted(out, key=lambda t: (t[1].date, t[1].payee, t[1].row))


def _rule3(groups: Dict[str, List[Payment]], s: Settings) -> List[Flag]:
    out = []
    for g in groups.values():
        for i, p in enumerate(g):
            m = _dup_match(g, i, s)
            if not m:
                continue
            q, by_invoice = m
            if by_invoice:
                hit = f"Invoice {p.invoice_no.strip()} appears twice: paid on {_d(q.date)} and {_d(p.date)}."
            else:
                hit = (f"Possible duplicate: {_m(p.amount)} paid on {_d(q.date)} and again on {_d(p.date)} "
                       f"({(p.date - q.date).days} days apart).")
            out.append(_flag(
                3, p, hit,
                "Compare both payments to the bill. If one was not owed, ask the vendor for a credit or refund.",
            ))
    return out


def _rule4(groups: Dict[str, List[Payment]], s: Settings) -> List[Flag]:
    out = []
    keys = sorted(k for k in groups if len(k) >= s.lookalike_min_name_len)
    accts = {k: {p.account_last4 for p in groups[k] if p.account_last4} for k in keys}
    for i, a in enumerate(keys):
        for b in keys[i + 1:]:
            if abs(len(a) - len(b)) > 3:
                continue
            sm = difflib.SequenceMatcher(None, a, b)
            if sm.real_quick_ratio() < s.lookalike_ratio or sm.quick_ratio() < s.lookalike_ratio:
                continue
            ratio = sm.ratio()
            if ratio < s.lookalike_ratio:
                continue
            both_long = len(groups[a]) >= s.lookalike_clean_history and len(groups[b]) >= s.lookalike_clean_history
            if both_long and accts[a] and accts[b] and accts[a].isdisjoint(accts[b]):
                continue  # two established companies with their own accounts
            # attach to the less-used record's most recent payment
            small, big = sorted((a, b), key=lambda k: (len(groups[k]), k))
            p = groups[small][-1]
            big_name = groups[big][-1].payee
            out.append(_flag(
                4, p,
                f"Vendor name '{p.payee}' is nearly identical to '{big_name}' "
                f"(similarity {ratio:.2f}); {len(groups[small])} and {len(groups[big])} payments on file.",
                "Confirm these are two different companies and not one vendor entered twice or a lookalike.",
            ))
    return out


def _rule5(groups: Dict[str, List[Payment]], s: Settings) -> List[Flag]:
    out = []
    for g in groups.values():
        for i, p in enumerate(g):
            prior = g[:i]
            if not prior:
                if p.amount > s.payment_line:
                    out.append(_flag(
                        5, p,
                        f"Amount out of range: first payment to this payee, {_m(p.amount)}, "
                        f"is over the {_m(s.payment_line)} line.",
                        "Match the payment to a signed quote, contract or approved bill.",
                    ))
            elif len(prior) >= s.min_history:
                recent = prior[-s.trailing_n:]
                avg = sum((q.amount for q in recent), Decimal(0)) / len(recent)
                if p.amount > s.range_multiple * avg:
                    out.append(_flag(
                        5, p,
                        f"Amount out of range: {_m(p.amount)} is {float(p.amount / avg):.1f} times "
                        f"this vendor's usual {_m(avg)}.",
                        "Match the payment to a signed quote, contract or approved bill.",
                    ))
    return out


def _rule6(groups: Dict[str, List[Payment]], s: Settings) -> List[Flag]:
    out = []
    low = s.payment_line * (1 - s.cluster_under_pct)
    for g in groups.values():
        near = [p for p in g if low <= p.amount < s.payment_line]
        best: Dict[int, int] = {}
        for p in near:
            members = [q for q in near if 0 <= (q.date - p.date).days <= s.cluster_days]
            if len(members) >= s.cluster_min:
                for q in members:
                    best[q.row] = max(best.get(q.row, 0), len(members))
        for p in near:
            if p.row in best:
                out.append(_flag(
                    6, p,
                    f"{best[p.row]} payments to this payee within {s.cluster_days} days, each just under "
                    f"the {_m(s.payment_line)} line ({_m(p.amount)} on {_d(p.date)}).",
                    "Check whether one larger bill was split into smaller payments, and who approved each.",
                ))
    return out


def _rule7(groups: Dict[str, List[Payment]], bills: Sequence[Bill], s: Settings) -> List[Flag]:
    by_payee: Dict[str, List[Bill]] = defaultdict(list)
    for b in bills:
        by_payee[normalize_name(b.payee)].append(b)
    consumed: set = set()
    out = []
    ordered = sorted((p for g in groups.values() for p in g), key=lambda p: (p.date, p.row))
    for p in ordered:
        cands = [(i, b) for i, b in enumerate(by_payee.get(normalize_name(p.payee), [])) if (normalize_name(p.payee), i) not in consumed]
        key = normalize_name(p.payee)
        pick = None
        inv = p.invoice_no.strip().lower()
        if inv:
            pick = next((i for i, b in cands if b.invoice_no.strip().lower() == inv), None)
        if pick is None:
            ok = [
                (abs((p.date - b.date).days), i) for i, b in cands
                if abs(b.amount - p.amount) <= s.bill_amount_tolerance
                and -7 <= (p.date - b.date).days <= s.bill_window_days
            ]
            if ok:
                pick = min(ok)[1]
        if pick is not None:
            consumed.add((key, pick))
        else:
            out.append(_flag(
                7, p,
                f"No matching bill in the bills file for {_m(p.amount)} paid on {_d(p.date)}.",
                "Find the bill or invoice behind this payment. If there is none, ask who approved it.",
            ))
    return out


def scan(payments: Iterable[Payment], settings: Optional[Settings] = None,
         bills: Optional[Sequence[Bill]] = None) -> List[Flag]:
    """Run every rule over the payments. Returns flags sorted by weight (heaviest first), then date."""
    s = settings or Settings()
    ordered = sorted(payments, key=lambda p: (p.date, p.row))
    groups: Dict[str, List[Payment]] = defaultdict(list)
    for p in ordered:
        groups[normalize_name(p.payee)].append(p)
    flags: List[Flag] = []
    flags += _rule1(groups)
    flags += _rule2(groups, s)
    flags += _rule3(groups, s)
    flags += _rule4(groups, s)
    flags += _rule5(groups, s)
    flags += _rule6(groups, s)
    if bills is not None:
        flags += _rule7(groups, bills, s)
    return sorted(flags, key=lambda f: (-f.weight, f.date, f.payee, f.row))
