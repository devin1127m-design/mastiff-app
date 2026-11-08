// Payee out of a bank's description line. Port of lookback/bankdesc.py; keep them in step.
// "ORIG CO NAME:RAYS DRYWALL LLC ORIG ID:…" → "Rays Drywall LLC"; "MENARDS LAKE ORION MI 05/03" → "Menards Lake"
// (merged with "Menards" later); "CHECK 1837" → the check number, payee unknown.

const PREFIXES = /^\s*(?:pos\s+debit|pos\s+purchase|debit\s+card\s+purchase|debit\s+purchase|card\s+purchase|purchase|ach\s+debit|ach\s+payment|ach\s+pmt|electronic\s+payment|online\s+payment|online\s+pmt|bill\s+pay(?:ment)?|payment\s+to|pmt\s+to|zelle\s+payment\s+to|zelle\s+to|wire\s+out(?:going)?|wire\s+transfer\s+to|recurring\s+payment|recurring\s+debit|preauthorized\s+debit|web\s+pmt|epay|autopay)\b[\s:\-]*/i;
const ORIG = /ORIG\s*CO\s*NAME:\s*(.+?)\s+(?:ORIG\s*ID|CO\s*ID|DESC)/i;
const CHECK = /^\s*(?:check|chk|cheque)\s*#?\s*(\d{2,})\b/i;
const TRAIL_DATE = /\s+\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\s*$/;
const TRAIL_PHONE = /\s+\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}\b/;
const STATES = "AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC";
const TRAIL_STATE = new RegExp(`\\s+(?:${STATES})\\s*$`);
const TRAIL_LOC = new RegExp(`\\s+[A-Z][A-Za-z.']*\\s+(?:${STATES})\\s*$`);
const TRAIL_NUM = /[\s#*]+[A-Z]?\d{4,}\s*$/;
const ID_FIELDS = /\b(?:id|ref|trace|conf(?:irmation)?|auth|seq)\s*[#:]\s*\S+/gi;

export const CHECK_PAYEE = "Check (payee not in the export)";

function tidy(s: string): string {
  s = s.replace(/\s+/g, " ").replace(/^[\s\-:*#]+|[\s\-:*#]+$/g, "");
  if (s.length > 3 && s === s.toUpperCase() && /[A-Z]/.test(s)) {
    s = s.split(" ").map((w) => (["LLC", "INC", "LLP", "PC", "DBA", "USA"].includes(w) ? w : w.charAt(0) + w.slice(1).toLowerCase())).join(" ");
  }
  return s;
}

export function payeeFromDescription(desc: string): { payee: string; ref: string | null } {
  let s = (desc || "").trim();
  if (!s) return { payee: "", ref: null };
  let m = s.match(CHECK);
  if (m) return { payee: CHECK_PAYEE, ref: m[1] };
  m = s.match(ORIG);
  if (m) return { payee: tidy(m[1]), ref: null };
  s = s.replace(PREFIXES, "").replace(ID_FIELDS, "");
  for (let i = 0; i < 3; i++) {
    const s2 = s.replace(TRAIL_DATE, "").replace(TRAIL_PHONE, "").replace(TRAIL_NUM, "");
    if (s2 === s) break;
    s = s2;
  }
  if (TRAIL_STATE.test(s) && s.split(/\s+/).length >= 2) {
    const s2 = TRAIL_PHONE.test(desc) ? s.replace(TRAIL_STATE, "") : s.replace(TRAIL_LOC, "");
    if (s2.trim()) s = s2;
  }
  return { payee: tidy(s), ref: null };
}

// A suffix that is a place or a store number, the only kind of tail a bank adds to one vendor.
// "Lake", "Auburn Hills", "#1234", "0042" merge; "Rental", "Supply", "Pro" do not.
const PLACE_WORDS = new Set("north south east west lake lakes hills hill heights park pointe point township twp city village beach shores grove harbor harbour center centre station plaza mall square ridge creek river falls valley springs woods oaks pines mt mount saint st ste suite rd road ave avenue blvd hwy highway main".split(" "));
const MI_CITIES = new Set("oxford orion ortonville clarkston auburn rochester troy pontiac waterford detroit flint lapeer brandon holly fenton grand blanc davison burton goodrich metamora dryden almont imlay romeo washington shelby utica sterling warren royal oak ferndale birmingham bloomfield southfield novi livonia farmington wixom milford highland white commerce walled lyon brighton howell hartland ann arbor ypsilanti saline dearborn lansing okemos holland saginaw midland bay traverse kalamazoo portage battle jackson monroe wyandotte taylor canton plymouth northville".split(" "));
function placeLike(suffix: string, firstWords: Set<string>, ownNames: Set<string>): boolean {
  const words = suffix.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return false;
  if (ownNames.has(suffix.toLowerCase())) return false;                 // the suffix is itself a payee in the file
  return words.every((w) => PLACE_WORDS.has(w) || MI_CITIES.has(w) || /^#?\d{2,}$/.test(w) || /^[a-z]{2}$/.test(w)) && !words.some((w) => firstWords.has(w));
}

// Names that extend one another by a place-like tail are one vendor; each maps to the family's most common form.
export function mergePrefixes(names: string[]): Map<string, string> {
  const counts = new Map<string, number>();
  for (const n of names) if (n) counts.set(n, (counts.get(n) ?? 0) + 1);
  const keys = [...counts.keys()].sort((a, b) => a.length - b.length);
  const ownNames = new Set(keys.map((k) => k.toLowerCase()));
  const firstWords = new Set(keys.map((k) => k.toLowerCase().split(" ")[0]));
  const family = new Map<string, string>();
  for (const n of keys) {
    let root = n;
    for (const k of keys) {
      if (k.length >= n.length) break;
      if ((k.split(" ").length >= 2 || k.length >= 6) && n.toLowerCase().startsWith(k.toLowerCase() + " ") && placeLike(n.slice(k.length), firstWords, ownNames)) { root = family.get(k) ?? k; break; }
    }
    family.set(n, root);
  }
  const members = new Map<string, string[]>();
  for (const [n, root] of family) { if (!members.has(root)) members.set(root, []); members.get(root)!.push(n); }
  const canon = new Map<string, string>();
  for (const ns of members.values()) {
    const best = ns.reduce((a, b) => (counts.get(b)! > counts.get(a)! || (counts.get(b) === counts.get(a) && b.length < a.length) ? b : a));
    for (const n of ns) canon.set(n, best);
  }
  return canon;
}
