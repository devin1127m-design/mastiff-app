"""Subcontractor checks for construction offices: insurance certificates (COI) and lien waivers.

Cautions only. Nothing here holds a payment. Mastiff flags. It does not give legal advice.
Your firm makes every payment decision.
"""
from __future__ import annotations

import csv
import html
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Dict, List, Optional, Sequence

from .importer import LookbackError, _read_rows, parse_date
from .normalize import match_headers, normalize_name
from .rules import Payment

ADVISORY = "Mastiff flags. It does not give legal advice. Your firm makes every payment decision."
GREY = "#6B6B6B"
SOON_DAYS = 30

SUB_SYNONYMS = {
    "payee": ["vendor", "sub", "subcontractor", "vendorname", "payee", "name", "company"],
    "gl_expires": ["glexpires", "glexpiration", "generalliability", "glexp", "gl", "liabilityexpires"],
    "wc_expires": ["wcexpires", "wcexpiration", "workerscomp", "workerscompensation", "wcexp", "wc"],
    "auto_expires": ["autoexpires", "autoexpiration", "auto", "autoliability", "autoexp"],
    "additional_insured": ["additionalinsured", "ai", "addlinsured", "additionalinsuredendorsement"],
    "waiver_through": ["waiverthrough", "lienwaiverthrough", "waiverdate", "lastwaiver", "waivedthrough", "lienwaiver"],
}

TEMPLATE_HEADERS = ["Vendor", "GL expires", "WC expires", "Auto expires", "Additional insured", "Waiver through"]


@dataclass
class Sub:
    name: str
    gl: Optional[date] = None
    wc: Optional[date] = None
    wc_exempt: bool = False
    auto: Optional[date] = None
    ai: Optional[bool] = None
    waiver: Optional[date] = None


def _date_or_none(text: str) -> Optional[date]:
    text = (text or "").strip()
    if not text or text.lower() in ("none", "n/a", "na", "missing", "-"):
        return None
    return parse_date(text)


def read_subs(path) -> Dict[str, Sub]:
    headers, rows = _read_rows(path)
    mapping = match_headers(headers, SUB_SYNONYMS)
    if "payee" not in mapping:
        raise LookbackError(f"Could not find a vendor column. Headers seen: {', '.join(headers)}.")
    idx = {f: headers.index(m.header) for f, m in mapping.items()}

    def get(row, f):
        i = idx.get(f)
        return row[i].strip() if i is not None and i < len(row) else ""

    out: Dict[str, Sub] = {}
    for line, row in rows:
        name = get(row, "payee")
        if not name:
            continue
        try:
            wc_text = get(row, "wc_expires")
            exempt = wc_text.lower() in ("exempt", "sole proprietor", "no employees", "sole prop")
            ai = get(row, "additional_insured").lower()
            out[normalize_name(name)] = Sub(
                name=name,
                gl=_date_or_none(get(row, "gl_expires")),
                wc=None if exempt else _date_or_none(wc_text),
                wc_exempt=exempt,
                auto=_date_or_none(get(row, "auto_expires")),
                ai=True if ai in ("y", "yes", "true", "1", "x") else (False if ai in ("n", "no", "false", "0") else None),
                waiver=_date_or_none(get(row, "waiver_through")),
            )
        except ValueError as exc:
            raise LookbackError(f"Row {line} ({name}): {exc}") from None
    if not out:
        raise LookbackError("No subcontractors found in the file.")
    return out


@dataclass
class Item:
    payee: str
    kind: str          # "Insurance" or "Lien waiver"
    finding: str
    amount: Decimal = Decimal("0")
    check: str = ""


@dataclass
class SubReport:
    as_of: date
    subs: int
    items: List[Item] = field(default_factory=list)
    uninsured_total: Decimal = Decimal("0")
    unwaived_total: Decimal = Decimal("0")

    @property
    def coi_count(self) -> int:
        return len({i.payee for i in self.items if i.kind == "Insurance"})

    @property
    def waiver_count(self) -> int:
        return len({i.payee for i in self.items if i.kind == "Lien waiver"})

    @property
    def line(self) -> str:
        parts = [f"{self.subs} subcontractors checked as of {_d(self.as_of)}.",
                 f"{self.coi_count} with an insurance item worth checking."]
        if self.uninsured_total:
            parts.append(f"${self.uninsured_total:,.2f} paid while a certificate on file had lapsed.")
        parts.append(f"{self.waiver_count} with payments not covered by a lien waiver"
                     + (f" (${self.unwaived_total:,.2f})." if self.unwaived_total else "."))
        return " ".join(parts)


def _d(d: date) -> str:
    return d.strftime("%b %d, %Y").replace(" 0", " ")


def _coverage(label: str, exp: Optional[date], as_of: date) -> Optional[str]:
    if exp is None:
        return f"No {label} certificate on file."
    if exp < as_of:
        return f"{label} certificate expired {_d(exp)}."
    if exp <= as_of + timedelta(days=SOON_DAYS):
        return f"{label} certificate expires {_d(exp)}, within {SOON_DAYS} days."
    return None


def build(subs: Dict[str, Sub], payments: Optional[Sequence[Payment]] = None,
          as_of: Optional[date] = None) -> SubReport:
    as_of = as_of or date.today()
    rep = SubReport(as_of, len(subs))
    by_sub: Dict[str, List[Payment]] = defaultdict(list)
    for p in payments or []:
        k = normalize_name(p.payee)
        if k in subs and p.amount > 0:
            by_sub[k].append(p)

    for key, s in sorted(subs.items(), key=lambda kv: kv[1].name.lower()):
        renew = "Request a current certificate from the sub's insurance agent, not from the sub, before the next payment."
        for label, exp in (("General liability", s.gl), ("Workers' comp", None if s.wc_exempt else s.wc)):
            msg = _coverage(label, exp, as_of)
            if msg:
                rep.items.append(Item(s.name, "Insurance", msg, check=renew if "expired" in msg or "No " in msg
                                      else "Ask the agent for the renewal certificate now."))
        if s.wc_exempt:
            rep.items.append(Item(s.name, "Insurance", "Workers' comp marked exempt.",
                                  check="Keep the sub's written exemption on file. At audit, your workers' comp "
                                        "carrier may charge premium for subs it treats as uninsured."))
        if s.auto is not None:
            msg = _coverage("Auto", s.auto, as_of)
            if msg:
                rep.items.append(Item(s.name, "Insurance", msg, check="Ask the agent for the renewal certificate."))
        if s.ai is False:
            rep.items.append(Item(s.name, "Insurance", "Your firm is not listed as additional insured.",
                                  check="Check the subcontract. If it requires additional insured status, ask for the endorsement."))

        ps = sorted(by_sub.get(key, []), key=lambda p: p.date)
        if not ps:
            continue
        lapsed = [p for p in ps if (s.gl and p.date > s.gl) or (not s.wc_exempt and s.wc and p.date > s.wc)]
        if lapsed:
            amt = sum((p.amount for p in lapsed), Decimal("0"))
            rep.uninsured_total += amt
            rep.items.append(Item(
                s.name, "Insurance",
                f"{len(lapsed)} payment{'s' if len(lapsed) != 1 else ''} made after a certificate on file expired "
                f"({_d(lapsed[0].date)} to {_d(lapsed[-1].date)}).", amt,
                "Get proof the sub was covered for those dates before your carrier's audit."))
        uncovered = [p for p in ps if s.waiver is None or p.date > s.waiver]
        if uncovered:
            amt = sum((p.amount for p in uncovered), Decimal("0"))
            rep.unwaived_total += amt
            since = f"since the last waiver ({_d(s.waiver)})" if s.waiver else "with no waiver on file"
            rep.items.append(Item(
                s.name, "Lien waiver",
                f"{len(uncovered)} payment{'s' if len(uncovered) != 1 else ''} {since}.", amt,
                "Collect a waiver covering these payments, and a conditional waiver before the next one, "
                "so the work is not paid for twice if a supplier goes unpaid."))
    order = {"Insurance": 0, "Lien waiver": 1}
    rep.items.sort(key=lambda i: (-i.amount, order[i.kind], i.payee))
    return rep


def write_csv(path, rep: SubReport) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh, lineterminator="\n")
        w.writerow(["Subcontractor", "Area", "Finding", "Amount", "What to check", "Done"])
        for i in rep.items:
            w.writerow([i.payee, i.kind, i.finding, f"{i.amount:.2f}" if i.amount else "", i.check, ""])


def write_template(path) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh, lineterminator="\n")
        w.writerow(TEMPLATE_HEADERS)
        w.writerow(["Example Drywall LLC", "2027-03-31", "2027-03-31", "", "yes", "2026-09-30"])
        w.writerow(["Example Concrete", "2026-11-15", "exempt", "2027-01-01", "no", ""])


def render_html(org: str, rep: SubReport, generated: date) -> str:
    e = html.escape
    rows = "".join(
        f'<tr><td>{e(i.payee)}</td><td class="nowrap">{e(i.kind)}</td><td>{e(i.finding)}<br>'
        f'<span class="grey">What to check: {e(i.check)}</span></td>'
        f'<td class="num">{"$" + format(i.amount, ",.2f") if i.amount else ""}</td><td class="box"></td></tr>'
        for i in rep.items
    ) or '<tr><td colspan="5">Every certificate is current and every payment is covered by a waiver.</td></tr>'
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Subcontractor check - {e(org)}</title>
<style>
body {{ margin:0; padding:32px; color:#000; background:#fff; font-family:Inter,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif; font-size:13px; line-height:1.45; }}
h1,h2 {{ font-family:Georgia,"Times New Roman",serif; font-weight:normal; margin:0; }}
h1 {{ font-size:28px; }} h2 {{ font-size:18px; margin-top:28px; }}
.grey {{ color:{GREY}; }}
.big {{ font-family:Georgia,"Times New Roman",serif; font-size:20px; margin:18px 0 10px; padding:12px 0; border-top:1px solid #000; border-bottom:1px solid #000; }}
table {{ width:100%; border-collapse:collapse; margin-top:12px; }}
th {{ text-align:left; font-weight:600; border-bottom:1px solid #000; padding:6px 6px 6px 0; font-size:11px; text-transform:uppercase; letter-spacing:.04em; }}
td {{ vertical-align:top; padding:8px 6px 8px 0; border-bottom:1px solid {GREY}; }}
.num {{ text-align:right; white-space:nowrap; padding-right:12px; }} .nowrap {{ white-space:nowrap; }}
.box {{ width:.6in; border-left:1px solid {GREY}; }}
@page {{ size:Letter; margin:.6in; }} @media print {{ body {{ padding:0; font-size:10.5pt; }} thead {{ display:table-header-group; }} tr {{ page-break-inside:avoid; }} }}
</style></head><body>
<p class="grey" style="margin:0 0 6px">Mastiff</p>
<h1>Subcontractor check: {e(org)}</h1>
<p class="grey" style="margin:6px 0 0">Insurance certificates and lien waivers. Prepared {_d(generated)}</p>
<p class="big">{e(rep.line)}</p>
<p style="margin:0">{e(ADVISORY)}</p>
<h2>Items worth checking</h2>
<table><thead><tr><th>Subcontractor</th><th>Area</th><th>Finding</th><th class="num">Amount</th><th>Done</th></tr></thead>
<tbody>{rows}</tbody></table>
<p style="margin-top:28px;padding-top:12px;border-top:1px solid #000">{e(ADVISORY)}<br>
<span class="grey">These are cautions. None of them holds a payment. Certificates should come from the sub's insurance agent. Lien and insurance requirements depend on your subcontracts and on Michigan law; ask your attorney or agent about a specific case.</span></p>
</body></html>
"""


def write_html(path, org: str, rep: SubReport, generated: date) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(render_html(org, rep, generated), encoding="utf-8")
