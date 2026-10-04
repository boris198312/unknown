"use client";
import { motion } from "framer-motion";
import type { Receipt } from "@/lib/data";

const n = (x: number) => x.toLocaleString("en-IN");

export default function Statement({ r, label }: { r: Receipt; label: string }) {
  const rows: [string, string][] = [
    ["Transaction ID", r.id],
    ["Date and time", new Date(r.ts).toLocaleString()],
    ["Provider", r.partner],
    ["Sender", "Anonymous"],
    ["Recipient", "Anonymous"],
    ["Principal sent", `${n(r.principal)} ${r.currency}`],
    ["Mid-market rate", `${r.mid.toFixed(4)} NPR per ${r.currency}`],
    ["Exchange rate applied", `${r.rate.toFixed(4)} NPR per ${r.currency}`],
    ["Transfer fee", `${n(r.fee)} ${r.currency}`],
    ["Hidden FX markup", `NPR ${n(r.markup_npr)}`],
    ["Total charges deducted", `NPR ${n(r.charges_npr)}`],
  ];
  return (
    <motion.section id="statement" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-6xl px-5 pb-12" aria-label="Transaction statement">
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <h2 className="text-3xl font-black uppercase tracking-tight">Transaction statement</h2>
        <p className="mt-1 text-sm text-slate-400">Simulated transfer for demonstration. No money moved.</p>
        <dl className="mt-4 divide-y divide-slate-800">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2 text-sm">
              <dt className="text-slate-400">{k}</dt><dd className="text-right font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex items-end justify-between rounded-xl bg-teal-500/10 p-4">
          <span className="font-bold text-teal-300">{label}</span>
          <span className="text-3xl font-black text-teal-300">NPR {n(r.net)}</span>
        </div>
        <p className="mt-3 text-sm text-sky-300">You earned {r.points} Remit Points for this transfer.</p>
      </div>
    </motion.section>
  );
}
