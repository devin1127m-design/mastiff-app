"""Day-30 read-out: the Wall log CSV in, a one-page summary and a question table out.

summarize() is a pure function: no I/O, no clock, inputs not mutated. The page presents questions
carriers commonly ask on applications, from public forms, and shows the office's own record against
each. It does not say what any insurer requires and does not say coverage is assured.
Mastiff flags. Your firm makes every payment decision.
"""
from __future__ import annotations

import csv
import html
import io
import re
import statistics
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple

from .importer import LookbackError, _read_text, last4, mask_text, parse_amount, parse_date

ADVISORY_LINE = "Mastiff flags. Your firm makes every payment decision."
NOT_ADVICE_LINE = ("This read-out is a summary of your own log. It is not coverage advice. "
                   "Whether a policy responds depends on its wording; confirm with your broker.")
SOURCE_LINE = ("The questions above are taken from publicly available carrier applications as of "
               "October 2026 and may differ from your policy's application.")
GREY = "#6B6B6B"

HEADER = ["date_time", "payee", "amount", "request_type", "bank", "account_last4", "how_arrived",
          "submitted_by", "verdict", "reasons", "cautions", "status", "resolved_at", "who_called",
          "number_called", "vendor_said", "approver", "override_reason"]

CLOSED = ("released", "rejected", "override")  # a decision was recorded; void is an entry made in error
MAX_HOLD_ROWS = 12

RECORDED, PARTLY, NOT_RECORDED = "Recorded", "Partly recorded", "Not recorded"

# Questions 1, 2, 3, 4, 5, 7, 9, 11 and 15 of r1/requirements-matrix.md, verbatim, with the carriers
# as the matrix gives them.
QUESTIONS: Tuple[Tuple[int, str, str], ...] = (
    (1, "Does the Applicant confirm all change requests regarding Vendor account information... by a direct call to the Vendor using only the telephone number provided by the Vendor before the change request was received?",
     "Travelers (CRI-14104 II.4, CYB-14302 Q6, CRI-N-14300 Q5), One80/PSG (C.4), Intact 71074, SPG ExecuPro ~, Beazley F00769 ~ (predetermined number)"),
    (2, "Is the call back procedure performed by an individual other than the individual who received the change request?",
     "Travelers II.4a; PSG A/B/C; SPG ExecuPro ~"),
    (3, "Does the Applicant refrain from implementing any such change requests until after the Vendor has responded...?",
     "Travelers II.4b; PSG ~; SPG ~"),
    (4, "Does the Applicant confirm all such change requests made by a Vendor with an individual (at the Vendor) other than the individual who requested the change?",
     "Travelers II.4c; PSG C.4b; SPG ExecuPro"),
    (5, "Does the Applicant require that all such change requests made by a Vendor be approved by the Applicant's supervisor(s)...?",
     "Travelers II.4d; PSG C.4c; Intact \"second individual\"; Marsh AU \"senior management approval\""),
    (7, "Do payments or funds-transfers of a certain amount require dual authorization?",
     "Travelers IV.2 / CRI-N-14300 Q3; PSG A.2; Hartford HR 00 H122 I.4; SPG ExecuPro; Intact 71074; Coalition (\"in excess of $25,000\"); At-Bay ($25,000, two employees)"),
    (9, "Do you require all outgoing wire transfers be subject to segregation of duties between initiation and authorization...?",
     "PSG A.1; Beazley (\"Can the employee independently initiate a wire transfer?\"); Cowbell 5.3 ~; Marsh AU reconciliation by persons not authorised"),
    (11, "Is all vendor bank information verified by a direct call to the receiving bank prior to the account being established...?",
     "PSG C.2; Travelers II.1; Cowbell 5.1 ~; Intact 71074 (legitimacy of new vendors)"),
    (15, "Does the Applicant maintain a pre-established list of employees authorized to initiate payment or funds transfer requests...?",
     "Travelers IV.1; Hartford I.1; Beazley (\"Who in your organization has the authority to initiate a wire transfer?\")"),
)

# The 13 fields from "What the log must record": (number, name, export columns that hold it, note).
# An empty column tuple means the export has no such column.
FIELDS: Tuple[Tuple[int, str, Tuple[str, ...], str], ...] = (
    (1, "Request received: receiver, date/time, channel, copy", ("date_time", "how_arrived", "submitted_by"),
     "copy of the request is not in the export"),
    (2, "Request type, payee, amount", ("request_type", "payee", "amount"), ""),
    (3, "Callback number used, and where it came from", ("number_called",), "source and on-file date are not in the export"),
    (4, "Channel of verification, different from the request", (), ""),
    (5, "Caller, different from the receiver", ("who_called",), "counted when different from submitted_by"),
    (6, "Time of call and every attempt", (), ""),
    (7, "Who answered at the vendor", (), ""),
    (8, "What the vendor said", ("vendor_said",), ""),
    (9, "Hold kept until the vendor responded; release time", ("resolved_at", "vendor_said"),
     "time of call is not in the export"),
    (10, "Second approver, different from initiator", ("approver",), "counted when different from submitted_by"),
    (11, "Outcome and reason", ("status",), "reason is recorded for overrides"),
    (12, "Documentation retained (notes, request copy)", (), ""),
    (13, "New-account checks, incident time", (), ""),
)


@dataclass(frozen=True)
class LogRow:
    at: datetime
    payee: str
    amount: Decimal
    request_type: str = ""
    bank: str = ""
    account_last4: str = ""
    how_arrived: str = ""
    submitted_by: str = ""
    verdict: str = "PASS"
    reasons: str = ""
    cautions: str = ""
    status: str = ""
    resolved_at: Optional[datetime] = None
    who_called: str = ""
    number_called: str = ""
    vendor_said: str = ""
    approver: str = ""
    override_reason: str = ""

    @property
    def day(self) -> date:
        return self.at.date()

    @property
    def is_hold(self) -> bool:
        return self.verdict.upper() == "HOLD"


@dataclass(frozen=True)
class ReadoutSettings:
    line: Decimal = Decimal("5000")
    start: Optional[date] = None
    end: Optional[date] = None


@dataclass(frozen=True)
class QuestionResult:
    num: int
    text: str
    carriers: str
    record: str
    status: str


@dataclass(frozen=True)
class FieldCount:
    num: int
    name: str
    filled: int
    closed: int
    in_export: bool
    note: str


@dataclass(frozen=True)
class Readout:
    start: Optional[date]
    end: Optional[date]
    checked: int
    holds: int
    released: int
    rejected: int
    overrides: int
    voids: int
    open_holds: int
    closed_holds: int
    median_hours: Optional[float]
    amount_not_paid: Decimal
    hold_rows: Tuple[LogRow, ...]
    questions: Tuple[QuestionResult, ...]
    fields: Tuple[FieldCount, ...]
    submitters: Tuple[Tuple[str, int], ...]
    line: Decimal

    @property
    def line_text(self) -> str:
        med = "n/a" if self.median_hours is None else f"{self.median_hours:.1f}"
        return (f"{self.checked} checked, {self.holds} holds, {self.released} released, "
                f"{self.rejected} recorded not paid, median {med} hours to resolve")


@dataclass
class LogResult:
    rows: List[LogRow] = field(default_factory=list)
    skipped: List[Tuple[int, str]] = field(default_factory=list)
    masked: int = 0


# ---------------------------------------------------------------- import

def _parse_ts(value: str) -> datetime:
    s = (value or "").strip()
    if not s:
        raise ValueError("empty date_time")
    try:
        d = datetime.fromisoformat(s.replace("Z", "+00:00"))
    except ValueError:
        return datetime.combine(parse_date(s), datetime.min.time())
    if d.tzinfo is not None:
        d = d.astimezone(timezone.utc).replace(tzinfo=None)
    return d


def _cell(s: str) -> str:
    s = (s or "").strip()
    if len(s) > 1 and s[0] == "'" and s[1] in "=+-@":  # the Wall prefixes these so a sheet will not run them
        s = s[1:]
    return s


def read_log(path) -> LogResult:
    """Read a Wall log export. Account values are cut to the last 4 digits here, on import."""
    text = _read_text(Path(path))
    reader = csv.reader(io.StringIO(text, newline=""))
    try:
        head = [h.strip().lower() for h in next(reader)]
    except StopIteration:
        raise LookbackError("The log file is empty.") from None
    missing = [h for h in HEADER if h not in head]
    if missing:
        raise LookbackError("This does not look like a Wall log export. Missing columns: "
                            + ", ".join(missing) + ".")
    idx = {h: head.index(h) for h in HEADER}
    res = LogResult()
    for n, raw in enumerate(reader, start=2):
        if not any(c.strip() for c in raw):
            continue

        def get(col: str) -> str:
            i = idx[col]
            return _cell(raw[i]) if i < len(raw) else ""

        try:
            at = _parse_ts(get("date_time"))
            amount = parse_amount(get("amount"))
            resolved = _parse_ts(get("resolved_at")) if get("resolved_at") else None
        except ValueError as exc:
            res.skipped.append((n, str(exc)))
            continue
        acct, was_longer = last4(get("account_last4"))
        res.masked += int(was_longer)
        free: Dict[str, str] = {}
        for col in ("payee", "reasons", "cautions", "vendor_said", "override_reason", "bank"):
            free[col], k = mask_text(get(col))
            res.masked += k
        res.rows.append(LogRow(
            at=at, payee=free["payee"], amount=amount, request_type=get("request_type").lower(), bank=free["bank"],
            account_last4=acct, how_arrived=get("how_arrived"), submitted_by=get("submitted_by"),
            verdict=get("verdict").upper() or "PASS", reasons=free["reasons"], cautions=free["cautions"],
            status=get("status").lower(), resolved_at=resolved, who_called=get("who_called"),
            number_called=get("number_called"), vendor_said=free["vendor_said"], approver=get("approver"),
            override_reason=free["override_reason"],
        ))
    return res


# ---------------------------------------------------------------- the numbers

def _differs(a: str, b: str) -> bool:
    return bool(a.strip()) and bool(b.strip()) and a.strip().casefold() != b.strip().casefold()


def _ladder(k: int, n: int) -> str:
    if n == 0 or k == 0:
        return NOT_RECORDED
    return RECORDED if k == n else PARTLY


def _status_of(row: LogRow) -> str:
    """The Wall's 'open hold' (and anything unrecognised on a HOLD row) reads as open."""
    return row.status if row.status in ("pass", "released", "rejected", "void", "override") else "open"


def _field_filled(num: int, r: LogRow) -> bool:
    if num == 1:
        return bool(r.how_arrived and r.submitted_by)
    if num == 2:
        return bool(r.request_type and r.payee and r.amount)
    if num == 3:
        return bool(r.number_called)
    if num == 5:
        return _differs(r.who_called, r.submitted_by)
    if num == 8:
        return bool(r.vendor_said)
    if num == 9:
        return bool(r.resolved_at and r.vendor_said)
    if num == 10:
        return _differs(r.approver, r.submitted_by)
    if num == 11:
        return bool(r.status) and (r.status != "override" or bool(r.override_reason))
    return False


def _is_amount_hold(r: LogRow) -> bool:
    return bool(re.search(r"\bamount\b.*\b(more than|over the)\b", r.reasons, re.I))


def _is_new_payee_hold(r: LogRow) -> bool:
    return "payee not on file" in r.reasons.lower()


def _money(d: Decimal) -> str:
    return f"${d:,.2f}" if d % 1 else f"${d:,.0f}"


def _plural(n: int, one: str, many: str) -> str:
    return one if n == 1 else many


def summarize(rows: Sequence[LogRow], settings: ReadoutSettings) -> Readout:
    sel = [r for r in rows
           if (settings.start is None or r.day >= settings.start) and (settings.end is None or r.day <= settings.end)]
    start = settings.start or min((r.day for r in sel), default=None)
    end = settings.end or max((r.day for r in sel), default=None)
    holds = sorted((r for r in sel if r.is_hold), key=lambda r: r.at)

    def of(s: str) -> List[LogRow]:
        return [r for r in holds if _status_of(r) == s]

    released, rejected, override, void, opened = of("released"), of("rejected"), of("override"), of("void"), of("open")
    closed = [r for r in holds if _status_of(r) in CLOSED]
    hours = [(r.resolved_at - r.at) / timedelta(hours=1) for r in closed if r.resolved_at]
    median = round(statistics.median(hours), 1) if hours else None
    n = len(closed)

    called = sum(1 for r in closed if r.number_called)
    caller_diff = sum(1 for r in closed if _differs(r.who_called, r.submitted_by))
    said = sum(1 for r in closed if r.vendor_said and r.resolved_at)
    said_any = sum(1 for r in closed if r.vendor_said)
    appr = sum(1 for r in closed if r.approver)
    appr_diff = sum(1 for r in closed if _differs(r.approver, r.submitted_by))
    over = [r for r in closed if r.amount > settings.line]
    over_diff = sum(1 for r in over if _differs(r.approver, r.submitted_by))
    amount_holds = sum(1 for r in holds if _is_amount_hold(r))
    new_holds = [r for r in holds if _is_new_payee_hold(r)]
    new_rel = sum(1 for r in new_holds if _status_of(r) == "released" and r.number_called)
    counts: Dict[str, int] = {}
    for r in sel:
        name = r.submitted_by.strip()
        if name:
            counts[name] = counts.get(name, 0) + 1
    submitters = tuple(sorted(counts.items(), key=lambda kv: (-kv[1], kv[0].casefold())))

    q: Dict[int, Tuple[str, str]] = {}
    q[1] = (f"Callback to a number on file before the request: {called} of {n} closed holds record a number called. "
            "When the number first went on file is not in the log.",
            PARTLY if called else NOT_RECORDED)
    q[2] = (f"Caller different from the person who received the request: {caller_diff} of {n} closed holds "
            "(compared with the person who entered the request).", _ladder(caller_diff, n))
    q[3] = (f"Payment held until the vendor responded: {said} of {n} closed holds have vendor_said recorded "
            "before resolved_at.", _ladder(said, n))
    q[4] = (f"Not recorded by Mastiff. The log keeps what the vendor said ({said_any} of {n} closed holds), "
            "not who answered at the vendor.", NOT_RECORDED)
    q[5] = (f"Second person approved: {appr} of {n} closed holds record an approver; approver differs from "
            f"submitter in {appr_diff} of {n}. The approver's role is not recorded.",
            RECORDED if n and appr_diff == n else (PARTLY if appr else NOT_RECORDED))
    q[7] = (f"Dual authorization above a stated amount: line set at {_money(settings.line)}; {amount_holds} "
            f"{_plural(amount_holds, 'hold', 'holds')} for amount out of range. Closed holds over the line with a "
            f"different approver: {over_diff} of {len(over)}.",
            RECORDED if over and over_diff == len(over) else PARTLY)
    q[9] = (f"Initiator and approver are different people in {appr_diff} of {n} closed holds. "
            "Payments that pass record no approver, so this covers holds only.", PARTLY if appr_diff else NOT_RECORDED)
    q[11] = ("Not recorded by Mastiff. A direct call to the receiving bank is not a field in the log. "
             f"For context: {len(new_holds)} new-payee {_plural(len(new_holds), 'hold', 'holds')}, "
             f"{new_rel} released after a callback to the vendor.", NOT_RECORDED)
    names = ", ".join(f"{nm} ({c})" for nm, c in submitters) or "none"
    q[15] = (f"Pre-established list of authorized initiators: submitters seen in the log: {names}. "
             "Roles and the office's own list are not in the log.", PARTLY if submitters else NOT_RECORDED)
    questions = tuple(QuestionResult(num, text, carriers, q[num][0], q[num][1]) for num, text, carriers in QUESTIONS)

    fields = tuple(
        FieldCount(num, name, sum(1 for r in closed if _field_filled(num, r)) if cols else 0, n, bool(cols), note)
        for num, name, cols, note in FIELDS)

    return Readout(
        start=start, end=end, checked=len(sel), holds=len(holds), released=len(released), rejected=len(rejected),
        overrides=len(override), voids=len(void), open_holds=len(opened), closed_holds=n, median_hours=median,
        amount_not_paid=sum((r.amount for r in rejected), Decimal("0")), hold_rows=tuple(holds),
        questions=questions, fields=fields, submitters=submitters, line=settings.line)


# ---------------------------------------------------------------- outputs

def outcome(r: LogRow) -> str:
    s = _status_of(r)
    if s == "released":
        return "Released after callback"
    if s == "rejected":
        return "Recorded not paid"
    if s == "void":
        return "Void"
    if s == "override":
        who = f", reported by {r.approver}" if r.approver else ""
        why = f": {r.override_reason}" if r.override_reason else ""
        return f"Paid without callback{who}{why}"
    return "Still open"


def _safe(s: str) -> str:
    return "'" + s if s[:1] in ("=", "+", "-", "@") else s


def write_csv(path, ro: Readout) -> None:
    """The question table: one row per question."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh, lineterminator="\n")
        w.writerow(["Question no.", "Question (verbatim)", "Carriers that ask it", "Your record", "Evidence"])
        for q in ro.questions:
            w.writerow([q.num, q.text, q.carriers, _safe(q.record), q.status])


def write_holds_csv(path, ro: Readout) -> None:
    """Every hold row, for the 'and N more' line when the page table is cut."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh, lineterminator="\n")
        w.writerow(["Date", "Payee", "Amount", "Reasons", "Outcome", "Who called", "Number called", "Approver"])
        for r in ro.hold_rows:
            w.writerow([r.day.isoformat(), _safe(r.payee), f"{r.amount:.2f}", _safe(r.reasons), outcome(r),
                        _safe(r.who_called), r.number_called, _safe(r.approver)])


_CSS = f"""
:root {{ color-scheme: light; }}
* {{ box-sizing: border-box; }}
body {{ margin: 0; padding: 28px; background: #fff; color: #000;
  font-family: Inter, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.35; }}
h1, h2 {{ font-family: Georgia, "Times New Roman", serif; font-weight: normal; margin: 0; }}
h1 {{ font-size: 24px; }}
h2 {{ font-size: 15px; margin-top: 16px; }}
p {{ margin: 0; }}
.grey {{ color: {GREY}; }}
.nums {{ display: flex; border-top: 1px solid #000; border-bottom: 1px solid #000; margin-top: 10px; }}
.nums div {{ flex: 1; padding: 6px 8px 6px 0; }}
.nums b {{ display: block; font-family: Georgia, "Times New Roman", serif; font-size: 22px; font-weight: normal; }}
.nums span {{ font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: {GREY}; }}
table {{ width: 100%; border-collapse: collapse; margin-top: 6px; }}
th {{ text-align: left; font-weight: 600; border-bottom: 1px solid #000; padding: 3px 6px 3px 0; font-size: 9.5px;
  text-transform: uppercase; letter-spacing: .04em; }}
td {{ vertical-align: top; padding: 4px 6px 4px 0; border-bottom: 1px solid {GREY}; }}
td.num, th.num {{ text-align: right; white-space: nowrap; }}
td.nowrap {{ white-space: nowrap; }}
.carriers {{ color: {GREY}; font-size: 9.5px; }}
.ev {{ font-weight: 600; white-space: nowrap; }}
.fields {{ columns: 2; column-gap: 24px; list-style: none; padding: 0; margin: 6px 0 0; }}
.fields li {{ break-inside: avoid; padding: 1px 0; }}
.advisory {{ margin-top: 14px; padding-top: 8px; border-top: 1px solid #000; }}
@page {{ size: Letter; margin: 0.35in; }}
@media print {{
  body {{ padding: 0; font-size: 7pt; line-height: 1.15; }}
  h1 {{ font-size: 16pt; }} h2 {{ font-size: 9.5pt; margin-top: 5px; }}
  .nums {{ margin-top: 5px; }} .nums div {{ padding: 3px 6px 3px 0; }}
  .nums b {{ font-size: 14pt; }} .nums span {{ font-size: 6pt; }}
  th {{ font-size: 6pt; }} td {{ padding: 1.5px 5px 1.5px 0; }} .carriers {{ font-size: 6pt; }}
  .advisory {{ margin-top: 6px; padding-top: 4px; }}
  tr {{ page-break-inside: avoid; }}
}}
"""


def _date(d: Optional[date]) -> str:
    return d.strftime("%B %d, %Y").replace(" 0", " ") if d else "no rows"


def render_html(org: str, ro: Readout, generated: date) -> str:
    e = html.escape
    median = "n/a" if ro.median_hours is None else f"{ro.median_hours:.1f}"
    nums = [(ro.checked, "Checked"), (ro.holds, "Holds"), (ro.released, "Released"),
            (ro.rejected, "Recorded not paid"), (median, "Median hours to resolve")]
    nums_html = "".join(f"<div><b>{e(str(v))}</b><span>{e(lbl)}</span></div>" for v, lbl in nums)
    small = (f"{ro.overrides} {_plural(ro.overrides, 'override', 'overrides')} (paid without callback, as reported), "
             f"{ro.voids} {_plural(ro.voids, 'void', 'voids')}, {ro.open_holds} still open.")

    shown = ro.hold_rows[:MAX_HOLD_ROWS]
    hold_html = "".join(
        f'<tr><td class="nowrap">{r.day.isoformat()}</td><td>{e(r.payee)}</td><td class="num">{_money(r.amount)}</td>'
        f'<td>{e(r.reasons)}</td><td>{e(outcome(r))}</td><td>{e(r.who_called)}</td>'
        f'<td class="nowrap">{e(r.number_called)}</td><td>{e(r.approver)}</td></tr>' for r in shown)
    if not hold_html:
        hold_html = '<tr><td colspan="8">No holds in this period.</td></tr>'
    more = len(ro.hold_rows) - len(shown)
    more_html = f'<p class="grey">and {more} more in the CSV.</p>' if more > 0 else ""

    q_html = "".join(
        f'<tr><td class="num">{q.num}</td><td>{e(q.text)}<div class="carriers">Asked by: {e(q.carriers)}</div></td>'
        f'<td>{e(q.record)}</td><td class="ev">{e(q.status)}</td></tr>' for q in ro.questions)
    f_html = "".join(
        f'<li>{f.num}. {e(f.name)}: <b>' + (f"{f.filled} of {f.closed}" if f.in_export else "not in the export") + "</b>"
        + (f' <span class="grey">({e(f.note)})</span>' if f.note else "") + "</li>" for f in ro.fields)

    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Day-30 read-out - {e(org)}</title>
<style>{_CSS}</style></head>
<body>
<p class="grey">Mastiff</p>
<h1>Day-30 read-out: {e(org)}</h1>
<p class="grey">Period covered: {_date(ro.start)} to {_date(ro.end)}. Prepared {_date(generated)}.</p>
<div class="nums">{nums_html}</div>
<p class="grey" style="margin-top:4px">{e(small)}</p>
<h2>What was held and what happened</h2>
<table>
<thead><tr><th>Date</th><th>Payee</th><th class="num">Amount</th><th>Reasons</th><th>Outcome</th><th>Who called</th><th>Number called</th><th>Approver</th></tr></thead>
<tbody>{hold_html}</tbody></table>
{more_html}
<p style="margin-top:4px">Amount recorded not paid: <b>{_money(ro.amount_not_paid)}</b> across {ro.rejected} rejected {_plural(ro.rejected, 'hold', 'holds')}.</p>
<h2>Your record against the questions carriers ask</h2>
<p class="grey">Questions carriers commonly ask on applications, from public forms, with your own record beside each. Closed holds are those released, rejected or overridden: {ro.closed_holds} in this period.</p>
<table>
<thead><tr><th class="num">No.</th><th>Question and who asks it</th><th>Your record</th><th>Evidence</th></tr></thead>
<tbody>{q_html}</tbody></table>
<h2>What the log holds for each closed hold</h2>
<ul class="fields">{f_html}</ul>
<p class="advisory">{e(ADVISORY_LINE)}</p>
<p class="grey">{e(NOT_ADVICE_LINE)}</p>
<p class="grey">{e(SOURCE_LINE)}</p>
</body></html>
"""


def write_html(path, org: str, ro: Readout, generated: date) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(render_html(org, ro, generated), encoding="utf-8")
