"use client";

// Take a photo or pick a file, shrink a photo on the phone, upload it straight
// to the private bucket, then hand the path to the server to read and check.

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { startIntake } from "@/lib/actions";

const MAX_EDGE = 1800;

async function shrink(file: File): Promise<{ blob: Blob; ext: string }> {
  if (file.type === "application/pdf") return { blob: file, ext: "pdf" };
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.86));
  if (!blob) throw new Error("could not process the photo");
  return { blob, ext: "jpg" };
}

export function InvoiceUpload({ orgId, byName }: { orgId: string; byName: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(file: File | undefined, source: "photo" | "upload") {
    if (!file) return;
    setError(null);
    try {
      setBusy("Preparing");
      const { blob, ext } = await shrink(file);
      if (blob.size > 15 * 1024 * 1024) throw new Error("That file is over 15 MB.");
      setBusy("Uploading");
      const path = `${orgId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await createClient().storage.from("invoices").upload(path, blob, { contentType: ext === "pdf" ? "application/pdf" : "image/jpeg" });
      if (upErr) throw new Error(upErr.message);
      setBusy("Reading");
      await startIntake(orgId, byName, path, source); // redirects
    } catch (e) {
      setBusy(null);
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  return (
    <div className="card max-w-lg space-y-3">
      <h2>Send Mastiff the invoice</h2>
      <p className="grey text-sm">Take a picture or pick a PDF. Mastiff reads it, checks it, and fills in the request. If it is a vendor on file for a usual amount, it goes straight into your pay run; you confirm it when you pay.</p>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onPick(e.target.files?.[0], "photo")} />
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => onPick(e.target.files?.[0], "upload")} />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn fill" disabled={!!busy} onClick={() => cameraRef.current?.click()}>{busy ?? "Take a photo"}</button>
        <button type="button" className="btn" disabled={!!busy} onClick={() => fileRef.current?.click()}>Upload a file</button>
      </div>
      {error && <p className="text-sm">{error}</p>}
      <p className="advisory">The picture stays with the request so whoever pays sees it beside the numbers. Only the last four digits of any account are kept from it.</p>
    </div>
  );
}
