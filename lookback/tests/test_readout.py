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

from lookback import readout
from lookback.cli import main
from lookback.importer import LookbackError
from lookback.readout import (NOT_RECORDED, PARTLY, RECORDED, ReadoutSettings, read_log, render_html,
                              summarize, write_csv, write_holds_csv)

FIX = Path(__file__).parent / "fixtures" / "wall_log_30d.csv"
FORBIDDEN = ("fraud", "you were hit", "illegal", "caught", "prevented", "saved", "amount saved",
             "your insurer requires", "coverage is assured", "guaranteed")
WALL_HEADER = ["date_time", "payee", "amount", "request_type", "bank", "account_last4", "how_arrived",
               "submitted_by", "verdict", "reasons", "cautions", "status", "resolved_at", "who_called",
               "number_called", "vendor_said", "approver", "override_reason"]


class ReadoutBase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.res = read_log(FIX)
        cls.ro = summarize(cls.res.rows, ReadoutSettings())

    def q(self, num):
        return next(q for q in self.ro.questions if q.num == num)


class FixtureTests(unittest.TestCase):
    def test_fixture_matches_wall_header_exactly(self):
        with FIX.open(newline="", encoding="utf-8") as fh:
            rows = list(csv.reader(fh))
        self.assertEqual(rows[0], WALL_HEADER)
        self.assertEqual(len(rows) - 1, 40)
        statuses = [r[11] for r in rows[1:]]
        self.assertEqual(statuses.count("pass"), 31)
        self.assertEqual([r[8] for r in rows[1:]].count("HOLD"), 9)


class ImportTests(ReadoutBase):
    def test_nine_digit_account_is_cut(self):
        self.assertEqual(self.res.masked, 1)
        self.assertTrue(all(len(r.account_last4) <= 4 for r in self.res.rows))
        self.assertIn("6789", [r.account_last4 for r in self.res.rows])

    def test_no_long_digit_run_in_outputs(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "o.html"
            readout.write_html(p, "Acme", self.ro, date(2026, 10, 1))
            text = p.read_text(encoding="utf-8")
        self.assertNotIn("123456789", text)
        self.assertFalse(re.search(r"\d{9,}", text))

    def test_missing_columns_and_empty(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "bad.csv"
            p.write_text("date,payee\n2026-09-01,X\n", encoding="utf-8")
            with self.assertRaises(LookbackError):
                read_log(p)
            p.write_text("", encoding="utf-8")
            with self.assertRaises(LookbackError):
                read_log(p)

    def test_formula_prefix_removed(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "f.csv"
            with p.open("w", newline="", encoding="utf-8") as fh:
                w = csv.writer(fh, quoting=csv.QUOTE_ALL)
                w.writerow(WALL_HEADER)
                w.writerow(["2026-09-01T10:00:00.000Z", "'=Acme", "10", "payment", "", "", "email", "Dana", "PASS",
                            "", "", "pass", "", "", "", "", "", ""])
            self.assertEqual(read_log(p).rows[0].payee, "=Acme")


class NumberTests(ReadoutBase):
    def test_five_numbers(self):
        ro = self.ro
        self.assertEqual((ro.checked, ro.holds, ro.released, ro.rejected), (40, 9, 4, 2))
        self.assertEqual(ro.median_hours, 5.0)  # closed holds took 1, 2, 3, 5, 20, 26, 48 hours
        self.assertEqual((ro.overrides, ro.voids, ro.open_holds, ro.closed_holds), (1, 1, 1, 7))
        self.assertEqual(ro.amount_not_paid, Decimal("17280.00"))
        self.assertEqual(ro.line_text, "40 checked, 9 holds, 4 released, 2 recorded not paid, "
                                       "median 5.0 hours to resolve")
        self.assertEqual((ro.start, ro.end), (date(2026, 9, 1), date(2026, 9, 30)))

    def test_date_range_filters(self):
        ro = summarize(self.res.rows, ReadoutSettings(start=date(2026, 9, 1), end=date(2026, 9, 10)))
        self.assertLess(ro.checked, 40)
        self.assertEqual(ro.holds, 2)  # September 3 and 8
        self.assertEqual((ro.start, ro.end), (date(2026, 9, 1), date(2026, 9, 10)))

    def test_empty_period(self):
        ro = summarize([], ReadoutSettings())
        self.assertEqual((ro.checked, ro.holds, ro.median_hours), (0, 0, None))
        self.assertIn("median n/a", ro.line_text)
        self.assertTrue(all(q.status == NOT_RECORDED for q in ro.questions if q.num != 15 and q.num != 7))
        render_html("Empty Office", ro, date(2026, 10, 1))  # must not raise

    def test_hold_table_lists_every_hold_in_date_order(self):
        days = [r.day for r in self.ro.hold_rows]
        self.assertEqual(len(days), 9)
        self.assertEqual(days, sorted(days))


class QuestionTests(ReadoutBase):
    def test_nine_questions_in_order_verbatim(self):
        self.assertEqual([q.num for q in self.ro.questions], [1, 2, 3, 4, 5, 7, 9, 11, 15])
        self.assertTrue(self.q(2).text.startswith("Is the call back procedure performed by an individual other than"))
        self.assertIn("Travelers II.4b", self.q(3).carriers)

    def test_callback_questions(self):
        self.assertIn("6 of 7 closed holds record a number called", self.q(1).record)  # the override has none
        self.assertEqual(self.q(1).status, PARTLY)
        self.assertIn("6 of 7", self.q(2).record)
        self.assertEqual(self.q(2).status, PARTLY)
        self.assertIn("6 of 7 closed holds have vendor_said recorded before resolved_at", self.q(3).record)
        self.assertEqual(self.q(4).status, NOT_RECORDED)

    def test_approver_questions(self):
        # 7 closed holds all record an approver; one was approved by the person who submitted it.
        self.assertIn("7 of 7 closed holds record an approver; approver differs from submitter in 6 of 7", self.q(5).record)
        self.assertEqual(self.q(5).status, PARTLY)
        self.assertIn("different people in 6 of 7", self.q(9).record)
        self.assertEqual(self.q(9).status, PARTLY)

    def test_dual_authorization_line(self):
        r = self.q(7).record
        self.assertIn("line set at $5,000", r)
        self.assertIn("2 holds for amount out of range", r)
        self.assertIn("4 of 4", r)  # four closed holds are over the line, each with a different approver
        self.assertEqual(self.q(7).status, RECORDED)
        ro = summarize(self.res.rows, ReadoutSettings(line=Decimal("10000")))
        self.assertIn("line set at $10,000", next(q for q in ro.questions if q.num == 7).record)

    def test_receiving_bank_is_not_recorded(self):
        q = self.q(11)
        self.assertTrue(q.record.startswith("Not recorded by Mastiff"))
        self.assertEqual(q.status, NOT_RECORDED)
        self.assertIn("5 new-payee holds, 2 released after a callback", q.record)

    def test_submitters(self):
        self.assertEqual(dict(self.ro.submitters), {"Dana": 30, "Marcus": 10})
        self.assertIn("Dana (30)", self.q(15).record)
        self.assertEqual(self.q(15).status, PARTLY)

    def test_evidence_words_are_one_of_three(self):
        self.assertTrue(all(q.status in (RECORDED, PARTLY, NOT_RECORDED) for q in self.ro.questions))

    def test_full_record_reads_recorded(self):
        released = [r for r in self.res.rows if r.status == "released" and r.approver != r.submitted_by]
        ro = summarize(released, ReadoutSettings())
        s = {q.num: q.status for q in ro.questions}
        self.assertEqual((s[2], s[3], s[5]), (RECORDED, RECORDED, RECORDED))


class FieldTests(ReadoutBase):
    def test_thirteen_fields_with_counts(self):
        f = {x.num: x for x in self.ro.fields}
        self.assertEqual(len(f), 13)
        self.assertEqual((f[2].filled, f[2].closed), (7, 7))
        self.assertEqual(f[3].filled, 6)
        self.assertEqual(f[5].filled, 6)
        self.assertEqual(f[8].filled, 6)
        self.assertEqual(f[10].filled, 6)
        self.assertEqual(f[11].filled, 7)
        for n in (4, 6, 7, 12, 13):
            self.assertFalse(f[n].in_export)
            self.assertEqual(f[n].filled, 0)


class PurityTests(ReadoutBase):
    def test_summarize_is_pure(self):
        rows = list(self.res.rows)
        before = copy.deepcopy(rows)
        a = summarize(rows, ReadoutSettings())
        b = summarize(rows, ReadoutSettings())
        self.assertEqual(rows, before)
        self.assertEqual(a, b)
        with self.assertRaises(Exception):
            a.checked = 1  # frozen


class OutputTests(ReadoutBase):
    def render(self):
        with tempfile.TemporaryDirectory() as d:
            h, c, hc = Path(d) / "r.html", Path(d) / "r.csv", Path(d) / "r-holds.csv"
            readout.write_html(h, "Sample Office", self.ro, date(2026, 10, 1))
            write_csv(c, self.ro)
            write_holds_csv(hc, self.ro)
            return h.read_text(encoding="utf-8"), c.read_text(encoding="utf-8"), hc.read_text(encoding="utf-8")

    def test_forbidden_words(self):
        for text in self.render():
            low = text.lower()
            for word in FORBIDDEN:
                self.assertNotIn(word, low)

    def test_page_sections_and_footer_lines(self):
        page, _, _ = self.render()
        order = ["Day-30 read-out: Sample Office", "Period covered: September 1, 2026 to September 30, 2026",
                 "Prepared October 1, 2026", "What was held and what happened", "recorded not paid",
                 "Your record against the questions carriers ask", "What the log holds for each closed hold"]
        pos = [page.index(s) for s in order]
        self.assertEqual(pos, sorted(pos))
        for line in ("Mastiff flags. Your firm makes every payment decision.",
                     "This read-out is a summary of your own log. It is not coverage advice. Whether a policy "
                     "responds depends on its wording; confirm with your broker.",
                     "The questions above are taken from publicly available carrier applications as of October 2026 "
                     "and may differ from your policy&#x27;s application."):
            self.assertIn(line, page)
        self.assertIn("Amount recorded not paid: <b>$17,280</b>", page)
        self.assertNotRegex(page, r"(src|href)=\"https?:")
        self.assertNotIn("@import", page)
        for word in ("Not recorded by Mastiff", "Partly recorded", "Recorded"):
            self.assertIn(word, page)

    def test_hold_table_cut_at_twelve(self):
        base = [r for r in self.res.rows if r.is_hold]
        rows = base + [base[0]] * 6  # 15 holds
        ro = summarize(rows, ReadoutSettings())
        page = render_html("Big Office", ro, date(2026, 10, 1))
        self.assertIn("and 3 more in the CSV", page)
        self.assertEqual(page.count('<td class="nowrap">2026-'), 12)
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "h.csv"
            write_holds_csv(p, ro)
            self.assertEqual(len(p.read_text(encoding="utf-8").splitlines()) - 1, 15)

    def test_question_csv(self):
        _, c, hc = self.render()
        rows = list(csv.reader(io.StringIO(c)))
        self.assertEqual(len(rows), 10)
        self.assertEqual(rows[0][-1], "Evidence")
        self.assertTrue(all(r[-1] in (RECORDED, PARTLY, NOT_RECORDED) for r in rows[1:]))
        self.assertEqual(len(list(csv.reader(io.StringIO(hc)))), 10)


class CliTests(unittest.TestCase):
    def run_cli(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(list(argv))
        return code, out.getvalue(), err.getvalue()

    def test_readout_writes_both_files(self):
        with tempfile.TemporaryDirectory() as d:
            base = Path(d) / "reports" / "acme-day30"
            code, out, err = self.run_cli("readout", str(FIX), "--out", str(base), "--org", "Acme Builders",
                                          "--line", "5000", "--start", "2026-09-01", "--end", "2026-09-30")
            self.assertEqual(code, 0, err)
            self.assertTrue(base.with_suffix(".html").exists())
            self.assertTrue(base.with_suffix(".csv").exists())
            self.assertIn("Day-30 read-out: Acme Builders", base.with_suffix(".html").read_text(encoding="utf-8"))
            self.assertIn("40 checked, 9 holds, 4 released, 2 recorded not paid, median 5.0 hours to resolve", out)
            self.assertIn("1 account-number-like values were cut down to the last 4 digits", out)

    def test_bad_inputs_exit_nonzero(self):
        with tempfile.TemporaryDirectory() as d:
            code, _, err = self.run_cli("readout", str(FIX), "--out", str(Path(d) / "x"), "--line", "abc")
            self.assertEqual(code, 2)
            self.assertIn("--line", err)
            code, _, err = self.run_cli("readout", str(FIX), "--out", str(Path(d) / "x"), "--start", "09/01")
            self.assertEqual(code, 2)
            code, _, err = self.run_cli("readout", str(Path(d) / "missing.csv"), "--out", str(Path(d) / "x"))
            self.assertEqual(code, 2)


if __name__ == "__main__":
    unittest.main()
