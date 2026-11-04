// Shows the invoice attached to a request, from the private bucket, via a short-lived link.
import { createClient } from "@/lib/supabase/server";

export async function InvoiceImage({ path, caption }: { path: string; caption?: string }) {
  const supabase = await createClient();
  const { data } = await supabase.storage.from("invoices").createSignedUrl(path, 600);
  if (!data?.signedUrl) return <div className="card grey text-sm">The invoice image could not be loaded.</div>;
  const isPdf = path.endsWith(".pdf");
  return (
    <figure className="border border-black rounded-[2px] overflow-hidden">
      {isPdf
        ? <iframe src={data.signedUrl} title="Invoice" className="w-full h-[70vh] bg-white" />
        /* eslint-disable-next-line @next/next/no-img-element */
        : <img src={data.signedUrl} alt="Invoice" className="w-full block" />}
      <figcaption className="advisory px-3 py-2 border-t hair">{caption ?? "The invoice as it arrived. Compare it with the fields."}{isPdf && <> <a href={data.signedUrl} target="_blank" rel="noreferrer" className="underline">Open</a></>}</figcaption>
    </figure>
  );
}
