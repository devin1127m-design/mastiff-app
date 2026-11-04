// Step 7: send the owner to Intuit to sign in with their own login.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { authorizeUrl, qboConfigured } from "@/lib/qbo";

export async function GET(req: Request) {
  if (!qboConfigured()) return NextResponse.redirect(new URL("/app/settings?qbo=notconfigured", req.url));
  const orgId = new URL(req.url).searchParams.get("org") ?? "";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));
  const { data: m } = await supabase.from("memberships").select("role").eq("user_id", user.id).eq("org_id", orgId).maybeSingle();
  if (m?.role !== "owner") return NextResponse.redirect(new URL("/app/settings?qbo=owneronly", req.url));
  const state = crypto.randomUUID();
  const jar = await cookies();
  jar.set("qbo_state", `${state}:${orgId}`, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  const origin = new URL(req.url).origin;
  return NextResponse.redirect(authorizeUrl(`${origin}/api/qbo/callback`, state));
}
