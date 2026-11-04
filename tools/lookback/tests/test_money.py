import copy
import csv
import io
import tempfile
import unittest
from datetime import date
from decimal import Decimal
from pathlib import Path

from lookback import report
from lookback.importer import read_bills, read_payments
from lookback.money import find_money, parse_terms
from lookback.rules import Bill, Payment, Settings, scan
from lookback.tests.fixtures import make_fixture as mf

FIX = Path(__file__).parent / "fixtures"
PAYMENTS = FIX / "payments_700.csv"
BILLS = FIX / "bills_700.csv"
FORBIDDEN = ("fraud", "you were hit", "illegal", "caught", "prevented", "saved")
D = Decimal


def pay(row, when, payee, amount, **kw):
    return Payment(row=row, date=when, payee=payee, amount=D(amount), **kw)


class FixtureMoneyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pays = read_payments(PAYMENTS).items
        cls.bills = read_bills(BILLS).items
        cls.s = Settings()
        cls.m = find_money(cls.pays, cls.bills, cls.s)

    def test_duplicates_match_planted_to_the_cent(self):
        planted = sum(mf.MONEY_DUPLICATES.values(), D("0"))
        self.assertEqual(planted, D("3594.90"))
        got = {d.vendor: d.amount for d in self.m.duplicates}
        for vendor, amt in mf.MONEY_DUPLICATES.items():
            self.assertEqual(got[vendor], amt)
        # the fixture's original rule 3 pattern (Metro Fasteners) is also a pair
        self.assertEqual(set(got), set(mf.MONEY_DUPLICATES) | {mf.PLANTED[3]})
        self.assertEqual(len(self.m.duplicates), 3)
        self.assertEqual(self.m.duplicate_total, planted + got[mf.PLANTED[3]])
        by_inv = {d.vendor: d.by_invoice for d in self.m.duplicates}
        self.assertTrue(by_inv["Cascade Roofing Supply"])
        self.assertFalse(by_inv["Ironwood Excavating"])

    def test_duplicates_agree_with_rule3(self):
        rule3 = {f.row for f in scan(self.pays, self.s, self.bills) if f.rule == 3}
        self.assertEqual({d.second_row for d in self.m.duplicates}, rule3)

    def test_late_fees_match_planted_to_the_cent(self):
        self.assertEqual({f.vendor: f.amount for f in self.m.late_fees}, mf.MONEY_LATE)
        self.assertEqual(self.m.late_total, D("322.22"))
        self.assertIn("Late fees and interest paid: $322.22 across 4 payments to 4 vendors. "
                      "Paying these on time stops this.", self.m.late_line)

    def test_lender_loan_interest_is_not_flagged(self):
        self.assertNotIn(mf.MONEY_LENDER, {f.vendor for f in self.m.late_fees})
        # but a credit union charging a LATE FEE is
        self.assertIn("Lakeshore Credit Union", {f.vendor for f in self.m.late_fees})

    def test_missed_discounts_match_planted_to_the_cent(self):
        self.assertTrue(self.m.discounts_checked)
        self.assertEqual({x.vendor: x.amount for x in self.m.discounts},
                         {k: v[2] for k, v in mf.MONEY_MISSED.items()})
        self.assertEqual(self.m.discount_total, D("156.17"))
        self.assertEqual(self.m.discount_line,
                         "Early-payment discounts missed: $156.17 on 3 bills. "
                         "Paying by the discount date keeps this.")

    def test_bills_paid_in_the_window_are_not_flagged(self):
        vendors = {x.vendor for x in self.m.discounts}
        for name in mf.MONEY_IN_WINDOW:
            self.assertNotIn(name, vendors)

    def test_nothing_else_is_found(self):
        self.assertEqual({f.vendor for f in self.m.late_fees}, set(mf.MONEY_LATE))
        self.assertEqual({x.vendor for x in self.m.discounts}, set(mf.MONEY_MISSED))

    def test_not_checked_without_terms(self):
        plain = [Bill(b.date, b.payee, b.amount, b.invoice_no) for b in self.bills]
        m = find_money(self.pays, plain, self.s)
        self.assertFalse(m.discounts_checked)
        self.assertEqual(m.discounts, ())
        self.assertEqual(m.discount_line, "Not checked: the bills file has no payment terms.")
        self.assertEqual(m.discount_total, D("0"))
        self.assertIn("Not checked", find_money(self.pays, None, self.s).discount_line)
        # duplicates and late fees do not depend on the bills file
        self.assertEqual(m.duplicates, self.m.duplicates)
        self.assertEqual(m.late_fees, self.m.late_fees)

    def test_pure(self):
        pays, bills = copy.deepcopy(self.pays), copy.deepcopy(self.bills)
        a = find_money(pays, bills, self.s)
        b = find_money(pays, bills, self.s)
        self.assertEqual(a, b)
        self.assertEqual((pays, bills), (self.pays, self.bills))
        self.assertEqual(find_money(list(reversed(pays)), bills, self.s), a)

    def test_forbidden_words_in_html_and_money_csv(self):
        flags = scan(self.pays, self.s, self.bills)
        summary = report.summarize(self.pays, flags, self.s, self.m)
        with tempfile.TemporaryDirectory() as d:
            h, c = Path(d) / "r.html", Path(d) / "r-money.csv"
            report.write_html(h, "Sample Office", summary, report.build_rows(flags), date(2025, 7, 1), self.m)
            report.write_money_csv(c, self.m)
            text_html, text_csv = h.read_text(encoding="utf-8"), c.read_text(encoding="utf-8")
        for text in (text_html, text_csv):
            for word in FORBIDDEN:
                self.assertNotIn(word, text.lower())
        self.assertIn("Money worth checking", text_html)
        # the money section sits after the summary and before the holds table
        self.assertLess(text_html.index('class="summary"'), text_html.index("Money worth checking"))
        self.assertLess(text_html.index("Money worth checking"), text_html.index("Payments worth a look"))
        self.assertIn("worth checking", text_html)
        rows = list(csv.reader(io.StringIO(text_csv)))
        self.assertEqual(rows[0], ["Finding", "Vendor", "Date(s)", "Amount", "What to check"])
        self.assertEqual(len(rows) - 1, 3 + 4 + 3)
        total = sum(D(r[3]) for r in rows[1:])
        self.assertEqual(total, self.m.total)

    def test_summary_second_sentence_present(self):
        flags = scan(self.pays, self.s, self.bills)
        sm = report.summarize(self.pays, flags, self.s, self.m)
        self.assertEqual(
            sm.text,
            sm.line + ". Possible money back or stopped: $4,446.93 in duplicate payments, "
                      "$322.22 in late fees and interest, $156.17 in missed discounts.")

    def test_all_money_csv_rows_have_vendor_and_check(self):
        for r in self.m.rows():
            self.assertTrue(r.check)
            self.assertTrue(r.vendor)


class SummarySentenceTests(unittest.TestCase):
    def test_absent_when_all_zero(self):
        ps = [pay(1, date(2025, 1, 5), "Plain Co", "100.15"), pay(2, date(2025, 3, 5), "Plain Co", "101.15")]
        m = find_money(ps, None)
        self.assertEqual(m.summary_sentence, "")
        sm = report.summarize(ps, scan(ps), Settings(), m)
        self.assertNotIn("Possible money", sm.text)
        self.assertEqual(sm.text, sm.line)

    def test_zero_items_omitted(self):
        ps = [pay(1, date(2025, 1, 5), "Plain Co", "100.15", memo="late fee")]
        m = find_money(ps, None)
        self.assertEqual(m.summary_sentence, "Possible money back or stopped: $100.15 in late fees and interest.")


class LateFeeUnitTests(unittest.TestCase):
    def late(self, payee="Some Co", memo="", invoice=""):
        p = pay(1, date(2025, 1, 5), payee, "50.00", memo=memo, invoice_no=invoice)
        return find_money([p], None).late_fees

    def test_phrases_case_insensitive(self):
        for memo in ["LATE FEE", "Late Charge", "late payment", "Finance Charge", "interest charge", "Penalty",
                     "NSF", "Returned Payment Fee", "past due fee", "Reinstatement fee", "LATE", "late."]:
            self.assertEqual(len(self.late(memo=memo)), 1, memo)
        self.assertEqual(len(self.late(payee="Metro Late Fee Services")), 1)
        self.assertEqual(len(self.late(invoice="LATE FEE 0425")), 1)

    def test_word_boundaries(self):
        for memo in ["translate fee", "chocolate", "nsfw", "penaltyfree", "plate charges", "on late delivery of goods"]:
            self.assertEqual(self.late(memo=memo), (), memo)

    def test_lender_scheduled_interest_excluded_but_fees_kept(self):
        self.assertEqual(self.late("First Bank", "loan payment interest charge"), ())
        self.assertEqual(self.late("Huron Mortgage Co", "mortgage finance charge"), ())
        self.assertEqual(len(self.late("First Bank", "loan payment late fee")), 1)
        # not a loan memo: a lender's interest charge is still worth checking
        self.assertEqual(len(self.late("First Bank", "interest charge")), 1)
        # not a lender: "loan payment" in the memo does not exclude
        self.assertEqual(len(self.late("Delmar Supply", "loan payment finance charge")), 1)


class TermsAndDiscountUnitTests(unittest.TestCase):
    def test_parse_terms(self):
        for text, expect in [("2/10 net 30", (2, 10, 30)), ("2% 10 net 30", (2, 10, 30)),
                             ("1/15 n45", (1, 15, 45)), ("2/10, Net 30", (2, 10, 30)),
                             ("1.5/10 net 45", (D("1.5"), 10, 45))]:
            t = parse_terms(text)
            self.assertEqual((t.percent, t.days, t.net), (D(expect[0]), expect[1], expect[2]), text)
        for text in ["net 30", "due on receipt", "", "30", "2/40 net 30", "COD"]:
            self.assertIsNone(parse_terms(text), text)

    def bill_case(self, paid_day, terms="2/10 net 30", bill_amt="1000.00", paid_amt=None, **kw):
        b = Bill(date(2025, 3, 1), "Term Co", D(bill_amt), "T-1", terms=terms, **kw)
        p = pay(1, date(2025, 3, 1 + paid_day), "Term Co", paid_amt or bill_amt, invoice_no="T-1")
        return find_money([p], [b])

    def test_window_boundary(self):
        self.assertEqual(self.bill_case(10).discounts, ())
        m = self.bill_case(11)
        self.assertEqual([x.amount for x in m.discounts], [D("20.00")])
        self.assertEqual(m.discounts[0].discount_by, date(2025, 3, 11))

    def test_other_formats(self):
        self.assertEqual(self.bill_case(16, terms="1/15 n45").discount_total, D("10.00"))
        self.assertEqual(self.bill_case(16, terms="2% 10 net 30").discount_total, D("20.00"))

    def test_discount_taken_is_not_missed(self):
        self.assertEqual(self.bill_case(20, paid_amt="980.00").discounts, ())

    def test_terms_columns_via_discount_date_and_percent(self):
        m = self.bill_case(12, terms="", discount_date=date(2025, 3, 8), discount_percent=D("1.5"))
        self.assertTrue(m.discounts_checked)
        self.assertEqual(m.discount_total, D("15.00"))

    def test_unparseable_terms_never_guessed(self):
        m = self.bill_case(28, terms="net 30")
        self.assertFalse(m.discounts_checked)
        self.assertEqual(m.discount_line, "Not checked: the bills file has no payment terms.")

    def test_importer_reads_terms_columns(self):
        with tempfile.TemporaryDirectory() as d:
            f = Path(d) / "bills.csv"
            f.write_text("Vendor,Bill Date,Amount,Payment Terms\nTerm Co,03/01/2025,1000.00,2/10 net 30\n",
                         encoding="utf-8")
            self.assertEqual(read_bills(f).items[0].terms, "2/10 net 30")
            g = Path(d) / "b2.csv"
            g.write_text("Vendor,Bill Date,Amount,Discount Date,Discount Percent\n"
                         "Term Co,03/01/2025,1000.00,03/11/2025,2%\n", encoding="utf-8")
            b = read_bills(g).items[0]
            self.assertEqual((b.discount_date, b.discount_percent), (date(2025, 3, 11), D("2")))


if __name__ == "__main__":
    unittest.main()
