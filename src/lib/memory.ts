// Step 5: vendor memory. What is normal for each vendor, worked out from the
// office's own paid history in plain code. It only ever suggests; the owner
// clicks to make a suggestion the usual range. Nothing here changes a verdict.

export type Pattern = {
  count: number;
  low: number;          // suggested usual_min
  high: number;         // suggested usual_max
  everyDays: number | null;  // typical gap between payments
  lastAt: string | null;
  domains: string[];    // sender domains seen on forwarded invoices
};

const q = (sorted: number[], p: number) => sorted[Math.floor((sorted.length - 1) * p)];

// Needs three paid requests to say anything. Uses the 10th to 90th percentile
// with 20% room each way, rounded to a sensible step, so one odd invoice does not set the range.
export function pattern(amounts: number[], dates: string[], domains: string[] = []): Pattern | null {
  const a = amounts.filter((x) => x > 0).sort((x, y) => x - y);
  if (a.length < 3) return null;
  const lo = q(a, 0.1) * 0.8, hi = q(a, 0.9) * 1.2;
  const step = hi >= 10000 ? 500 : hi >= 1000 ? 100 : 10;
  const low = Math.max(0, Math.floor(lo / step) * step);
  const high = Math.ceil(hi / step) * step;
  const ds = dates.map((d) => new Date(d).getTime()).filter(Number.isFinite).sort((x, y) => x - y);
  let everyDays: number | null = null;
  if (ds.length >= 3) {
    const gaps = ds.slice(1).map((t, i) => (t - ds[i]) / 86400000).sort((x, y) => x - y);
    everyDays = Math.round(gaps[Math.floor(gaps.length / 2)]);
    if (everyDays < 1) everyDays = null;
  }
  const seen = new Map<string, number>();
  for (const d of domains) { const k = d.toLowerCase().split("@").pop() ?? ""; if (k) seen.set(k, (seen.get(k) ?? 0) + 1); }
  return { count: a.length, low, high, everyDays, lastAt: ds.length ? new Date(ds[ds.length - 1]).toISOString() : null, domains: [...seen.entries()].sort((x, y) => y[1] - x[1]).map(([k]) => k) };
}

export function describe(p: Pattern): string {
  const money = (n: number) => "$" + n.toLocaleString("en-US");
  let s = `Paid ${p.count} times, ${money(p.low)} to ${money(p.high)}`;
  if (p.everyDays) s += p.everyDays >= 25 && p.everyDays <= 35 ? ", about monthly" : p.everyDays >= 6 && p.everyDays <= 8 ? ", about weekly" : `, about every ${p.everyDays} days`;
  if (p.domains.length) s += `, invoices from ${p.domains[0]}`;
  return s + ".";
}
