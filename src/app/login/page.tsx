"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: true } });
    setBusy(false);
    if (error) setErr(error.message.includes("seconds") ? "Give it a minute, then try again." : error.message);
    else setStage("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.replace(/\D/g, ""), type: "email" });
    if (error) { setBusy(false); setErr("That code didn't work. Check it or request a new one."); return; }
    await supabase.rpc("claim_invites");
    const { data: staff } = await supabase.from("staff").select("user_id").maybeSingle();
    window.location.href = staff ? "/desk" : "/app";
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="serif text-3xl mb-1">Mastiff</div>
        <p className="grey mb-8">Payment verification for small offices.</p>
        {stage === "email" ? (
          <form onSubmit={sendCode} className="space-y-4">
            <div className="field">
              <label htmlFor="email">Work email</label>
              <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              <div className="hint">No password. We email you a 6-digit code.</div>
            </div>
            {err && <p className="text-sm">{err}</p>}
            <button className="btn fill w-full" disabled={busy}>{busy ? "Sending…" : "Email me a code"}</button>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-4">
            <div className="field">
              <label htmlFor="code">Enter the code we sent to {email}</label>
              <input id="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]*" maxLength={8} required value={code} onChange={(e) => setCode(e.target.value)} autoFocus className="tracking-widest text-xl" />
              <div className="hint">Check spam if it is not there in a minute. The code works on any device.</div>
            </div>
            {err && <p className="text-sm">{err}</p>}
            <button className="btn fill w-full" disabled={busy}>{busy ? "Checking…" : "Sign in"}</button>
            <button type="button" className="btn w-full" onClick={() => { setStage("email"); setCode(""); setErr(null); }}>Use a different email</button>
          </form>
        )}
        <p className="advisory mt-8">Mastiff flags. Your firm makes every payment decision.</p>
      </div>
    </div>
  );
}
