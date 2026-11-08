// The look-back rules and money findings. A port of lookback/rules.py and lookback/money.py.
// Pure: no I/O, no clock. Rules 1, 2 and 5 map to the three live holds and read "would have held";
// 3, 4 and 6 are cautions and read "worth checking". Rule 7 (bills file) is not in the app yet.
// Mastiff flags. Your firm makes every payment decision.

import { nameKey } from "@/lib/rules";
import { similarity, type Payment } from "./importer";

export const HELD = "would have held";
export const CHECK = "worth checking";
export const WEIGHTS: Record<number, number> = { 1: 100, 2: 90, 3: 80, 4: 70, 5: 60, 6: 50 };
export const VERDICTS: Record<number, string> = { 1: HELD, 2: HELD, 3: CHECK, 4: CHECK, 5: HELD, 6: CHECK };
export const RULE_NAMES: Record<number, string> = {
  1: "Bank details changed", 2: "Paid once, never again", 3: "Possible duplicate",
  4: "Lookalike vendor names", 5: "Amount out of range", 6: "Just under the approval line",
};

export type Settings = {
  payment_line: number; duplicate_days: number; lookalike_ratio: number; lookalike_min_name_len: number;
  lookalike_clean_history: number; range_multiple: number; min_history: number; trailing_n: number;
  round_unit: number; round_min: number; cluster_days: number; cluster_under_pct: number; cluster_min: number; recent_days: number;
};
export const DEFAULTS: Settings = {
  payment_line: 5000, duplicate_days: 14, lookalike_ratio: 0.88, lookalike_min_name_len: 5, lookalike_clean_history: 6,
  range_multiple: 2, min_history: 3, trailing_n: 12, round_unit: 100, round_min: 1000, cluster_days: 30,
  cluster_under_pct: 0.05, cluster_min: 3, recent_days: 30,
};

export type Flag = { rule: number; weight: number; verdict: string; row: number; date: string; payee: string; amount: number; reason: string; check: string };

const m = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const d = (x: Date) => x.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const days = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / 86400000);
const eq = (a: number, b: number) => Math.abs(a - b) < 0.005;

function flag(rule: number, p: Payment, reason: string, check: string): Flag {
  return { rule, weight: WEIGHTS[rule], verdict: VERDICTS[rule], row: p.row, date: p.date.toISOString().slice(0, 10), payee: p.payee, amount: p.amount, reason, check };
}

function group(payments: Payment[]): Map<string, Payment[]> {
  const g = new Map<string, Payment[]>();
  for (const p of [...payments].sort((a, b) => a.date.getTime() - b.date.getTime() || a.row - b.row)) {
    const k = nameKey(p.payee);
    if (!g.has(k)) g.set(k, []);
    g.get(k)!.push(p);
  }
  return g;
}

function rule1(groups: Map<string, Payment[]>): Flag[] {
  const out: Flag[] = [];
  for (const g of groups.values()) {
    let prev: Payment | null = null;
    for (const p of g) {
      if (!(p.account_last4 || p.routing_last4)) continue;
      if (prev) {
        const parts: string[] = [];
        if (p.account_last4 && prev.account_last4 && p.account_last4 !== prev.account_last4) parts.push(`account ending ${p.account_last4} (was ${prev.account_last4})`);
        if (p.routing_last4 && prev.routing_last4 && p.routing_last4 !== prev.routing_last4) parts.push(`routing ending ${p.routing_last4} (was ${prev.routing_last4})`);
        if (parts.length) out.push(flag(1, p, `Bank details changed: paid to ${parts.join(" and ")}; last paid on ${d(prev.date)}.`,
          "Call the vendor on the number already on file, not one from an email, and confirm they asked for the change."));
      }
      prev = p;
    }
  }
  return out;
}

function rule2(groups: Map<string, Payment[]>, s: Settings): Flag[] {
  const out: Flag[] = [];
  for (const g of groups.values()) {
    if (g.length !== 1) continue;
    const p = g[0]; const why: string[] = [];
    if (p.amount >= s.round_min && eq(p.amount % s.round_unit, 0)) why.push("a round amount");
    if (p.amount > s.payment_line) why.push(`a first payment over the ${m(s.payment_line)} line`);
    if (why.length) {
      const f = flag(2, p, `Paid once and not again: ${m(p.amount)} on ${d(p.date)}, ${why.join(" and ")}.`,
        "Confirm this payee was an expected vendor and that the goods or work were received.");
      if (!(p.amount > s.payment_line)) { f.verdict = CHECK; f.weight = WEIGHTS[4]; } // a round amount alone is worth checking, not a hold
      out.push(f);
    }
  }
  return out;
}

function dupMatch(g: Payment[], i: number, s: Settings): { q: Payment; byInvoice: boolean } | null {
  const p = g[i]; const inv = p.invoice_no.trim().toLowerCase();
  for (const q of g.slice(0, i)) {
    if (inv && q.invoice_no.trim().toLowerCase() === inv) return { q, byInvoice: true };
    const dd = days(p.date, q.date);
    if (eq(q.amount, p.amount) && dd >= 0 && dd <= s.duplicate_days) return { q, byInvoice: false };
  }
  return null;
}

export type DuplicatePair = { vendor: string; first_date: string; second_date: string; amount: number; first_row: number; second_row: number; by_invoice: boolean };

export function duplicatePairs(payments: Payment[], s: Settings = DEFAULTS): DuplicatePair[] {
  const out: DuplicatePair[] = [];
  for (const g of group(payments).values()) g.forEach((p, i) => {
    const mm = dupMatch(g, i, s);
    if (mm) out.push({ vendor: p.payee, first_date: mm.q.date.toISOString().slice(0, 10), second_date: p.date.toISOString().slice(0, 10), amount: p.amount, first_row: mm.q.row, second_row: p.row, by_invoice: mm.byInvoice });
  });
  return out.sort((a, b) => a.second_date.localeCompare(b.second_date) || a.vendor.localeCompare(b.vendor) || a.second_row - b.second_row);
}

function rule3(groups: Map<string, Payment[]>, s: Settings): Flag[] {
  const out: Flag[] = [];
  for (const g of groups.values()) g.forEach((p, i) => {
    const mm = dupMatch(g, i, s); if (!mm) return;
    const hit = mm.byInvoice ? `Invoice ${p.invoice_no.trim()} appears twice: paid on ${d(mm.q.date)} and ${d(p.date)}.`
      : `Possible duplicate: ${m(p.amount)} paid on ${d(mm.q.date)} and again on ${d(p.date)} (${days(p.date, mm.q.date)} days apart).`;
    out.push(flag(3, p, hit, "Compare both payments to the bill. If one was not owed, ask the vendor for a credit or refund."));
  });
  return out;
}

function rule4(groups: Map<string, Payment[]>, s: Settings): Flag[] {
  const out: Flag[] = [];
  const keys = [...groups.keys()].filter((k) => k.length >= s.lookalike_min_name_len).sort();
  const accts = new Map(keys.map((k) => [k, new Set(groups.get(k)!.map((p) => p.account_last4).filter(Boolean))]));
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
    const a = keys[i], b = keys[j];
    if (Math.abs(a.length - b.length) > 3) continue;
    const ratio = similarity(a, b);
    if (ratio < s.lookalike_ratio) continue;
    const ga = groups.get(a)!, gb = groups.get(b)!;
    const bothLong = ga.length >= s.lookalike_clean_history && gb.length >= s.lookalike_clean_history;
    const aa = accts.get(a)!, ab = accts.get(b)!;
    if (bothLong && aa.size && ab.size && [...aa].every((x) => !ab.has(x))) continue;
    const [small, big] = [a, b].sort((x, y) => groups.get(x)!.length - groups.get(y)!.length || x.localeCompare(y));
    const p = groups.get(small)!.at(-1)!; const bigName = groups.get(big)!.at(-1)!.payee;
    out.push(flag(4, p, `Vendor name '${p.payee}' is nearly identical to '${bigName}' (similarity ${ratio.toFixed(2)}); ${groups.get(small)!.length} and ${groups.get(big)!.length} payments on file.`,
      "Confirm these are two different companies and not one vendor entered twice or a lookalike."));
  }
  return out;
}

function rule5(groups: Map<string, Payment[]>, s: Settings): Flag[] {
  const out: Flag[] = [];
  for (const g of groups.values()) g.forEach((p, i) => {
    const prior = g.slice(0, i);
    if (!prior.length) {
      if (p.amount > s.payment_line) out.push(flag(5, p, `Amount out of range: first payment to this payee, ${m(p.amount)}, is over the ${m(s.payment_line)} line.`, "Match the payment to a signed quote, contract or approved bill."));
    } else if (prior.length >= s.min_history) {
      const recent = prior.slice(-s.trailing_n);
      const avg = recent.reduce((t, q) => t + q.amount, 0) / recent.length;
      if (p.amount > s.range_multiple * avg) out.push(flag(5, p, `Amount out of range: ${m(p.amount)} is ${(p.amount / avg).toFixed(1)} times this vendor's usual ${m(avg)}.`, "Match the payment to a signed quote, contract or approved bill."));
    }
  });
  return out;
}

function rule6(groups: Map<string, Payment[]>, s: Settings): Flag[] {
  const out: Flag[] = [];
  const low = s.payment_line * (1 - s.cluster_under_pct);
  for (const g of groups.values()) {
    const near = g.filter((p) => p.amount >= low && p.amount < s.payment_line);
    const best = new Map<number, number>();
    for (const p of near) {
      const members = near.filter((q) => { const dd = days(q.date, p.date); return dd >= 0 && dd <= s.cluster_days; });
      if (members.length >= s.cluster_min) for (const q of members) best.set(q.row, Math.max(best.get(q.row) ?? 0, members.length));
    }
    for (const p of near) if (best.has(p.row)) out.push(flag(6, p, `${best.get(p.row)} payments to this payee within ${s.cluster_days} days, each just under the ${m(s.payment_line)} line (${m(p.amount)} on ${d(p.date)}).`,
      "Check whether one larger bill was split into smaller payments, and who approved each."));
  }
  return out;
}

export function scan(payments: Payment[], s: Settings = DEFAULTS): Flag[] {
  const groups = group(payments);
  const flags = [...rule1(groups), ...rule2(groups, s), ...rule3(groups, s), ...rule4(groups, s), ...rule5(groups, s), ...rule6(groups, s)];
  return flags.sort((a, b) => b.weight - a.weight || a.date.localeCompare(b.date) || a.payee.localeCompare(b.payee) || a.row - b.row);
}

// --- money -----------------------------------------------------------------------------

const FEE_RE = /\b(late\s+fees?|late\s+charges?|late\s+payments?|penalt(?:y|ies)|nsf|returned\s+payment\s+fees?|past\s+due\s+fees?|reinstatement\s+fees?)\b/i;
const INTEREST_RE = /\b(finance\s+charges?|interest\s+charges?)\b/i;
const LATE_ALONE_RE = /^\W*late\W*$/i;
const LENDER_RE = /\b(bank|bancorp|credit\s+union|lending|lender|mortgage|loans?|financial|finance|capital|savings)\b/i;
const LOAN_MEMO_RE = /\b(loan\s+payment|mortgage)\b/i;

export type LateFee = { vendor: string; date: string; amount: number; row: number; matched: string; field: string };

function lateMatch(p: Payment): { matched: string; field: string } | null {
  const fields: [string, string][] = [["payee", p.payee], ["memo", p.memo], ["invoice", p.invoice_no]];
  const lenderLoan = LENDER_RE.test(p.payee) && LOAN_MEMO_RE.test(p.memo);
  for (const [name, text] of fields) { const mm = text.match(FEE_RE); if (mm) return { matched: mm[1].toLowerCase().replace(/\s+/g, " "), field: name }; }
  if (!lenderLoan) {
    for (const [name, text] of fields) { const mm = text.match(INTEREST_RE); if (mm) return { matched: mm[1].toLowerCase().replace(/\s+/g, " "), field: name }; }
    if (LATE_ALONE_RE.test(p.memo)) return { matched: "late", field: "memo" };
  }
  return null;
}

export type NearRepeat = { vendor: string; first_date: string; second_date: string; amount: number; first_row: number; second_row: number; days: number };
export type Money = { duplicates: DuplicatePair[]; duplicate_total: number; late_fees: LateFee[]; late_total: number; total: number; summary: string; near_repeats?: NearRepeat[] };

// Not flagged, only counted: same payee, same amount, 15 to 45 days apart. Where monthly bills live.
// Kept on the report so a real file can tell us whether a wider duplicate window would find anything but rent.
export function nearRepeats(payments: Payment[], s: Settings = DEFAULTS): NearRepeat[] {
  const out: NearRepeat[] = [];
  for (const g of group(payments).values()) {
    const sorted = [...g].sort((a, b) => a.date.getTime() - b.date.getTime());
    for (let i = 1; i < sorted.length; i++) {
      const p = sorted[i];
      for (let j = i - 1; j >= 0; j--) {
        const q = sorted[j]; const dd = days(p.date, q.date);
        if (dd > 45) break;
        if (dd > s.duplicate_days && Math.abs(p.amount - q.amount) < 0.005) { out.push({ vendor: p.payee, first_date: q.date.toISOString().slice(0, 10), second_date: p.date.toISOString().slice(0, 10), amount: p.amount, first_row: q.row, second_row: p.row, days: dd }); break; }
      }
    }
  }
  return out.sort((a, b) => b.amount - a.amount);
}

export function findMoney(payments: Payment[], s: Settings = DEFAULTS): Money {
  const duplicates = duplicatePairs(payments, s);
  const late_fees: LateFee[] = [];
  for (const p of payments) { const h = lateMatch(p); if (h) late_fees.push({ vendor: p.payee, date: p.date.toISOString().slice(0, 10), amount: p.amount, row: p.row, ...h }); }
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const duplicate_total = round2(duplicates.reduce((t, x) => t + x.amount, 0));
  const late_total = round2(late_fees.reduce((t, x) => t + x.amount, 0));
  const parts: string[] = [];
  if (duplicates.length) parts.push(`${m(duplicate_total)} in possible duplicate payments`);
  if (late_fees.length) parts.push(`${m(late_total)} in late fees and interest`);
  return { duplicates, duplicate_total, late_fees, late_total, total: round2(duplicate_total + late_total), summary: parts.length ? "Possible money back or stopped: " + parts.join(", ") + "." : "", near_repeats: nearRepeats(payments, s) };
}

export type Summary = { payments: number; months: number; held: number; need_call: number; first: string; last: string; line: string };

export function summarize(payments: Payment[], flags: Flag[], s: Settings = DEFAULTS): Summary {
  const times = payments.map((p) => p.date.getTime());
  const first = new Date(Math.min(...times)), last = new Date(Math.max(...times));
  const months = Math.max(1, Math.round(days(last, first) / 30.4375));
  const held = new Set(flags.filter((f) => f.verdict === HELD).map((f) => f.row)).size;
  const cutoff = last.getTime() - s.recent_days * 86400000;
  const recent = new Set(flags.filter((f) => (f.rule === 1 || f.rule === 2) && new Date(f.date).getTime() > cutoff).map((f) => f.row));
  let need = recent.size;
  if (!need && flags.length) need = Math.min(3, new Set(flags.map((f) => f.row)).size);
  return { payments: payments.length, months, held, need_call: need, first: first.toISOString().slice(0, 10), last: last.toISOString().slice(0, 10),
    line: `${payments.length} payments, ${months} month${months === 1 ? "" : "s"}, ${held} would have held, ${need} need a call this week` };
}
