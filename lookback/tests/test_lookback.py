import contextlib
import copy
import csv
import io
import re
import tempfile
import unittest
from datetime import date
from decimal import Decimal
from pathlib import Path

from lookback import report
from lookback.cli import main
from lookback.money import find_money
from lookback.importer import LookbackError, mask_text, parse_amount, parse_date, read_bills, read_payments
from lookback.normalize import match_headers, normalize_name
from lookback.rules import Bill, Flag, Payment, Settings, scan
from lookback.tests.fixtures import make_fixture

FIX = Path(__file__).parent / "fixtures"
PAYMENTS = FIX / "payments_700.csv"
BILLS = FIX / "bills_700.csv"

_n = 0


def pay(when, payee, amount, acct="", **kw):
    global _n
    _n += 1
    return Payment(row=_n, date=when, payee=payee, amount=Decimal(str(amount)), account_last4=acct, **kw)


def monthly(payee, base, acct, n, year=2024):
    return [pay(date(year, 1 + i, 10), payee, base + i * 7 + Decimal("0.13"), acct) for i in range(n)]


class NormalizeTests(unittest.TestCase):
    def test_names(self):
        self.assertEqual(normalize_name("Acme Supply, L.L.C."), "acme supply")
        self.assertEqual(normalize_name("ACME  SUPPLY Inc."), "acme supply")
        self.assertEqual(normalize_name("Smith & Sons Co"), "smith and sons")

    def test_headers(self):
        m = match_headers(["Pmt Date", "Vendor Name", "Amt", "Chk #"],
                          {"date": ["paymentdate", "pmtdate"], "payee": ["vendorname"], "amount": ["amt"],
                           "check_or_ref": ["check", "chk"]})
        self.assertEqual(m["payee"].header, "Vendor Name")
        self.assertIn("check_or_ref", m)


class ImportTests(unittest.TestCase):
    def test_parsers(self):
        self.assertEqual(parse_date("3/5/2024"), date(2024, 3, 5))
        self.assertEqual(parse_date("2024-03-05"), date(2024, 3, 5))
        self.assertEqual(parse_date("Mar 5, 2024"), date(2024, 3, 5))
        self.assertEqual(parse_amount("$1,234.50"), Decimal("1234.50"))
        self.assertEqual(parse_amount("(2,000.00)"), Decimal("2000.00"))
        with self.assertRaises(ValueError):
            parse_date("soon")

    def test_mask_keeps_dates_and_short_numbers(self):
        self.assertEqual(mask_text("paid 2024-01-15 inv 123456")[0], "paid 2024-01-15 inv 123456")
        self.assertEqual(mask_text("acct 123456789012")[0], "acct ****9012")
        self.assertEqual(mask_text("EIN 38-1234567")[0], "EIN ****4567")

    def test_no_full_account_number_survives(self):
        raw = PAYMENTS.read_text(encoding="utf-8")
        self.assertTrue(re.search(r"\d{8,}", raw), "fixture should contain full numbers to strip")
        res = read_payments(PAYMENTS)
        self.assertGreater(res.masked, 0)
        for p in res.items:
            self.assertLessEqual(len(p.account_last4), 4)
            for value in (p.payee, p.method, p.check_or_ref, p.invoice_no, p.memo, p.account_last4, p.routing_last4):
                self.assertIsNone(re.search(r"\d{8,}", value), value)
                self.assertIsNone(re.search(r"(?i)(acct|account|routing)\W*\d{5,}", value), value)

    def test_bad_files(self):
        with tempfile.TemporaryDirectory() as d:
            bad = Path(d) / "bad.csv"
            bad.write_text("foo,bar\n1,2\n", encoding="utf-8")
            with self.assertRaises(LookbackError):
                read_payments(bad)
            with self.assertRaises(LookbackError):
                read_payments(Path(d) / "missing.csv")
            empty = Path(d) / "empty.csv"
            empty.write_text("", encoding="utf-8")
            with self.assertRaises(LookbackError):
                read_payments(empty)


class RuleUnitTests(unittest.TestCase):
    def rules_for(self, flags, payee):
        return {f.rule for f in flags if f.payee == payee}

    def test_rule1_bank_change(self):
        ps = monthly("Pine HVAC", 1000, "4412", 5) + [pay(date(2024, 8, 10), "Pine HVAC", 1010, "9087")]
        fl = scan(ps)
        self.assertEqual([f.rule for f in fl], [1])
        self.assertEqual(fl[0].verdict, "would have held")

    def test_rule2_round_once(self):
        fl = scan([pay(date(2024, 1, 5), "One Off Co", "2500.00")] + monthly("Regular", 800, "1111", 4))
        self.assertEqual({f.rule for f in fl}, {2})
        self.assertEqual(scan([pay(date(2024, 1, 5), "One Off Co", "2517.42")]), [])

    def test_rule3_amount_and_invoice(self):
        fl = scan([pay(date(2024, 1, 5), "Dup Co", "812.40"), pay(date(2024, 1, 12), "Dup Co", "812.40")])
        self.assertEqual([f.rule for f in fl], [3])
        self.assertEqual(fl[0].verdict, "worth checking")
        fl = scan([pay(date(2024, 1, 5), "Inv Co", "100.10", invoice_no="A-77"),
                   pay(date(2024, 5, 5), "Inv Co", "230.20", invoice_no="A-77")])
        self.assertEqual([f.rule for f in fl], [3])
        # 20 days apart, same amount, different invoices: fine
        self.assertEqual(scan([pay(date(2024, 1, 5), "Ok Co", "812.40"), pay(date(2024, 1, 25), "Ok Co", "812.40")]), [])

    def test_rule4_lookalike_and_clean_pair(self):
        ps = monthly("Acme Supply", 900, "1000", 6) + [pay(date(2024, 9, 1), "Acme Suply", "905.55", "2000")]
        fl = [f for f in scan(ps) if f.rule == 4]
        self.assertEqual(len(fl), 1)
        self.assertEqual(fl[0].payee, "Acme Suply")
        # suffix variants are one vendor, not a lookalike
        self.assertEqual(scan(monthly("Acme Supply", 900, "1000", 4) +
                              [pay(date(2024, 9, 1), "Acme Supply LLC", "905.55", "1000")]), [])

    def test_rule5_range_and_no_history(self):
        ps = monthly("Glass", 1000, "3333", 6) + [pay(date(2024, 9, 1), "Glass", "2900.00", "3333")]
        self.assertEqual([f.rule for f in scan(ps)], [5])
        fl = scan([pay(date(2024, 1, 5), "New Big Co", "5200.55")])  # also paid once, over the line
        self.assertEqual(sorted(f.rule for f in fl), [2, 5])
        fl = scan([pay(date(2024, 1, 5), "New Big Co", "5200.55")], Settings(payment_line=Decimal("6000")))
        self.assertEqual(fl, [])

    def test_rule6_cluster(self):
        ps = [pay(date(2024, 3, d), "Splitco", a) for d, a in [(1, "4900.10"), (9, "4950.20"), (20, "4875.30")]]
        self.assertEqual({f.rule for f in scan(ps)}, {6})
        self.assertEqual(scan(ps[:2]), [])

    def test_rule7_only_with_bills(self):
        ps = [pay(date(2024, 3, 10), "Bill Co", "300.25", invoice_no="B-1"),
              pay(date(2024, 4, 10), "Bill Co", "310.25", invoice_no="B-2")]
        bills = [Bill(date(2024, 3, 1), "Bill Co", Decimal("300.25"), "B-1")]
        self.assertEqual(scan(ps), [])
        fl = scan(ps, bills=bills)
        self.assertEqual([(f.rule, f.amount) for f in fl], [(7, Decimal("310.25"))])

    def test_flag_fields(self):
        fl = scan([pay(date(2024, 1, 5), "One Off Co", "2500.00")])[0]
        for attr in ("rule", "weight", "date", "payee", "amount", "reason", "check", "verdict"):
            self.assertTrue(getattr(fl, attr))

    def test_scan_is_pure(self):
        ps = read_payments(PAYMENTS).items
        before = copy.deepcopy(ps)
        s = Settings()
        a = scan(ps, s)
        b = scan(ps, s)
        self.assertEqual(a, b)
        self.assertEqual(ps, before)
        self.assertEqual(scan(list(reversed(ps)), s), a)  # input order does not matter
        bills = read_bills(BILLS).items
        self.assertEqual(scan(ps, s, bills), scan(ps, s, bills))


class FixtureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.res = read_payments(PAYMENTS)
        cls.bills = read_bills(BILLS).items
        cls.s = Settings()
        cls.flags = scan(cls.res.items, cls.s, cls.bills)

    def test_fixture_size_and_determinism(self):
        self.assertEqual(len(self.res.items), 700)
        pay_rows, bill_rows = make_fixture.generate()
        with open(PAYMENTS, newline="", encoding="utf-8") as fh:
            on_disk = list(csv.reader(fh))[1:]
        self.assertEqual(on_disk, pay_rows)

    def test_every_planted_pattern_found(self):
        for rule, payee in make_fixture.PLANTED.items():
            hits = [f for f in self.flags if f.rule == rule and f.payee == payee]
            self.assertTrue(hits, f"rule {rule} not found for {payee}")

    def test_specific_rows(self):
        by = lambda rule, payee: [f for f in self.flags if f.rule == rule and f.payee == payee]
        self.assertEqual(by(1, "Pinecrest HVAC")[0].date, date(2025, 6, 10))
        self.assertEqual(len(by(1, "Pinecrest HVAC")), 1)
        self.assertEqual(by(5, "Gordon Glass")[0].amount, Decimal("3900.75"))
        self.assertEqual(len(by(6, "Northfield Concrete")), 4)

    def test_clean_rows_do_not_flag(self):
        clean = set(make_fixture.CLEAN)
        self.assertEqual([f for f in self.flags if f.payee in clean], [])

    def test_no_false_flags_anywhere_else(self):
        planted = set(make_fixture.PLANTED.values()) | make_fixture.MONEY_PAYEES
        stray = [f for f in self.flags if f.payee not in planted]
        self.assertEqual(stray, [])

    def test_without_bills_no_rule7(self):
        self.assertFalse([f for f in scan(self.res.items, self.s) if f.rule == 7])


SHAPE = re.compile(r"^\d+ payments, \d+ months?, \d+ would have held, \d+ need a call this week$")
FORBIDDEN = ("fraud", "you were hit", "illegal")


class ReportTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.res = read_payments(PAYMENTS)
        cls.s = Settings()
        cls.flags = scan(cls.res.items, cls.s, read_bills(BILLS).items)
        cls.summary = report.summarize(cls.res.items, cls.flags, cls.s)
        cls.rows = report.build_rows(cls.flags)

    def test_summary_shape(self):
        self.assertRegex(self.summary.line, SHAPE)
        self.assertTrue(self.summary.line.startswith("700 payments, 18 months, 2 would have held"))
        self.assertEqual(self.summary.need_call, 2)

    def test_need_call_falls_back_to_top_three(self):
        ps = [pay(date(2024, 1, 5), "Old Round", "2500.00"), pay(date(2024, 1, 6), "Old Round2", "3000.00"),
              pay(date(2024, 1, 7), "Old Round3", "3500.00"), pay(date(2024, 1, 8), "Old Round4", "4000.00"),
              pay(date(2025, 1, 5), "Recent Co", "99.15")]
        fl = scan(ps)
        sm = report.summarize(ps, fl, Settings())
        self.assertEqual(sm.need_call, 3)
        self.assertRegex(sm.line, SHAPE)

    def test_sorted_by_weight_then_date(self):
        keys = [(-r.weight, r.date) for r in self.rows]
        self.assertEqual(keys, sorted(keys))

    def test_outputs_and_forbidden_words(self):
        with tempfile.TemporaryDirectory() as d:
            c, h = Path(d) / "r.csv", Path(d) / "r.html"
            report.write_csv(c, self.rows)
            report.write_html(h, "Sample Office", self.summary, self.rows, date(2025, 7, 1))
            text_csv = c.read_text(encoding="utf-8")
            text_html = h.read_text(encoding="utf-8")
        for text in (text_csv, text_html):
            for word in FORBIDDEN:
                self.assertNotIn(word, text.lower())
        for f in self.flags:
            for word in FORBIDDEN:
                self.assertNotIn(word, (f.reason + " " + f.check).lower())
        self.assertIn("Mastiff flags. Your firm makes every payment decision.", text_html)
        self.assertIn("This report is advisory. It does not say a payment was wrong; "
                      "it says what is worth checking.", text_html)
        self.assertIn(self.summary.line, text_html)
        self.assertNotRegex(text_html, r"(src|href)=\"https?:")
        self.assertNotIn("@import", text_html)
        rows = list(csv.reader(io.StringIO(text_csv)))
        self.assertEqual(rows[0][-1], "Status")
        self.assertTrue(all(r[-1] == "" for r in rows[1:]))
        self.assertTrue(all(r[4] in ("would have held", "worth checking") for r in rows[1:]))


class CliTests(unittest.TestCase):
    def run_cli(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(list(argv))
        return code, out.getvalue(), err.getvalue()

    def test_scan_writes_both_files(self):
        with tempfile.TemporaryDirectory() as d:
            base = str(Path(d) / "sub" / "acme-lookback")
            code, out, _ = self.run_cli("scan", str(PAYMENTS), "--bills", str(BILLS), "--out", base,
                                        "--org", "Acme", "--line", "5000")
            self.assertEqual(code, 0)
            self.assertRegex(out.splitlines()[0], SHAPE.pattern[:-1] + r"(\. Possible money back or stopped: .+\.)?$")
            self.assertTrue(Path(base + ".csv").is_file())
            self.assertTrue(Path(base + ".html").is_file())

    def test_preview(self):
        code, out, _ = self.run_cli("preview", str(PAYMENTS))
        self.assertEqual(code, 0)
        self.assertIn("700 rows read", out)
        self.assertIn("'Payee'", out)

    def test_bad_file_exits_nonzero(self):
        code, _, err = self.run_cli("scan", str(FIX / "nope.csv"), "--out", "x")
        self.assertNotEqual(code, 0)
        self.assertIn("not found", err)
        with tempfile.TemporaryDirectory() as d:
            bad = Path(d) / "bad.csv"
            bad.write_text("a,b\n1,2\n", encoding="utf-8")
            code, _, err = self.run_cli("preview", str(bad))
            self.assertNotEqual(code, 0)
            self.assertIn("Could not find a column", err)


if __name__ == "__main__":
    unittest.main()


class MoneyFoundTests(unittest.TestCase):
    def _p(self, row, d, payee, amt, inv=""):
        return Payment(row=row, date=d, payee=payee, amount=Decimal(amt), invoice_no=inv)

    def test_duplicates_totalled_once_each(self):
        ps = [
            self._p(1, date(2026, 3, 2), "Acme Supply", "4120.00"),
            self._p(2, date(2026, 3, 9), "Acme Supply", "4120.00"),
            self._p(3, date(2026, 4, 1), "Bolt Electric", "980.50", "INV-77"),
            self._p(4, date(2026, 6, 1), "Bolt Electric", "980.50", "INV-77"),
            self._p(5, date(2026, 5, 1), "Rent LLC", "2500.00"),
            self._p(6, date(2026, 6, 1), "Rent LLC", "2500.00"),
        ]
        money = find_money(ps, None)
        self.assertEqual([d.second_row for d in money.duplicates], [2, 4])
        self.assertEqual(money.duplicate_total, Decimal("5100.50"))
        self.assertIn("$5,100.50 across 2 pairs", money.duplicate_line)

    def test_cli_writes_money_csv_and_section(self):
        with tempfile.TemporaryDirectory() as d:
            out = Path(d) / "x-lookback"
            buf = io.StringIO()
            with contextlib.redirect_stdout(buf):
                self.assertEqual(main(["scan", str(PAYMENTS), "--out", str(out), "--org", "Test"]), 0)
            self.assertTrue((Path(d) / "x-lookback-money.csv").exists())
            self.assertIn("Money worth checking", (Path(d) / "x-lookback.html").read_text(encoding="utf-8"))
            self.assertIn("Possible duplicate payments:", buf.getvalue())
