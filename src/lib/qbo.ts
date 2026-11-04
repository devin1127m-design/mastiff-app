// Step 7: QuickBooks Online, read only. OAuth with the owner's own login; vendors
// and unpaid bills pulled in; nothing written back, ever. The only calls made are
// the token exchange and `query`. There is no code path that POSTs to the company.
//
// Env: QBO_CLIENT_ID, QBO_CLIENT_SECRET, QBO_ENV ("sandbox" or "production").

import type { SupabaseClient } from "@supabase/supabase-js";
import { check, nameKey, type Vendor, type Org } from "@/lib/rules";

export const qboConfigured = () => !!process.env.QBO_CLIENT_ID && !!process.env.QBO_CLIENT_SECRET;
const API = () => (process.env.QBO_ENV === "production" ? "https://quickbooks.api.intuit.com" : "https://sandbox-quickbooks.api.intuit.com");
const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const MINOR = 75;

export function authorizeUrl(redirectUri: string, state: string): string {
  const u = new URL("https://appcenter.intuit.com/connect/oauth2");
  u.searchParams.set("client_id", process.env.QBO_CLIENT_ID!);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "com.intuit.quickbooks.accounting");
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("state", state);
  return u.toString();
}

type Tokens = { access_token: string; refresh_token: string; expires_in: number; x_refresh_token_expires_in: number };

async function tokenCall(body: Record<string, string>): Promise<Tokens> {
  const basic = Buffer.from(`${process.env.QBO_CLIENT_ID}:${process.env.QBO_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(TOKEN_URL, { method: "POST", headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body: new URLSearchParams(body) });
  if (!res.ok) throw new Error(`QuickBooks token ${res.status}: ${(await res.text()).slice(0, 120)}`);
  return res.json();
}
export const exchangeCode = (code: string, redirectUri: string) => tokenCall({ grant_type: "authorization_code", code, redirect_uri: redirectUri });
export const refresh = (refreshToken: string) => tokenCall({ grant_type: "refresh_token", refresh_token: refreshToken });

type Conn = { org_id: string; realm_id: string; access_token: string; refresh_token: string; expires_at: string };

async function freshToken(supabase: SupabaseClient, c: Conn): Promise<string> {
  if (new Date(c.expires_at).getTime() - Date.now() > 120000) return c.access_token;
  const t = await refresh(c.refresh_token);
  await supabase.from("connections").update({
    access_token: t.access_token, refresh_token: t.refresh_token,
    expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString(),
    refresh_expires_at: new Date(Date.now() + t.x_refresh_token_expires_in * 1000).toISOString(),
  }).eq("org_id", c.org_id).eq("provider", "qbo");
  return t.access_token;
}

async function query<T>(token: string, realm: string, q: string, key: string): Promise<T[]> {
  const u = `${API()}/v3/company/${realm}/query?query=${encodeURIComponent(q)}&minorversion=${MINOR}`;
  const res = await fetch(u, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
  if (!res.ok) throw new Error(`QuickBooks ${res.status}: ${(await res.text()).slice(0, 120)}`);
  const j = await res.json() as { QueryResponse?: Record<string, T[]> };
  return j.QueryResponse?.[key] ?? [];
}

type QVendor = { Id: string; DisplayName: string; PrimaryPhone?: { FreeFormNumber?: string }; Active?: boolean };
type QBill = { Id: string; VendorRef?: { value: string; name?: string }; TotalAmt: number; Balance: number; DueDate?: string; TxnDate?: string; DocNumber?: string; PrivateNote?: string };

// Pull vendors and unpaid bills for one office. Returns a plain-words result for the settings page.
export async function pull(supabase: SupabaseClient, orgId: string, byName: string): Promise<string> {
  const { data: c } = await supabase.from("connections").select("org_id, realm_id, access_token, refresh_token, expires_at").eq("org_id", orgId).eq("provider", "qbo").maybeSingle();
  if (!c) return "QuickBooks is not connected.";
  const token = await freshToken(supabase, c as Conn);
  const [qv, qb] = await Promise.all([
    query<QVendor>(token, c.realm_id, "select Id, DisplayName, PrimaryPhone, Active from Vendor maxresults 1000", "Vendor"),
    query<QBill>(token, c.realm_id, "select * from Bill where Balance > '0' orderby TxnDate desc maxresults 500", "Bill"),
  ]);

  // Vendors: add the ones not on file. Never overwrite a phone or last four the office already has.
  const { data: existing } = await supabase.from("vendors").select("id, name, name_key, account_last4, usual_min, usual_max, callback_phone").eq("org_id", orgId);
  const have = new Map((existing ?? []).map((v) => [v.name_key, v]));
  let added = 0, phones = 0;
  for (const v of qv) {
    if (v.Active === false || !v.DisplayName) continue;
    const key = nameKey(v.DisplayName);
    const phone = v.PrimaryPhone?.FreeFormNumber?.trim() || null;
    const cur = have.get(key);
    if (!cur) {
      const { data: row } = await supabase.from("vendors").insert({ org_id: orgId, name: v.DisplayName, name_key: key, callback_phone: phone, phone_on_file_since: phone ? new Date().toISOString().slice(0, 10) : null, notes: "From QuickBooks" }).select("id, name, name_key, account_last4, usual_min, usual_max, callback_phone").single();
      if (row) { have.set(key, row); added++; }
    } else if (!cur.callback_phone && phone) {
      await supabase.from("vendors").update({ callback_phone: phone, phone_on_file_since: new Date().toISOString().slice(0, 10) }).eq("id", cur.id);
      cur.callback_phone = phone; phones++;
    }
  }

  // Bills: each unpaid bill not seen before becomes a request, checked like any other.
  const { data: org } = await supabase.from("orgs").select("single_cap, range_multiple, hours_start, hours_end").eq("id", orgId).single();
  const vendors = [...have.values()] as Vendor[];
  const { data: seen } = await supabase.from("requests").select("external_id").eq("org_id", orgId).like("external_id", "qbo:%");
  const seenIds = new Set((seen ?? []).map((r) => r.external_id));
  let bills = 0, held = 0;
  for (const b of qb) {
    const ext = `qbo:${c.realm_id}:${b.Id}`;
    if (seenIds.has(ext) || !b.VendorRef?.name || !(b.Balance > 0)) continue;
    const input = { payee: b.VendorRef.name, amount: Math.round(b.Balance * 100) / 100, account_last4: null, note: b.PrivateNote ?? null, submittedAt: new Date() };
    const v = check(input, vendors, org as Org);
    const { error } = await supabase.from("requests").insert({
      org_id: orgId, payee: input.payee, amount: input.amount, account_last4: null, invoice_no: b.DocNumber ?? null, note: input.note,
      source: "qbo", submitted_by: `QuickBooks (pulled by ${byName})`, verdict: v.verdict, reasons: v.reasons, cautions: v.cautions,
      vendor_id: v.vendor?.id ?? null, status: v.verdict === "pass" ? "passed" : "open", external_id: ext, due_date: b.DueDate ?? null,
    });
    if (!error) { bills++; if (v.verdict === "hold") held++; }
  }
  const result = `Pulled ${qv.length} vendors (${added} added, ${phones} phones filled in) and ${qb.length} unpaid bills (${bills} new, ${held} would hold). Nothing was written to QuickBooks.`;
  await supabase.from("connections").update({ last_pulled_at: new Date().toISOString(), last_result: result }).eq("org_id", orgId).eq("provider", "qbo");
  return result;
}
