// The same read-out without the app shell, for printing or saving as PDF.
import ReadoutPage from "../page";

export default async function PrintReadout(props: { searchParams: Promise<{ from?: string; to?: string }> }) {
  return <div className="print-page">{await ReadoutPage(props)}</div>;
}
