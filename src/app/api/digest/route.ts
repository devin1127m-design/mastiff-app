// The Monday digest. One note per person per office covering the last seven days.
import { NextResponse } from "next/server";
import { plainClient, SECRET, composeDigest, flushNotifications } from "@/lib/mail";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!SECRET()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const db = plainClient();
  const { data: people, error } = await db.rpc("digest_recipients", { p_secret: SECRET() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const counts = new Map<string, Parameters<typeof composeDigest>[2]>();
  let queued = 0;
  for (const p of (people ?? []) as { org_id: string; org_name: string; email: string; name: string }[]) {
    if (!counts.has(p.org_id)) {
      const { data: c } = await db.rpc("digest_counts", { p_secret: SECRET(), p_org: p.org_id, p_since: since });
      counts.set(p.org_id, c as Parameters<typeof composeDigest>[2]);
    }
    const { subject, body } = composeDigest(p.org_name, p.name, counts.get(p.org_id)!);
    const { error: qe } = await db.rpc("notifications_queue", { p_secret: SECRET(), p_org: p.org_id, p_kind: "digest", p_to: p.email, p_subject: subject, p_body: body });
    if (!qe) queued++;
  }
  const flushed = await flushNotifications(200);
  return NextResponse.json({ queued, ...flushed });
}
