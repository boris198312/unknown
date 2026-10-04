"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";
import { CORRIDORS, type Channel, type Offer } from "@/lib/data";

type Link = { label: string; run: () => void };
type Msg = { from: "bot" | "me"; text: string; links?: Link[] };
type Act = { go: (v: string) => void; setCur: (c: string) => void; setAmount: (a: string) => void; setChannel: (c: Channel) => void };
type Props = { offers: Offer[]; cur: string; mid: number; amount: number; channel: Channel; points: number; hasReceipt: boolean; act: Act };

const npr = (x: number) => Math.round(x).toLocaleString("en-IN");
const AGENTS = ["Pokhara Lakeside agent, open until 8 pm", "Kaski Bazar agent, open until 6 pm", "Lekhnath agent, open until 7 pm"];
const CUR: Record<string, string> = { qar: "QAR", qatar: "QAR", aed: "AED", uae: "AED", dubai: "AED", myr: "MYR", malaysia: "MYR", usd: "USD", usa: "USD" };
const CH: Record<string, Channel> = { wallet: "wallet", esewa: "wallet", khalti: "wallet", mobile: "wallet", cash: "cash", pickup: "cash", bank: "bank" };

function parse(s: string) {
  const w = s.toLowerCase().replace(/,/g, "");
  const c = Object.keys(CUR).find((k) => new RegExp(`\\b${k}\\b`).test(w));
  const h = Object.keys(CH).find((k) => w.includes(k));
  const n = w.match(/\d+(\.\d+)?/);
  return { cur: c ? CUR[c] : undefined, chan: h ? CH[h] : undefined, amt: n && +n[0] > 0 ? n[0] : undefined };
}

export default function Sahayak(props: Props) {
  const P = useRef(props); P.current = props;
  const step = useRef<null | "cur" | "amt" | "chan">(null);
  const end = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const B = (t: string, links?: Link[]): Msg => ({ from: "bot", text: t, links });
  const nav = (label: string, v: string): Link => ({ label, run: () => P.current.act.go(v) });
  const ask = (label: string, q = label): Link => ({ label, run: () => submit(q, label) });
  const MENU = [ask("Start a transfer", "start"), ask("Best rate now", "best"), ask("Explain FX markup", "markup"), ask("Find cash agents", "agents"), ask("My points", "points")];
  const [msgs, setMsgs] = useState<Msg[]>([B("Namaste! I'm Sahayak. Tell me what you want, like “send 1500 QAR by cash”, or tap a button. I can also open any page for you.", MENU)]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs, open]);
  useEffect(() => { const f = () => setOpen(true); window.addEventListener("sahayak:open", f); return () => window.removeEventListener("sahayak:open", f); }, []);

  function guide(s: "cur" | "amt" | "chan"): Msg {
    step.current = s;
    if (s === "cur") return B("Where are you sending from?", Object.entries(CORRIDORS).map(([k, c]) => ask(`${c.name} (${k})`, k)));
    if (s === "amt") return B(`How much do you want to send, in ${P.current.cur}? Type a number.`);
    return B("How should your family receive it?", [ask("Mobile wallet", "wallet"), ask("Cash pickup", "cash"), ask("Bank transfer", "bank")]);
  }

  function reply(s: string): Msg {
    const { offers, cur, mid, amount, points, hasReceipt, act } = P.current;
    const w = s.toLowerCase(), p = parse(s), has = (...k: string[]) => k.some((x) => w.includes(x));
    const best = offers[0];
    const st = step.current; step.current = null;
    if (st) {
      if (has("cancel", "stop")) return B("No problem, I've stopped the setup.", MENU);
      if (st === "cur" && p.cur) { act.setCur(p.cur); return guide("amt"); }
      if (st === "amt" && p.amt) { act.setAmount(p.amt); return guide("chan"); }
      if (st === "chan" && p.chan) { act.setChannel(p.chan); act.go("rates"); return B("All set. I've opened Live rates with your details. The top card has the highest amount the recipient receives.", [nav("Go to Live rates", "rates")]); }
    }
    if (has("point", "reward", "redeem")) return B(`You have ${points} Remit Points (10 per 1,000 NPR received). Complete a transfer to earn more, then redeem them on the points page.`, [nav("Open Remit Points", "points")]);
    if (has("pool", "samyukta", "group", "camp")) return B("Samyukta Remit lets workers in one camp pool transfers for a payday rate bonus. Join a pool from its page.", [nav("Open Samyukta Remit", "samyukta")]);
    if (has("cash agent", "agents", "nearby", "pickup point")) return B("Sample agents in Kaski (demo data, not live): " + AGENTS.join("; ") + ".");
    if (has("markup", "fx")) { const o = offers[offers.length - 1]; return B(!o || !mid ? "Open Live rates first and I'll show real numbers." : `A markup is the gap between the mid-market rate (${mid.toFixed(2)}) and the rate a provider gives you. ${o.name} applies ${o.rate.toFixed(2)}, so every 1,000 ${cur} loses about NPR ${npr(1000 * (mid - o.rate))} before any fee.`, [nav("Open Live rates", "rates")]); }
    if (has("fee")) return B(offers.length ? `Estimated fees for ${cur}: ` + offers.map((o) => `${o.name} ${o.fee} ${cur}`).join(", ") + ". Confirm on the provider's site." : "Open Live rates first.", [nav("Open Live rates", "rates")]);
    if (has("budget")) { const b = best?.net ?? 0; return B(b ? `Example split of NPR ${npr(b)}: rent ${npr(b * 0.35)}, groceries ${npr(b * 0.3)}, emergency savings ${npr(b * 0.35)}. Adjust to your costs.` : "Open Live rates first so I have an amount to plan."); }
    if (has("hundi", "informal", "illegal", "my agent")) return B("Informal agents can be quick and sometimes cheap, but you get no receipt or recourse if money is lost, and it may be illegal. Enter your agent's rate in “Compare with your current agent” and I'll show the difference.", [nav("Open Live rates", "rates"), nav("Read the comparison", "discover")]);
    if (has("discover", "about", "what is", "who are")) return B("EasyRemit compares licensed remittance providers and shows what the recipient receives. We never hold your money.", [nav("Open Discover", "discover")]);
    if (has("corridor", "countries")) return B("We cover Qatar, UAE, Malaysia and the USA. Pick your country at the top of Live rates.", [nav("Open Live rates", "rates")]);
    if (p.cur || p.amt || (p.chan && has("send", "transfer", "pay"))) {
      if (p.cur) act.setCur(p.cur); if (p.amt) act.setAmount(p.amt); if (p.chan) act.setChannel(p.chan);
      act.go("rates");
      return B(`Done. I've set ${p.amt ?? amount} ${p.cur ?? cur}${p.chan ? " by " + p.chan : ""} and opened Live rates. The best option is at the top.`, [nav("Go to Live rates", "rates")]);
    }
    if (has("best", "cheapest", "highest", "which")) return B(best ? `Right now: ${best.name} gives the highest estimate, NPR ${npr(best.net)} for ${amount} ${cur}. Estimates can differ from the provider's live quote, so confirm on their site.` : "Open Live rates first.", [nav("Open Live rates", "rates")]);
    if (has("statement", "receipt")) return B(hasReceipt ? "Your statement is on the Live rates page, below the offers." : "A statement appears after you go to a provider and press “Simulate transfer completed” on Live rates.", [nav("Open Live rates", "rates")]);
    if (has("rate", "compare", "start", "send", "transfer", "help", "how")) return guide("cur");
    if (st) { const g = guide(st); return { ...g, text: "Sorry, I didn't catch that. " + g.text }; }
    return B("I can start a transfer, find the best rate, explain markups, show your points, find agents or open any page.", MENU);
  }

  function submit(t: string, shown = t) {
    if (!t.trim()) return;
    const r = reply(t); // run once, outside the state updater
    setMsgs((m) => [...m, { from: "me", text: shown }, r]); setText("");
  }

  return (
    <>
      <button aria-label="Open Sahayak chat" onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-teal-500 text-slate-950 shadow-lg">
        {open ? <X /> : <MessageCircle />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-5 z-40 flex h-[32rem] max-h-[75vh] w-[calc(100%-2.5rem)] max-w-sm flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
            <p className="border-b border-slate-700 p-3 font-black uppercase">Sahayak</p>
            <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm" aria-live="polite">
              {msgs.map((m, i) => (
                <div key={i} className={m.from === "bot" ? "" : "ml-8"}>
                  <p className={`rounded-xl p-2 ${m.from === "bot" ? "bg-slate-800" : "bg-teal-500/20 text-teal-200"}`}>{m.text}</p>
                  {m.links && <div className="mt-1 flex flex-wrap gap-2">{m.links.map((l) => (
                    <button key={l.label} onClick={l.run}
                      className="rounded-full border border-sky-500 px-3 py-1 text-xs font-bold text-sky-300">{l.label}</button>))}</div>}
                </div>
              ))}
              <div ref={end} />
            </div>
            <form onSubmit={(e) => { e.preventDefault(); submit(text); }} className="flex gap-2 border-t border-slate-700 p-3">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask or say what you need…" aria-label="Message Sahayak"
                className="flex-1 rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm" />
              <button aria-label="Send" className="rounded-xl bg-teal-500 px-3 text-slate-950"><Send size={16} /></button>
            </form>
            <p className="px-3 pb-2 text-[11px] text-slate-500">Rule-based assistant. Not financial advice. Rates are estimates.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
