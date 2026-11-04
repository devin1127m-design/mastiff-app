import assert from "node:assert/strict";
import { pattern, describe } from "../memory";
assert.equal(pattern([100, 200], ["2026-01-01", "2026-02-01"]), null);
const p = pattern([2400, 2600, 2550, 2500, 9800, 2450], ["2026-01-05", "2026-02-04", "2026-03-06", "2026-04-05", "2026-05-05", "2026-06-04"], ["ap@rays.com", "ap@rays.com"]);
assert.ok(p);
assert.equal(p!.count, 6);
assert.ok(p!.low >= 1900 && p!.low <= 2000, String(p!.low));
assert.ok(p!.high >= 3000 && p!.high <= 3200, String(p!.high));  // the 9,800 outlier does not set the top
assert.equal(p!.everyDays, 30);
assert.equal(p!.domains[0], "rays.com");
assert.match(describe(p!), /Paid 6 times, \$1,9\d\d to \$3,\d00, about monthly, invoices from rays.com\./);
console.log("memory tests pass");
