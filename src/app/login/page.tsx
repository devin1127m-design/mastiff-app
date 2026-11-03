"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) setErr(error.message); else setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="serif text-3xl mb-1">Mastiff</div>
        <p className="grey mb-8">Payment verification for small offices.</p>
        {sent ? (
          <div className="card">
            <h2 className="mb-2">Check your email</h2>
            <p>We sent a sign-in link to <strong>{email}</strong>. Open it on this device.</p>
          </div>
        ) : (
          <form onSubmit={send} className="space-y-4">
            <div className="field">
              <label htmlFor="email">Work email</label>
              <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              <div className="hint">No password. We email you a link each time.</div>
            </div>
            {err && <p className="text-sm">{err}</p>}
            <button className="btn fill w-full" disabled={busy}>{busy ? "Sending…" : "Send sign-in link"}</button>
          </form>
        )}
        <p className="advisory mt-8">Mastiff flags. Your firm makes every payment decision.</p>
      </div>
    </div>
  );
}
