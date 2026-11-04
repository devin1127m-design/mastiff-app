import contextlib
import io
import tempfile
import unittest
from datetime import date
from decimal import Decimal
from pathlib import Path

from lookback import ten99
from lookback.cli import main
from lookback.rules import Payment


def P(row, d, payee, amt, method=""):
    return Payment(row=row, date=d, payee=payee, amount=Decimal(amt), method=method)


class Ten99Tests(unittest.TestCase):
    def setUp(self):
        self.ps = [
            P(1, date(2026, 2, 1), "Ray's Drywall", "1500"),
            P(2, date(2026, 6, 1), "Rays Drywall LLC", "1200"),           # same vendor, 2,700 -> needs
            P(3, date(2026, 3, 1), "Lumber Supply Inc", "9000"),          # corp -> exempt
            P(4, date(2026, 3, 5), "Oakland Law Group Inc", "2500"),      # legal -> always
            P(5, date(2026, 4, 1), "Card Vendor", "5000", "Credit Card"), # card -> excluded
            P(6, date(2026, 5, 1), "Near Line Electric", "1600"),         # 80% -> near
            P(7, date(2026, 5, 1), "Small Guy", "300"),                   # under -> not listed
            P(8, date(2025, 5, 1), "Old Year Co", "9000"),                # other year
        ]

    def test_thresholds_and_deadline(self):
        self.assertEqual(ten99.threshold_for(2025), Decimal("600"))
        self.assertEqual(ten99.threshold_for(2026), Decimal("2000"))
        self.assertEqual(ten99.deadline_for(2026), date(2027, 2, 1))

    def test_statuses(self):
        t = ten99.build(self.ps, 2026)
        s = {l.payee: l.status for l in t.lines}
        self.assertEqual(s["Ray's Drywall"] if "Ray's Drywall" in s else s["Rays Drywall LLC"], ten99.STATUS_NO_W9)
        self.assertEqual(s["Lumber Supply Inc"], ten99.STATUS_CORP)
        self.assertEqual(s["Oakland Law Group Inc"], ten99.STATUS_ALWAYS)
        self.assertEqual(s["Near Line Electric"], ten99.STATUS_NEAR)
        self.assertNotIn("Card Vendor", s)
        self.assertNotIn("Small Guy", s)
        self.assertNotIn("Old Year Co", s)
        self.assertEqual(len(t.needs), 2)

    def test_w9_on_file(self):
        v = {"rays drywall": ten99.VendorInfo("Rays Drywall", True, "Individual", "1234")}
        t = ten99.build(self.ps, 2026, v)
        line = [l for l in t.lines if "Drywall" in l.payee][0]
        self.assertEqual(line.status, ten99.STATUS_NEEDS)

    def test_cli(self):
        with tempfile.TemporaryDirectory() as d:
            src = Path(d) / "p.csv"
            src.write_text("Date,Vendor,Amount,Method\n2026-01-05,Ray's Drywall,2500,Check\n", encoding="utf-8")
            ven = Path(d) / "v.csv"
            ven.write_text("Vendor,W-9 on file,Entity type,TIN\nRay's Drywall,yes,Sole proprietor,123456789\n", encoding="utf-8")
            buf = io.StringIO()
            with contextlib.redirect_stdout(buf):
                self.assertEqual(main(["1099", str(src), "--vendors", str(ven), "--out", str(Path(d) / "o"), "--org", "T"]), 0)
            self.assertIn("1 vendor over the $2,000 line", buf.getvalue())
            text = (Path(d) / "o.csv").read_text(encoding="utf-8")
            self.assertIn("On file", text)
            self.assertNotIn("123456789", text)
            self.assertIn("advisory", (Path(d) / "o.html").read_text(encoding="utf-8"))
