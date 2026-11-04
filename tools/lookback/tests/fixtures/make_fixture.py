"""Deterministic generator for the 700-row look-back fixture.

Run:  python -m lookback.tests.fixtures.make_fixture
Writes payments_700.csv and bills_700.csv next to this file.

Planted: one pattern per rule 1-7 (PLANTED) plus two clean look-alike pairs (CLEAN) that must not flag.
Everything else is background: recurring vendors with steady amounts that must not flag either.
"""
from __future__ import annotations

import csv
import difflib
import random
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path

SEED = 20250701
START, END = date(2024, 1, 1), date(2025, 6, 30)
TOTAL = 700
HERE = Path(__file__).parent

PLANTED = {
    1: "Pinecrest HVAC",
    2: "Lakeview Marketing Partners",
    3: "Metro Fasteners",
    4: "Acme Suply",
    5: "Gordon Glass",
    6: "Northfield Concrete",
    7: "Riverbend Landscaping",
}
CLEAN = ["Oakland Electric", "Oakland Electrical Supply", "Brandon Tile", "Brandon Tiles"]

# Money findings (lookback/money.py). Known amounts the tests check to the cent.
MONEY_DUPLICATES = {  # payee: amount of the second payment
    "Ironwood Excavating": Decimal("1284.50"),      # same amount, five days apart
    "Cascade Roofing Supply": Decimal("2310.40"),   # same invoice number, 78 days apart
}
MONEY_LATE = {  # payee: amount; memos are set where each row is added
    "Lakeshore Credit Union": Decimal("75.00"),
    "Paylink Payment Processing": Decimal("35.00"),
    "Delmar Wholesale Supply": Decimal("184.22"),
    "Tri-County Utilities": Decimal("28.00"),
}
MONEY_LENDER = "Huron Valley Bank"  # memo "loan payment interest": scheduled loan interest, not flagged
MONEY_MISSED = {  # payee: (bill amount, days from bill to payment, discount missed at 2%)
    "Harlan Building Products": (Decimal("3275.50"), 18, Decimal("65.51")),
    "Corbin Electrical Wholesale": (Decimal("1892.50"), 25, Decimal("37.85")),
    "Penrose Fastener and Tool": (Decimal("2640.50"), 33, Decimal("52.81")),
}
MONEY_IN_WINDOW = {  # paid on day 8 and on day 10 (the last day of the window): no discount missed
    "Kessler Glass and Door": (Decimal("1450.50"), 8),
    "Brightwater Paint Supply": (Decimal("980.25"), 10),
}
MONEY_PAYEES = (set(MONEY_DUPLICATES) | set(MONEY_LATE) | {MONEY_LENDER} | set(MONEY_MISSED) | set(MONEY_IN_WINDOW))

WORDS = (
    "Maple Cedar Granite Harbor Summit Ridge Lakeshore Westfield Eastgate Pioneer Liberty Heritage Crescent "
    "Beacon Redwood Silverline Stonebridge Meadow Falcon Orion Kestrel Juniper Sterling Atlas Cobalt "
    "Evergreen Foxcroft Glenview Hawthorne Inland Jasper Keystone Lantern Mercer Overlook Parkway "
    "Quarry Rainier Sable Tamarack Union Vanguard Wexford Yarrow Zenith Aspen Copperfield "
    "Elmhurst Fairmont Gateway Highland Kingsley Larkspur Magnolia Northgate"
).split()
TRADES = ["Plumbing", "Roofing", "Lumber", "Insurance", "Office Supply", "Fuel", "Telecom",
          "Equipment Rental", "Printing", "Staffing", "Paving", "Cleaning"]
METHODS = ["ACH", "ACH", "Check", "Check", "Wire", "Card"]


def _amount(rng: random.Random, base: float, lo: float = 0.88, hi: float = 1.12) -> Decimal:
    d = Decimal(str(round(base * rng.uniform(lo, hi), 2)))
    if d % 100 == 0:
        d += Decimal("0.37")
    return d


def _dates(rng, first: date, last: date, interval: int):
    out, d = [], first
    while d <= last:
        out.append(d + timedelta(days=rng.randint(-3, 3)))
        d += timedelta(days=interval)
    return [x for x in out if START <= x <= END]


class _Builder:
    def __init__(self, rng):
        self.rng = rng
        self.recs = []
        self.n = 0

    def add(self, when, payee, amount, acct, *, tag="", bill=True, invoice=None, method=None, memo="",
            bill_days=None, terms=""):
        self.n += 1
        method = method or self.rng.choice(METHODS)
        self.recs.append(dict(
            date=when, payee=payee, amount=amount, acct=acct, tag=tag, bill=bill, memo=memo,
            bill_days=bill_days, terms=terms,
            invoice=invoice or f"INV-{self.n:05d}", method=method,
            ref=str(10000 + self.n) if method == "Check" else "",
        ))

    def series(self, payee, base, acct, first, last, interval, tag="", **kw):
        seen = set()
        for d in _dates(self.rng, first, last, interval):
            a = _amount(self.rng, base)
            while a in seen:
                a = _amount(self.rng, base)
            seen.add(a)
            self.add(d, payee, a, acct, tag=tag, **kw)


def generate():
    rng = random.Random(SEED)
    b = _Builder(rng)
    acct = lambda: f"{rng.randint(1000, 9999)}"

    # --- planted, one per rule -------------------------------------------------
    # 1: nine payments to account 4412, then the account changes to 9087 in the last month
    b.series(PLANTED[1], 1450, "4412", date(2024, 9, 10), date(2025, 5, 12), 30, tag="p1")
    b.add(date(2025, 6, 10), PLANTED[1], Decimal("1472.18"), "9087", tag="p1")
    b.add(date(2025, 6, 24), PLANTED[1], Decimal("1431.64"), "9087", tag="p1")
    # 2: one round payment, never again
    b.add(date(2025, 6, 18), PLANTED[2], Decimal("2500.00"), "7731", tag="p2", method="Wire")
    # 3: same amount twice, six days apart
    b.series(PLANTED[3], 880, "6150", date(2024, 2, 5), date(2025, 6, 1), 35, tag="p3")
    dup_src = [r for r in b.recs if r["tag"] == "p3"][5]
    b.add(dup_src["date"] + timedelta(days=6), PLANTED[3], dup_src["amount"], "6150", tag="p3")
    # 4: Acme Supply / Acme Supply LLC are one vendor; Acme Suply is the lookalike
    names = ["Acme Supply", "Acme Supply LLC"]
    for i, d in enumerate(_dates(rng, date(2024, 1, 20), date(2025, 6, 1), 45)):
        b.add(d, names[i % 2], _amount(rng, 2100), "3320", tag="p4ctl")
    b.add(date(2025, 4, 2), PLANTED[4], Decimal("2144.90"), "8841", tag="p4")
    b.add(date(2025, 5, 20), PLANTED[4], Decimal("2087.35"), "8841", tag="p4")
    # 5: usual ~1,200, then one at 3,900
    b.series(PLANTED[5], 1200, "5502", date(2024, 10, 3), date(2025, 4, 30), 30, tag="p5")
    b.add(date(2025, 5, 22), PLANTED[5], Decimal("3900.75"), "5502", tag="p5")
    # 6: regular near-line payments, then four inside three weeks (line 5,000)
    for d, a in [(date(2024, 11, 5), "4881.40"), (date(2024, 12, 4), "4927.15"), (date(2025, 1, 6), "4863.90"),
                 (date(2025, 4, 3), "4912.25"), (date(2025, 4, 11), "4958.60"),
                 (date(2025, 4, 19), "4894.05"), (date(2025, 4, 27), "4935.80")]:
        b.add(d, PLANTED[6], Decimal(a), "2088", tag="p6")
    # 7: monthly, one payment has no bill
    b.series(PLANTED[7], 650, "9014", date(2024, 6, 8), date(2025, 6, 8), 30, tag="p7")
    nb = [r for r in b.recs if r["tag"] == "p7"][8]
    nb["bill"] = False
    nb["tag"] = "p7nobill"

    # --- clean look-alikes: different companies, long histories, own accounts --------
    b.series("Oakland Electric", 2400, "1102", date(2024, 1, 12), END, 40, tag="clean")
    b.series("Oakland Electrical Supply", 980, "6609", date(2024, 1, 25), END, 35, tag="clean")
    b.series("Brandon Tile", 1750, "2250", date(2024, 2, 2), END, 45, tag="clean")
    b.series("Brandon Tiles", 640, "7743", date(2024, 2, 20), END, 50, tag="clean")

    # --- money findings: explicit method and bill timing so no random numbers are drawn here ----
    two = Decimal("1284.50")
    b.add(date(2024, 8, 14), "Ironwood Excavating", two, "", tag="m-dup", method="ACH", invoice="IE-4410")
    b.add(date(2024, 8, 19), "Ironwood Excavating", two, "", tag="m-dup", method="ACH", invoice="IE-4411")
    b.add(date(2024, 11, 4), "Cascade Roofing Supply", Decimal("2310.40"), "", tag="m-dup", method="ACH",
          invoice="CRS-88231")
    b.add(date(2025, 1, 21), "Cascade Roofing Supply", Decimal("2310.40"), "", tag="m-dup", method="ACH",
          invoice="CRS-88231", bill=False)
    b.add(date(2024, 5, 9), "Lakeshore Credit Union", Decimal("75.00"), "", tag="m-late", method="ACH",
          memo="LATE FEE")
    b.add(date(2024, 10, 17), "Paylink Payment Processing", Decimal("35.00"), "", tag="m-late", method="Card",
          memo="returned payment fee")
    b.add(date(2025, 2, 13), "Delmar Wholesale Supply", Decimal("184.22"), "", tag="m-late", method="Check",
          memo="finance charge on balance")
    b.add(date(2025, 3, 26), "Tri-County Utilities", Decimal("28.00"), "", tag="m-late", method="ACH",
          memo="past due fee")
    for d, a in [(date(2024, 4, 3), "412.67"), (date(2024, 5, 3), "409.12"), (date(2024, 6, 3), "405.55")]:
        b.add(d, MONEY_LENDER, Decimal(a), "", tag="m-lender", method="ACH", memo="loan payment interest")
    for (name, (amt, days, _)), d in zip(MONEY_MISSED.items(),
                                         [date(2024, 7, 22), date(2024, 9, 12), date(2025, 1, 30)]):
        b.add(d, name, amt, "", tag="m-missed", method="Check", terms="2/10 net 30", bill_days=days)
    for (name, (amt, days)), d in zip(MONEY_IN_WINDOW.items(), [date(2024, 12, 5), date(2025, 3, 11)]):
        b.add(d, name, amt, "", tag="m-window", method="Check", terms="2/10 net 30", bill_days=days)

    # --- background -------------------------------------------------------------
    target = TOTAL - len(b.recs)
    pool = [(w, t) for w, t in zip(WORDS, [TRADES[i % len(TRADES)] for i in range(len(WORDS))])]
    rng.shuffle(pool)
    generic = []
    gb = _Builder(rng)
    gb.n = 1000
    taken = [v.lower() for v in list(PLANTED.values()) + CLEAN + ["Acme Supply LLC"] + sorted(MONEY_PAYEES)]
    for word, trade in pool:
        name = f"{word} {trade}"
        if any(difflib.SequenceMatcher(None, name.lower(), t).ratio() >= 0.75 for t in taken):
            continue
        taken.append(name.lower())
        iv = rng.choice([28, 30, 35, 42, 45, 60])
        first = START + timedelta(days=rng.randint(0, iv))
        gb.series(name, rng.choice([300, 520, 760, 1100, 1650, 2300, 3100, 3600]), acct(),
                  first, END, iv, tag="bg")
        if len(gb.recs) >= target:
            break
    assert len(gb.recs) >= target, "not enough background rows"
    while len(gb.recs) > target:
        gb.recs.pop(rng.randrange(len(gb.recs)))
    # a few full account numbers and tax IDs in the raw file, to exercise import stripping
    idx = rng.sample(range(len(gb.recs)), 12)
    for i in idx[:6]:
        gb.recs[i]["acct"] = str(rng.randint(10**7, 10**11)) + gb.recs[i]["acct"]
    for i in idx[6:9]:
        gb.recs[i]["memo"] = f"wire to acct {rng.randint(10**9, 10**11)} routing 072000326"
    for i in idx[9:]:
        gb.recs[i]["memo"] = f"W-9 on file, EIN 38-{rng.randint(1000000, 9999999)}"
    recs = b.recs + gb.recs
    assert len(recs) == TOTAL, len(recs)
    names_all = sorted({r["payee"] for r in recs})
    # sanity: only the intended lookalike pairs resemble each other
    allowed = {frozenset(x) for x in [("Acme Suply", "Acme Supply"), ("Acme Suply", "Acme Supply LLC"),
                                      ("Brandon Tile", "Brandon Tiles")]}
    for i, x in enumerate(names_all):
        for y in names_all[i + 1:]:
            if frozenset((x, y)) in allowed or {x, y} == {"Acme Supply", "Acme Supply LLC"}:
                continue
            assert difflib.SequenceMatcher(None, x.lower(), y.lower()).ratio() < 0.8, (x, y)

    recs.sort(key=lambda r: (r["date"], r["payee"], r["invoice"]))
    pay_rows, bill_rows = [], []
    for r in recs:
        fmt = "%Y-%m-%d" if rng.random() < 0.1 else "%m/%d/%Y"
        pay_rows.append([r["date"].strftime(fmt), r["payee"], f"${r['amount']:,.2f}", r["method"],
                         r["ref"], r["invoice"], r["memo"], r["acct"]])
        if r["bill"]:
            back = r["bill_days"] if r["bill_days"] is not None else rng.randint(5, 40)
            bd = r["date"] - timedelta(days=back)
            bill_rows.append([bd.strftime("%m/%d/%Y"), r["payee"], f"{r['amount']:.2f}", r["invoice"], r["terms"]])
    return pay_rows, bill_rows


PAY_HEADER = ["Date", "Payee", "Amount", "Method", "Check #", "Invoice No", "Memo", "Account Last4"]
BILL_HEADER = ["Bill Date", "Vendor", "Amount", "Invoice No", "Terms"]


def write(path_pay=None, path_bills=None):
    pay, bills = generate()
    for path, header, rows in [(path_pay or HERE / "payments_700.csv", PAY_HEADER, pay),
                               (path_bills or HERE / "bills_700.csv", BILL_HEADER, bills)]:
        with open(path, "w", newline="", encoding="utf-8") as fh:
            w = csv.writer(fh, lineterminator="\n")
            w.writerow(header)
            w.writerows(rows)


if __name__ == "__main__":
    write()
    print("wrote", HERE / "payments_700.csv", "and", HERE / "bills_700.csv")
