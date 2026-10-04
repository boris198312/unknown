import { NextResponse } from "next/server";
import { db } from "@/lib/store";
import { PARTNERS, CORRIDORS } from "@/lib/data";

// Logs a click-tracking event and keeps the quoted numbers for the later statement.
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const p = b && PARTNERS.find((x) => x.id === b.partner_id);
  const ok = p && typeof b.user_id === "string" && CORRIDORS[b.currency]
    && b.send_amount > 0 && b.mid > 0 && b.fee === p.fee
    && Math.abs(b.rate - b.mid * (1 - p.margin / 100)) < 0.01
    && Math.abs(b.quoted_net_npr - (b.send_amount - b.fee) * b.rate) <= 1;
  if (!ok) return NextResponse.json({ error: "Invalid referral" }, { status: 400 });
  const click_id = `ER-${++db.n}`;
  db.txs.set(click_id, {
    click_id, user_id: b.user_id, partner_id: b.partner_id, currency: b.currency, send_amount: b.send_amount,
    mid: b.mid, rate: b.rate, fee: b.fee, quoted_net_npr: b.quoted_net_npr, status: "PENDING",
  });
  return NextResponse.json({ click_id, status: "PENDING" });
}
