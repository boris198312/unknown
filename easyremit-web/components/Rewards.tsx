"use client";
import { REWARDS } from "@/lib/data";

export default function Rewards({ points, redeemed, onRedeem }: { points: number; redeemed: string[]; onRedeem: (id: string, cost: number) => void }) {
  return (
    <section id="points" className="mx-auto max-w-6xl px-5 pb-12">
      <h2 className="mb-4 text-3xl font-black uppercase tracking-tight">Remit Points</h2>
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <p className="text-4xl font-black text-teal-300">{points} points</p>
        <p className="mt-1 text-sm text-slate-400">Earn 10 points for every 1,000 NPR transferred through a formal provider.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {REWARDS.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-800 p-4">
              <div><p className="font-bold">{r.name}</p><p className="text-sm text-slate-400">{r.cost} points</p></div>
              <button disabled={points < r.cost || redeemed.includes(r.id)} onClick={() => onRedeem(r.id, r.cost)}
                className="rounded-full bg-sky-500 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40">
                {redeemed.includes(r.id) ? "Redeemed" : "Redeem"}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">Demo catalog: items and point costs are placeholders, and no real rewards are issued.</p>
      </div>
    </section>
  );
}
