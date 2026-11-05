import { Shell } from "@/components/Shell";
import { requireOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { sendMessage, decideInThread } from "@/lib/actions";
import { ChatForm } from "@/components/ChatForm";

export default async function Chat() {
  const { session, org, role, myName } = await requireOrg();
  const supabase = await createClient();
  const { data: msgs } = await supabase.from("messages").select("id, role, by_name, text, instruction_id, created_at").eq("org_id", org.id).order("created_at").limit(200);
  const insIds = (msgs ?? []).map((m) => m.instruction_id).filter((x): x is string => !!x);
  const { data: ins } = insIds.length ? await supabase.from("instructions").select("id, status, decided_by").in("id", insIds) : { data: [] };
  const insById = new Map((ins ?? []).map((i) => [i.id, i]));
  const canDecide = role === "owner" || role === "approver" || session.isStaff;
  const day = (s: string) => new Date(s).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const time = (s: string) => new Date(s).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  let lastDay = "";
  return (
    <Shell session={session} orgName={org.name}>
      <div className="max-w-2xl mx-auto flex flex-col" style={{ minHeight: "calc(100vh - 12rem)" }}>
        <div className="mb-3">
          <h1>Mastiff</h1>
          <p className="grey text-sm">Ask about your own records, or tell it how your office pays. It reads; a person confirms anything that changes.</p>
        </div>
        <div className="flex-1 space-y-2">
          {msgs && msgs.length ? msgs.map((m) => {
            const d = day(m.created_at); const showDay = d !== lastDay; lastDay = d;
            const i = m.instruction_id ? insById.get(m.instruction_id) : null;
            return (
              <div key={m.id}>
                {showDay && <div className="grey text-xs text-center my-3">{d}</div>}
                <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`bubble ${m.role}`}>
                    <div className="whitespace-pre-wrap">{m.text}</div>
                    {i && i.status === "proposed" && canDecide && (
                      <div className="flex gap-2 mt-3">
                        <form action={decideInThread.bind(null, org.id, myName, i.id, true)}><button className="btn small fill">Confirm</button></form>
                        <form action={decideInThread.bind(null, org.id, myName, i.id, false)}><button className="btn small">Leave it</button></form>
                      </div>
                    )}
                    {i && i.status === "proposed" && !canDecide && <div className="text-xs mt-2 opacity-70">Waiting for the owner to confirm.</div>}
                    {i && i.status === "confirmed" && <div className="text-xs mt-2 opacity-70">Confirmed by {i.decided_by}</div>}
                    {i && i.status === "declined" && <div className="text-xs mt-2 opacity-70">Declined by {i.decided_by}</div>}
                    <div className="text-[11px] mt-1 opacity-60">{m.role === "user" ? m.by_name : "Mastiff"} · {time(m.created_at)}</div>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="grey text-sm space-y-1 mt-6">
              <p>Try one:</p>
              <p>"Why did the last one hold?"</p>
              <p>"What have we paid Ray's Drywall this year?"</p>
              <p>"Which vendors aren't verified yet?"</p>
              <p>"Always pass Metro Fasteners under $500."</p>
            </div>
          )}
          <div id="bottom" />
        </div>
        <ChatForm action={sendMessage.bind(null, org.id, myName)} />
      </div>
    </Shell>
  );
}
