"use client";
import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { DIAL } from "@/lib/data";

export type User = { uid: string; email: string; phone: string };
type Lang = "en" | "ne";
const inp = "mt-1 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2";
const btn = "mt-4 w-full rounded-full bg-teal-500 py-3 font-bold text-slate-950 hover:bg-teal-400";

// DEMO verification: the code is shown on screen. A real launch sends it by SMS and email
// and keeps the session on the server (httpOnly cookie), with rate limiting on code requests.
export default function AuthModal({ mode, defaultDial, onClose, onDone }: {
  mode: null | "login" | "signup"; defaultDial: string; onClose: () => void; onDone: (u: User, lang: Lang) => void;
}) {
  const [step, setStep] = useState<"form" | "code">("form");
  const [dial, setDial] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [lang, setLang] = useState<Lang>("en");
  const [sent, setSent] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const cc = dial ?? defaultDial;
  const digits = phone.replace(/[\s-]/g, "");
  const reset = () => { setStep("form"); setCode(""); setErr(""); };

  function sendCode(e: FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErr("Enter a valid email address.");
    if (!/^\d{6,14}$/.test(digits)) return setErr("Enter your phone number with digits only (6 to 14 digits).");
    setErr(""); setSent(String(100000 + Math.floor(Math.random() * 900000))); setStep("code");
  }
  function verify(e: FormEvent) {
    e.preventDefault();
    if (code !== sent) return setErr("That code is not correct.");
    onDone({ uid: "u_" + Math.random().toString(36).slice(2, 10), email: email.trim().toLowerCase(), phone: cc + digits }, lang);
    reset(); setEmail(""); setPhone("");
  }
  const close = () => { reset(); onClose(); };

  return (
    <AnimatePresence>
      {mode && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.form role="dialog" aria-modal="true" initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
            onClick={(e) => e.stopPropagation()} onSubmit={step === "form" ? sendCode : verify}
            className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <button type="button" aria-label="Close" onClick={close} className="absolute right-4 top-4"><X size={20} /></button>
            <h3 className="mb-3 text-2xl font-black">{mode === "login" ? "Log in" : "Sign up"}</h3>
            {step === "form" ? (
              <>
                <label className="block font-bold">Email
                  <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inp} />
                </label>
                <label className="mt-3 block font-bold">Phone number
                  <span className="mt-1 flex gap-2">
                    <select value={cc} onChange={(e) => setDial(e.target.value)} aria-label="Country code" className="w-32 rounded-xl border border-slate-600 bg-slate-800 px-2 py-2">
                      {DIAL.map((d) => <option key={d.name} value={d.code}>{d.code} {d.name}</option>)}
                    </select>
                    <input type="tel" inputMode="numeric" required autoComplete="tel-national" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="5512 3456" className="w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2" />
                  </span>
                </label>
                <label className="mt-3 block font-bold">Language
                  <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className={inp}>
                    <option value="en">English</option><option value="ne">नेपाली</option>
                  </select>
                </label>
                <button className={btn}>Send verification code</button>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-300">Enter the 6-digit code for {email.trim()} and {cc} {digits}.</p>
                <p className="mt-2 rounded-lg bg-sky-500/10 p-2 text-sm text-sky-300">Demo only: nothing is sent. Your code is <b>{sent}</b>.</p>
                <input inputMode="numeric" maxLength={6} autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} aria-label="Verification code" className={`${inp} text-center text-2xl tracking-widest`} />
                <button className={btn}>Verify and continue</button>
                <button type="button" onClick={reset} className="mt-2 w-full text-sm text-slate-400 underline">Change email or phone</button>
              </>
            )}
            {err && <p role="alert" className="mt-2 text-sm font-bold text-red-400">{err}</p>}
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
