"""Command line: python -m lookback scan|preview|readout"""
from __future__ import annotations

import argparse
import re
import sys
from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import List, Optional

from . import readout, report
from .money import find_money
from .importer import LookbackError, describe, read_bills, read_payments
from .rules import Settings, scan


def _slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-") or "office"


def _strip_ext(p: str) -> Path:
    path = Path(p)
    if path.suffix.lower() in (".csv", ".html"):
        path = path.with_suffix("")
    return path


def _parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(prog="python -m lookback", description="Mastiff look-back scan.")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sc = sub.add_parser("scan", help="scan a payments CSV and write the look-back report")
    sc.add_argument("payments")
    sc.add_argument("--out", help="output base path; writes <out>.csv and <out>.html")
    sc.add_argument("--bills", help="optional AP/bills CSV (payee, amount, invoice_no, date)")
    sc.add_argument("--line", default="5000", help="payment approval line (default 5000)")
    sc.add_argument("--org", help="office name for the report")
    ro = sub.add_parser("readout", help="turn a Wall log CSV into the day-30 read-out")
    ro.add_argument("log")
    ro.add_argument("--out", help="output base path; writes <out>.html, <out>.csv and <out>-holds.csv")
    ro.add_argument("--org", help="office name for the read-out")
    ro.add_argument("--line", default="5000", help="payment approval line (default 5000)")
    ro.add_argument("--start", help="first day to include, YYYY-MM-DD")
    ro.add_argument("--end", help="last day to include, YYYY-MM-DD")
    tn = sub.add_parser("1099", help="1099 readiness: vendors that likely need a 1099 and missing W-9s")
    tn.add_argument("payments")
    tn.add_argument("--year", type=int, help="tax year (default: latest year in the file)")
    tn.add_argument("--vendors", help="optional vendor list CSV (vendor, W-9 on file, entity type, TIN last 4)")
    tn.add_argument("--threshold", help="override the reporting line (default: $600 through 2025, $2,000 from 2026)")
    tn.add_argument("--out", help="output base path; writes <out>.csv and <out>.html")
    tn.add_argument("--org", help="office name for the report")
    sb = sub.add_parser("subs", help="subcontractor insurance certificates and lien waivers")
    sb.add_argument("subs", nargs="?", help="subcontractor register CSV (vendor, GL/WC/auto expiry, additional insured, waiver through)")
    sb.add_argument("--payments", help="optional payments CSV to check payments against certificates and waivers")
    sb.add_argument("--as-of", dest="as_of", help="check date, YYYY-MM-DD (default today)")
    sb.add_argument("--template", help="write a blank subcontractor register CSV to this path and stop")
    sb.add_argument("--out", help="output base path; writes <out>.csv and <out>.html")
    sb.add_argument("--org", help="office name for the report")
    pv = sub.add_parser("preview", help="show how headers were matched and row counts")
    pv.add_argument("payments")
    pv.add_argument("--bills", help="optional bills CSV to preview as well")
    return ap


def _amount_line(text: str) -> Decimal:
    try:
        line = Decimal(text.replace("$", "").replace(",", ""))
        if line <= 0:
            raise InvalidOperation
    except InvalidOperation:
        raise LookbackError(f"--line must be a positive amount, got {text!r}.") from None
    return line


def _day(text: Optional[str], flag: str) -> Optional[date]:
    if not text:
        return None
    try:
        return date.fromisoformat(text)
    except ValueError:
        raise LookbackError(f"{flag} must be a date like 2026-09-30, got {text!r}.") from None


def _readout(args) -> int:
    start, end = _day(args.start, "--start"), _day(args.end, "--end")
    if start and end and start > end:
        raise LookbackError("--start is after --end.")
    settings = readout.ReadoutSettings(line=_amount_line(args.line), start=start, end=end)
    res = readout.read_log(args.log)
    org = args.org or Path(args.log).stem
    out = _strip_ext(args.out) if args.out else Path("reports") / f"{_slug(org)}-day30"
    ro = readout.summarize(res.rows, settings)
    html_path, csv_path = out.with_name(out.name + ".html"), out.with_name(out.name + ".csv")
    holds_path = out.with_name(out.name + "-holds.csv")
    readout.write_html(html_path, org, ro, date.today())
    readout.write_csv(csv_path, ro)
    readout.write_holds_csv(holds_path, ro)

    print(ro.line_text)
    if res.skipped:
        print(f"Note: {len(res.skipped)} rows could not be read and were skipped.")
    if res.masked:
        print(f"Note: {res.masked} account-number-like values were cut down to the last 4 digits on import.")
    print(f"Wrote {html_path}")
    print(f"Wrote {csv_path}")
    print(f"Wrote {holds_path}")
    return 0


def _subs(args) -> int:
    from . import subs as subs_mod
    if args.template:
        subs_mod.write_template(args.template)
        print(f"Wrote {args.template}")
        return 0
    if not args.subs:
        raise LookbackError("Give the subcontractor register CSV, or use --template to make a blank one.")
    register = subs_mod.read_subs(args.subs)
    pays = read_payments(args.payments).items if args.payments else None
    as_of = _day(args.as_of, "--as-of") if args.as_of else None
    rep = subs_mod.build(register, pays, as_of)
    org = args.org or Path(args.subs).stem
    out = _strip_ext(args.out) if args.out else Path("reports") / f"{_slug(org)}-subs"
    csv_path, html_path = out.with_name(out.name + ".csv"), out.with_name(out.name + ".html")
    subs_mod.write_csv(csv_path, rep)
    subs_mod.write_html(html_path, org, rep, date.today())
    print(rep.line)
    print(f"Wrote {csv_path}")
    print(f"Wrote {html_path}")
    return 0


def _ten99(args) -> int:
    from . import ten99
    res = read_payments(args.payments)
    vendors = ten99.read_vendors(args.vendors) if args.vendors else None
    thr = None
    if args.threshold:
        try:
            thr = Decimal(args.threshold.replace("$", "").replace(",", ""))
        except InvalidOperation:
            raise LookbackError(f"--threshold must be an amount, got {args.threshold!r}.") from None
    t = ten99.build(res.items, args.year, vendors, thr)
    org = args.org or Path(args.payments).stem
    out = _strip_ext(args.out) if args.out else Path("reports") / f"{_slug(org)}-1099-{t.year}"
    csv_path, html_path = out.with_name(out.name + ".csv"), out.with_name(out.name + ".html")
    ten99.write_csv(csv_path, t)
    ten99.write_html(html_path, org, t, date.today())
    print(t.line)
    if t.year >= 2027 and not args.threshold:
        print("Note: the line from 2027 is adjusted for inflation. Check the IRS figure and pass --threshold.")
    print(f"Wrote {csv_path}")
    print(f"Wrote {html_path}")
    return 0


def _run(args) -> int:
    if args.cmd == "readout":
        return _readout(args)
    if args.cmd == "subs":
        return _subs(args)
    if args.cmd == "1099":
        return _ten99(args)
    if args.cmd == "preview":
        print(describe(read_payments(args.payments)))
        if args.bills:
            print()
            print(describe(read_bills(args.bills)))
        return 0

    try:
        line = Decimal(args.line.replace("$", "").replace(",", ""))
        if line <= 0:
            raise InvalidOperation
    except InvalidOperation:
        raise LookbackError(f"--line must be a positive amount, got {args.line!r}.") from None
    settings = Settings(payment_line=line)
    res = read_payments(args.payments)
    bills = read_bills(args.bills).items if args.bills else None
    org = args.org or Path(args.payments).stem
    out = _strip_ext(args.out) if args.out else Path("reports") / f"{_slug(org)}-lookback"

    flags = scan(res.items, settings, bills)
    money = find_money(res.items, bills, settings)
    summary = report.summarize(res.items, flags, settings, money)
    rows = report.build_rows(flags)
    csv_path, html_path = out.with_name(out.name + ".csv"), out.with_name(out.name + ".html")
    money_path = out.with_name(out.name + "-money.csv")
    report.write_csv(csv_path, rows)
    report.write_money_csv(money_path, money)
    report.write_html(html_path, org, summary, rows, date.today(), money)

    print(summary.text)
    print(money.duplicate_line)
    print(money.late_line)
    print(money.discount_line)
    if res.skipped:
        print(f"Note: {len(res.skipped)} rows could not be read and were skipped.")
    if res.masked:
        print(f"Note: {res.masked} account-number-like values were cut down to the last 4 digits on import.")
    print(f"Wrote {csv_path}")
    print(f"Wrote {html_path}")
    print(f"Wrote {money_path}")
    return 0


def main(argv: Optional[List[str]] = None) -> int:
    args = _parser().parse_args(argv)
    try:
        return _run(args)
    except LookbackError as exc:
        print(f"Error: {exc}", file=sys.stderr)
    except (OSError, UnicodeError) as exc:
        print(f"Error: could not read or write a file: {exc}", file=sys.stderr)
    return 2
