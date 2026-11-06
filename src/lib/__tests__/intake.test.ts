import assert from "node:assert/strict";
import { parseExtracted, needsTap } from "../intake";
import { check, type Vendor, type Org } from "../rules";

const org: Org = { single_cap: 5000, range_multiple: 2, hours_start: 7, hours_end: 19 };
const rays: Vendor = { id: "v1", name: "Ray's Drywall LLC", name_key: "rays drywall", account_last4: "2208", usual_min: 2500, usual_max: 5000 };

// Parser cuts anything longer than four digits, everywhere.
const x = parseExtracted('Here you go: {"payee":"Ray\'s Drywall LLC","amount":"3,400.00","invoice_no":"1042","invoice_date":"2026-11-01","due_date":null,"account_last4":"123456782208","full_account_visible":true,"confidence":0.93,"notes":"remit to acct 9876543210 changed"}');
assert.equal(x.payee, "Ray's Drywall LLC");
assert.equal(x.amount, 3400);
assert.equal(x.account_last4, "2208");
assert.equal(x.notes, "remit to acct ****3210 changed");
assert.equal(x.full_account_visible, true);

// Straight through: confident, on file, passes, in range.
const clean = { ...x, notes: null };
const v = check({ payee: clean.payee!, amount: clean.amount!, account_last4: clean.account_last4, submittedAt: new Date("2026-11-04T15:00:00") }, [rays], org);
assert.equal(v.verdict, "pass");
assert.equal(needsTap(clean, v, v.vendor), null);

// Tap: low confidence.
assert.match(needsTap({ ...clean, confidence: 0.6 }, v, v.vendor)!, /not sure/);
// Tap: not on file.
const v2 = check({ payee: "New Guy Concrete", amount: 3400, account_last4: null }, [rays], org);
assert.match(needsTap({ ...clean, payee: "New Guy Concrete" }, v2, v2.vendor)!, /not on file/);
// Tap: bank change holds.
const v3 = check({ payee: clean.payee!, amount: 3400, account_last4: "9999" }, [rays], org);
assert.match(needsTap({ ...clean, account_last4: "9999" }, v3, v3.vendor)!, /would hold/i);
// Tap: outside usual range even though under cap and under 2x.
const v4 = check({ payee: clean.payee!, amount: 6000, account_last4: "2208" }, [rays], org);
assert.equal(v4.verdict, "hold"); // over cap
const v5 = check({ payee: clean.payee!, amount: 1200, account_last4: "2208" }, [rays], org);
assert.equal(v5.verdict, "pass");
assert.match(needsTap({ ...clean, amount: 1200 }, v5, v5.vendor)!, /below/);
// Tap: vendor with no usual range yet.
const noRange = { ...rays, usual_min: null, usual_max: null };
const v6 = check({ payee: clean.payee!, amount: 3400, account_last4: "2208" }, [noRange], org);
assert.match(needsTap(clean, v6, v6.vendor)!, /usual amount yet/);
// Tap: a "new bank details" note.
assert.match(needsTap({ ...clean, notes: "Notice: new bank details effective today" }, v, v.vendor)!, /change/);
// Not an invoice.
const n = parseExtracted('{"payee":null,"amount":null,"invoice_no":null,"invoice_date":null,"due_date":null,"account_last4":null,"full_account_visible":false,"confidence":0,"notes":"This is a receipt for lunch"}');
assert.match(needsTap(n, { verdict: "hold", reasons: [], cautions: [], vendor: null }, null)!, /could not read/);
console.log("intake tests pass");
