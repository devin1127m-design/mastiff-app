"use server";

import { createClient } from "@/lib/supabase/server";
import { check, nameKey, type Vendor, type Org } from "@/lib/rules";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Send whatever notifications the database just queued. Best effort, never blocks the bookkeeper.
async function flush() {
  try { const { flushNotifications } = await import("@/lib/mail"); await flushNotifications(20); } catch { /* mail is optional */ }
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
    notes: String(form.get("notes") ?? "").trim() || null,
  }, { onConflict: "org_id,name_key" });
  revalidatePath("/app/vendors");
}

export async function importVendors(orgId: string, form: FormData) {
  const supabase = await createClient();
  const text = String(form.get("csv") ?? "");
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return;
  const header = lines[0].toLowerCase().split(",").map((h) => h.replace(/[^a-z0-9]/g, ""));
  const col = (names: string[]) => header.findIndex((h) => names.includes(h));
  const iName = col(["vendor", "name", "payee", "vendorname", "supplier"]);
  const iPhone = col(["phone", "callbackphone", "callback", "phonenumber"]);
  const iAcct = col(["last4", "accountlast4", "account", "acct", "accountnumber"]);
  if (iName < 0) return;
  const rows = lines.slice(1).map((l) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, ""))).filter((c) => c[iName]);
  const payload = rows.map((c) => ({
    org_id: orgId,
    name: c[iName],
    name_key: nameKey(c[iName]),
    callback_phone: iPhone >= 0 ? c[iPhone] || null : null,
    account_last4: iAcct >= 0 ? last4(c[iAcct]) : null,
  }));
  if (payload.length) await supabase.from("vendors").upsert(payload, { onConflict: "org_id,name_key" });
  revalidatePath("/app/vendors");
}

export async function deleteVendor(orgId: string, vendorId: string) {
  const supabase = await createClient();
  await supabase.from("vendors").delete().eq("id", vendorId).eq("org_id", orgId);
  revalidatePath("/app/vendors");
}

export async function submitRequest(orgId: string, submittedBy: string, form: FormData) {
  const supabase = await createClient();
  const { data: org } = await supabase.from("orgs").select("single_cap, range_multiple, hours_start, hours_end").eq("id", orgId).single();
  const { data: vendors } = await supabase.from("vendors").select("id, name, name_key, account_last4, usual_min, usual_max").eq("org_id", orgId);
  const input = {
    payee: String(form.get("payee") ?? "").trim(),
    amount: money(form.get("amount")),
    account_last4: last4(form.get("account_last4")),
    note: String(form.get("note") ?? "").trim() || null,
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
    who_answered: String(form.get("who_answered") ?? "").trim() || null,
    what_said: String(form.get("what_said") ?? "").trim() || null,
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
  await supabase.from("decisions").insert({
    request_id: requestId,
    decided_by: decidedBy,
    decision,
    note: String(form.get("note") ?? "").trim() || null,
  });
  await supabase.from("requests").update({ status: decision === "reject" ? "rejected" : "released" }).eq("id", requestId);
  revalidatePath(`/app/requests/${requestId}`);
  revalidatePath("/app");
  revalidatePath("/desk");
}

export async function saveSettings(orgId: string, form: FormData) {
  const supabase = await createClient();
  await supabase.from("orgs").update({
    single_cap: money(form.get("single_cap")) || 5000,
    range_multiple: Number(form.get("range_multiple")) || 2,
    hours_start: Number(form.get("hours_start")),
    hours_end: Number(form.get("hours_end")),
  }).eq("id", orgId);
  revalidatePath("/app/settings");
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
  const org_id = String(form.get("org_id") ?? "");
  const role = String(form.get("role") ?? "bookkeeper");
  const name = String(form.get("name") ?? "").trim();
  if (!email || !org_id || !name) return;
  await supabase.from("invites").upsert({ email, org_id, role, name }, { onConflict: "email,org_id" });
  revalidatePath("/desk");
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
    const { data: org } = await supabase.from("orgs").select("single_cap, range_multiple, hours_start, hours_end").eq("id", orgId).single();
    const { data: vendors } = await supabase.from("vendors").select("id, name, name_key, account_last4, usual_min, usual_max").eq("org_id", orgId);
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
