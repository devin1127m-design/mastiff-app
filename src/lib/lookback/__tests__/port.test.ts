// Run: npx tsx src/lib/lookback/__tests__/port.test.ts
// The TypeScript scan must match lookback/ (Python) on the 700-row fixture. Baseline from Python, 2026-11-04.
import { readFileSync } from "fs";
import assert from "assert";
import { readPayments } from "../importer";
import { scan, findMoney, summarize } from "../scan";

const res = readPayments(readFileSync("lookback/tests/fixtures/payments_700.csv", "utf8"));
assert.equal(res.items.length, 700);
assert.equal(res.masked, 15);
const flags = scan(res.items);
const got = flags.map((f) => `${f.rule}:${f.row}`).sort();
const want = ["1:678", "2:690", "3:259", "3:285", "3:490", "4:649", "5:652", "6:587", "6:598", "6:611", "6:622"].sort();
assert.deepEqual(got, want, "flags differ from the Python baseline");
const money = findMoney(res.items);
assert.equal(money.duplicate_total, 4446.93);
assert.equal(money.late_total, 322.22);
assert.equal(money.late_fees.map((l) => l.row).join(","), "154,364,524,578");
assert.equal(summarize(res.items, flags).line, "700 payments, 18 months, 2 would have held, 2 need a call this week");
console.log("port matches Python baseline: 11 flags, $4,446.93 duplicates, $322.22 late fees");
