"""Name normalisation and loose header matching. Standard library only."""
from __future__ import annotations

import difflib
import re
from typing import Dict, NamedTuple, Optional, Sequence

SUFFIXES = frozenset(
    {"llc", "inc", "co", "corp", "corporation", "company", "ltd", "lp", "llp", "pllc", "incorporated"}
)


def normalize_name(name: str) -> str:
    """Lowercase, drop punctuation and LLC/Inc/Co/Corp/Ltd/LP style suffixes."""
    s = (name or "").lower().replace("&", " and ")
    s = re.sub(r"[.'’`]", "", s)
    s = re.sub(r"[^a-z0-9]+", " ", s).strip()
    tokens = [t for t in s.split() if t not in SUFFIXES]
    return " ".join(tokens) or s


def normalize_header(header: str) -> str:
    return re.sub(r"[^a-z0-9]", "", (header or "").lower())


class HeaderMatch(NamedTuple):
    header: str
    how: str  # "exact" or "close"


def match_headers(
    headers: Sequence[str], synonyms: Dict[str, Sequence[str]], cutoff: float = 0.85
) -> Dict[str, HeaderMatch]:
    """Map each field to a source header: exact synonym hits first, then close spellings."""
    norm = [normalize_header(h) for h in headers]
    used: set = set()
    result: Dict[str, HeaderMatch] = {}
    for field, syns in synonyms.items():
        done = False
        for syn in syns:
            for i, n in enumerate(norm):
                if i not in used and n == syn:
                    used.add(i)
                    result[field] = HeaderMatch(headers[i], "exact")
                    done = True
                    break
            if done:
                break
    for field, syns in synonyms.items():
        if field in result:
            continue
        best: Optional[tuple] = None
        for i, n in enumerate(norm):
            if i in used or not n:
                continue
            close = difflib.get_close_matches(n, list(syns), n=1, cutoff=cutoff)
            if close:
                score = difflib.SequenceMatcher(None, n, close[0]).ratio()
                if best is None or score > best[0]:
                    best = (score, i)
        if best:
            used.add(best[1])
            result[field] = HeaderMatch(headers[best[1]], "close")
    return result
