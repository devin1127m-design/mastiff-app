"""CSV import: loose header matching, date/amount parsing, account-number stripping."""
from __future__ import annotations

import csv
import io
import re
from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Dict, List, Tuple

from .bankdesc import merge_prefixes, payee_from_description
from .normalize import HeaderMatch, match_headers
from .rules import Bill, Payment


class LookbackError(Exception):
    """A problem with an input file, phrased for a person."""


PAYMENT_SYNONYMS = {
    "date": ["date", "paymentdate", "paiddate", "datepaid", "transactiondate", "txndate", "postdate", "postingdate", "checkdate"],
    "payee": ["payee", "vendor", "vendorname", "payeename", "paidto", "name", "supplier"],
    "amount": ["amount", "amt", "paymentamount", "amountpaid", "total", "debit", "paid"],
    "method": ["method", "paymentmethod", "paymenttype", "type", "paidby"],
    "check_or_ref": ["checkorref", "checkno", "checknumber", "check", "ref", "refno", "reference", "referencenumber", "num", "checknum", "checkorslip", "checkorslipno", "checkslip"],
    "invoice_no": ["invoiceno", "invoicenumber", "invoice", "invno", "billno", "billnumber", "invnum"],
    "memo": ["memo", "description", "note", "notes", "details"],
    "account_last4": ["accountlast4", "acctlast4", "last4", "account", "accountnumber", "acct", "acctno", "bankaccount", "accountno"],
    "routing_last4": ["routinglast4", "routing", "routingnumber", "aba", "abanumber", "routingno"],
    "direction": ["details", "transactiontype", "drcr", "debitcredit", "creditdebit", "direction", "dc"],
}
# A bank export: no payee column, but a description we can read the payee out of.
DESCRIPTION_HEADERS = ("description", "memo", "details", "transactiondescription", "narrative", "payeedescription")
CREDIT_WORDS = ("credit", "deposit", "cr", "refund", "transfer in", "interest paid")
BILL_SYNONYMS = {
    "date": ["date", "billdate", "invoicedate", "duedate", "txndate"],
    "payee": ["payee", "vendor", "vendorname", "payeename", "supplier", "name"],
    "amount": ["amount", "amt", "total", "billamount", "invoiceamount", "openbalance"],
    "invoice_no": ["invoiceno", "invoicenumber", "invoice", "invno", "billno", "billnumber", "ref", "refno"],
    "terms": ["terms", "paymentterms", "discountterms"],
    "discount_date": ["discountdate", "discountdue", "discountdeadline", "discountduedate"],
    "discount_percent": ["discountpercent", "discountpct", "discountrate"],
}
REQUIRED = ("date", "payee", "amount")

DATE_FORMATS = [
    "%m/%d/%Y", "%m/%d/%y", "%Y-%m-%d", "%m-%d-%Y", "%m-%d-%y", "%Y/%m/%d",
    "%b %d, %Y", "%B %d, %Y", "%d-%b-%Y", "%d %b %Y", "%b %d %Y", "%Y%m%d",
]

_KEYWORD_RE = re.compile(
    r"(?i)\b(acct|account|acc|routing|aba|ein|tin|ssn|tax\s*id)\b(\W{0,12}?)(\d[\d \-]{3,}\d)"
)
_LONG_RUN_RE = re.compile(r"(?<!\d)\d(?:[ \-]?\d){7,}(?!\d)")
_ISO_DATE_RE = re.compile(r"\d{4}-\d{1,2}-\d{1,2}")


def _mask_digits(run: str) -> str:
    return "****" + re.sub(r"\D", "", run)[-4:]


def mask_text(text: str) -> Tuple[str, int]:
    """Replace account-number-like digit runs with ****last4. Returns (text, count masked)."""
    count = 0

    def kw(m):
        nonlocal count
        count += 1
        return f"{m.group(1)}{m.group(2)}{_mask_digits(m.group(3))}"

    def long_run(m):
        nonlocal count
        if _ISO_DATE_RE.fullmatch(m.group(0)):
            return m.group(0)
        count += 1
        return _mask_digits(m.group(0))

    out = _KEYWORD_RE.sub(kw, text or "")
    out = _LONG_RUN_RE.sub(long_run, out)
    return out, count


def last4(value: str) -> Tuple[str, bool]:
    """Keep only the last 4 digits of an account-like field. Returns (last4, was_longer)."""
    digits = re.sub(r"\D", "", value or "")
    return digits[-4:], len(digits) > 4


def parse_date(value: str) -> date:
    s = (value or "").strip()
    if not s:
        raise ValueError("empty date")
    candidates = [s]
    if " " in s or "T" in s:
        candidates.append(re.split(r"[ T]", s, maxsplit=1)[0])
    for cand in candidates:
        for fmt in DATE_FORMATS:
            try:
                return datetime.strptime(cand, fmt).date()
            except ValueError:
                continue
    raise ValueError(f"unrecognised date {value!r}")


def parse_amount(value: str) -> Decimal:
    s = (value or "").strip()
    if not s:
        raise ValueError("empty amount")
    s = re.sub(r"(?i)usd|[$,()\s-]", "", s)
    try:
        d = Decimal(s)
    except InvalidOperation:
        raise ValueError(f"unrecognised amount {value!r}") from None
    d = abs(d).quantize(Decimal("0.01"))
    if d == 0:
        raise ValueError("zero amount")
    return d


@dataclass
class ImportResult:
    kind: str
    items: list = field(default_factory=list)
    headers: List[str] = field(default_factory=list)
    mapping: Dict[str, HeaderMatch] = field(default_factory=dict)
    unmapped: List[str] = field(default_factory=list)
    rows_read: int = 0
    skipped: List[Tuple[int, str]] = field(default_factory=list)
    masked: int = 0


def _read_text(path: Path) -> str:
    raw = path.read_bytes()
    for enc in ("utf-8-sig", "cp1252"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    raise LookbackError(f"{path.name} could not be read as text. Save it as CSV and try again.")


def _read_rows(path) -> Tuple[List[str], List[Tuple[int, List[str]]]]:
    path = Path(path)
    if not path.is_file():
        raise LookbackError(f"File not found: {path}")
    text = _read_text(path)
    if not text.strip():
        raise LookbackError(f"{path.name} is empty.")
    if "\x00" in text:
        raise LookbackError(f"{path.name} does not look like a CSV file.")
    try:
        delim = csv.Sniffer().sniff(text[:4096], delimiters=",;\t").delimiter
    except csv.Error:
        delim = ","
    reader = csv.reader(io.StringIO(text), delimiter=delim)
    headers: List[str] = []
    rows: List[Tuple[int, List[str]]] = []
    try:
        for row in reader:
            if not headers:
                if any(c.strip() for c in row):
                    headers = [c.strip() for c in row]
                continue
            if any(c.strip() for c in row):
                rows.append((reader.line_num, row))
    except csv.Error as exc:
        raise LookbackError(f"{path.name} is not a readable CSV: {exc}") from None
    if not headers:
        raise LookbackError(f"{path.name} has no header row.")
    return headers, rows


def _import(path, kind: str, synonyms) -> ImportResult:
    headers, rows = _read_rows(path)
    mapping = match_headers(headers, synonyms)
    bank_mode = False
    if kind == "payments" and "payee" not in mapping and "memo" in mapping:
        # Bank export: derive the payee from the description column.
        bank_mode = True
        mapping["payee"] = HeaderMatch(mapping["memo"].header, "derived from the description")
    missing = [f for f in REQUIRED if f not in mapping]
    if missing:
        raise LookbackError(
            f"Could not find a column for: {', '.join(missing)}. Headers seen: {', '.join(headers)}."
        )
    res = ImportResult(kind=kind, headers=headers, mapping=mapping, rows_read=len(rows))
    used = {m.header for m in mapping.values()}
    res.unmapped = [h for h in headers if h not in used]
    idx = {f: headers.index(m.header) for f, m in mapping.items()}

    def get(row: List[str], f: str) -> str:
        i = idx.get(f)
        return row[i].strip() if i is not None and i < len(row) else ""

    # Signed amounts: when any amount is negative, positives are money in, not payments.
    signed = kind == "payments" and any(get(row, "amount").lstrip().startswith("-") or get(row, "amount").strip().startswith("(")
                                        for _, row in rows)
    for line, row in rows:
        raw_amt = get(row, "amount").strip()
        direction = get(row, "direction").lower()
        if kind == "payments" and direction and any(w == direction or direction.startswith(w) for w in CREDIT_WORDS):
            res.skipped.append((line, "money in, not a payment"))
            continue
        if signed and raw_amt and not raw_amt.startswith(("-", "(")):
            res.skipped.append((line, "money in, not a payment"))
            continue
        try:
            d = parse_date(get(row, "date"))
            amt = parse_amount(raw_amt)
        except ValueError as exc:
            res.skipped.append((line, str(exc)))
            continue
        texts = {}
        for f in ("payee", "method", "check_or_ref", "invoice_no", "memo"):
            t, n = mask_text(get(row, f))
            res.masked += n
            texts[f] = t.strip()
        if bank_mode:
            payee, ref = payee_from_description(get(row, "memo"))  # before masking, so a phone number is stripped, not starred
            texts["payee"], _ = mask_text(payee)
            if ref and not texts["check_or_ref"]:
                texts["check_or_ref"] = ref
        if not texts["payee"]:
            res.skipped.append((line, "no payee"))
            continue
        acct, a_long = last4(get(row, "account_last4"))
        rout, r_long = last4(get(row, "routing_last4"))
        res.masked += int(a_long) + int(r_long)
        if kind == "payments":
            res.items.append(
                Payment(
                    row=line, date=d, payee=texts["payee"], amount=amt, method=texts["method"],
                    check_or_ref=texts["check_or_ref"], invoice_no=texts["invoice_no"],
                    memo=texts["memo"], account_last4=acct, routing_last4=rout,
                )
            )
        else:
            terms, _ = mask_text(get(row, "terms"))
            try:
                disc_date = parse_date(get(row, "discount_date")) if get(row, "discount_date") else None
            except ValueError:
                disc_date = None
            try:
                raw_pct = re.sub(r"[%\s]", "", get(row, "discount_percent"))
                disc_pct = Decimal(raw_pct) if raw_pct else None
                if disc_pct is not None and not (0 < disc_pct <= 100):
                    disc_pct = None
            except InvalidOperation:
                disc_pct = None
            res.items.append(Bill(date=d, payee=texts["payee"], amount=amt, invoice_no=texts["invoice_no"],
                                  terms=terms.strip(), discount_date=disc_date, discount_percent=disc_pct))
    if not res.items:
        raise LookbackError(f"No usable rows in {Path(path).name}. {len(res.skipped)} rows were skipped.")
    if bank_mode:
        canon = merge_prefixes([i.payee for i in res.items])
        res.items = [i._replace(payee=canon.get(i.payee, i.payee)) if hasattr(i, "_replace") else _with_payee(i, canon.get(i.payee, i.payee)) for i in res.items]
    return res


def _with_payee(item, payee):
    from dataclasses import replace
    return replace(item, payee=payee)


def read_payments(path) -> ImportResult:
    return _import(path, "payments", PAYMENT_SYNONYMS)


def read_bills(path) -> ImportResult:
    return _import(path, "bills", BILL_SYNONYMS)


def describe(res: ImportResult) -> str:
    lines = [f"{res.kind.capitalize()} file: {res.rows_read} rows read, {len(res.items)} usable, {len(res.skipped)} skipped."]
    if res.mapping.get("payee") and res.mapping["payee"].how == "derived from the description":
        lines.append("Bank export: payee names read out of the description; checks show only a number; "
                     "invoice wording and vendor accounts are not in this file.")
    lines.append("Column matching:")
    synonyms = PAYMENT_SYNONYMS if res.kind == "payments" else BILL_SYNONYMS
    for f in synonyms:
        m = res.mapping.get(f)
        if m:
            lines.append(f"  {f:<14} <- {m.header!r} ({m.how})")
        else:
            lines.append(f"  {f:<14} <- (not found, {'required' if f in REQUIRED else 'optional'})")
    if res.unmapped:
        lines.append("Ignored columns: " + ", ".join(res.unmapped))
    dates = [i.date for i in res.items]
    lines.append(f"Dates: {min(dates).isoformat()} to {max(dates).isoformat()}")
    lines.append(f"Distinct payees: {len({i.payee.lower() for i in res.items})}")
    lines.append(f"Account-number-like values trimmed to last 4 digits: {res.masked}")
    for line, why in res.skipped[:10]:
        lines.append(f"  skipped line {line}: {why}")
    if len(res.skipped) > 10:
        lines.append(f"  ...and {len(res.skipped) - 10} more skipped")
    return "\n".join(lines)
