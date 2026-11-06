// Sends pending notifications. Hit by the daily Vercel cron as a sweeper; the
// actions also flush right after they queue, so a hold email goes out at once.
import { NextResponse } from "next/server";
import { flushNotifications } from "@/lib/mail";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await flushNotifications(200));
}
