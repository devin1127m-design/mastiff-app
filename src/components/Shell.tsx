import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type Session = {
  userId: string;
  email: string;
  isStaff: boolean;
  staffName: string | null;
  isPartner: boolean;
  memberships: { org_id: string; role: string; name: string; orgs: { id: string; name: string; slug: string; inbound_email: string; single_cap: number; range_multiple: number; hours_start: number; hours_end: number } }[];
};

export async function getSession(): Promise<Session> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: staff }, { data: memberships }, { data: pm }] = await Promise.all([
    supabase.from("staff").select("name").eq("user_id", user.id).maybeSingle(),
    supabase.from("memberships").select("org_id, role, name, orgs(id, name, slug, inbound_email, single_cap, range_multiple, hours_start, hours_end)").eq("user_id", user.id),
    supabase.from("partner_members").select("partner_id, name").eq("user_id", user.id),
  ]);
  const ms = (memberships ?? []) as unknown as Session["memberships"];
  // A partner firm's people work each client office as its bookkeeper (step 10).
  if (pm && pm.length) {
    const { data: porgs } = await supabase.from("orgs").select("id, name, slug, inbound_email, single_cap, range_multiple, hours_start, hours_end, partner_id").in("partner_id", pm.map((p) => p.partner_id));
    for (const o of porgs ?? []) if (!ms.some((m) => m.org_id === o.id)) ms.push({ org_id: o.id, role: "bookkeeper", name: pm.find((p) => p.partner_id === o.partner_id)?.name ?? user.email ?? "", orgs: o });
  }
  return {
    userId: user.id,
    email: user.email ?? "",
    isStaff: !!staff,
    staffName: staff?.name ?? null,
    isPartner: !!(pm && pm.length),
    memberships: ms,
  };
}

export function Shell({ session, orgName, children }: { session: Session; orgName?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-black">
        <div className="mx-auto max-w-5xl px-4 min-h-14 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <Link href={session.isStaff ? "/desk" : "/app"} className="serif text-xl no-underline">Mastiff</Link>
            {orgName && <span className="grey text-sm hidden sm:inline">{orgName}{session.memberships.length > 1 && <> · {session.memberships.filter((m) => m.orgs.name !== orgName).slice(0, 3).map((m) => <a key={m.org_id} href={`/app/switch?org=${m.org_id}`} className="underline mr-2">{m.orgs.name}</a>)}</>}</span>}
          </div>
          <nav className="flex items-center flex-wrap justify-end gap-x-3 gap-y-1 text-sm">
            {session.isStaff && <Link href="/desk">Desk</Link>}
            {session.isPartner && <Link href="/partner">Offices</Link>}
            {session.memberships.length > 0 && (
              <>
                <Link href="/app">Home</Link>
                <Link href="/app/requests/new">New request</Link>
                <Link href="/app/vendors">Vendors</Link>
                <Link href="/app/lookback">Look-back</Link>
                <Link href="/app/subs">Subs</Link>
                <Link href="/app/readout">Read-out</Link>
                <Link href="/app/instructions">Instructions</Link>
                <Link href="/app/log">Log</Link>
              </>
            )}
            <form action="/auth/signout" method="post"><button className="grey underline-offset-2 hover:underline">Sign out</button></form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-8 flex-1">{children}</main>
      <footer className="border-t hair">
        <div className="mx-auto max-w-5xl px-4 py-4 advisory">Mastiff flags. Your firm makes every payment decision.</div>
      </footer>
    </div>
  );
}
