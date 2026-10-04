# EasyRemit Web (demo)

Next.js 14 + Tailwind demo of a remittance comparison app. Providers, margins, checkout,
webhook, WhatsApp message and agent list are simulated.

```bash
npm install
npm run dev     # http://localhost:3000
```

Demo limits: partner margins are illustrative, the webhook is unauthenticated
(a real one needs HMAC signature, duplicate and amount checks), and the
sweepstakes needs legal review.
