"use client";

// The question box. Ask about the office's own records; the answer changes nothing.
import { useActionState } from "react";
import { askMastiff } from "@/lib/actions";

const EXAMPLES = ["Why did the last one hold?", "What did the callback say?", "What have we paid Ray's Drywall this year?", "Which vendors are not verified yet?"];

export function AskBox({ orgId }: { orgId: string }) {
  const [state, action, pending] = useActionState(
    async (_prev: { q: string; a: string }, form: FormData) => {
      const q = String(form.get("q") ?? "");
      const a = await askMastiff(orgId, q);
      return { q, a };
    },
    { q: "", a: "" },
  );
  return (
    <div className="card">
      <h2 className="mb-1">Ask Mastiff</h2>
      <p className="grey text-sm mb-3">About your own records only. It reads; it never changes anything.</p>
      <form action={action} className="flex gap-2">
        <input name="q" required maxLength={500} placeholder={EXAMPLES[0]} className="flex-1 border border-black rounded-[2px] px-3 min-h-10" list="ask-examples" />
        <datalist id="ask-examples">{EXAMPLES.map((e) => <option key={e} value={e} />)}</datalist>
        <button className="btn fill" disabled={pending}>{pending ? "Reading" : "Ask"}</button>
      </form>
      {state.a && (
        <div className="mt-4 border-t hair pt-3">
          <p className="grey text-sm mb-1">{state.q}</p>
          <p className="whitespace-pre-wrap">{state.a}</p>
        </div>
      )}
    </div>
  );
}
