"use client";

// The text box at the bottom of the Mastiff thread. Stays put on the phone, clears after send.
import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

function Send() {
  const { pending } = useFormStatus();
  return <button className="btn fill" disabled={pending}>{pending ? "…" : "Send"}</button>;
}

export function ChatForm({ action }: { action: (form: FormData) => Promise<void> }) {
  const ref = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { document.getElementById("bottom")?.scrollIntoView({ block: "end" }); }, []);
  return (
    <form ref={ref} action={async (fd) => { await action(fd); ref.current?.reset(); input.current?.focus(); setTimeout(() => document.getElementById("bottom")?.scrollIntoView({ behavior: "smooth", block: "end" }), 50); }}
      className="sticky bottom-0 bg-white pt-3 pb-2 mt-4 flex gap-2 border-t hair">
      <input ref={input} name="text" required maxLength={600} autoComplete="off" placeholder="Text Mastiff" className="flex-1 border border-black rounded-[2px] px-3 min-h-11" />
      <Send />
    </form>
  );
}
