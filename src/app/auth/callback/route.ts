import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const supabase = await createClient();
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  } else if (token_hash && type) {
    await supabase.auth.verifyOtp({ token_hash, type: type as "magiclink" | "email" });
  }
  const { data: staff } = await supabase.from("staff").select("user_id").maybeSingle();
  return NextResponse.redirect(`${origin}${staff ? "/desk" : "/app"}`);
}
