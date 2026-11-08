import unittest
from pathlib import Path

from lookback.bankdesc import merge_prefixes, payee_from_description
from lookback.importer import read_payments

FIX = Path(__file__).parent / "fixtures" / "bank-export.csv"


class BankDescription(unittest.TestCase):
    def test_ach(self):
        p, ref = payee_from_description("ORIG CO NAME:RAYS DRYWALL LLC  ORIG ID:1234567890 DESC DATE:0312 CO ENTRY DESCR:PAYMENT   SEC:CCD    TRACE#:123 EED:20260312")
        self.assertEqual(p, "Rays Drywall LLC")
        self.assertIsNone(ref)

    def test_card_city_state_and_date(self):
        self.assertEqual(payee_from_description("MENARDS LAKE ORION MI 05/03")[0], "Menards Lake")  # merged later
        self.assertEqual(payee_from_description("HOME DEPOT PRO OXFORD MI 05/09")[0], "Home Depot Pro")
        self.assertEqual(payee_from_description("COSTCO BUSINESS 800-555-0100 MI 05/09")[0], "Costco Business")

    def test_prefixes(self):
        self.assertEqual(payee_from_description("POS DEBIT  SUNBELT RENTALS AUBURN HILLS MI")[0], "Sunbelt Rentals Auburn")
        self.assertEqual(payee_from_description("Zelle payment to Mike Tile Setters 9981234")[0], "Mike Tile Setters")

    def test_check(self):
        p, ref = payee_from_description("CHECK 1837")
        self.assertEqual(ref, "1837")
        self.assertIn("Check", p)

    def test_merge(self):
        canon = merge_prefixes(["Home Depot Pro"] * 5 + ["Home Depot Pro Lake"] * 2 + ["Home Depot Pro Auburn"] + ["Menards"] * 3 + ["Menards Lake"])
        self.assertEqual(canon["Home Depot Pro Lake"], "Home Depot Pro")
        self.assertEqual(canon["Menards Lake"], "Menards")
        self.assertEqual(canon["Menards"], "Menards")

    def test_no_merge_of_different_business(self):
        canon = merge_prefixes(["Metro Fasteners"] * 2 + ["Metro Fasteners Rental"] * 2 + ["Metro Fasteners Auburn", "Great Lakes Flooring Supply", "Great Lakes Flooring"])
        self.assertEqual(canon["Metro Fasteners Rental"], "Metro Fasteners Rental")
        self.assertEqual(canon["Metro Fasteners Auburn"], "Metro Fasteners")
        self.assertEqual(canon["Great Lakes Flooring Supply"], "Great Lakes Flooring Supply")

    def test_bank_file(self):
        res = read_payments(FIX)
        self.assertEqual(len(res.items), 791)
        self.assertEqual(res.mapping["payee"].how, "derived from the description")
        self.assertTrue(any(why == "money in, not a payment" for _, why in res.skipped))
        payees = {i.payee for i in res.items}
        self.assertIn("Metro Fasteners", payees)
        self.assertIn("Home Depot Pro", payees)
        self.assertNotIn("Metro", payees)
        self.assertTrue(all(i.amount > 0 for i in res.items))
        checks = [i for i in res.items if i.payee.startswith("Check")]
        self.assertTrue(all(i.check_or_ref for i in checks))


if __name__ == "__main__":
    unittest.main()
