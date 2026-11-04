import { payeeFromDescription, mergePrefixes } from "./bankdesc";

// CSV import for the look-back: loose header matching, date and amount parsing,
// and account-number stripping. A port of lookback/importer.py; keep them in step.

export type Payment = {
  row: number;
  date: Date;
  payee: string;
  amount: number; // cents-safe: we round to 2dp and compare with a tolerance
  method: string;
  check_or_ref: string;
  invoice_no: string;
  memo: string;
  account_last4: string;
  routing_last4: string;
};

export type ImportResult = {
  items: Payment[];
  bankMode: boolean; // payee read out of the description column (a bank export)
  headers: string[];
  mapping: Record<string, string>;
  unmapped: string[];
  rowsRead: number;
  skipped: { line: number; why: string }[];
  masked: number;
};

export class LookbackError extends Error {}

const PAYMENT_SYNONYMS: Record<string, string[]> = {
  date: ["date", "paymentdate", "paiddate", "datepaid", "transactiondate", "txndate", "postdate", "postingdate", "checkdate"],
  payee: ["payee", "vendor", "vendorname", "payeename", "paidto", "name", "supplier"],
  amount: ["amount", "amt", "paymentamount", "amountpaid", "total", "debit", "paid"],
  method: ["method", "paymentmethod", "paymenttype", "type", "paidby"],
  check_or_ref: ["checkorref", "checkno", "checknumber", "check", "ref", "refno", "reference", "referencenumber", "num", "checknum", "checkorslip", "checkorslipno", "checkslip"],
  invoice_no: ["invoiceno", "invoicenumber", "invoice", "invno", "billno", "billnumber", "invnum"],
  memo: ["memo", "description", "note", "notes", "details"],
  account_last4: ["accountlast4", "acctlast4", "last4", "account", "accountnumber", "acct", "acctno", "bankaccount", "accountno"],
  routing_last4: ["routinglast4", "routing", "routingnumber", "aba", "abanumber", "routingno"],
  direction: ["details", "transactiontype", "drcr", "debitcredit", "creditdebit", "direction", "dc"],
};
const CREDIT_WORDS = ["credit", "deposit", "cr", "refund", "transfer in", "interest paid"];
const REQUIRED = ["date", "payee", "amount"];

export function normalizeHeader(h: string): string {
  return (h || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Similarity close to Python difflib's ratio for short strings: 2*matches/total via LCS.
export function similarity(a: string, b: string): number {
  if (!a.length && !b.length) return 1;
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return (2 * dp[m][n]) / (m + n);
}

export function matchHeaders(headers: string[], synonyms: Record<string, string[]>, cutoff = 0.85): Record<string, string> {
  const norm = headers.map(normalizeHeader);
  const used = new Set<number>();
  const result: Record<string, string> = {};
  for (const [field, syns] of Object.entries(synonyms)) {
    let done = false;
    for (const syn of syns) {
      const i = norm.findIndex((n, idx) => !used.has(idx) && n === syn);
      if (i >= 0) { used.add(i); result[field] = headers[i]; done = true; break; }
    }
    if (done) continue;
  }
  for (const [field, syns] of Object.entries(synonyms)) {
    if (result[field]) continue;
    let bestScore = 0, bestIdx = -1;
    norm.forEach((n, i) => {
      if (used.has(i) || !n) return;
      for (const syn of syns) {
        const s = similarity(n, syn);
        if (s >= cutoff && s > bestScore) { bestScore = s; bestIdx = i; }
      }
    });
    if (bestIdx >= 0) { used.add(bestIdx); result[field] = headers[bestIdx]; }
  }
  return result;
}

const KEYWORD_RE = /\b(acct|account|acc|routing|aba|ein|tin|ssn|tax\s*id)\b(\W{0,12}?)(\d[\d \-]{3,}\d)/gi;
const LONG_RUN_RE = /(?<!\d)\d(?:[ \-]?\d){7,}(?!\d)/g;
const ISO_DATE_RE = /\d{4}-\d{1,2}-\d{1,2}/;

function maskDigits(run: string): string {
  return "****" + run.replace(/\D/g, "").slice(-4);
}

export function maskText(text: string): { text: string; count: number } {
  let count = 0;
  let out = (text || "").replace(KEYWORD_RE, (_m, kw: string, sep: string, run: string) => { count++; return kw + sep + maskDigits(run); });
  out = out.replace(LONG_RUN_RE, (run) => {
    if (ISO_DATE_RE.test(run)) return run;
    count++; return maskDigits(run);
  });
  return { text: out, count };
}

export function last4(value: string): { last4: string; wasLonger: boolean } {
  const digits = (value || "").replace(/\D/g, "");
  return { last4: digits.slice(-4), wasLonger: digits.length > 4 };
}

const MONTHS: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };

export function parseDate(value: string): Date {
  const s = (value || "").trim();
  if (!s) throw new Error("empty date");
  const cands = [s];
  if (/[ T]/.test(s)) cands.push(s.split(/[ T]/)[0]);
  for (const c of cands) {
    let m: RegExpMatchArray | null;
    if ((m = c.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/))) {
      const y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
      const d = new Date(Date.UTC(y, Number(m[1]) - 1, Number(m[2])));
      if (d.getUTCMonth() === Number(m[1]) - 1) return d;
    }
    if ((m = c.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/))) {
      const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
      if (d.getUTCMonth() === Number(m[2]) - 1) return d;
    }
    if ((m = c.match(/^(\d{4})(\d{2})(\d{2})$/))) return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    if ((m = c.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})$/))) {
      const mo = MONTHS[m[1].slice(0, 3).toLowerCase()];
      if (mo !== undefined) return new Date(Date.UTC(Number(m[3]), mo, Number(m[2])));
    }
    if ((m = c.match(/^(\d{1,2})[ -]([A-Za-z]{3,9})[ -](\d{4})$/))) {
      const mo = MONTHS[m[2].slice(0, 3).toLowerCase()];
      if (mo !== undefined) return new Date(Date.UTC(Number(m[3]), mo, Number(m[1])));
    }
  }
  throw new Error(`unrecognised date ${JSON.stringify(value)}`);
}

export function parseAmount(value: string): number {
  let s = (value || "").trim();
  if (!s) throw new Error("empty amount");
  s = s.replace(/usd|[$,()\s-]/gi, "");
  const n = Number(s);
  if (!Number.isFinite(n)) throw new Error(`unrecognised amount ${JSON.stringify(value)}`);
  const d = Math.round(Math.abs(n) * 100) / 100;
  if (d === 0) throw new Error("zero amount");
  return d;
}

export function parseCsv(text: string): string[][] {
  // RFC-4180-ish: quotes, escaped quotes, commas/semicolons/tabs sniffed from the header.
  const firstLine = text.split(/\r?\n/)[0] ?? "";
  const delim = [",", ";", "\t"].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === delim) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

export function readPayments(text: string): ImportResult {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  if (!text.trim()) throw new LookbackError("The file is empty.");
  if (text.includes("\u0000")) throw new LookbackError("That does not look like a CSV file. Export as CSV and try again.");
  const all = parseCsv(text);
  let headers: string[] = [];
  const rows: { line: number; cells: string[] }[] = [];
  all.forEach((cells, idx) => {
    if (!cells.some((c) => c.trim())) return;
    if (!headers.length) { headers = cells.map((c) => c.trim()); return; }
    rows.push({ line: idx + 1, cells });
  });
  if (!headers.length) throw new LookbackError("The file has no header row.");
  const mapping = matchHeaders(headers, PAYMENT_SYNONYMS);
  // A bank export: no payee column, but a description we can read the payee out of.
  const bankMode = !mapping.payee && !!mapping.memo;
  if (bankMode) mapping.payee = mapping.memo;
  const missing = REQUIRED.filter((f) => !mapping[f]);
  if (missing.length) throw new LookbackError(`Could not find a column for: ${missing.join(", ")}. Headers seen: ${headers.join(", ")}.`);
  const idx: Record<string, number> = {};
  for (const [f, h] of Object.entries(mapping)) idx[f] = headers.indexOf(h);
  const used = new Set(Object.values(mapping));
  const res: ImportResult = { items: [], bankMode, headers, mapping, unmapped: headers.filter((h) => !used.has(h)), rowsRead: rows.length, skipped: [], masked: 0 };
  const get = (cells: string[], f: string) => (idx[f] !== undefined && idx[f] < cells.length ? cells[idx[f]].trim() : "");
  // Signed amounts: when any amount is negative, positives are money in, not payments.
  const signed = rows.some(({ cells }) => /^\s*[-(]/.test(get(cells, "amount")));
  for (const { line, cells } of rows) {
    const rawAmt = get(cells, "amount");
    const direction = get(cells, "direction").toLowerCase();
    if (direction && CREDIT_WORDS.some((w) => direction === w || direction.startsWith(w))) { res.skipped.push({ line, why: "money in, not a payment" }); continue; }
    if (signed && rawAmt && !/^[-(]/.test(rawAmt)) { res.skipped.push({ line, why: "money in, not a payment" }); continue; }
    let date: Date, amount: number;
    try { date = parseDate(get(cells, "date")); amount = parseAmount(rawAmt); }
    catch (e) { res.skipped.push({ line, why: (e as Error).message }); continue; }
    const texts: Record<string, string> = {};
    for (const f of ["payee", "method", "check_or_ref", "invoice_no", "memo"]) {
      const { text: t, count } = maskText(get(cells, f));
      res.masked += count; texts[f] = t.trim();
    }
    if (bankMode) {
      const { payee, ref } = payeeFromDescription(get(cells, "memo")); // before masking, so a phone number is stripped, not starred
      texts.payee = maskText(payee).text;
      if (ref && !texts.check_or_ref) texts.check_or_ref = ref;
    }
    if (!texts.payee) { res.skipped.push({ line, why: "no payee" }); continue; }
    const a = last4(get(cells, "account_last4")), r = last4(get(cells, "routing_last4"));
    res.masked += (a.wasLonger ? 1 : 0) + (r.wasLonger ? 1 : 0);
    res.items.push({ row: line, date, payee: texts.payee, amount, method: texts.method, check_or_ref: texts.check_or_ref, invoice_no: texts.invoice_no, memo: texts.memo, account_last4: a.last4, routing_last4: r.last4 });
  }
  if (!res.items.length) throw new LookbackError(`No usable rows. ${res.skipped.length} rows were skipped.`);
  if (bankMode) {
    const canon = mergePrefixes(res.items.map((i) => i.payee));
    for (const i of res.items) i.payee = canon.get(i.payee) ?? i.payee;
  }
  return res;
}
