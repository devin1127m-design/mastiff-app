// The check. Three holds, two cautions. Plain code on purpose: anyone can read it,
// a lawyer can defend it, and it never decides anything; the office does.

export type Vendor = {
  id: string;
  name: string;
  name_key: string;
  account_last4: string | null;
  usual_min: number | null;
  usual_max: number | null;
};

export type Org = {
  timezone?: string | null;
  single_cap: number;
  range_multiple: number;
  hours_start: number;
  hours_end: number;
};

export type RequestInput = {
  payee: string;
  amount: number;
  account_last4: string | null;
  note?: string | null;
  submittedAt?: Date;
};

export type Verdict = {
  verdict: "pass" | "hold";
  reasons: string[];   // the holds, in plain English
  cautions: string[];  // noted, never hold alone
  vendor: Vendor | null;
};

const SUFFIXES = new Set(["llc", "inc", "co", "corp", "corporation", "company", "ltd", "lp", "llp", "pllc", "incorporated"]);

export function nameKey(name: string): string {
  const s = (name || "").toLowerCase().replace(/&/g, " and ").replace(/[.'’`]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  const tokens = s.split(/\s+/).filter((t) => t && !SUFFIXES.has(t));
  return tokens.join(" ") || s;
}

const URGENCY = /\b(urgent|asap|today only|right away|immediately|don'?t (call|tell)|skip|rush|before (noon|5|close))\b/i;

export function check(input: RequestInput, vendors: Vendor[], org: Org): Verdict {
  const reasons: string[] = [];
  const cautions: string[] = [];
  const key = nameKey(input.payee);
  const vendor = vendors.find((v) => v.name_key === key) ?? null;

  // Hold 1: payee not on file
  if (!vendor) {
    reasons.push("Payee is not on your vendor list. Worth checking before payment.");
  }

  // Hold 2: bank details changed
  if (vendor && vendor.account_last4 && input.account_last4 && vendor.account_last4 !== input.account_last4) {
    reasons.push(`Bank details differ from the file (on file ends ${vendor.account_last4}, request ends ${input.account_last4}). Would have held.`);
  }
  if (vendor && !vendor.account_last4 && input.account_last4) {
    cautions.push("No account on file for this vendor yet; this request's last four will be recorded once confirmed.");
  }

  // Hold 3: amount out of range
  if (input.amount > org.single_cap) {
    reasons.push(`Amount is above the office's single-payment cap of $${org.single_cap.toLocaleString()}.`);
  } else if (vendor && vendor.usual_max && input.amount > vendor.usual_max * org.range_multiple) {
    reasons.push(`Amount is more than ${org.range_multiple}x this vendor's usual maximum of $${vendor.usual_max.toLocaleString()}.`);
  }

  // Caution A: off-hours
  const at = input.submittedAt ?? new Date();
  // Hours are the office's local hours (orgs.timezone), never the server's.
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: org.timezone || "America/Detroit", hour: "numeric", hour12: false, weekday: "short" }).formatToParts(at);
  const hour = Number(parts.find((x) => x.type === "hour")?.value ?? at.getHours()) % 24;
  const wd = parts.find((x) => x.type === "weekday")?.value ?? "";
  const weekend = wd === "Sat" || wd === "Sun";
  if (weekend || hour < org.hours_start || hour >= org.hours_end) {
    cautions.push("Request arrived outside payment hours.");
  }

  // Caution B: urgency language
  if (input.note && URGENCY.test(input.note)) {
    cautions.push("Request pushes to hurry or skip a step.");
  }

  // A caution adds weight only when a hold already exists. Alone, it is noted and the request passes.
  return { verdict: reasons.length ? "hold" : "pass", reasons, cautions, vendor };
}
