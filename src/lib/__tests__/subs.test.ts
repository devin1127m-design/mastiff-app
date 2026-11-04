import assert from "node:assert/strict";
import { build, cautionFor, parseRegister } from "../subs";
const regs = parseRegister("Vendor,GL expires,WC expires,Auto expires,Additional insured,Waiver through\nExample Drywall LLC,2027-03-31,2027-03-31,,yes,2026-09-30\nExample Concrete,2026-11-15,exempt,2027-01-01,no,\n");
assert.equal(regs.length, 2); assert.equal(regs[1].wc_exempt, true); assert.equal(regs[1].additional_insured, false); assert.equal(regs[0].waiver_through, "2026-09-30");
const subs = [
  { id: "a", ...regs[0] },
  { id: "b", ...regs[1] },
];
const paid = [
  { vendor_id: "a", amount: 1000, created_at: "2026-09-10T00:00:00Z" }, { vendor_id: "a", amount: 2500, created_at: "2026-10-20T00:00:00Z" },
  { vendor_id: "b", amount: 800, created_at: "2026-10-01T00:00:00Z" },
];
const rep = build(subs, paid, "2026-11-04");
assert.equal(rep.unwaived, 3300); // 2,500 since last waiver + 800 with no waiver
assert.match(rep.line, /2 subcontractors checked as of Nov 4, 2026\. 1 with an insurance item worth checking\. 2 with payments not covered by a lien waiver \(\$3,300\.00\)\./);
assert.ok(rep.items.some((i) => i.finding.includes("expires Nov 15, 2026, within 30 days")));
assert.ok(rep.items.some((i) => i.finding === "Workers' comp marked exempt."));
assert.equal(cautionFor(subs[0], "2026-11-04"), "Last lien waiver covers through Sep 30, 2026.");
assert.match(cautionFor(subs[1], "2026-11-04")!, /within 30 days.*No lien waiver on file/);
console.log("subs tests pass");
