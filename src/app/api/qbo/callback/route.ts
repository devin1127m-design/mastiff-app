// Step 7: Intuit sends the owner back here. Exchange the code, store the tokens for this office.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { exchangeCode } from "@/lib/qbo";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const code = u.searchParams.get("code"), state = u.searchParams.get("state"), realm = u.searchParams.get("realmId");
  const jar = await cookies();
  const saved = jar.get("qbo_state")?.value ?? "";
  jar.delete("qbo_state");
  const [expected, orgId] = saved.split(":");
  if (!code || !state || !realm || state !== expected || !orgId) return NextResponse.redirect(new URL("/app/settings?qbo=failed", req.url));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));
  const { data: m } = await supabase.from("memberships").select("role, name").eq("user_id", user.id).eq("org_id", orgId).maybeSingle();
  if (m?.role !== "owner") return NextResponse.redirect(new URL("/app/settings?qbo=owneronly", req.url));
  try {
    const t = await exchangeCode(code, `${u.origin}/api/qbo/callback`);
    const { error } = await supabase.from("connections").upsert({
      org_id: orgId, provider: "qbo", realm_id: realm, access_token: t.access_token, refresh_token: t.refresh_token,
      expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString(),
      refresh_expires_at: new Date(Date.now() + t.x_refresh_token_expires_in * 1000).toISOString(),
      connected_by: m.name,
    }, { onConflict: "org_id,provider" });
    if (error) throw error;
  } catch {
    return NextResponse.redirect(new URL("/app/settings?qbo=failed", req.url));
  }
  return NextResponse.redirect(new URL("/app/settings?qbo=connected", req.url));
}
