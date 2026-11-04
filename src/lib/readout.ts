// Step 6: the day-30 read-out. A pure function over the office's own tables:
// the numbers, every hold, and the office's record against the questions
// carriers commonly ask on applications (taken from public forms, see
// research/r1). It never says what an insurer requires or that coverage is assured.
// Mastiff flags. Your firm makes every payment decision.

export const ADVISORY_LINE = "Mastiff flags. Your firm makes every payment decision.";
export const NOT_ADVICE_LINE = "This read-out is a summary of your own log. It is not coverage advice. Whether a policy responds depends on its wording; confirm with your broker.";
export const SOURCE_LINE = "The questions are taken from publicly available carrier applications as of October 2026 and may differ from your policy's application.";

export type Req = {
  id: string; payee: string; amount: number; account_last4: string | null; source: string; submitted_by: string;
  verdict: "pass" | "hold"; reasons: string[]; status: string; straight_through: boolean; image_path: string | null; created_at: string;
  vendor: { name: string; callback_phone: string | null; phone_on_file_since: string | null; verified_at: string | null } | null;
  callbacks: { called_at: string; number_called: string; who_answered: string | null; what_said: string | null; outcome: string; by_name: string }[];
  decisions: { decided_at: string; decided_by: string; decision: string; note: string | null }[];
};
export type Member = { name: string; role: string };

export const RECORDED = "Recorded", PARTLY = "Partly recorded", NOT = "Not recorded";

// Questions 1, 2, 3, 4, 5, 7, 9, 11 and 15 of research/r1/requirements-matrix.md, verbatim.
const QUESTIONS: [number, string, string][] = [
  [1, "Does the Applicant confirm all change requests regarding Vendor account information... by a direct call to the Vendor using only the telephone number provided by the Vendor before the change request was received?", "Travelers (CRI-14104 II.4, CYB-14302 Q6, CRI-N-14300 Q5), One80/PSG (C.4), Intact 71074, SPG ExecuPro ~, Beazley F00769 ~ (predetermined number)"],
  [2, "Is the call back procedure performed by an individual other than the individual who received the change request?", "Travelers II.4a; PSG A/B/C; SPG ExecuPro ~"],
  [3, "Does the Applicant refrain from implementing any such change requests until after the Vendor has responded...?", "Travelers II.4b; PSG ~; SPG ~"],
  [4, "Does the Applicant confirm all such change requests made by a Vendor with an individual (at the Vendor) other than the individual who requested the change?", "Travelers II.4c; PSG C.4b; SPG ExecuPro"],
  [5, "Does the Applicant require that all such change requests made by a Vendor be approved by the Applicant's supervisor(s)...?", "Travelers II.4d; PSG C.4c; Intact \"second individual\"; Marsh AU \"senior management approval\""],
  [7, "Do payments or funds-transfers of a certain amount require dual authorization?", "Travelers IV.2 / CRI-N-14300 Q3; PSG A.2; Hartford HR 00 H122 I.4; SPG ExecuPro; Intact 71074; Coalition (\"in excess of $25,000\"); At-Bay ($25,000, two employees)"],
  [9, "Do you require all outgoing wire transfers be subject to segregation of duties between initiation and authorization...?", "PSG A.1; Beazley (\"Can the employee independently initiate a wire transfer?\"); Cowbell 5.3 ~; Marsh AU reconciliation by persons not authorised"],
  [11, "Is all vendor bank information verified by a direct call to the receiving bank prior to the account being established...?", "PSG C.2; Travelers II.1; Cowbell 5.1 ~; Intact 71074 (legitimacy of new vendors)"],
  [15, "Does the Applicant maintain a pre-established list of employees authorized to initiate payment or funds transfer requests...?", "Travelers IV.1; Hartford I.1; Beazley (\"Who in your organization has the authority to initiate a wire transfer?\")"],
];

// The 13 log fields from research/r1, and whether this log holds each one.
const FIELDS: [number, string][] = [
  [1, "Request received: receiver, date/time, channel, copy"], [2, "Request type, payee, amount"], [3, "Callback number used, and where it came from"],
  [4, "Channel of verification, different from the request"], [5, "Caller, different from the receiver"], [6, "Time of call and every attempt"],
  [7, "Who answered at the vendor"], [8, "What the vendor said"], [9, "Hold kept until the vendor responded; release time"],
  [10, "Second approver, different from initiator"], [11, "Outcome and reason"], [12, "Documentation retained (notes, request copy)"], [13, "New-account checks, incident time"],
];

export type Readout = ReturnType<typeof summarize>;

const differs = (a: string | null | undefined, b: string | null | undefined) => !!a?.trim() && !!b?.trim() && a.trim().toLowerCase() !== b.trim().toLowerCase();
const ladder = (k: number, n: number) => (n === 0 || k === 0 ? NOT : k === n ? RECORDED : PARTLY);
const money = (n: number) => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function summarize(rows: Req[], members: Member[], line: number, start: string, end: string) {
  const holds = rows.filter((r) => r.verdict === "hold").sort((a, b) => a.created_at.localeCompare(b.created_at));
  const closed = holds.filter((r) => ["released", "rejected"].includes(r.status));
  const released = holds.filter((r) => r.status === "released");
  const rejected = holds.filter((r) => r.status === "rejected");
  const open = holds.filter((r) => !["released", "rejected"].includes(r.status));
  const n = closed.length;
  const lastDecision = (r: Req) => r.decisions.length ? r.decisions[r.decisions.length - 1] : null;
  const hours = closed.map((r) => { const d = lastDecision(r); return d ? (new Date(d.decided_at).getTime() - new Date(r.created_at).getTime()) / 3600000 : null; }).filter((x): x is number => x !== null).sort((a, b) => a - b);
  const median = hours.length ? Math.round(hours[Math.floor(hours.length / 2)] * 10) / 10 : null;

  const called = closed.filter((r) => r.callbacks.length > 0);
  const onFile = called.filter((r) => r.vendor?.callback_phone && r.callbacks.every((c) => c.number_called.replace(/\D/g, "") === (r.vendor!.callback_phone ?? "").replace(/\D/g, "")));
  const onFileDated = onFile.filter((r) => r.vendor?.phone_on_file_since && r.vendor.phone_on_file_since < r.created_at.slice(0, 10));
  const callerDiff = closed.filter((r) => r.callbacks.length && r.callbacks.every((c) => differs(c.by_name, r.submitted_by)));
  const heldUntil = closed.filter((r) => { const d = lastDecision(r); return d && r.callbacks.some((c) => c.what_said && c.called_at <= d.decided_at); });
  const whoAnswered = closed.filter((r) => r.callbacks.some((c) => c.who_answered));
  const approved = closed.filter((r) => lastDecision(r));
  const approvedDiff = approved.filter((r) => differs(lastDecision(r)!.decided_by, r.submitted_by));
  const approverRole = (r: Req) => members.find((m) => m.name.toLowerCase() === lastDecision(r)?.decided_by.toLowerCase())?.role ?? null;
  const approvedByOwner = approvedDiff.filter((r) => ["owner", "approver"].includes(approverRole(r) ?? ""));
  const over = closed.filter((r) => Number(r.amount) > line);
  const overDiff = over.filter((r) => differs(lastDecision(r)?.decided_by, r.submitted_by));
  const amountHolds = holds.filter((r) => r.reasons.some((x) => /amount is (above|more than)/i.test(x)));
  const newHolds = holds.filter((r) => r.reasons.some((x) => /not on your vendor list/i.test(x)));
  const newReleased = newHolds.filter((r) => r.status === "released" && r.callbacks.length);
  const bankHolds = holds.filter((r) => r.reasons.some((x) => /bank details differ/i.test(x)));
  const submitters = [...rows.reduce((m, r) => m.set(r.submitted_by, (m.get(r.submitted_by) ?? 0) + 1), new Map<string, number>()).entries()].sort((a, b) => b[1] - a[1]);
  const initiators = members.filter((m) => ["owner", "bookkeeper"].includes(m.role)).map((m) => m.name);
  const withImage = rows.filter((r) => r.image_path).length;

  const q: Record<number, [string, string]> = {
    1: [`Callback to a number on file: ${called.length} of ${n} closed holds record a call; ${onFile.length} used only the number on the vendor file, ${onFileDated.length} to a number dated on file before the request.`, n && onFileDated.length === n ? RECORDED : onFile.length ? PARTLY : NOT],
    2: [`Caller different from the person who received the request: ${callerDiff.length} of ${n} closed holds.`, ladder(callerDiff.length, n)],
    3: [`Payment held until the vendor responded: ${heldUntil.length} of ${n} closed holds have what the vendor said recorded before the decision.`, ladder(heldUntil.length, n)],
    4: [`Who answered at the vendor is recorded in ${whoAnswered.length} of ${n} closed holds. Whether that person differs from the one who requested the change is not a field.`, whoAnswered.length ? PARTLY : NOT],
    5: [`Second person decided: ${approved.length} of ${n} closed holds record a decision; decider differs from submitter in ${approvedDiff.length}; decider holds the owner or approver role in ${approvedByOwner.length}.`, n && approvedByOwner.length === n ? RECORDED : approved.length ? PARTLY : NOT],
    7: [`Dual authorization above a stated amount: line set at ${money(line)}; ${amountHolds.length} ${plural(amountHolds.length, "hold", "holds")} for amount out of range. Closed holds over the line with a different decider: ${overDiff.length} of ${over.length}.`, over.length && overDiff.length === over.length ? RECORDED : PARTLY],
    9: [`Initiator and decider are different people in ${approvedDiff.length} of ${n} closed holds. Payments that pass record no second person, so this covers holds only.`, approvedDiff.length ? PARTLY : NOT],
    11: [`Not recorded by Mastiff. A direct call to the receiving bank is not a field in the log. For context: ${newHolds.length} new-payee ${plural(newHolds.length, "hold", "holds")}, ${newReleased.length} released after a callback to the vendor; ${bankHolds.length} ${plural(bankHolds.length, "hold", "holds")} for bank details differing from the file.`, NOT],
    15: [`Pre-established list of authorized initiators: the office's members with the owner or bookkeeper role are ${initiators.join(", ") || "none"}. Submitters seen in the log: ${submitters.map(([k, v]) => `${k} (${v})`).join(", ") || "none"}.`, initiators.length ? RECORDED : NOT],
  };
  const questions = QUESTIONS.map(([num, text, carriers]) => ({ num, text, carriers, record: q[num][0], status: q[num][1] }));

  const filled: Record<number, number> = {
    1: closed.filter((r) => r.source && r.submitted_by).length, 2: n, 3: onFile.length, 4: called.length, 5: callerDiff.length,
    6: called.length, 7: whoAnswered.length, 8: closed.filter((r) => r.callbacks.some((c) => c.what_said)).length, 9: heldUntil.length,
    10: approvedDiff.length, 11: closed.filter((r) => lastDecision(r)).length, 12: closed.filter((r) => r.image_path || lastDecision(r)?.note).length, 13: 0,
  };
  const fieldNotes: Record<number, string> = { 4: "a phone call, never the channel the request came in on", 12: "counted when the invoice image or a decision note is on the request", 13: "not a field in this log" };
  const fields = FIELDS.map(([num, name]) => ({ num, name, filled: filled[num], closed: n, inLog: num !== 13, note: fieldNotes[num] ?? "" }));

  return {
    start, end, checked: rows.length, passed: rows.filter((r) => r.verdict === "pass").length, straight: rows.filter((r) => r.straight_through).length,
    holds: holds.length, released: released.length, rejected: rejected.length, open: open.length, closed: n, medianHours: median,
    amountNotPaid: rejected.reduce((t, r) => t + Number(r.amount), 0), holdRows: holds, questions, fields, submitters, line, withImage,
    verifiedVendors: [...new Map(rows.filter((r) => r.vendor?.verified_at).map((r) => [r.vendor!.name, r.vendor!.verified_at!])).entries()],
    lineText: `${rows.length} checked, ${holds.length} ${plural(holds.length, "hold", "holds")}, ${released.length} released, ${rejected.length} recorded not paid, median ${median === null ? "n/a" : median.toFixed(1)} hours to resolve`,
  };
}

export function outcome(r: Req): string {
  if (r.status === "released") { const d = r.decisions[r.decisions.length - 1]; return d?.decision === "change" ? "Paid to the account on file" : "Released after callback"; }
  if (r.status === "rejected") return "Recorded not paid";
  if (r.status === "confirmed") return "Vendor confirmed, awaiting decision";
  if (r.status === "not_confirmed") return "Vendor did not request it, awaiting decision";
  return "Still open";
}
