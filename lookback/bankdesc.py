"""Payee out of a bank's description line.

A bank export has no payee column: the name is buried in a description like
"ORIG CO NAME:RAYS DRYWALL LLC  ORIG ID:..." or "MENARDS LAKE ORION MI 05/03"
or "CHECK 1837". This pulls out the part that names who was paid. Best effort,
plain regex, and the importer records that it was derived so the report can say so.
Keep in step with src/lib/lookback/bankdesc.ts.
"""
from __future__ import annotations

import re
from typing import Optional, Tuple

_PREFIXES = re.compile(
    r"(?i)^\s*(?:pos\s+debit|pos\s+purchase|debit\s+card\s+purchase|debit\s+purchase|card\s+purchase|purchase|"
    r"ach\s+debit|ach\s+payment|ach\s+pmt|electronic\s+payment|online\s+payment|online\s+pmt|bill\s+pay(?:ment)?|"
    r"payment\s+to|pmt\s+to|zelle\s+payment\s+to|zelle\s+to|wire\s+out(?:going)?|wire\s+transfer\s+to|"
    r"recurring\s+payment|recurring\s+debit|preauthorized\s+debit|web\s+pmt|epay|autopay)\b[\s:\-]*"
)
_ORIG = re.compile(r"(?i)ORIG\s*CO\s*NAME:\s*(.+?)\s+(?:ORIG\s*ID|CO\s*ID|DESC)")
_CHECK = re.compile(r"(?i)^\s*(?:check|chk|cheque)\s*#?\s*(\d{2,})\b")
_TRAIL_DATE = re.compile(r"\s+\d{1,2}/\d{1,2}(?:/\d{2,4})?\s*$")
_TRAIL_PHONE = re.compile(r"\s+\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}\b")
_STATES = "AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC"
_TRAIL_STATE = re.compile(r"\s+(?:" + _STATES + r")\s*$")                        # a bare trailing state code
_TRAIL_LOC = re.compile(r"\s+[A-Z][A-Za-z.']*\s+(?:" + _STATES + r")\s*$")       # "OXFORD MI"; a longer city leaves a word behind, merged later
_TRAIL_NUM = re.compile(r"[\s#*]+[A-Z]?\d{4,}\s*$")                     # trailing reference numbers
_ID_FIELDS = re.compile(r"(?i)\b(?:id|ref|trace|conf(?:irmation)?|auth|seq)\s*[#:]\s*\S+")
_WS = re.compile(r"\s+")


def payee_from_description(desc: str) -> Tuple[str, Optional[str]]:
    """Return (payee, check_or_ref). Payee is '' when nothing usable is left."""
    s = (desc or "").strip()
    if not s:
        return "", None
    m = _CHECK.match(s)
    if m:
        return "Check (payee not in the export)", m.group(1)
    m = _ORIG.search(s)
    if m:
        return _tidy(m.group(1)), None
    s = _PREFIXES.sub("", s)
    s = _ID_FIELDS.sub("", s)
    for _ in range(3):
        s2 = _TRAIL_DATE.sub("", s)
        s2 = _TRAIL_PHONE.sub("", s2)
        s2 = _TRAIL_NUM.sub("", s2)
        if s2 == s:
            break
        s = s2
    if _TRAIL_STATE.search(s) and len(s.split()) >= 2:
        s2 = _TRAIL_STATE.sub("", s) if _TRAIL_PHONE.search(desc) else _TRAIL_LOC.sub("", s)
        if s2.strip():
            s = s2
    return _tidy(s), None


def merge_prefixes(names):
    """Names that extend one another by whole words are one vendor ("Home Depot Pro",
    "Home Depot Pro Lake", "Home Depot Pro Auburn"). Each maps to the family's most common form."""
    from collections import Counter
    counts = Counter(n for n in names if n)
    keys = sorted(counts, key=len)
    family = {}
    for n in keys:
        root = n
        for k in keys:
            if len(k) >= len(n):
                break
            if (len(k.split()) >= 2 or len(k) >= 6) and n.lower().startswith(k.lower() + " "):
                root = family.get(k, k)
                break
        family[n] = root
    members = {}
    for n, root in family.items():
        members.setdefault(root, []).append(n)
    canon = {}
    for root, ns in members.items():
        best = max(ns, key=lambda x: (counts[x], -len(x)))
        for n in ns:
            canon[n] = best
    return canon


def _tidy(s: str) -> str:
    s = _WS.sub(" ", s).strip(" -:*#")
    if s.isupper() and len(s) > 3:
        s = " ".join(w if w in ("LLC", "INC", "LLP", "PC", "DBA", "USA") else w.capitalize() for w in s.split())
    return s
