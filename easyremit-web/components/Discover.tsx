const PILLARS: [string, string][] = [
  ["Live Rate Comparison Engine", "Instantly compare verified operators (such as eSewa Money Transfer, IME Remit, and others) ranked from highest to lowest net delivery value."],
  ["Samyukta Remit (Group Rate Pooling)", "A community-driven feature allowing workers in shared industrial camps to pool their transfer volumes together, unlocking exclusive rate bonuses on payday."],
  ["Remit Rewards & Loyalty", "Turn routine financial transfers into tangible perks. Earn Remit Points for every formal transfer and redeem them for mobile top-ups, zero-fee vouchers, or wallet cashbacks."],
  ["Sahayak — Your Agentic AI Assistant", "A built-in intelligent companion ready around the clock to help families plan budgets, understand FX dynamics, and locate secure local cash-pickup agents."],
  ["Absolute Privacy & Transparency", "Detailed transaction statements that protect user identities while offering a crystal-clear breakdown of principal amounts, charges, and delivery times."],
];

export default function Discover() {
  return (
    <section id="discover" className="mx-auto max-w-4xl px-5 pb-16">
      <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl">
        Empowering Migrant Transfers. Maximizing Every Rupee Sent Home.
      </h1>
      <p className="mt-6 text-lg text-slate-300">
        EasyRemit is a next-generation remittance aggregator and financial inclusion platform designed to bridge the gap between migrant workers abroad and their families back home. Built to replace opaque corridors and informal networks with complete transparency, EasyRemit ensures that every transfer is safe, fast, and rewarding.
      </p>
      <h2 className="mt-10 text-2xl font-black uppercase tracking-tight text-teal-300">What is Our Model?</h2>
      <p className="mt-3 text-slate-300">
        EasyRemit operates as an intelligent comparison and routing engine for cross-border remittances. Instead of forcing users to guess which operator offers the best deal, EasyRemit aggregates live exchange rates, transfer fees, and payout speeds from licensed financial institutions in real time.
      </p>
      <p className="mt-3 text-slate-300">
        Our platform empowers senders to see exactly what the recipient receives down to the last rupee, eliminating hidden foreign exchange markups and unexpected deductions.
      </p>
      <h2 className="mt-10 text-2xl font-black uppercase tracking-tight text-teal-300">Key Pillars of the EasyRemit Ecosystem</h2>
      <ul className="mt-4 space-y-3">
        {PILLARS.map(([title, text]) => (
          <li key={title} className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
            <p className="font-black">{title}</p>
            <p className="mt-1 text-slate-300">{text}</p>
          </li>
        ))}
      </ul>
      <h2 className="mt-10 text-2xl font-black uppercase tracking-tight text-teal-300">Licensed vs informal: an honest comparison</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead><tr className="text-slate-400"><th className="p-2"></th><th className="p-2">Licensed provider</th><th className="p-2">Informal (hundi)</th></tr></thead>
          <tbody>
            {[["Protection", "Regulated, with a receipt and a complaints route.", "No receipt or recourse if money is lost, and it can be illegal."],
              ["Rate", "Shown up front, so you can compare.", "Sometimes competitive. Test it with the rate check on Live rates."],
              ["Reach", "Depends on the provider's wallets and agents.", "Often delivers door to door, including remote areas."],
              ["Paperwork", "ID checks are required.", "Usually none, which is why some workers use it."]].map(([a, b, c]) => (
              <tr key={a} className="border-t border-slate-800 align-top"><td className="p-2 font-bold">{a}</td><td className="p-2 text-slate-300">{b}</td><td className="p-2 text-slate-300">{c}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="mt-10 text-2xl font-black uppercase tracking-tight text-teal-300">How EasyRemit earns (prototype plan)</h2>
      <p className="mt-3 text-slate-300">
        EasyRemit never holds your money. You pay the provider directly. The plan is to earn a referral fee from providers on completed transfers, which would also fund rewards. Providers are ranked by what the recipient receives, never by commission. Only licensed providers are listed, and each corridor needs a legal review before launch.
      </p>
      <h2 className="mt-10 text-2xl font-black uppercase tracking-tight text-teal-300">Our Mission</h2>
      <p className="mt-3 text-slate-300">
        We believe sending money home should be as simple, transparent, and rewarding as possible. By championing formal, licensed remittance channels, EasyRemit protects migrant earnings, strengthens financial security, and drives economic inclusion for families across borders.
      </p>
      <p className="mt-8 text-xs text-slate-500">
        Prototype note: provider margins and fees in this demo are illustrative, and Sahayak is a scripted demo assistant.
      </p>
    </section>
  );
}
