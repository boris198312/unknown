"use client";
import { useState } from "react";
import type { Offer } from "@/lib/data";

const npr = (n: number) => Math.round(n).toLocaleString("en-IN");
const inp = "mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 font-bold";

// Lets the sender replace our estimates with the numbers they actually see,
// and compare against what an informal agent offers.
export default function RealityCheck({ offers, cur, amount }: { offers: Offer[]; cur: string; amount: number }) {
  const [pid, setPid] = useState("");
  const [rate, setRate] = useState("");
  const [fee, setFee] = useState("0");
  const [agent, setAgent] = useState("");
  const o = offers.find((x) => x.id === pid) ?? offers[0];
  const r = parseFloat(rate), f = parseFloat(fee) || 0, a = parseFloat(agent);
  const real = r > 0 ? Math.round(Math.max(0, amount - f) * r) : null;
  const agentNet = a > 0 ? Math.round(amount * a) : null;
  const best = offers[0];

  return (
    <section id="reality" className="mx-auto max-w-6xl px-5 pb-12">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
          <h2 className="text-xl font-black uppercase">Check against a real quote</h2>
          <p className="mt-1 text-sm text-slate-400">Our provider numbers are estimates. Type the rate and fee shown on the provider's own site.</p>
          <label className="mt-3 block text-sm font-bold">Provider
            <select value={o?.id} onChange={(e) => setPid(e.target.value)} className={inp}>
              {offers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-sm font-bold">Rate (NPR per {cur})<input type="number" value={rate} onChange={(e) => setRate(e.target.value)} className={inp} /></label>
            <label className="text-sm font-bold">Fee ({cur})<input type="number" value={fee} onChange={(e) => setFee(e.target.value)} className={inp} /></label>
          </div>
          {real !== null && o && (
            <p className="mt-3 text-sm" role="status">
              Recipient receives <b className="text-teal-300">NPR {npr(real)}</b>. Our estimate was NPR {npr(o.net)}
              {" "}({real >= o.net ? "you got NPR " + npr(real - o.net) + " more" : "NPR " + npr(o.net - real) + " less"} than we estimated).
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
          <h2 className="text-xl font-black uppercase">Compare with your current agent</h2>
          <p className="mt-1 text-sm text-slate-400">Enter the rate your agent (formal or informal) offers for {npr(amount)} {cur}.</p>
          <label className="mt-3 block text-sm font-bold">Agent rate (NPR per {cur})<input type="number" value={agent} onChange={(e) => setAgent(e.target.value)} className={inp} /></label>
          {agentNet !== null && best && (
            <p className="mt-3 text-sm" role="status">
              Agent: <b>NPR {npr(agentNet)}</b>. Best licensed estimate ({best.name}): <b className="text-teal-300">NPR {npr(best.net)}</b>.{" "}
              {best.net > agentNet
                ? `The licensed option gives NPR ${npr(best.net - agentNet)} more, with a receipt and a complaints route.`
                : `Your agent gives NPR ${npr(agentNet - best.net)} more on rate alone. Weigh that against having no receipt or recourse if money is lost.`}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
