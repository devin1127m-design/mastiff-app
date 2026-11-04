// Pick which office /app shows, for people who belong to more than one (a partner firm, say).
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const org = new URL(req.url).searchParams.get("org") ?? "";
  const jar = await cookies();
  if (/^[0-9a-f-]{36}$/.test(org)) jar.set("mastiff_org", org, { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 60 * 24 * 90 });
  return NextResponse.redirect(new URL("/app", req.url));
}
