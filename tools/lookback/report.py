"""Look-back report: summary line, CSV, and a self-contained print-ready HTML page."""
from __future__ import annotations

import csv
import html
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from pathlib import Path
from typing import List, Optional, Sequence

from .money import MoneyFindings
from .rules import CHECK, HELD, RULE_NAMES, Flag, Payment, Settings

ADVISORY_LINE = "Mastiff flags. Your firm makes every payment decision."
ADVISORY_NOTE = (
    "This report is advisory. It does not say a payment was wrong; "
    "it says what is worth checking."
)
STATUS_CHOICES = "to verify / verified fine / confirmed loss"
GREY = "#6B6B6B"


@dataclass(frozen=True)
class Summary:
    payments: int
    months: int
    held: int
    need_call: int
    money_sentence: str = ""

    @property
    def text(self) -> str:
        """The summary line, plus the money sentence when any money total is non-zero."""
        return f"{self.line}. {self.money_sentence}" if self.money_sentence else self.line

    @property
    def line(self) -> str:
        unit = "month" if self.months == 1 else "months"
        return (f"{self.payments} payments, {self.months} {unit}, "
                f"{self.held} would have held, {self.need_call} need a call this week")


@dataclass(frozen=True)
class ReportRow:
    row: int
    date: date
    payee: str
    amount: Decimal
    rules: str
    verdict: str
    reasons: List[str]
    checks: List[str]
    weight: int


def summarize(payments: Sequence[Payment], flags: Sequence[Flag], settings: Settings,
              money: Optional[MoneyFindings] = None) -> Summary:
    if payments:
        first = min(p.date for p in payments)
        last = max(p.date for p in payments)
        months = max(1, round((last - first).days / 30.4375))
    else:
        months, last = 0, None
    held = len({f.row for f in flags if f.verdict == HELD})
    need = 0
    if flags and last is not None:
        cutoff = last.toordinal() - settings.recent_days
        recent = {f.row for f in flags if f.rule in (1, 2) and f.date.toordinal() > cutoff}
        if recent:
            need = len(recent)
        else:
            ranked = sorted(flags, key=lambda f: (-f.weight, f.date, f.row))
            top: List[int] = []
            for f in ranked:
                if f.row not in top:
                    top.append(f.row)
                if len(top) == 3:
                    break
            need = len(top)
    return Summary(len(payments), months, held, need, money.summary_sentence if money else "")


def build_rows(flags: Sequence[Flag]) -> List[ReportRow]:
    by_row = {}
    for f in flags:
        by_row.setdefault(f.row, []).append(f)
    rows = []
    for row, fs in by_row.items():
        fs = sorted(fs, key=lambda f: (-f.weight, f.rule))
        first = fs[0]
        verdict = HELD if any(f.verdict == HELD for f in fs) else CHECK
        rows.append(ReportRow(
            row=row, date=first.date, payee=first.payee, amount=first.amount,
            rules=", ".join(str(f.rule) for f in fs), verdict=verdict,
            reasons=[f.reason for f in fs], checks=[f.check for f in fs], weight=first.weight,
        ))
    rows.sort(key=lambda r: (-r.weight, r.date, r.payee, r.row))
    return rows


def _m(d: Decimal) -> str:
    return f"${d:,.2f}"


def write_money_csv(path, money: MoneyFindings) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh, lineterminator="\n")
        w.writerow(["Finding", "Vendor", "Date(s)", "Amount", "What to check"])
        for r in money.rows():
            w.writerow([r.finding, r.vendor, r.dates, "" if r.amount is None else f"{r.amount:.2f}", r.check])


def _table(head: Sequence[str], body: Sequence[Sequence[str]], num_cols=()) -> str:
    th = "".join(f'<th class="num">{h}</th>' if i in num_cols else f"<th>{h}</th>" for i, h in enumerate(head))
    trs = "".join(
        "<tr>" + "".join(
            f'<td class="num">{c}</td>' if i in num_cols else f"<td>{c}</td>" for i, c in enumerate(r)
        ) + "</tr>" for r in body
    )
    return f"<table><thead><tr>{th}</tr></thead><tbody>{trs}</tbody></table>"


def _money_html(money: MoneyFindings) -> str:
    e = html.escape
    parts = ['<h2>Money worth checking</h2>']
    sentence = money.summary_sentence
    parts.append(f'<p style="margin:6px 0 0">{e(sentence) if sentence else "Nothing in this file adds up to money worth checking."}</p>')
    parts.append('<p class="grey" style="margin:4px 0 0">These are possibilities for your office to confirm. '
                 'A payment can repeat for a good reason, and a memo can mislead.</p>')

    parts.append(f'<h3>Duplicate payments</h3><p style="margin:4px 0 0">{e(money.duplicate_line)}</p>')
    if money.duplicates:
        parts.append(_table(
            ["Vendor", "First paid", "Paid again", "Amount", "Why it looks repeated"],
            [[e(d.vendor), d.first_date.isoformat(), d.second_date.isoformat(), _m(d.amount),
              "same invoice number twice" if d.by_invoice else "same amount within a few days"]
             for d in money.duplicates], num_cols=(3,)))

    parts.append(f'<h3>Late fees and interest</h3><p style="margin:4px 0 0">{e(money.late_line)}</p>')
    if money.late_fees:
        parts.append(_table(
            ["Vendor", "Payments", "Total"],
            [[e(v), str(n), _m(t)] for v, n, t in money.late_by_vendor], num_cols=(1, 2)))
        parts.append(_table(
            ["Date", "Vendor", "Amount", "Matched on", "Verdict"],
            [[f.date.isoformat(), e(f.vendor), _m(f.amount), e(f"{f.matched} ({f.field})"), "worth checking"]
             for f in sorted(money.late_fees, key=lambda f: (f.date, f.vendor, f.row))], num_cols=(2,)))

    parts.append(f'<h3>Early-payment discounts</h3><p style="margin:4px 0 0">{e(money.discount_line)}</p>')
    if money.discounts:
        parts.append(_table(
            ["Vendor", "Bill date", "Discount by", "Paid", "Terms", "Discount missed"],
            [[e(x.vendor), x.bill_date.isoformat(), x.discount_by.isoformat(), x.paid_date.isoformat(),
              e(x.terms), _m(x.amount)] for x in money.discounts], num_cols=(5,)))
    return "\n".join(parts)


def write_csv(path, rows: Sequence[ReportRow]) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh, lineterminator="\n")
        w.writerow(["Date", "Payee", "Amount", "Rule(s)", "Verdict", "Reason", "What to check", "Status"])
        for r in rows:
            w.writerow([
                r.date.isoformat(), r.payee, f"{r.amount:.2f}", r.rules, r.verdict,
                " | ".join(r.reasons), " | ".join(r.checks), "",
            ])


_CSS = f"""
:root {{ color-scheme: light; }}
* {{ box-sizing: border-box; }}
body {{ margin: 0; padding: 32px; background: #fff; color: #000;
  font-family: Inter, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.45; }}
h1, h2 {{ font-family: Georgia, "Times New Roman", serif; font-weight: normal; margin: 0; }}
h1 {{ font-size: 28px; }}
h2 {{ font-size: 18px; margin-top: 28px; }}
h3 {{ font-family: Georgia, "Times New Roman", serif; font-weight: normal; font-size: 15px; margin: 18px 0 0; }}
.grey {{ color: {GREY}; }}
.summary {{ font-family: Georgia, "Times New Roman", serif; font-size: 20px; margin: 18px 0 10px;
  padding: 12px 0; border-top: 1px solid #000; border-bottom: 1px solid #000; }}
.rules {{ margin: 4px 0 0; padding-left: 18px; }}
table {{ width: 100%; border-collapse: collapse; margin-top: 12px; }}
th {{ text-align: left; font-weight: 600; border-bottom: 1px solid #000; padding: 6px 6px 6px 0; font-size: 11px;
  text-transform: uppercase; letter-spacing: .04em; }}
td {{ vertical-align: top; padding: 8px 6px 8px 0; border-bottom: 1px solid {GREY}; }}
td.num, th.num {{ text-align: right; white-space: nowrap; padding-right: 12px; }}
td.nowrap {{ white-space: nowrap; }}
td.status {{ width: 1.25in; border-left: 1px solid {GREY}; padding-left: 6px; }}
.verdict {{ font-weight: 600; }}
.item {{ margin: 0 0 6px; }}
.chk {{ color: {GREY}; }}
.money {{ font-family: Georgia, "Times New Roman", serif; font-size: 30px; margin: 10px 0 4px; }}
.advisory {{ margin-top: 28px; padding-top: 12px; border-top: 1px solid #000; }}
@page {{ size: Letter; margin: 0.6in; }}
@media print {{
  body {{ padding: 0; font-size: 10.5pt; }}
  thead {{ display: table-header-group; }}
  tr {{ page-break-inside: avoid; }}
  a {{ color: #000; text-decoration: none; }}
}}
"""


def render_html(org: str, summary: Summary, rows: Sequence[ReportRow], generated: date,
                money: "MoneyFindings | None" = None) -> str:
    e = html.escape
    rule_items = "".join(f"<li>{n}. {e(RULE_NAMES[n])}</li>" for n in sorted(RULE_NAMES))
    body_rows = []
    for r in rows:
        items = "".join(
            f'<p class="item"><span class="verdict">{e(r.verdict)}.</span> {e(reason)}<br>'
            f'<span class="chk">What to check: {e(chk)}</span></p>'
            for reason, chk in zip(r.reasons, r.checks)
        )
        body_rows.append(
            f'<tr><td class="nowrap">{r.date.isoformat()}</td><td>{e(r.payee)}</td>'
            f'<td class="num">{_m(r.amount)}</td><td class="nowrap">{e(r.rules)}</td>'
            f'<td>{items}</td><td class="status"></td></tr>'
        )
    if not body_rows:
        body_rows.append('<tr><td colspan="6">Nothing in this file would have held under Mastiff\'s rules.</td></tr>')
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Look-back report - {e(org)}</title>
<style>{_CSS}</style></head>
<body>
<p class="grey" style="margin:0 0 6px">Mastiff</p>
<h1>Look-back report: {e(org)}</h1>
<p class="grey" style="margin:6px 0 0">Prepared {generated.strftime("%B %d, %Y").replace(" 0", " ")}</p>
<p class="summary">{e(summary.text)}</p>
<p style="margin:0">{e(ADVISORY_LINE)}</p>
<p class="grey" style="margin:4px 0 0">{e(ADVISORY_NOTE)}</p>
{_money_html(money) if money is not None else ""}
<h2>Payments worth a look</h2>
<p class="grey" style="margin:4px 0 0">Heaviest first. The Status column is for your office to fill in: {e(STATUS_CHOICES)}.</p>
<table>
<thead><tr><th>Date</th><th>Payee</th><th class="num">Amount</th><th>Rule(s)</th><th>What to check</th><th>Status</th></tr></thead>
<tbody>
{chr(10).join(body_rows)}
</tbody></table>
<h2>The rules</h2>
<p class="grey" style="margin:4px 0 0">Rules 1, 2 and 5 are the checks that would have held a payment. Rules 3, 4, 6 and 7 are worth checking.</p>
<ol class="rules" style="list-style:none;padding:0">{rule_items}</ol>
<p class="advisory">{e(ADVISORY_LINE)}<br><span class="grey">{e(ADVISORY_NOTE)}</span></p>
</body></html>
"""


def write_html(path, org: str, summary: Summary, rows: Sequence[ReportRow], generated: date,
               money: "MoneyFindings | None" = None) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(render_html(org, summary, rows, generated, money), encoding="utf-8")
