import { LocalScan } from "@/components/LocalScan";
export const metadata = { title: "Scan your own payments · Mastiff", description: "Run the Mastiff look-back on your own payment export, in your browser. Nothing is uploaded." };
export default function Scan() {
  return (
    <>
      <section className="wrap hero">
        <p className="eyebrow">Scan it yourself</p>
        <h1 className="display">Your payments never leave this page.</h1>
        <p className="lead">Pick your last 12 to 18 months of payments. The scan runs in your browser: what would have held, what looks paid twice, what went to late fees. No account, no upload, and nothing for us to see. Turn your wifi off first if you want to be sure.</p>
      </section>
      <section className="wrap band">
        <LocalScan />
      </section>
    </>
  );
}
