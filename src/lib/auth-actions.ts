"use server";
import { createClient as createPlain } from "@supabase/supabase-js";

// Sends the sign-in link using the implicit flow, so the link works on any device,
// not only the one that asked for it. The callback page reads the tokens from the URL.
export async function sendSignInLink(email: string, origin: string): Promise<{ ok: boolean; message?: string }> {
  const supabase = createPlain(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: true, emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) return { ok: false, message: error.message.includes("seconds") ? "Give it a minute, then try again." : error.message };
  return { ok: true };
}
