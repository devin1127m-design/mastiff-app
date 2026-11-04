// Step 9: subcontractor checks for construction offices. Insurance certificates
// (COI) and lien waivers, from dates kept on the vendor row, against the office's
// own paid requests. A port of lookback/subs.py. Cautions only: nothing here holds
// a payment. Mastiff flags. It does not give legal advice. Your firm makes every payment decision.

export const SUB_ADVISORY = "Mastiff flags. It does not give legal advice. Your firm makes every payment decision.";
const SOON_DAYS = 30;

export type Sub = {
  id: string; name: string; gl_expires: string | null; wc_expires: string | null; wc_exempt: boolean;
  auto_expires: string | null; additional_insured: boolean | null; waiver_through: string | null;
};
export type Paid = { vendor_id: string; amount: number; created_at: string };
export type Item = { vendorId: string; payee: string; kind: "Insurance" | "Lien waiver"; finding: string; amount: number; check: string };

const d = (s: string) => new Date(s.length === 10 ? s + "T00:00:00Z" : s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const day = (s: string) => s.slice(0, 10);

function coverage(label: string, exp: string | null, asOf: string): string | null {
  if (!exp) return `No ${label} certificate on file.`;
  if (exp < asOf) return `${label} certificate expired ${d(exp)}.`;
  const soon = new Date(new Date(asOf + "T00:00:00Z").getTime() + SOON_DAYS * 86400000).toISOString().slice(0, 10);
  if (exp <= soon) return `${label} certificate expires ${d(exp)}, within ${SOON_DAYS} days.`;
  return null;
}

export function build(subs: Sub[], paid: Paid[], asOf = new Date().toISOString().slice(0, 10)) {
  const items: Item[] = [];
  let uninsured = 0, unwaived = 0;
  const renew = "Request a current certificate from the sub's insurance agent, not from the sub, before the next payment.";
  for (const s of [...subs].sort((a, b) => a.name.localeCompare(b.name))) {
    for (const [label, exp] of [["General liability", s.gl_expires], ["Workers' comp", s.wc_exempt ? "exempt" : s.wc_expires]] as [string, string | null][]) {
      if (exp === "exempt") continue;
      const msg = coverage(label, exp, asOf);
      if (msg) items.push({ vendorId: s.id, payee: s.name, kind: "Insurance", finding: msg, amount: 0, check: msg.includes("expired") || msg.startsWith("No ") ? renew : "Ask the agent for the renewal certificate now." });
    }
    if (s.wc_exempt) items.push({ vendorId: s.id, payee: s.name, kind: "Insurance", finding: "Workers' comp marked exempt.", amount: 0, check: "Keep the sub's written exemption on file. At audit, your workers' comp carrier may charge premium for subs it treats as uninsured." });
    if (s.auto_expires) { const msg = coverage("Auto", s.auto_expires, asOf); if (msg) items.push({ vendorId: s.id, payee: s.name, kind: "Insurance", finding: msg, amount: 0, check: "Ask the agent for the renewal certificate." }); }
    if (s.additional_insured === false) items.push({ vendorId: s.id, payee: s.name, kind: "Insurance", finding: "Your firm is not listed as additional insured.", amount: 0, check: "Check the subcontract. If it requires additional insured status, ask for the endorsement." });

    const ps = paid.filter((p) => p.vendor_id === s.id && p.amount > 0).sort((a, b) => a.created_at.localeCompare(b.created_at));
    if (!ps.length) continue;
    const lapsed = ps.filter((p) => (s.gl_expires && day(p.created_at) > s.gl_expires) || (!s.wc_exempt && s.wc_expires && day(p.created_at) > s.wc_expires));
    if (lapsed.length) {
      const amt = lapsed.reduce((t, p) => t + Number(p.amount), 0); uninsured += amt;
      items.push({ vendorId: s.id, payee: s.name, kind: "Insurance", finding: `${lapsed.length} payment${lapsed.length === 1 ? "" : "s"} made after a certificate on file expired (${d(lapsed[0].created_at)} to ${d(lapsed[lapsed.length - 1].created_at)}).`, amount: amt, check: "Get proof the sub was covered for those dates before your carrier's audit." });
    }
    const uncovered = ps.filter((p) => !s.waiver_through || day(p.created_at) > s.waiver_through);
    if (uncovered.length) {
      const amt = uncovered.reduce((t, p) => t + Number(p.amount), 0); unwaived += amt;
      items.push({ vendorId: s.id, payee: s.name, kind: "Lien waiver", finding: `${uncovered.length} payment${uncovered.length === 1 ? "" : "s"} ${s.waiver_through ? `since the last waiver (${d(s.waiver_through)})` : "with no waiver on file"}.`, amount: amt, check: "Collect a waiver covering these payments, and a conditional waiver before the next one, so the work is not paid for twice if a supplier goes unpaid." });
    }
  }
  const order = { Insurance: 0, "Lien waiver": 1 };
  items.sort((a, b) => b.amount - a.amount || order[a.kind] - order[b.kind] || a.payee.localeCompare(b.payee));
  const coiCount = new Set(items.filter((i) => i.kind === "Insurance").map((i) => i.payee)).size;
  const waiverCount = new Set(items.filter((i) => i.kind === "Lien waiver").map((i) => i.payee)).size;
  const money = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const line = [`${subs.length} subcontractor${subs.length === 1 ? "" : "s"} checked as of ${d(asOf)}.`, `${coiCount} with an insurance item worth checking.`,
    ...(uninsured ? [`${money(uninsured)} paid while a certificate on file had lapsed.`] : []),
    `${waiverCount} with payments not covered by a lien waiver${unwaived ? ` (${money(unwaived)})` : ""}.`].join(" ");
  return { asOf, items, uninsured, unwaived, coiCount, waiverCount, line };
}

// The one-line caution shown on a request for a sub: before the next payment, not a hold.
export function cautionFor(s: Sub, asOf = new Date().toISOString().slice(0, 10)): string | null {
  const parts: string[] = [];
  const gl = coverage("General liability", s.gl_expires, asOf); if (gl) parts.push(gl);
  if (!s.wc_exempt) { const wc = coverage("Workers' comp", s.wc_expires, asOf); if (wc) parts.push(wc); }
  if (!s.waiver_through) parts.push("No lien waiver on file.");
  else if (s.waiver_through < asOf) parts.push(`Last lien waiver covers through ${d(s.waiver_through)}.`);
  return parts.length ? parts.join(" ") : null;
}

// CSV paste, same columns as pilot-kit/subcontractor-register-template.csv.
export function parseRegister(text: string): { name: string; gl_expires: string | null; wc_expires: string | null; wc_exempt: boolean; auto_expires: string | null; additional_insured: boolean | null; waiver_through: string | null }[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");
  const head = lines[0].split(",").map(norm);
  const col = (names: string[]) => head.findIndex((h) => names.includes(h));
  const iName = col(["vendor", "sub", "subcontractor", "name", "payee", "company"]);
  const iGl = col(["glexpires", "gl", "generalliability", "glexp"]), iWc = col(["wcexpires", "wc", "workerscomp", "wcexp"]);
  const iAuto = col(["autoexpires", "auto", "autoexp"]), iAi = col(["additionalinsured", "ai", "addlinsured"]), iW = col(["waiverthrough", "lienwaiver", "waiverdate", "lastwaiver"]);
  if (iName < 0) return [];
  const date = (s: string | undefined) => { const t = (s ?? "").trim(); if (!t || /^(none|n\/a|na|missing|-)$/i.test(t)) return null; const m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (m) return t; const m2 = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/); if (m2) { const y = m2[3].length === 2 ? "20" + m2[3] : m2[3]; return `${y}-${m2[1].padStart(2, "0")}-${m2[2].padStart(2, "0")}`; } return null; };
  return lines.slice(1).map((l) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, ""))).filter((c) => c[iName]).map((c) => {
    const wcText = (iWc >= 0 ? c[iWc] : "") ?? "";
    const exempt = /^(exempt|sole proprietor|no employees|sole prop)$/i.test(wcText.trim());
    const ai = (iAi >= 0 ? c[iAi] : "").toLowerCase();
    return { name: c[iName], gl_expires: iGl >= 0 ? date(c[iGl]) : null, wc_expires: exempt ? null : iWc >= 0 ? date(wcText) : null, wc_exempt: exempt, auto_expires: iAuto >= 0 ? date(c[iAuto]) : null, additional_insured: ["y", "yes", "true", "1", "x"].includes(ai) ? true : ["n", "no", "false", "0"].includes(ai) ? false : null, waiver_through: iW >= 0 ? date(c[iW]) : null };
  });
}
