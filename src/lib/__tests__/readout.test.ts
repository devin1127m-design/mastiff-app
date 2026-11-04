import assert from "node:assert/strict";
import { summarize, RECORDED, PARTLY, NOT, type Req } from "../readout";
const v = { name: "Ray's Drywall", callback_phone: "248-555-0101", phone_on_file_since: "2026-01-01", verified_at: "2026-10-20T00:00:00Z" };
const rows: Req[] = [
  { id: "a", payee: "Ray's Drywall", amount: 3000, account_last4: "2208", source: "photo", submitted_by: "Mastiff", verdict: "pass", reasons: [], status: "passed", straight_through: true, image_path: "x", created_at: "2026-10-20T15:00:00Z", vendor: v, callbacks: [], decisions: [] },
  { id: "b", payee: "Ray's Drywall", amount: 3000, account_last4: "9999", source: "form", submitted_by: "Linda", verdict: "hold", reasons: ["Bank details differ from the file (on file ends 2208, request ends 9999). Would have held."], status: "rejected", straight_through: false, image_path: null, created_at: "2026-10-21T15:00:00Z", vendor: v,
    callbacks: [{ called_at: "2026-10-21T15:30:00Z", number_called: "(248) 555-0101", who_answered: "Ray", what_said: "No change requested", outcome: "not_confirmed", by_name: "Devin" }],
    decisions: [{ decided_at: "2026-10-21T16:00:00Z", decided_by: "Mike", decision: "reject", note: null }] },
  { id: "c", payee: "New Guy", amount: 800, account_last4: null, source: "form", submitted_by: "Linda", verdict: "hold", reasons: ["Payee is not on your vendor list. Worth checking before payment."], status: "open", straight_through: false, image_path: null, created_at: "2026-10-22T15:00:00Z", vendor: null, callbacks: [], decisions: [] },
];
const ro = summarize(rows, [{ name: "Mike", role: "owner" }, { name: "Linda", role: "bookkeeper" }], 5000, "2026-10-01", "2026-10-31");
assert.equal(ro.checked, 3); assert.equal(ro.holds, 2); assert.equal(ro.closed, 1); assert.equal(ro.open, 1);
assert.equal(ro.amountNotPaid, 3000); assert.equal(ro.medianHours, 1);
const q = Object.fromEntries(ro.questions.map((x) => [x.num, x.status]));
assert.equal(q[1], RECORDED); assert.equal(q[2], RECORDED); assert.equal(q[3], RECORDED); assert.equal(q[4], PARTLY); assert.equal(q[5], RECORDED); assert.equal(q[11], NOT); assert.equal(q[15], RECORDED);
assert.match(ro.lineText, /3 checked, 2 holds, 0 released, 1 recorded not paid, median 1.0 hours/);
assert.equal(ro.verifiedVendors.length, 1);
console.log("readout tests pass");
