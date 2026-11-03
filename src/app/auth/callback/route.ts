import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Kept for links clicked on the same device. The 6-digit code on /login is the main path.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const supabase = await createClient();
  let ok = false;
  if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  else if (token_hash && type) ok = !(await supabase.auth.verifyOtp({ token_hash, type: type as "magiclink" | "email" })).error;
  if (!ok) return NextResponse.redirect(`${origin}/login?expired=1`);
  await supabase.rpc("claim_invites");
  const { data: staff } = await supabase.from("staff").select("user_id").maybeSingle();
  return NextResponse.redirect(`${origin}${staff ? "/desk" : "/app"}`);
}
