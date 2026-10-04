import { NextResponse } from "next/server";
import { db } from "@/lib/store";
import { PARTNERS, pointsFor, type Receipt } from "@/lib/data";

// DEMO ONLY: unauthenticated. A real partner webhook must verify an HMAC signature
// over the raw body, reject duplicate event IDs and check the amount.
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const tx = b && typeof b.click_id === "string" ? db.txs.get(b.click_id) : undefined;
  if (!tx) return NextResponse.json({ error: "Unknown click_id" }, { status: 404 });
  if (tx.status === "COMPLETED") return NextResponse.json({ error: "Already completed" }, { status: 409 });
  tx.status = "COMPLETED";
  const markup = Math.round((tx.send_amount - tx.fee) * (tx.mid - tx.rate));
  const receipt: Receipt = {
    id: tx.click_id, ts: Date.now(), partner: PARTNERS.find((p) => p.id === tx.partner_id)?.name ?? tx.partner_id,
    currency: tx.currency, principal: tx.send_amount, fee: tx.fee, mid: tx.mid, rate: tx.rate,
    markup_npr: markup, charges_npr: Math.round(tx.fee * tx.mid) + markup,
    net: tx.quoted_net_npr, points: pointsFor(tx.quoted_net_npr),
  };
  return NextResponse.json({ receipt });
}
