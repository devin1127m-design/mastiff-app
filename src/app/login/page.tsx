"use client";
import { useEffect, useState } from "react";
import { sendSignInLink } from "@/lib/auth-actions";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // A sign-in link that lands here (or on the root) still carries its tokens in the hash. Hand them to the callback.
  useEffect(() => {
    if (/access_token=|error_description=/.test(window.location.hash)) window.location.replace("/auth/callback" + window.location.hash);
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const r = await sendSignInLink(email, window.location.origin);
    setBusy(false);
    if (!r.ok) setErr(r.message ?? "Could not send."); else setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="serif text-3xl mb-1">Mastiff</div>
        <p className="grey mb-8">Payment verification for small offices.</p>
        {sent ? (
          <div className="card space-y-3">
            <h2>Check your email</h2>
            <p>We sent a sign-in link to <strong>{email}</strong>. Open it on any device. It works once and expires in an hour.</p>
            <p className="grey text-sm">Not there in a minute? Check spam.</p>
            <button type="button" className="btn w-full" onClick={() => { setSent(false); setErr(null); }}>Use a different email</button>
          </div>
        ) : (
          <form onSubmit={send} className="space-y-4">
            <div className="field">
              <label htmlFor="email">Work email</label>
              <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              <div className="hint">No password. We email you a sign-in link each time.</div>
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
