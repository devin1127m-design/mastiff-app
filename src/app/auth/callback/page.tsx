"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Callback() {
  const [msg, setMsg] = useState("Signing you in…");
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const query = new URLSearchParams(window.location.search);
      const access_token = hash.get("access_token");
      const refresh_token = hash.get("refresh_token");
      const code = query.get("code");
      let ok = false;
      if (access_token && refresh_token) {
        ok = !(await supabase.auth.setSession({ access_token, refresh_token })).error;
      } else if (code) {
        ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
      } else if (hash.get("error_description") || query.get("error_description")) {
        setMsg("That link has expired or was already used. Request a new one.");
        return;
      }
      if (!ok) { setMsg("That link didn't work. Request a new one."); return; }
      await supabase.rpc("claim_invites");
      const { data: staff } = await supabase.from("staff").select("user_id").maybeSingle();
      window.history.replaceState(null, "", "/auth/callback");
      window.location.replace(staff ? "/desk" : "/app");
    })();
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="serif text-3xl mb-4">Mastiff</div>
        <p>{msg}</p>
        {msg.includes("new one") && <a href="/login" className="btn mt-4">Back to sign in</a>}
      </div>
    </div>
  );
}
