import { redirect } from "next/navigation";
import { getSession, type Session } from "@/components/Shell";

export async function requireOrg(orgId?: string) {
  const session = await getSession();
  const m = (orgId && session.memberships.find((x) => x.org_id === orgId)) || session.memberships[0];
  if (!m) {
    if (session.isStaff) redirect("/desk");
    redirect("/login?noorg=1");
  }
  return { session, org: m.orgs, role: m.role, myName: m.name };
}

export function fmtMoney(n: number | string) {
  return "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export function fmtDate(s: string) {
  return new Date(s).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
export const STATUS_LABEL: Record<string, string> = {
  passed: "Passed", open: "Hold, open", confirmed: "Confirmed by callback", not_confirmed: "Not confirmed",
  released: "Released by office", rejected: "Rejected by office",
};
export type { Session };
