import { NextResponse } from "next/server";
import { CORRIDORS, CHANNELS, quote, type Channel } from "@/lib/data";

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const cur = p.get("cur") ?? "QAR";
  const amount = Number(p.get("amount"));
  const channel = p.get("channel") as Channel;
  if (!CORRIDORS[cur] || !(amount > 0) || !CHANNELS.includes(channel)) {
    return NextResponse.json({ error: "Invalid currency, amount or channel" }, { status: 400 });
  }
  let mid = CORRIDORS[cur].mock;
  let source: "live" | "demo" = "demo";
  try {
    const r = await fetch(`https://open.er-api.com/v6/latest/${cur}`, { next: { revalidate: 3600 } });
    const d = await r.json();
    if (typeof d?.rates?.NPR === "number") { mid = d.rates.NPR; source = "live"; }
  } catch { /* fall back to demo rate */ }
  return NextResponse.json({ mid, source, offers: quote(amount, channel, mid) });
}
