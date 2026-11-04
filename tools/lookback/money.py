"""Money worth checking: dollar figures that belong to the office. find_money() is pure.

Three findings, all advisory ("possible", "may", "worth checking"):
  1. Possible duplicate payments to recover (rule 3's detection; the later payment's amount).
  2. Late fees and interest paid, read from payee, memo and invoice fields.
  3. Early-payment discounts missed, only when the bills file carries payment terms. Terms are never guessed.
Mastiff flags. Your firm makes every payment decision.
"""
from __future__ import annotations

import re
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

from .normalize import normalize_name
from .rules import Bill, Payment, Settings, duplicate_pairs

CENT = Decimal("0.01")
ZERO = Decimal("0")

DUP_CHECK = ("Compare both payments to the bill. If the second was not owed, "
             "ask the vendor for a credit on the next invoice or a refund.")
LATE_CHECK = ("Worth checking: a memo can mislead. Look at the statement or invoice to see whether this was "
              "a late fee or interest, and what date it was due.")
DISCOUNT_CHECK = "Worth checking: confirm the terms with the vendor, then pay by the discount date."
NOT_CHECKED_NO_TERMS = "Not checked: the bills file has no payment terms."
NOT_CHECKED_NO_BILLS = "Not checked: no bills file was loaded, so payment terms are unknown."

# --- late fees -------------------------------------------------------------------------------
_FEE = (r"late\s+fees?|late\s+charges?|late\s+payments?|penalt(?:y|ies)|nsf|"
        r"returned\s+payment\s+fees?|past\s+due\s+fees?|reinstatement\s+fees?")
_INTEREST = r"finance\s+charges?|interest\s+charges?"
FEE_RE = re.compile(rf"(?i)\b({_FEE})\b")
INTEREST_RE = re.compile(rf"(?i)\b({_INTEREST})\b")
LATE_ALONE_RE = re.compile(r"(?i)^\W*late\W*$")
LENDER_RE = re.compile(r"(?i)\b(bank|bancorp|credit\s+union|lending|lender|mortgage|loans?|financial|finance|"
                       r"capital|savings)\b")
LOAN_MEMO_RE = re.compile(r"(?i)\b(loan\s+payment|mortgage)\b")

# --- terms -----------------------------------------------------------------------------------
TERMS_RE = re.compile(
    r"(?i)(?<![\d.])(\d+(?:\.\d+)?)\s*%?\s*[/ ]\s*(\d+)\s*(?:days?)?\s*,?\s*(?:net|n)\s*[/ ]?\s*(\d+)(?!\d)"
)


@dataclass(frozen=True)
class Terms:
    percent: Decimal
    days: int
    net: int


def parse_terms(text: str) -> Optional[Terms]:
    """'2/10 net 30', '2% 10 net 30', '1/15 n45' -> Terms. None for anything else; never guesses."""
    m = TERMS_RE.search(text or "")
    if not m:
        return None
    pct, days, net = Decimal(m.group(1)), int(m.group(2)), int(m.group(3))
    if not (0 < pct <= 100) or days <= 0 or net <= days:
        return None
    return Terms(pct, days, net)


@dataclass(frozen=True)
class DuplicatePair:
    vendor: str
    first_date: date
    second_date: date
    amount: Decimal  # the second payment: the amount worth asking back
    first_row: int
    second_row: int
    by_invoice: bool


@dataclass(frozen=True)
class LateFee:
    vendor: str
    date: date
    amount: Decimal
    row: int
    matched: str  # the phrase that matched, lower case
    field: str  # payee, memo or invoice


@dataclass(frozen=True)
class MissedDiscount:
    vendor: str
    bill_date: date
    discount_by: date
    paid_date: date
    bill_amount: Decimal
    percent: Decimal
    amount: Decimal  # the discount that was not taken
    terms: str


@dataclass(frozen=True)
class MoneyRow:
    finding: str
    vendor: str
    dates: str
    amount: Optional[Decimal]
    check: str


def _m(d: Decimal) -> str:
    return f"${d:,.2f}"


def _iso(d: date) -> str:
    return d.isoformat()


def _plural(n: int, one: str, many: str) -> str:
    return f"{n} {one if n == 1 else many}"


def _sum(values: Iterable[Decimal]) -> Decimal:
    return sum(values, ZERO)


@dataclass(frozen=True)
class MoneyFindings:
    duplicates: Tuple[DuplicatePair, ...] = ()
    late_fees: Tuple[LateFee, ...] = ()
    discounts: Tuple[MissedDiscount, ...] = ()
    discounts_checked: bool = False
    discounts_note: str = NOT_CHECKED_NO_BILLS

    @property
    def duplicate_total(self) -> Decimal:
        return _sum(d.amount for d in self.duplicates)

    @property
    def late_total(self) -> Decimal:
        return _sum(f.amount for f in self.late_fees)

    @property
    def discount_total(self) -> Decimal:
        return _sum(d.amount for d in self.discounts)

    @property
    def late_by_vendor(self) -> List[Tuple[str, int, Decimal]]:
        acc: Dict[str, List[LateFee]] = defaultdict(list)
        for f in self.late_fees:
            acc[f.vendor].append(f)
        return sorted(((v, len(fs), _sum(f.amount for f in fs)) for v, fs in acc.items()),
                      key=lambda t: (-t[2], t[0]))

    @property
    def duplicate_line(self) -> str:
        if not self.duplicates:
            return "No possible duplicate payments found."
        return (f"Possible duplicate payments: {_m(self.duplicate_total)} across "
                f"{_plural(len(self.duplicates), 'pair', 'pairs')}. Ask these vendors for a credit or refund.")

    @property
    def late_line(self) -> str:
        if not self.late_fees:
            return "No late fees or interest found in payee, memo or invoice fields."
        vendors = len({f.vendor for f in self.late_fees})
        return (f"Late fees and interest paid: {_m(self.late_total)} across "
                f"{_plural(len(self.late_fees), 'payment', 'payments')} to "
                f"{_plural(vendors, 'vendor', 'vendors')}. Paying these on time stops this.")

    @property
    def discount_line(self) -> str:
        if not self.discounts_checked:
            return self.discounts_note
        if not self.discounts:
            return "No early-payment discounts missed on the bills with terms."
        return (f"Early-payment discounts missed: {_m(self.discount_total)} on "
                f"{_plural(len(self.discounts), 'bill', 'bills')}. Paying by the discount date keeps this.")

    @property
    def total(self) -> Decimal:
        return self.duplicate_total + self.late_total + self.discount_total

    @property
    def summary_sentence(self) -> str:
        """Second sentence of the summary line; empty when every total is zero."""
        parts = []
        if self.duplicate_total:
            parts.append(f"{_m(self.duplicate_total)} in duplicate payments")
        if self.late_total:
            parts.append(f"{_m(self.late_total)} in late fees and interest")
        if self.discount_total:
            parts.append(f"{_m(self.discount_total)} in missed discounts")
        if not parts:
            return ""
        return "Possible money back or stopped: " + ", ".join(parts) + "."

    def rows(self) -> List[MoneyRow]:
        out: List[MoneyRow] = []
        for d in self.duplicates:
            how = "same invoice number twice" if d.by_invoice else "same amount within days"
            out.append(MoneyRow(
                "Possible duplicate payment", d.vendor, f"{_iso(d.first_date)}; {_iso(d.second_date)}",
                d.amount, f"{DUP_CHECK} ({how}.)"))
        for f in sorted(self.late_fees, key=lambda f: (f.date, f.vendor, f.row)):
            out.append(MoneyRow("Late fee or interest", f.vendor, _iso(f.date), f.amount, LATE_CHECK))
        for x in self.discounts:
            out.append(MoneyRow(
                "Early-payment discount missed", x.vendor,
                f"bill {_iso(x.bill_date)}; discount by {_iso(x.discount_by)}; paid {_iso(x.paid_date)}",
                x.amount, f"{DISCOUNT_CHECK} ({x.terms}, {x.percent.normalize():f}% of {_m(x.bill_amount)}.)"))
        if not self.discounts_checked:
            out.append(MoneyRow("Early-payment discounts", "", "", None, self.discounts_note))
        return out


# --- detection -----------------------------------------------------------------------------

def _late_match(p: Payment) -> Optional[Tuple[str, str]]:
    fields = (("payee", p.payee), ("memo", p.memo), ("invoice", p.invoice_no))
    lender_loan = bool(LENDER_RE.search(p.payee)) and bool(LOAN_MEMO_RE.search(p.memo))
    for name, text in fields:
        m = FEE_RE.search(text)
        if m:
            return re.sub(r"\s+", " ", m.group(1).lower()), name
    if not lender_loan:
        # scheduled interest on a loan is not a late charge; only skip the interest wording for lenders
        for name, text in fields:
            m = INTEREST_RE.search(text)
            if m:
                return re.sub(r"\s+", " ", m.group(1).lower()), name
        if LATE_ALONE_RE.match(p.memo):
            return "late", "memo"
    return None


def _find_late(payments: Sequence[Payment]) -> List[LateFee]:
    out = []
    for p in payments:
        hit = _late_match(p)
        if hit:
            out.append(LateFee(p.payee, p.date, p.amount, p.row, hit[0], hit[1]))
    return out


def _bill_deadline(b: Bill) -> Optional[Tuple[date, Decimal, str]]:
    """(discount-by date, percent, terms text) from the bill's own data, or None."""
    if b.discount_date is not None and b.discount_percent is not None:
        return b.discount_date, b.discount_percent, f"{b.discount_percent.normalize():f}% by {_iso(b.discount_date)}"
    t = parse_terms(b.terms)
    if t:
        return b.date + timedelta(days=t.days), t.percent, b.terms.strip()
    return None


def _has_terms_data(bills: Sequence[Bill]) -> bool:
    return any(_bill_deadline(b) is not None for b in bills)


def _find_discounts(payments: Sequence[Payment], bills: Sequence[Bill], s: Settings) -> List[MissedDiscount]:
    by_payee: Dict[str, List[Bill]] = defaultdict(list)
    for b in bills:
        by_payee[normalize_name(b.payee)].append(b)
    consumed: set = set()
    out = []
    for p in sorted(payments, key=lambda p: (p.date, p.row)):
        key = normalize_name(p.payee)
        cands = [(i, b) for i, b in enumerate(by_payee.get(key, [])) if (key, i) not in consumed]
        pick = None
        inv = p.invoice_no.strip().lower()
        if inv:
            pick = next((i for i, b in cands if b.invoice_no.strip().lower() == inv), None)
        if pick is None:
            ok = [(abs((p.date - b.date).days), i) for i, b in cands
                  if abs(b.amount - p.amount) <= s.bill_amount_tolerance
                  and -7 <= (p.date - b.date).days <= s.bill_window_days]
            if ok:
                pick = min(ok)[1]
        if pick is None:
            continue
        consumed.add((key, pick))
        b = by_payee[key][pick]
        dl = _bill_deadline(b)
        if dl is None:
            continue
        by, pct, text = dl
        if p.date <= by:
            continue  # paid inside the window
        discount = (b.amount * pct / 100).quantize(CENT, rounding=ROUND_HALF_UP)
        if p.amount <= b.amount - discount + s.bill_amount_tolerance:
            continue  # the discount appears to have been taken
        out.append(MissedDiscount(b.payee, b.date, by, p.date, b.amount, pct, discount, text))
    return sorted(out, key=lambda x: (x.paid_date, x.vendor))


def find_money(payments: Iterable[Payment], bills: Optional[Sequence[Bill]],
               settings: Optional[Settings] = None) -> MoneyFindings:
    """Pure: no I/O, no clock, inputs not mutated."""
    s = settings or Settings()
    pays = sorted(payments, key=lambda p: (p.date, p.row))
    dups = tuple(
        DuplicatePair(b.payee, a.date, b.date, b.amount, a.row, b.row, by_inv)
        for a, b, by_inv in duplicate_pairs(pays, s)
    )
    late = tuple(_find_late(pays))
    if bills is None:
        return MoneyFindings(dups, late, (), False, NOT_CHECKED_NO_BILLS)
    if not _has_terms_data(bills):
        return MoneyFindings(dups, late, (), False, NOT_CHECKED_NO_TERMS)
    return MoneyFindings(dups, late, tuple(_find_discounts(pays, bills, s)), True, "")
