"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import type { Offer } from "@/lib/data";

type Msg = { from: "bot" | "me"; text: string };
const npr = (x: number) => Math.round(x).toLocaleString("en-IN");
const AGENTS = ["Pokhara Lakeside agent, open until 8 pm", "Kaski Bazar agent, open until 6 pm", "Lekhnath agent, open until 7 pm"];

export default function Sahayak({ offers, cur, mid, base }: { offers: Offer[]; cur: string; mid: number; base: number }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "bot", text: "Namaste. I'm Sahayak, a guided demo assistant. Pick a question below." }]);

  const answers: Record<string, () => string> = {
    "Explain FX markups": () => {
      const o = offers[offers.length - 1];
      return !o || !mid ? "Load the rates first." :
        `A markup is the gap between the mid-market rate (${mid.toFixed(2)}) and the rate a provider gives you. ${o.name} applies ${o.rate.toFixed(2)}, so every 1,000 ${cur} loses about NPR ${npr(1000 * (mid - o.rate))} before any fee.`;
    },
    "Check corridor fees": () =>
      offers.length ? `Fees for ${cur} on this payout method: ` + offers.map((o) => `${o.name} ${o.fee} ${cur}`).join(", ") + "." : "Load the rates first.",
    "Plan my budget": () => {
      const rent = base * 0.35, food = base * 0.3, save = base - rent - food;
      return base > 0
        ? `3-step example from NPR ${npr(base)}: 1) Rent NPR ${npr(rent)}. 2) Groceries NPR ${npr(food)}. 3) Emergency savings NPR ${npr(save)}. This is a sample 35/30/35 split, so adjust it to your costs.`
        : "Load the rates first so I have an amount to plan.";
    },
    "Find cash agents": () => "Sample agents in Kaski (demo data, not live): " + AGENTS.join("; ") + ".",
  };
  const ask = (q: string) => setMsgs((m) => [...m, { from: "me", text: q }, { from: "bot", text: answers[q]() }]);

  return (
    <>
      <button aria-label="Open Sahayak chat" onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-teal-500 text-slate-950 shadow-lg">
        {open ? <X /> : <MessageCircle />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-5 z-40 flex max-h-[70vh] w-[calc(100%-2.5rem)] max-w-sm flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
            <p className="border-b border-slate-700 p-3 font-black uppercase">Sahayak</p>
            <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm" aria-live="polite">
              {msgs.map((m, i) => (
                <p key={i} className={`rounded-xl p-2 ${m.from === "bot" ? "bg-slate-800" : "ml-8 bg-teal-500/20 text-teal-200"}`}>{m.text}</p>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-slate-700 p-3">
              {Object.keys(answers).map((q) => (
                <button key={q} onClick={() => ask(q)} className="rounded-full border border-sky-500 px-3 py-1 text-xs font-bold text-sky-300">{q}</button>
              ))}
            </div>
            <p className="px-3 pb-2 text-[11px] text-slate-500">Scripted demo assistant. Not financial advice.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
