"use server";

import { createClient } from "@/lib/supabase/server";
import { check, nameKey, type Vendor, type Org } from "@/lib/rules";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Send whatever notifications the database just queued. Best effort, never blocks the bookkeeper.
async function flush() {
  // Never make the bookkeeper wait on mail: kick it off and let the daily cron sweep anything missed.
  try { const { flushNotifications } = await import("@/lib/mail"); void flushNotifications(20).catch(() => null); } catch { /* mail is optional */ }
}

// C11: free text never carries more than the last four of anything that looks like an account.
function clean(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  return s.replace(/\d(?:[ -]?\d){7,}/g, (run) => "****" + run.replace(/\D/g, "").slice(-4));
}

function last4(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").replace(/\D/g, "");
  if (!s) return null;
  return s.slice(-4);
}
function money(v: FormDataEntryValue | null): number {
  return Number(String(v ?? "").replace(/[$,\s]/g, ""));
}

export async function addVendor(orgId: string, form: FormData) {
  const supabase = await createClient();
  const name = String(form.get("name") ?? "").trim();
  if (!name) return;
  const usualMin = money(form.get("usual_min"));
  const usualMax = money(form.get("usual_max"));
  const since = String(form.get("phone_on_file_since") ?? "") || null;
  await supabase.from("vendors").upsert({
    org_id: orgId,
    name,
    name_key: nameKey(name),
    callback_phone: String(form.get("callback_phone") ?? "").trim() || null,
    phone_on_file_since: since,
    account_last4: last4(form.get("account_last4")),
    usual_min: usualMin || null,
    usual_max: usualMax || null,
    notes: clean(form.get("notes")),
  }, { onConflict: "org_id,name_key" });
  revalidatePath("/app/vendors");
}

export async function importVendors(orgId: string, form: FormData) {
  const supabase = await createClient();
  const { parseCsv } = await import("@/lib/lookback/importer");
  const all = parseCsv(String(form.get("csv") ?? "")).filter((r) => r.some((c) => c.trim()));
  if (all.length < 2) return;
  const header = all[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const col = (names: string[]) => header.findIndex((h) => names.includes(h));
  const iName = col(["vendor", "name", "payee", "vendorname", "supplier"]);
  const iPhone = col(["phone", "callbackphone", "callback", "phonenumber"]);
  const iAcct = col(["last4", "accountlast4", "account", "acct", "accountnumber"]);
  if (iName < 0) return;
  // Only the columns the sheet has are written, so a sheet without phones never blanks a phone on file.
  for (const c of all.slice(1)) {
    const name = (c[iName] ?? "").trim();
    if (!name) continue;
    const row: Record<string, unknown> = { org_id: orgId, name, name_key: nameKey(name) };
    if (iPhone >= 0 && c[iPhone]?.trim()) row.callback_phone = c[iPhone].trim();
    if (iAcct >= 0 && c[iAcct]?.trim()) row.account_last4 = last4(c[iAcct]);
    await supabase.from("vendors").upsert(row, { onConflict: "org_id,name_key" });
  }
  revalidatePath("/app/vendors");
}

export async function deleteVendor(orgId: string, vendorId: string) {
  const supabase = await createClient();
  await supabase.from("vendors").delete().eq("id", vendorId).eq("org_id", orgId);
  revalidatePath("/app/vendors");
}

export async function submitRequest(orgId: string, submittedBy: string, form: FormData) {
  const supabase = await createClient();
  const { data: org } = await supabase.from("orgs").select("single_cap, range_multiple, hours_start, hours_end, timezone").eq("id", orgId).single();
  const { data: vendors } = await supabase.from("vendors").select("id, name, name_key, account_last4, usual_min, usual_max").eq("org_id", orgId);
  const input = {
    payee: String(form.get("payee") ?? "").trim(),
    amount: money(form.get("amount")),
    account_last4: last4(form.get("account_last4")),
    note: clean(form.get("note")),
    submittedAt: new Date(),
  };
  if (!input.payee || !(input.amount > 0)) return;
  const v = check(input, (vendors ?? []) as Vendor[], org as Org);
  // A request confirmed from a read carries the image and what was read.
  const intakeId = String(form.get("intake_id") ?? "") || null;
  let intake: { image_path: string; source: string; extracted: unknown; read_confidence: number | null } | null = null;
  if (intakeId) {
    const { data } = await supabase.from("intakes").select("image_path, source, extracted, read_confidence").eq("id", intakeId).eq("org_id", orgId).maybeSingle();
    intake = data;
  }
  const { data: row } = await supabase.from("requests").insert({
    org_id: orgId,
    payee: input.payee,
    amount: input.amount,
    account_last4: input.account_last4,
    invoice_no: String(form.get("invoice_no") ?? "").trim() || null,
    note: input.note,
    source: intake?.source ?? "form",
    submitted_by: submittedBy,
    verdict: v.verdict,
    reasons: v.reasons,
    cautions: v.cautions,
    vendor_id: v.vendor?.id ?? null,
    status: v.verdict === "pass" ? "passed" : "open",
    image_path: intake?.image_path ?? null,
    extracted: intake?.extracted ?? null,
    read_confidence: intake?.read_confidence ?? null,
    straight_through: false,
  }).select("id").single();
  if (intakeId && row) await supabase.from("intakes").update({ request_id: row.id }).eq("id", intakeId);
  if (v.verdict === "hold") await flush();
  revalidatePath("/app");
  revalidatePath("/desk");
  redirect(`/app/requests/${row!.id}`);
}

export async function logCallback(requestId: string, byName: string, form: FormData) {
  const supabase = await createClient();
  const outcome = String(form.get("outcome"));
  await supabase.from("callbacks").insert({
    request_id: requestId,
    number_called: String(form.get("number_called") ?? "").trim(),
    who_answered: clean(form.get("who_answered")),
    what_said: clean(form.get("what_said")),
    outcome,
    by_name: byName,
  });
  if (outcome === "confirmed" || outcome === "not_confirmed") {
    await supabase.from("requests").update({ status: outcome }).eq("id", requestId);
    if (outcome === "confirmed") {
      // A confirmed callback verifies the vendor by voice.
      const { data: r } = await supabase.from("requests").select("vendor_id, account_last4").eq("id", requestId).single();
      if (r?.vendor_id) {
        await supabase.from("vendors").update({ verified_at: new Date().toISOString(), verified_by: byName, ...(r.account_last4 ? { account_last4: r.account_last4 } : {}) }).eq("id", r.vendor_id);
      }
    }
  }
  await flush();
  revalidatePath(`/app/requests/${requestId}`);
  revalidatePath("/desk");
}

export async function recordDecision(requestId: string, decidedBy: string, form: FormData) {
  const supabase = await createClient();
  const decision = String(form.get("decision"));
  const { error } = await supabase.from("decisions").insert({
    request_id: requestId,
    decided_by: decidedBy,
    decision,
    note: clean(form.get("note")),
  });
  if (error) return; // not the owner or approver: the database says no and nothing moves
  await supabase.from("requests").update({ status: decision === "reject" ? "rejected" : "released" }).eq("id", requestId);
  revalidatePath(`/app/requests/${requestId}`);
  revalidatePath("/app");
  revalidatePath("/desk");
}

export async function saveSettings(orgId: string, form: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("orgs").update({
    single_cap: money(form.get("single_cap")) || 5000,
    range_multiple: Number(form.get("range_multiple")) || 2,
    hours_start: Number(form.get("hours_start")),
    hours_end: Number(form.get("hours_end")),
  }).eq("id", orgId).select("id");
  revalidatePath("/app/settings");
  if (error || !data?.length) redirect("/app/settings?qbo=notsaved");
  redirect("/app/settings?qbo=saved");
}

export async function createOrg(form: FormData) {
  const supabase = await createClient();
  const name = String(form.get("name") ?? "").trim();
  const slug = String(form.get("slug") ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!name || !slug) return;
  await supabase.from("orgs").insert({ name, slug });
  revalidatePath("/desk");
}

export async function inviteMember(form: FormData) {
  const supabase = await createClient();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const org_id = String(form.get("org_id") ?? "") || null;
  const partner_id = String(form.get("partner_id") ?? "") || null;
  const role = String(form.get("role") ?? "bookkeeper");
  const name = String(form.get("name") ?? "").trim();
  if (!email || !name || (!org_id && !partner_id)) return;
  if (role === "partner") await supabase.from("invites").insert({ email, partner_id, role, name });
  else await supabase.from("invites").upsert({ email, org_id, role, name }, { onConflict: "email,org_id" });
  revalidatePath("/desk");
}

// Step 10: partner firms.
export async function createPartner(form: FormData) {
  const supabase = await createClient();
  const name = String(form.get("name") ?? "").trim();
  if (!name) return;
  await supabase.from("partners").insert({ name });
  revalidatePath("/desk");
}
export async function attachOrgToPartner(form: FormData) {
  const supabase = await createClient();
  const org_id = String(form.get("org_id") ?? ""), partner_id = String(form.get("partner_id") ?? "");
  if (!org_id || !partner_id) return;
  await supabase.from("orgs").update({ partner_id }).eq("id", org_id);
  revalidatePath("/desk"); revalidatePath("/partner");
}

export async function removeInvite(id: string) {
  const supabase = await createClient();
  await supabase.from("invites").delete().eq("id", id);
  revalidatePath("/desk");
}

export async function runLookback(orgId: string, uploadedBy: string, form: FormData) {
  const { readPayments, LookbackError } = await import("@/lib/lookback/importer");
  const { scan, findMoney, summarize } = await import("@/lib/lookback/scan");
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return;
  if (file.size > 10 * 1024 * 1024) redirect(`/app/lookback?error=${encodeURIComponent("That file is over 10 MB. Export a shorter date range.")}`);
  const text = await file.text();
  let res;
  try { res = readPayments(text); }
  catch (e) { redirect(`/app/lookback?error=${encodeURIComponent(e instanceof LookbackError ? e.message : "Could not read that file.")}`); }
  const flags = scan(res.items);
  const money = findMoney(res.items);
  const s = summarize(res.items, flags);
  const supabase = await createClient();
  const { data: row } = await supabase.from("lookbacks").insert({
    org_id: orgId, filename: file.name, uploaded_by: uploadedBy,
    payments: s.payments, months: s.months, first_date: s.first, last_date: s.last,
    held: s.held, need_call: s.need_call, masked: res.masked, skipped: res.skipped.length,
    mapping: res.mapping, flags, money,
  }).select("id").single();
  revalidatePath("/app/lookback");
  redirect(`/app/lookback/${row!.id}`);
}

export async function markRow(lookbackId: string, row: number, markedBy: string, form: FormData) {
  const supabase = await createClient();
  const mark = String(form.get("mark") ?? "");
  if (!mark) return;
  const rec = String(form.get("amount_recovered") ?? "").replace(/[$,\s]/g, "");
  await supabase.from("lookback_marks").upsert({
    lookback_id: lookbackId, row, mark, note: String(form.get("note") ?? "").trim() || null,
    amount_recovered: rec ? Number(rec) : null, marked_by: markedBy,
  }, { onConflict: "lookback_id,row" });
  revalidatePath(`/app/lookback/${lookbackId}`);
}

// Intake (step 3). The file is already in the private `invoices` bucket at
// <org_id>/<name>, uploaded straight from the phone. Read it, check it, and
// either file the request (Rule 5: confident, on file, passes, in pattern)
// or park it as an intake for the bookkeeper to confirm.
export async function startIntake(orgId: string, byName: string, path: string, source: "upload" | "photo") {
  const { readInvoice, needsTap, isConfigured } = await import("@/lib/intake");
  const supabase = await createClient();
  if (!path.startsWith(orgId + "/")) return;
  const mime = path.endsWith(".pdf") ? "application/pdf" : path.endsWith(".png") ? "image/png" : path.endsWith(".webp") ? "image/webp" : "image/jpeg";

  let extracted = null as Awaited<ReturnType<typeof readInvoice>> | null;
  let readError: string | null = null;
  if (!isConfigured()) readError = "Reading is not switched on for this desk yet. Fill in the fields; the picture stays attached.";
  else {
    const { data: blob, error } = await supabase.storage.from("invoices").download(path);
    if (error || !blob) readError = "The upload did not finish. Try again.";
    else {
      try { extracted = await readInvoice(new Uint8Array(await blob.arrayBuffer()), mime); }
      catch (e) { readError = "Mastiff could not read this one. Fill it in by hand; the picture stays attached. (" + (e instanceof Error ? e.message.slice(0, 80) : "read failed") + ")"; }
    }
  }

  let tapReason: string | null = readError;
  let verdict: ReturnType<typeof check> | null = null;
  if (extracted) {
    const { data: org } = await supabase.from("orgs").select("single_cap, range_multiple, hours_start, hours_end, timezone").eq("id", orgId).single();
    const { data: vendors } = await supabase.from("vendors").select("id, name, name_key, account_last4, usual_min, usual_max, pass_under").eq("org_id", orgId);
    if (extracted.payee && extracted.amount) {
      verdict = check({ payee: extracted.payee, amount: extracted.amount, account_last4: extracted.account_last4, note: extracted.notes, submittedAt: new Date() }, (vendors ?? []) as Vendor[], org as Org);
      tapReason = needsTap(extracted, verdict, verdict.vendor);
    } else tapReason = needsTap(extracted, { verdict: "hold", reasons: [], cautions: [], vendor: null }, null);
  }

  if (extracted && verdict && !tapReason) {
    // Straight through. The pay screen shows the image beside these fields; the click on pay is the check.
    const { data: row } = await supabase.from("requests").insert({
      org_id: orgId, payee: extracted.payee, amount: extracted.amount, account_last4: extracted.account_last4,
      invoice_no: extracted.invoice_no, note: extracted.notes, source, submitted_by: "Mastiff (read for " + byName + ")",
      verdict: verdict.verdict, reasons: verdict.reasons, cautions: verdict.cautions, vendor_id: verdict.vendor?.id ?? null,
      status: "passed", image_path: path, extracted, read_confidence: extracted.confidence, straight_through: true,
    }).select("id").single();
    revalidatePath("/app");
    redirect(`/app/requests/${row!.id}`);
  }

  const { data: it } = await supabase.from("intakes").insert({
    org_id: orgId, image_path: path, source, extracted, read_confidence: extracted?.confidence ?? null,
    needs_tap_because: tapReason, read_error: readError, created_by: byName,
  }).select("id").single();
  revalidatePath("/app");
  redirect(`/app/requests/new?intake=${it!.id}`);
}

export async function discardIntake(orgId: string, intakeId: string) {
  const supabase = await createClient();
  await supabase.from("intakes").delete().eq("id", intakeId).eq("org_id", orgId);
  revalidatePath("/app");
  redirect("/app");
}

// Step 4: questions. Read-only; the answer is returned, nothing is stored.
export async function askMastiff(orgId: string, question: string): Promise<string> {
  const supabase = await createClient();
  const { data: ok } = await supabase.from("orgs").select("id").eq("id", orgId).maybeSingle();
  if (!ok) return "";
  const { ask } = await import("@/lib/ask");
  try { return await ask(supabase, orgId, question); }
  catch (e) { return "Mastiff could not answer that right now. (" + (e instanceof Error ? e.message.slice(0, 80) : "error") + ")"; }
}

// Step 4: the office takes over anything Mastiff did. A pass becomes a hold the desk works.
export async function askForALook(requestId: string, byName: string, form: FormData) {
  const supabase = await createClient();
  const why = String(form.get("why") ?? "").trim() || "The office asked for a look.";
  const { data: r } = await supabase.from("requests").select("reasons, status").eq("id", requestId).single();
  if (!r || ["released", "rejected"].includes(r.status)) return;
  await supabase.from("requests").update({ verdict: "hold", status: "open", reasons: [...(r.reasons as string[]), `${byName} asked Mastiff to check: ${why}`] }).eq("id", requestId);
  revalidatePath(`/app/requests/${requestId}`);
  revalidatePath("/app");
  revalidatePath("/desk");
}

// Step 5: the owner adopts what history suggests as the vendor's usual range.
export async function adoptPattern(orgId: string, vendorId: string, low: number, high: number) {
  const supabase = await createClient();
  if (!(high > 0) || low < 0 || low > high) return;
  await supabase.from("vendors").update({ usual_min: low || null, usual_max: high }).eq("id", vendorId).eq("org_id", orgId);
  revalidatePath("/app/vendors");
}

// Step 7: pull vendors and unpaid bills from QuickBooks. Owner only; read only.
export async function pullQuickBooks(orgId: string, byName: string) {
  const supabase = await createClient();
  const { pull } = await import("@/lib/qbo");
  let msg: string;
  try { msg = await pull(supabase, orgId, byName); }
  catch (e) { msg = "The pull did not finish: " + (e instanceof Error ? e.message.slice(0, 120) : "error"); }
  revalidatePath("/app"); revalidatePath("/app/vendors"); revalidatePath("/app/settings");
  redirect(`/app/settings?msg=${encodeURIComponent(msg)}`);
}

export async function disconnectQuickBooks(orgId: string) {
  const supabase = await createClient();
  await supabase.from("connections").delete().eq("org_id", orgId).eq("provider", "qbo");
  revalidatePath("/app/settings");
  redirect("/app/settings?qbo=disconnected");
}

// Step 8: instructions. Propose (model), the owner confirms, plain code applies.
export async function proposeInstruction(orgId: string, byName: string, form: FormData) {
  const supabase = await createClient();
  const text = String(form.get("text") ?? "").trim().slice(0, 400);
  if (!text) return;
  const { propose, summary } = await import("@/lib/instructions");
  const { data: vendors } = await supabase.from("vendors").select("id, name, name_key").eq("org_id", orgId);
  let proposal;
  try { proposal = await propose(text, vendors ?? []); }
  catch (e) { proposal = { kind: "unclear" as const, why: "Mastiff could not read that right now. (" + (e instanceof Error ? e.message.slice(0, 80) : "error") + ")" }; }
  await supabase.from("instructions").insert({ org_id: orgId, text, proposal, summary: summary(proposal), status: proposal.kind === "unclear" ? "unclear" : "proposed", asked_by: byName });
  revalidatePath("/app/instructions");
}

export async function decideInstruction(orgId: string, byName: string, id: string, confirm: boolean) {
  const supabase = await createClient();
  const { data: ins } = await supabase.from("instructions").select("proposal, status").eq("id", id).eq("org_id", orgId).maybeSingle();
  if (!ins || ins.status !== "proposed") return;
  if (confirm) {
    const p = ins.proposal as import("@/lib/instructions").Proposal;
    switch (p.kind) {
      case "vendor_pass_under": await supabase.from("vendors").update({ pass_under: p.amount }).eq("id", p.vendor_id).eq("org_id", orgId); break;
      case "vendor_usual_range": await supabase.from("vendors").update({ usual_min: p.min || null, usual_max: p.max }).eq("id", p.vendor_id).eq("org_id", orgId); break;
      case "vendor_phone": await supabase.from("vendors").update({ callback_phone: p.phone, phone_on_file_since: new Date().toISOString().slice(0, 10) }).eq("id", p.vendor_id).eq("org_id", orgId); break;
      case "vendor_note": await supabase.from("vendors").update({ instructions: p.note }).eq("id", p.vendor_id).eq("org_id", orgId); break;
      case "single_cap": await supabase.from("orgs").update({ single_cap: p.amount }).eq("id", orgId); break;
      case "range_multiple": await supabase.from("orgs").update({ range_multiple: p.multiple }).eq("id", orgId); break;
      case "hours": await supabase.from("orgs").update({ hours_start: p.start, hours_end: p.end }).eq("id", orgId); break;
    }
  }
  await supabase.from("instructions").update({ status: confirm ? "confirmed" : "declined", decided_by: byName, decided_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/app/instructions"); revalidatePath("/app"); revalidatePath("/app/vendors"); revalidatePath("/app/settings");
}

// Step 9: subcontractor register.
function dateOrNull(v: FormDataEntryValue | null) { const s = String(v ?? "").trim(); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null; }
export async function saveSub(orgId: string, vendorId: string, form: FormData) {
  const supabase = await createClient();
  const id = vendorId || String(form.get("vendor_id") ?? "");
  if (!id) return;
  const ai = String(form.get("additional_insured") ?? "");
  await supabase.from("vendors").update({
    is_sub: true, gl_expires: dateOrNull(form.get("gl_expires")), wc_expires: dateOrNull(form.get("wc_expires")),
    wc_exempt: String(form.get("wc_exempt")) === "yes", auto_expires: dateOrNull(form.get("auto_expires")),
    additional_insured: ai === "yes" ? true : ai === "no" ? false : null, waiver_through: dateOrNull(form.get("waiver_through")),
  }).eq("id", id).eq("org_id", orgId);
  revalidatePath("/app/subs");
}
export async function unmarkSub(orgId: string, vendorId: string) {
  const supabase = await createClient();
  await supabase.from("vendors").update({ is_sub: false }).eq("id", vendorId).eq("org_id", orgId);
  revalidatePath("/app/subs");
}
export async function importSubs(orgId: string, form: FormData) {
  const { parseRegister } = await import("@/lib/subs");
  const supabase = await createClient();
  const rows = parseRegister(String(form.get("csv") ?? ""));
  if (!rows.length) return;
  for (const r of rows) {
    await supabase.from("vendors").upsert({ org_id: orgId, name: r.name, name_key: nameKey(r.name), is_sub: true, gl_expires: r.gl_expires, wc_expires: r.wc_expires, wc_exempt: r.wc_exempt, auto_expires: r.auto_expires, additional_insured: r.additional_insured, waiver_through: r.waiver_through }, { onConflict: "org_id,name_key" });
  }
  revalidatePath("/app/subs"); revalidatePath("/app/vendors");
}

// The Mastiff thread (steps 4 and 8 in one place).
export async function sendMessage(orgId: string, byName: string, form: FormData) {
  const text = String(form.get("text") ?? "").trim().slice(0, 600);
  if (!text) return;
  const supabase = await createClient();
  const { data: ok } = await supabase.from("orgs").select("id").eq("id", orgId).maybeSingle();
  if (!ok) return;
  const { data: prior } = await supabase.from("messages").select("role, text").eq("org_id", orgId).order("created_at", { ascending: false }).limit(12);
  await supabase.from("messages").insert({ org_id: orgId, role: "user", by_name: byName, text });
  const { data: vendors } = await supabase.from("vendors").select("id, name, name_key").eq("org_id", orgId);
  const { converse } = await import("@/lib/ask");
  const { summary } = await import("@/lib/instructions");
  let reply = "", instructionId: string | null = null;
  try {
    const r = await converse(supabase, orgId, (prior ?? []).reverse() as { role: "user" | "mastiff"; text: string }[], text, vendors ?? []);
    reply = r.text;
    if (r.proposal) {
      const { data: ins } = await supabase.from("instructions").insert({ org_id: orgId, text, proposal: r.proposal, summary: summary(r.proposal), status: "proposed", asked_by: byName }).select("id").single();
      instructionId = ins?.id ?? null;
    }
  } catch (e) { reply = "I could not answer that right now. (" + (e instanceof Error ? e.message.slice(0, 80) : "error") + ")"; }
  await supabase.from("messages").insert({ org_id: orgId, role: "mastiff", text: reply, instruction_id: instructionId });
  revalidatePath("/app/chat");
}

export async function decideInThread(orgId: string, byName: string, instructionId: string, confirm: boolean) {
  await decideInstruction(orgId, byName, instructionId, confirm);
  const supabase = await createClient();
  const { data: ins } = await supabase.from("instructions").select("summary, status").eq("id", instructionId).maybeSingle();
  if (ins?.status === "confirmed") await supabase.from("messages").insert({ org_id: orgId, role: "mastiff", text: "Done. " + ins.summary });
  else if (ins?.status === "declined") await supabase.from("messages").insert({ org_id: orgId, role: "mastiff", text: "Left as it was. Nothing changed." });
  revalidatePath("/app/chat");
}

// The pilot form on the public site. No session; the leads table lets anyone insert and only staff read.
export async function submitLead(form: FormData) {
  if (String(form.get("website") ?? "")) redirect("/pilot?sent=1"); // honeypot: bots fill it, people never see it
  const { createClient: plain } = await import("@supabase/supabase-js");
  const db = plain(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const s = (k: string, n = 120) => String(form.get(k) ?? "").trim().slice(0, n).replace(/\d(?:[ -]?\d){7,}/g, (r) => "****" + r.replace(/\D/g, "").slice(-4));
  const name = s("name"), firm = s("firm"), email = s("email").toLowerCase(), phone = s("phone", 40);
  if (!name || !firm || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || phone.replace(/\D/g, "").length < 7) redirect("/pilot?err=1#form");
  const ppm = Number(s("payments_per_month", 6).replace(/\D/g, "")) || null;
  await db.from("leads").insert({ name, firm, email, phone, payments_per_month: ppm, note: s("note", 400) || null });
  redirect("/pilot?sent=1");
}
