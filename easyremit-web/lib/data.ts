export type Channel = "wallet" | "cash" | "bank";
export const CHANNELS: Channel[] = ["wallet", "cash", "bank"];

export const CORRIDORS: Record<string, { name: string; mock: number }> = {
  QAR: { name: "Qatar", mock: 35.85 },
  AED: { name: "UAE", mock: 36.4 },
  MYR: { name: "Malaysia", mock: 31.8 },
  USD: { name: "USA", mock: 133.5 },
};

// Margins and fees are ILLUSTRATIVE demo values, not real quotes.
// Check each url yourself before presenting: these are the links the redirect opens.
export const PARTNERS = [
  { id: "esewa", name: "eSewa Money Transfer", url: "https://esewa.com.np", channels: ["wallet", "bank"] as Channel[], margin: 0.2, fee: 0, speed: 10 },
  { id: "ime", name: "IME Remit", url: "https://www.imeremit.com.np", channels: ["cash", "bank"] as Channel[], margin: 0.8, fee: 0, speed: 30 },
  { id: "prabhu", name: "Prabhu Remit", url: "https://www.prabhuonline.com", channels: ["cash", "bank"] as Channel[], margin: 0.5, fee: 5, speed: 45 },
  { id: "khalti", name: "Khalti", url: "https://khalti.com", channels: ["wallet"] as Channel[], margin: 0.4, fee: 0, speed: 10 },
  { id: "wu", name: "Western Union", url: "https://www.westernunion.com", channels: ["cash", "bank"] as Channel[], margin: 1.8, fee: 10, speed: 15 },
];

export type Offer = {
  id: string; name: string; url: string; fee: number; speed: number;
  rate: number; net: number; channels: Channel[]; verified: boolean;
};
export type Receipt = {
  id: string; ts: number; partner: string; currency: string; principal: number; fee: number;
  mid: number; rate: number; markup_npr: number; charges_npr: number; net: number; points: number;
};

// Recipient receives = (send amount - fee) x (mid rate x (1 - margin))
export function quote(amount: number, channel: Channel, mid: number): Offer[] {
  return PARTNERS.filter((p) => p.channels.includes(channel))
    .map((p) => {
      const rate = mid * (1 - p.margin / 100);
      return { ...p, verified: false, rate: Math.round(rate * 10000) / 10000, net: Math.round(Math.max(0, amount - p.fee) * rate) };
    })
    .sort((a, b) => b.net - a.net);
}

export const REWARDS = [
  { id: "ntc", name: "1 GB data pack (NTC)", cost: 150 },
  { id: "ncell", name: "1 GB data pack (Ncell)", cost: 150 },
  { id: "cash50", name: "eSewa cashback NPR 50", cost: 300 },
  { id: "voucher", name: "Zero-fee transfer voucher", cost: 500 },
];
export const pointsFor = (npr: number) => Math.floor(npr / 100); // 10 points per 1,000 NPR

// Demo dialing codes for sign-up (a real launch would use a full E.164 country list).
export const DIAL = [
  { name: "Nepal", code: "+977" }, { name: "Qatar", code: "+974" }, { name: "UAE", code: "+971" }, { name: "Saudi Arabia", code: "+966" },
  { name: "Kuwait", code: "+965" }, { name: "Bahrain", code: "+973" }, { name: "Oman", code: "+968" }, { name: "Malaysia", code: "+60" },
  { name: "India", code: "+91" }, { name: "Bangladesh", code: "+880" }, { name: "Sri Lanka", code: "+94" }, { name: "Pakistan", code: "+92" },
  { name: "Singapore", code: "+65" }, { name: "Hong Kong", code: "+852" }, { name: "Japan", code: "+81" }, { name: "South Korea", code: "+82" },
  { name: "Australia", code: "+61" }, { name: "United Kingdom", code: "+44" }, { name: "United States / Canada", code: "+1" },
  { name: "Germany", code: "+49" }, { name: "France", code: "+33" }, { name: "Italy", code: "+39" },
];
export const CUR_DIAL: Record<string, string> = { QAR: "+974", AED: "+971", MYR: "+60", USD: "+1" };
