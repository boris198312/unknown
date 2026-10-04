export type Tx = {
  click_id: string; user_id: string; partner_id: string; currency: string; send_amount: number;
  mid: number; rate: number; fee: number; quoted_net_npr: number; status: "PENDING" | "COMPLETED";
};
// In-memory demo database. Resets when the server restarts.
const g = globalThis as unknown as { __hz?: { txs: Map<string, Tx>; n: number } };
g.__hz ??= { txs: new Map(), n: 8820 };
export const db = g.__hz;
