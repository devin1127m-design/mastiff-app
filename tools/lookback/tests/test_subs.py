import contextlib
import io
import tempfile
import unittest
from datetime import date
from decimal import Decimal
from pathlib import Path

from lookback import subs
from lookback.cli import main
from lookback.rules import Payment

AS_OF = date(2026, 10, 28)


def P(row, d, payee, amt):
    return Payment(row=row, date=d, payee=payee, amount=Decimal(amt))


class SubsTests(unittest.TestCase):
    def setUp(self):
        self.reg = {
            "good drywall": subs.Sub("Good Drywall LLC", gl=date(2027, 6, 1), wc=date(2027, 6, 1), ai=True,
                                     waiver=date(2026, 10, 1)),
            "lapsed concrete": subs.Sub("Lapsed Concrete", gl=date(2026, 8, 31), wc=date(2027, 1, 1), ai=True,
                                        waiver=date(2026, 7, 31)),
            "soon roofing": subs.Sub("Soon Roofing", gl=date(2026, 11, 15), wc_exempt=True, ai=False),
        }
        self.pays = [
            P(1, date(2026, 9, 15), "Good Drywall", "5000"),         # covered by waiver, insured
            P(2, date(2026, 7, 15), "Lapsed Concrete", "3000"),      # insured, waived
            P(3, date(2026, 9, 20), "Lapsed Concrete", "4000"),      # GL lapsed, not waived
            P(4, date(2026, 10, 10), "Lapsed Concrete", "2500"),     # GL lapsed, not waived
            P(5, date(2026, 10, 1), "Soon Roofing", "1200"),         # no waiver on file
            P(6, date(2026, 10, 1), "Not A Sub Supply", "9999"),     # ignored
        ]

    def test_build(self):
        r = subs.build(self.reg, self.pays, AS_OF)
        self.assertEqual(r.uninsured_total, Decimal("6500"))
        self.assertEqual(r.unwaived_total, Decimal("7700"))
        found = [(i.payee, i.finding) for i in r.items]
        self.assertTrue(any("expired Aug 31, 2026" in f for p, f in found if p == "Lapsed Concrete"))
        self.assertTrue(any("within 30 days" in f for p, f in found if p == "Soon Roofing"))
        self.assertTrue(any("exempt" in f for p, f in found if p == "Soon Roofing"))
        self.assertTrue(any("additional insured" in f for p, f in found if p == "Soon Roofing"))
        self.assertFalse(any(p == "Good Drywall LLC" for p, f in found))
        self.assertFalse(any("Not A Sub" in p for p, f in found))
        self.assertIn("2 with payments not covered", r.line)
        for i in r.items:
            for bad in ("fraud", "illegal", "confirmed"):
                self.assertNotIn(bad, (i.finding + i.check).lower())

    def test_without_payments(self):
        r = subs.build(self.reg, None, AS_OF)
        self.assertEqual(r.unwaived_total, Decimal("0"))
        self.assertTrue(all(i.kind == "Insurance" for i in r.items))

    def test_cli_and_template(self):
        with tempfile.TemporaryDirectory() as d:
            d = Path(d)
            buf = io.StringIO()
            with contextlib.redirect_stdout(buf):
                self.assertEqual(main(["subs", "--template", str(d / "t.csv")]), 0)
                reg = subs.read_subs(d / "t.csv")
                self.assertEqual(len(reg), 2)
                self.assertTrue(reg["example concrete"].wc_exempt)
                (d / "p.csv").write_text("Date,Vendor,Amount\n2026-10-05,Example Drywall LLC,800\n", encoding="utf-8")
                self.assertEqual(main(["subs", str(d / "t.csv"), "--payments", str(d / "p.csv"),
                                       "--as-of", "2026-10-28", "--out", str(d / "o"), "--org", "T"]), 0)
            self.assertIn("subcontractors checked", buf.getvalue())
            self.assertIn("does not give legal advice", (d / "o.html").read_text(encoding="utf-8"))
