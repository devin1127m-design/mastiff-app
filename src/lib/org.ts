import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSession, type Session } from "@/components/Shell";

export async function requireOrg(orgId?: string) {
  const session = await getSession();
  const chosen = orgId ?? (await cookies()).get("mastiff_org")?.value;
  const m = (chosen && session.memberships.find((x) => x.org_id === chosen)) || session.memberships[0];
  if (!m) {
    if (session.isStaff) redirect("/desk");
    redirect("/login?noorg=1");
  }
  return { session, org: m.orgs, role: m.role, myName: m.name };
}

export function fmtMoney(n: number | string) {
  return "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
// All offices are in Michigan for now; shown times use that zone, not the server's (UTC).
export const TZ = "America/Detroit";
export function fmtDate(s: string) {
  return new Date(s).toLocaleString("en-US", { timeZone: TZ, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
export const STATUS_LABEL: Record<string, string> = {
  passed: "Passed", open: "Hold, open", confirmed: "Confirmed by callback", not_confirmed: "Not confirmed",
  released: "Released by office", rejected: "Rejected by office",
};
export type { Session };
