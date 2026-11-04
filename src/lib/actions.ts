"use server";

import { createClient } from "@/lib/supabase/server";
import { check, nameKey, type Vendor, type Org } from "@/lib/rules";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
  const { data: row } = await supabase.from("requests").insert({
    org_id: orgId,
    payee: input.payee,
    amount: input.amount,
    account_last4: input.account_last4,
    invoice_no: String(form.get("invoice_no") ?? "").trim() || null,
    note: input.note,
    source: "form",
    submitted_by: submittedBy,
    verdict: v.verdict,
    reasons: v.reasons,
    cautions: v.cautions,
    vendor_id: v.vendor?.id ?? null,
    status: v.verdict === "pass" ? "passed" : "open",
  }).select("id").single();
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
