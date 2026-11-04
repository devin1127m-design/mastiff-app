// Step 4: questions. "Why did this hold?" "What did we pay Pinecrest this year?"
// The model is handed the office's own tables, read-only, and answers in plain
// words. It changes nothing. Per-office data goes in the prompt for this one
// answer and is kept nowhere else.

import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MODEL } from "@/lib/intake";

const SYSTEM = `You answer questions for one small office about its own accounts payable, using only the records provided. You are Mastiff's desk.
Rules:
- Answer in plain words, short, like a careful bookkeeper. Give amounts with dollar signs and dates as "Nov 4".
- Use only the records given. If they do not contain the answer, say what is missing. Never guess a number.
- Never use the words fraud, scam, caught, prevented or saved. Say "would have held", "worth checking", "missing".
- A hold is a prompt to check, never a finding. The office makes every payment decision; never tell them what to pay.
- Never reveal more than the last four digits of any account.
- You cannot change anything. If asked to change a setting, a vendor or a rule, say that the owner does that on the Settings or Vendors page.`;

export async function gatherContext(supabase: SupabaseClient, orgId: string): Promise<string> {
  const since = new Date(Date.now() - 400 * 86400000).toISOString();
  const [{ data: org }, { data: vendors }, { data: reqs }, { data: lbs }] = await Promise.all([
    supabase.from("orgs").select("name, single_cap, range_multiple, hours_start, hours_end").eq("id", orgId).single(),
    supabase.from("vendors").select("name, callback_phone, phone_on_file_since, account_last4, usual_min, usual_max, verified_at, verified_by, notes").eq("org_id", orgId).order("name"),
    supabase.from("requests").select("id, payee, amount, invoice_no, account_last4, source, submitted_by, verdict, reasons, cautions, status, straight_through, created_at, callbacks(called_at, number_called, who_answered, what_said, outcome, by_name), decisions(decided_at, decided_by, decision, note)").eq("org_id", orgId).gte("created_at", since).order("created_at", { ascending: false }).limit(400),
    supabase.from("lookbacks").select("filename, created_at, payments, months, held, need_call, money").eq("org_id", orgId).order("created_at", { ascending: false }).limit(3),
  ]);
  const parts = [
    `Today: ${new Date().toISOString().slice(0, 10)}`,
    `Office settings: ${JSON.stringify(org)}`,
    `Vendors on file (${vendors?.length ?? 0}): ${JSON.stringify(vendors ?? [])}`,
    `Payment requests, newest first (${reqs?.length ?? 0}, up to 400 from the last 13 months): ${JSON.stringify(reqs ?? [])}`,
    `Look-back scans: ${JSON.stringify((lbs ?? []).map((l) => ({ ...l, money: (l.money as { total?: number; summary?: string })?.summary })))}`,
  ];
  return parts.join("\n\n").slice(0, 150000);
}

export async function ask(supabase: SupabaseClient, orgId: string, question: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return "Questions are not switched on for this desk yet.";
  const q = question.trim().slice(0, 500);
  if (!q) return "";
  const context = await gatherContext(supabase, orgId);
  const client = new Anthropic();
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 700,
    system: SYSTEM,
    messages: [{ role: "user", content: `Records for this office:\n\n${context}\n\nQuestion: ${q}` }],
  });
  return res.content.filter((c) => c.type === "text").map((c) => (c as { text: string }).text).join("\n").trim();
}
