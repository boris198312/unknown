"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trophy, Zap, ShieldCheck, Clock, ExternalLink, X, Menu } from "lucide-react";
import { CORRIDORS, CHANNELS, type Channel, type Offer, type Receipt } from "@/lib/data";
import Statement from "@/components/Statement";
import Rewards from "@/components/Rewards";
import Sahayak from "@/components/Sahayak";
import Discover from "@/components/Discover";

type Lang = "en" | "ne";
type View = "home" | "discover" | "rates" | "corridors" | "samyukta" | "points";
const T = {
  en: {
    rates: "Live rates", discover: "Discover", corridors: "Corridors", samyukta: "Samyukta Remit", points: "Remit Points", login: "Log in", signup: "Sign up",
    h1: "Maximize every rupee sent home",
    sub: "Compare rates across licensed remittance operators. See hidden markups, fees and what the recipient actually receives.",
    cta: "Compare live rates now", select: "Go to provider", join: "Join pool", net: "Recipient receives",
    wallet: "Mobile wallet", cash: "Cash pickup", bank: "Bank transfer",
  },
  ne: {
    rates: "दर तुलना", discover: "परिचय", corridors: "देशहरू", samyukta: "संयुक्त रेमिट", points: "रेमिट पोइन्ट", login: "लग इन", signup: "साइन अप",
    h1: "घर पठाएको हरेक रुपैयाँ बढाउनुहोस्",
    sub: "इजाजतपत्र प्राप्त कम्पनीहरूको दर तुलना गर्नुहोस्। प्राप्तकर्ताले वास्तवमा कति रुपैयाँ पाउँछ हेर्नुहोस्।",
    cta: "दर तुलना गर्नुहोस्", select: "प्रदायकमा जानुहोस्", join: "समूहमा जोडिनुहोस्", net: "प्राप्तकर्ताले पाउँछ",
    wallet: "मोबाइल वालेट", cash: "नगद पिकअप", bank: "बैंक ट्रान्सफर",
  },
} as const;

const POOLS0 = [
  { id: 1, name: "Doha Industrial Area Camp #4 Pool", target: 15, current: 12, bonus: 0.4 },
  { id: 2, name: "Kuala Lumpur Site B Pool", target: 20, current: 7, bonus: 0.3 },
];
const npr = (n: number) => n.toLocaleString("en-IN");
const JSON_HEADERS = { "Content-Type": "application/json" };
const card = "rounded-2xl border border-slate-700 bg-slate-900 p-5";
const btn = "rounded-full bg-teal-500 px-5 py-2 font-bold text-slate-950 hover:bg-teal-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400";
const chip = (on: boolean) => `rounded-full border px-4 py-2 font-bold ${on ? "border-teal-500 bg-teal-500 text-slate-950" : "border-slate-600"}`;

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const t = T[lang];
  const [cur, setCur] = useState("QAR");
  const [amount, setAmount] = useState("1000");
  const [channel, setChannel] = useState<Channel>("wallet");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [mid, setMid] = useState(0);
  const [source, setSource] = useState("demo");
  const [phone, setPhone] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [pending, setPending] = useState<{ click_id: string; partner: string } | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [points, setPoints] = useState(0);
  const [pools, setPools] = useState(POOLS0);
  const [joined, setJoined] = useState<number[]>([]);
  const [msg, setMsg] = useState("");
  const [view, setView] = useState<View>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [redeemed, setRedeemed] = useState<string[]>([]);

  useEffect(() => {
    const a = parseFloat(amount);
    if (!(a > 0)) { setOffers([]); return; }
    const ctl = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/rates/compare?cur=${cur}&amount=${a}&channel=${channel}`, { signal: ctl.signal })
        .then((r) => r.json())
        .then((d) => { if (d.offers) { setOffers(d.offers); setMid(d.mid); setSource(d.source); } })
        .catch(() => {});
    }, 250);
    return () => { clearTimeout(timer); ctl.abort(); };
  }, [cur, amount, channel]);

  // Called when the provider link is clicked. The link itself opens the provider in a new tab.
  function track(o: Offer) {
    setMsg("");
    fetch("/api/referrals/click", {
      method: "POST", headers: JSON_HEADERS, keepalive: true,
      body: JSON.stringify({ user_id: phone ?? "guest", partner_id: o.id, send_amount: parseFloat(amount), currency: cur, mid, rate: o.rate, fee: o.fee, quoted_net_npr: o.net }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.click_id) { setPending({ click_id: d.click_id, partner: o.name }); setReceipt(null); } else setMsg(d.error); })
      .catch(() => setMsg("Could not log the click."));
  }

  async function settle() {
    if (!pending) return;
    const r = await fetch("/api/webhooks/remittance", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ click_id: pending.click_id }) });
    const d = await r.json();
    if (!r.ok) { setMsg(d.error); return; }
    setReceipt(d.receipt);
    setPoints((p) => p + d.receipt.points);
    setPending(null);
    setTimeout(() => document.getElementById("statement")?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  function go(v: View) { setView(v); setMenuOpen(false); window.scrollTo({ top: 0 }); }
  function redeem(id: string, cost: number) { setRedeemed((r) => [...r, id]); setPoints((p) => p - cost); }
  const corridorChips = (
    <div className="flex flex-wrap gap-2">
      {Object.entries(CORRIDORS).map(([code, c]) => (
        <button key={code} onClick={() => setCur(code)} aria-pressed={cur === code} className={chip(cur === code)}>{c.name} ({code})</button>
      ))}
    </div>
  );
  const rewards = <Rewards points={points} redeemed={redeemed} onRedeem={redeem} />;
  const menuItems: [View, string][] = [["discover", t.discover], ["rates", t.rates], ["corridors", t.corridors], ["samyukta", t.samyukta], ["points", t.points]];
  const badge = "flex items-center gap-1 rounded-full bg-teal-500/15 px-2 py-1 text-teal-300";

  return (
    <main className="min-h-screen">
      <nav className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="relative flex items-center gap-3">
          <button aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg border border-slate-700 p-2">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <button onClick={() => go("home")} className="text-2xl font-black">⚡ EasyRemit</button>
          <AnimatePresence>
            {menuOpen && (
              <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="absolute left-0 top-full z-40 mt-2 w-60 rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-xl">
                {menuItems.map(([v, label]) => (
                  <li key={v}>
                    <button onClick={() => go(v)} aria-current={view === v} className={`w-full rounded-xl px-4 py-3 text-left font-bold hover:bg-slate-800 ${view === v ? "text-teal-300" : ""}`}>{label}</button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        <div className="hidden gap-6 font-semibold md:flex">
          {menuItems.slice(1).map(([v, label]) => <button key={v} onClick={() => go(v)}>{label}</button>)}
        </div>
        <div className="flex items-center gap-3 text-sm font-semibold">
          <button onClick={() => setLang(lang === "en" ? "ne" : "en")} aria-label="Toggle language">🇳🇵 EN / नेपाली</button>
          {phone ? (
            <span className="rounded-full border border-teal-500 px-4 py-2 text-teal-300">{phone.slice(0, 9)}… | {points} pts</span>
          ) : (
            <>
              <button onClick={() => setAuthOpen(true)}>{t.login}</button>
              <button onClick={() => setAuthOpen(true)} className={btn}>{t.signup}</button>
            </>
          )}
        </div>
      </nav>

      {view === "home" && (
      <section className="mx-auto max-w-6xl px-5 pb-10 pt-8">
        <h1 className="max-w-3xl text-5xl font-black uppercase leading-[0.95] tracking-tight sm:text-7xl">{t.h1}</h1>
        <p className="mt-5 max-w-xl text-lg text-slate-300">{t.sub}</p>
        <button onClick={() => go("rates")} className={`${btn} mt-6 py-3`}>{t.cta}</button>
      </section>
      )}

      {view === "rates" && (
        <>
      <section id="rates" className="mx-auto max-w-6xl px-5 pb-12">
        <div className={card}>
          {corridorChips}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="font-bold">Amount ({cur})
              <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="ml-2 w-32 rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 font-bold" />
            </label>
            {CHANNELS.map((c) => (
              <button key={c} onClick={() => setChannel(c)} aria-pressed={channel === c} className={chip(channel === c)}>{t[c]}</button>
            ))}
          </div>
          <p className="mt-3 text-sm text-slate-400">
            Mid-market rate: {mid ? mid.toFixed(2) : "-"} NPR per {cur} ({source === "live" ? "live" : "demo data"}).
            Partner margins and fees are illustrative demo values, not real quotes.
          </p>
          {msg && <p role="alert" className="mt-2 font-bold text-red-400">{msg}</p>}
          <ul className="mt-4 space-y-3">
            {offers.map((o, i) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-800 p-4">
                <div>
                  <p className="text-lg font-black">{o.name}</p>
                  <p className="text-sm text-slate-400">Rate {o.rate.toFixed(2)} | Fee {o.fee} {cur} | ~{o.speed} min</p>
                  <p className="mt-1 flex flex-wrap gap-2 text-xs font-bold">
                    {i === 0 && <span className={badge}><Trophy size={12} /> Best net NPR</span>}
                    {channel === "cash" && o.speed <= 30 && <span className={badge}><Zap size={12} /> Fast cash</span>}
                    {o.fee === 0 && <span className={badge}><ShieldCheck size={12} /> No transfer fee</span>}
                    <span className="flex items-center gap-1 rounded-full bg-slate-700 px-2 py-1"><Clock size={12} /> {o.speed} min</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400">{t.net}</p>
                  <p className="text-2xl font-black text-teal-300">NPR {npr(o.net)}</p>
                  <a href={o.url} target="_blank" rel="noopener noreferrer" onClick={() => track(o)} className={`${btn} mt-2 inline-flex items-center gap-1`}>
                    {t.select} <ExternalLink size={14} />
                  </a>
                </div>
              </li>
            ))}
          </ul>
          {pending && (
            <div className="mt-4 rounded-xl border border-sky-500 bg-sky-500/10 p-4">
              <p className="font-bold">{pending.partner} opened in a new tab (ref {pending.click_id}).</p>
              <p className="text-sm text-slate-300">This demo cannot see a real transfer. Press the button to simulate the provider confirming it.</p>
              <button onClick={settle} className={`${btn} mt-3`}>Simulate transfer completed</button>
            </div>
          )}
        </div>
      </section>
          {receipt && <Statement r={receipt} label={t.net} />}
          {receipt && rewards}
        </>
      )}
      {view === "corridors" && (
        <section id="corridors" className="mx-auto max-w-6xl px-5 pb-12">
          <h2 className="mb-4 text-3xl font-black uppercase tracking-tight">{t.corridors}</h2>
          <div className={card}>
            {corridorChips}
            <p className="mt-3 text-sm text-slate-400">Mid-market rate: {mid ? mid.toFixed(2) : "-"} NPR per {cur} ({source === "live" ? "live" : "demo data"}).</p>
            <button onClick={() => go("rates")} className={`${btn} mt-4`}>Compare rates for {cur}</button>
          </div>
        </section>
      )}
      {view === "points" && rewards}
      {view === "discover" && <Discover />}

      {view === "samyukta" && (
      <section id="samyukta" className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="mb-4 text-3xl font-black uppercase tracking-tight">{t.samyukta}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {pools.map((p) => (
            <div key={p.id} className={card}>
              <p className="font-black">{p.name}: {p.current}/{p.target} workers joined</p>
              <div className="my-3 h-3 rounded-full bg-slate-700"><div className="h-3 rounded-full bg-teal-500" style={{ width: `${(p.current / p.target) * 100}%` }} /></div>
              <p className="text-sm text-slate-300">{p.target - p.current} slots left. Join to unlock an extra +{p.bonus.toFixed(2)} NPR per unit on payday (concept: a partner would need to fund this).</p>
              <button disabled={joined.includes(p.id)} className={`${btn} mt-3 disabled:opacity-50`}
                onClick={() => { setJoined([...joined, p.id]); setPools(pools.map((x) => (x.id === p.id ? { ...x, current: x.current + 1 } : x))); }}>
                {joined.includes(p.id) ? "Joined" : t.join}
              </button>
            </div>
          ))}
        </div>
      </section>
      )}

      <AnimatePresence>
        {authOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAuthOpen(false)}>
            <motion.form role="dialog" aria-modal="true" initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
              className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6" onClick={(e) => e.stopPropagation()}
              onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); setPhone(String(f.get("phone"))); setLang(f.get("lang") as Lang); setAuthOpen(false); }}>
              <button type="button" aria-label="Close" onClick={() => setAuthOpen(false)} className="absolute right-4 top-4"><X size={20} /></button>
              <h3 className="mb-3 text-2xl font-black">{t.signup}</h3>
              <label className="block font-bold">Phone number
                <input name="phone" required minLength={8} placeholder="+974 5512 3456" className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2" />
              </label>
              <label className="mt-3 block font-bold">Language
                <select name="lang" defaultValue={lang} className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2">
                  <option value="en">English</option><option value="ne">नेपाली</option>
                </select>
              </label>
              <p className="mt-2 text-xs text-slate-400">Demo only. No verification or SMS is sent.</p>
              <button className={`${btn} mt-4 w-full py-3`}>Continue</button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <Sahayak offers={offers} cur={cur} mid={mid} base={receipt ? receipt.net : offers[0]?.net ?? 0} />
    </main>
  );
}
