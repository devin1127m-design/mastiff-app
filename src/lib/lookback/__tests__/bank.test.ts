import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { payeeFromDescription, mergePrefixes, CHECK_PAYEE } from "../bankdesc";
import { readPayments } from "../importer";
import { scan, findMoney } from "../scan";

assert.equal(payeeFromDescription("ORIG CO NAME:RAYS DRYWALL LLC  ORIG ID:1234567890 DESC DATE:0312 CO ENTRY DESCR:PAYMENT   SEC:CCD    TRACE#:123 EED:20260312").payee, "Rays Drywall LLC");
assert.equal(payeeFromDescription("MENARDS LAKE ORION MI 05/03").payee, "Menards Lake");
assert.equal(payeeFromDescription("HOME DEPOT PRO OXFORD MI 05/09").payee, "Home Depot Pro");
assert.equal(payeeFromDescription("COSTCO BUSINESS 800-555-0100 MI 05/09").payee, "Costco Business");
assert.equal(payeeFromDescription("POS DEBIT  SUNBELT RENTALS AUBURN HILLS MI").payee, "Sunbelt Rentals Auburn");
assert.equal(payeeFromDescription("Zelle payment to Mike Tile Setters 9981234").payee, "Mike Tile Setters");
assert.deepEqual(payeeFromDescription("CHECK 1837"), { payee: CHECK_PAYEE, ref: "1837" });
const canon = mergePrefixes([..."12345"].map(() => "Home Depot Pro").concat(["Home Depot Pro Lake", "Home Depot Pro Lake", "Home Depot Pro Auburn", "Menards", "Menards", "Menards", "Menards Lake"]));
assert.equal(canon.get("Home Depot Pro Lake"), "Home Depot Pro"); assert.equal(canon.get("Menards Lake"), "Menards");

const res = readPayments(readFileSync("lookback/tests/fixtures/bank-export.csv", "utf8"));
assert.equal(res.bankMode, true);
assert.equal(res.items.length, 791);
assert.ok(res.skipped.some((s) => s.why === "money in, not a payment"));
const payees = new Set(res.items.map((i) => i.payee));
assert.ok(payees.has("Metro Fasteners") && payees.has("Home Depot Pro") && !payees.has("Metro"));
// Same findings as the Python scan on this file.
const flags = scan(res.items); const money = findMoney(res.items);
assert.equal(money.duplicates.length, 4); assert.equal(money.duplicate_total, 11240);
assert.equal(new Set(flags.map((f) => f.row)).size, 22);
console.log("bank import matches: 791 rows, 4 duplicate pairs, 22 flagged rows");
