"""1099 readiness: which vendors likely need a 1099 for a tax year, and which are missing a W-9.

Advisory only. Mastiff does not give tax advice; the office's accountant confirms every form.
Thresholds (IRS Forms 1099-NEC/MISC): $600 for payments made through 2025; $2,000 for payments
made in 2026 (One Big Beautiful Bill Act, sec. 70433), inflation-adjusted from 2027.
"""
from __future__ import annotations

import csv
import html
import re
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Dict, List, Optional, Sequence

from .importer import LookbackError, _read_rows, last4
from .normalize import match_headers, normalize_name
from .rules import Payment

ADVISORY = ("This list is advisory. Mastiff does not give tax advice. "
            "Your accountant confirms which vendors receive a 1099.")
GREY = "#6B6B6B"

# Card and payment-app payments are reported by the processor on Form 1099-K, not by the payer.
_CARD_RE = re.compile(r"(?i)\b(credit|debit|card|visa|mastercard|amex|american express|discover|paypal|venmo|stripe|square)\b")
_CORP_RE = re.compile(r"(?i)\b(inc|incorporated|corp|corporation)\b\.?")
_ALWAYS_RE = re.compile(r"(?i)\b(law|legal|attorney|attorneys|esq|counsel|medical|health|clinic|dds|md)\b")

VENDOR_SYNONYMS = {
    "payee": ["vendor", "vendorname", "payee", "name", "supplier", "payeename"],
    "w9": ["w9", "w9onfile", "w9received", "hasw9", "w9status"],
    "entity": ["entity", "entitytype", "taxclassification", "classification", "type", "federaltaxclassification"],
    "tin_last4": ["tinlast4", "tin", "einlast4", "ein", "ssnlast4", "taxid", "taxidlast4"],
}

STATUS_NEEDS = "Over the line. 1099 if paid for services"
STATUS_NO_W9 = "Over the line. W-9 missing"
STATUS_CORP = "Over the line, likely exempt (corporation). Confirm on the W-9"
STATUS_ALWAYS = "Likely needs a 1099 even if a corporation (legal or medical)"
STATUS_NEAR = "Close to the line. Collect a W-9 now"


def threshold_for(year: int) -> Decimal:
    return Decimal("600") if year <= 2025 else Decimal("2000")


def deadline_for(year: int) -> date:
    d = date(year + 1, 1, 31)
    while d.weekday() >= 5:  # weekend moves to the next business day
        d += timedelta(days=1)
    return d


@dataclass
class VendorInfo:
    name: str
    w9: Optional[bool] = None
    entity: str = ""
    tin_last4: str = ""


def read_vendors(path) -> Dict[str, VendorInfo]:
    headers, rows = _read_rows(path)
    mapping = match_headers(headers, VENDOR_SYNONYMS)
    if "payee" not in mapping:
        raise LookbackError(f"Could not find a vendor name column. Headers seen: {', '.join(headers)}.")
    idx = {f: headers.index(m.header) for f, m in mapping.items()}

    def get(row, f):
        i = idx.get(f)
        return row[i].strip() if i is not None and i < len(row) else ""

    out: Dict[str, VendorInfo] = {}
    for _, row in rows:
        name = get(row, "payee")
        if not name:
            continue
        w = get(row, "w9").lower()
        w9 = True if w in ("y", "yes", "true", "1", "on file", "received", "x") else (
            False if w in ("n", "no", "false", "0", "missing", "") and "w9" in idx else None)
        tin, _ = last4(get(row, "tin_last4"))
        out[normalize_name(name)] = VendorInfo(name, w9, get(row, "entity"), tin)
    return out


@dataclass
class VendorLine:
    payee: str
    total: Decimal
    reportable: Decimal
    card: Decimal
    payments: int
    status: str
    w9: Optional[bool]
    entity: str
    action: str


@dataclass
class Ten99:
    year: int
    threshold: Decimal
    deadline: date
    lines: List[VendorLine] = field(default_factory=list)

    @property
    def needs(self) -> List[VendorLine]:
        return [l for l in self.lines if l.status in (STATUS_NEEDS, STATUS_NO_W9, STATUS_ALWAYS)]

    @property
    def missing_w9(self) -> List[VendorLine]:
        return [l for l in self.lines if l.w9 is not True and l.status != STATUS_CORP]

    @property
    def line(self) -> str:
        n, m = len(self.needs), len(self.missing_w9)
        return (f"Tax year {self.year}: {n} vendor{'s' if n != 1 else ''} over the ${self.threshold:,.0f} line, "
                f"each needing a 1099 decision (services yes, goods only no). {m} W-9{'s' if m != 1 else ''} to collect or confirm. "
                f"Forms due {self.deadline.strftime('%B %d, %Y').replace(' 0', ' ')}.")


def build(payments: Sequence[Payment], year: Optional[int] = None,
          vendors: Optional[Dict[str, VendorInfo]] = None,
          threshold: Optional[Decimal] = None, near_pct: Decimal = Decimal("0.75")) -> Ten99:
    if not payments:
        raise LookbackError("No payments to check.")
    year = year or max(p.date.year for p in payments)
    limit = threshold if threshold is not None else threshold_for(year)
    vendors = vendors or {}
    groups: Dict[str, List[Payment]] = defaultdict(list)
    for p in payments:
        if p.date.year == year and p.amount > 0:
            groups[normalize_name(p.payee)].append(p)
    res = Ten99(year, limit, deadline_for(year))
    for key, ps in groups.items():
        total = sum((p.amount for p in ps), Decimal("0"))
        card = sum((p.amount for p in ps if _CARD_RE.search(p.method or "")), Decimal("0"))
        reportable = total - card
        name = max((p.payee for p in ps), key=lambda n: sum(1 for q in ps if q.payee == n))
        info = vendors.get(key)
        w9 = info.w9 if info else None
        entity = (info.entity if info else "") or ""
        corp = bool(re.search(r"(?i)\b(c\s*corp|s\s*corp|corporation)\b", entity)) or (
            not entity and bool(_CORP_RE.search(name)))
        always = bool(_ALWAYS_RE.search(name))
        if reportable >= limit:
            if always:
                status = STATUS_ALWAYS
            elif corp:
                status = STATUS_CORP
            else:
                status = STATUS_NEEDS if w9 is True else STATUS_NO_W9
        elif reportable >= limit * near_pct:
            status = STATUS_NEAR
        else:
            continue
        if status == STATUS_CORP:
            action = "Confirm the W-9 shows a C or S corporation. If it does, no 1099 is needed."
        elif w9 is True:
            action = "W-9 on file. Confirm the name and tax ID match before filing."
        else:
            action = ("Request a W-9 now. Without a valid tax ID, payments at or above the line "
                      "can require 24% backup withholding.")
        if status in (STATUS_NEEDS, STATUS_NO_W9):
            action += " A 1099-NEC covers services; payments only for goods (materials, fuel) do not need one."
        if card:
            action += f" ${card:,.2f} paid by card or payment app is left out (reported on 1099-K)."
        res.lines.append(VendorLine(name, total, reportable, card, len(ps), status, w9, entity, action))
    order = {STATUS_NO_W9: 0, STATUS_ALWAYS: 1, STATUS_NEEDS: 2, STATUS_NEAR: 3, STATUS_CORP: 4}
    res.lines.sort(key=lambda l: (order[l.status], -l.reportable, l.payee))
    return res


def _w9(v: Optional[bool]) -> str:
    return "On file" if v is True else ("Missing" if v is False else "Unknown")


def write_csv(path, t: Ten99) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh, lineterminator="\n")
        w.writerow(["Vendor", f"Paid in {t.year}", "Counted toward 1099", "Paid by card/app (excluded)",
                    "Payments", "Status", "W-9", "Entity type", "What to do", "Done"])
        for l in t.lines:
            w.writerow([l.payee, f"{l.total:.2f}", f"{l.reportable:.2f}", f"{l.card:.2f}", l.payments,
                        l.status, _w9(l.w9), l.entity, l.action, ""])


def render_html(org: str, t: Ten99, generated: date) -> str:
    e = html.escape
    rows = "".join(
        f'<tr><td>{e(l.payee)}</td><td class="num">${l.reportable:,.2f}</td><td>{e(l.status)}</td>'
        f'<td>{_w9(l.w9)}</td><td class="grey">{e(l.action)}</td><td class="box"></td></tr>'
        for l in t.lines
    ) or '<tr><td colspan="6">No vendor is at or near the 1099 line for this year.</td></tr>'
    dl = t.deadline.strftime("%B %d, %Y").replace(" 0", " ")
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>1099 readiness - {e(org)}</title>
<style>
body {{ margin:0; padding:32px; color:#000; background:#fff; font-family:Inter,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif; font-size:13px; line-height:1.45; }}
h1,h2 {{ font-family:Georgia,"Times New Roman",serif; font-weight:normal; margin:0; }}
h1 {{ font-size:28px; }} h2 {{ font-size:18px; margin-top:28px; }}
.grey {{ color:{GREY}; }}
.big {{ font-family:Georgia,"Times New Roman",serif; font-size:20px; margin:18px 0 10px; padding:12px 0; border-top:1px solid #000; border-bottom:1px solid #000; }}
table {{ width:100%; border-collapse:collapse; margin-top:12px; }}
th {{ text-align:left; font-weight:600; border-bottom:1px solid #000; padding:6px 6px 6px 0; font-size:11px; text-transform:uppercase; letter-spacing:.04em; }}
td {{ vertical-align:top; padding:8px 6px 8px 0; border-bottom:1px solid {GREY}; }}
.num {{ text-align:right; white-space:nowrap; padding-right:12px; }}
.box {{ width:.6in; border-left:1px solid {GREY}; }}
@page {{ size:Letter; margin:.6in; }} @media print {{ body {{ padding:0; font-size:10.5pt; }} thead {{ display:table-header-group; }} tr {{ page-break-inside:avoid; }} }}
</style></head><body>
<p class="grey" style="margin:0 0 6px">Mastiff</p>
<h1>1099 readiness: {e(org)}</h1>
<p class="grey" style="margin:6px 0 0">Tax year {t.year}. Prepared {generated.strftime("%B %d, %Y").replace(" 0", " ")}</p>
<p class="big">{len(t.needs)} vendor{"s" if len(t.needs) != 1 else ""} over the line. {len(t.missing_w9)} W-9{"s" if len(t.missing_w9) != 1 else ""} to collect. Forms due {dl}.</p>
<p style="margin:0">Line for {t.year}: ${t.threshold:,.0f} paid to one vendor in the year, not counting card or payment-app payments. Vendors at 75% of the line or more are listed so a December payment does not catch you out.</p>
<h2>Vendors</h2>
<table><thead><tr><th>Vendor</th><th class="num">Counted</th><th>Status</th><th>W-9</th><th>What to do</th><th>Done</th></tr></thead>
<tbody>{rows}</tbody></table>
<p style="margin-top:28px;padding-top:12px;border-top:1px solid #000">{e(ADVISORY)}<br>
<span class="grey">A 1099-NEC covers payments for services, not payments only for goods. Corporations are usually exempt, except for legal and medical services. LLCs depend on how they are taxed; the W-9 says which. Payments by card or payment app are reported by the processor on Form 1099-K.</span></p>
</body></html>
"""


def write_html(path, org: str, t: Ten99, generated: date) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(render_html(org, t, generated), encoding="utf-8")
