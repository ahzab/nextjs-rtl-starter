# nextjs-rtl-starter

## Payment methods

Cards (mada, Visa, Mastercard) work with Tap's test keys and no other setup. Apple Pay, STC Pay and KNET each need something done outside this code, so each is off until you turn on its flag in `.env.local`. When a method is on but can't be used, the checkout says why and still shows the card field. In test mode it also tells you, the developer, what to fix.

| Method | Flag | Currency | Needs |
|---|---|---|---|
| Apple Pay | `NEXT_PUBLIC_TAP_APPLE_PAY=1` | any the card field takes | `TAP_MERCHANT_ID`, your domain registered with Tap, Safari on an Apple device |
| STC Pay | `NEXT_PUBLIC_TAP_STC_PAY=1` | SAR only | Tap turning it on for your account |
| KNET | `NEXT_PUBLIC_TAP_KNET=1` | KWD only | Tap turning it on for your account |

The flags start with `NEXT_PUBLIC_` because the checkout page reads them too. Restart `npm run dev` after changing one.

### Apple Pay

Tap handles the Apple merchant certificate. You prove you own the domain:

1. Ask Tap support for the Apple Pay domain-verification file.
2. Save it as `public/.well-known/apple-developer-merchantid-domain-association` (no extension) and deploy. Check it opens at `https://<your-domain>/.well-known/apple-developer-merchantid-domain-association`.
3. Send Tap the domain (and each subdomain you use) and ask them to register it with Apple Pay. The file has to be live before they do.
4. Set `TAP_MERCHANT_ID` (your merchant id from Tap's dashboard) and `NEXT_PUBLIC_TAP_APPLE_PAY=1`.

Apple Pay can't run on `localhost`: it needs HTTPS on a registered domain. The button only shows in Safari on an Apple device with a card in Wallet; everywhere else the checkout says Apple Pay isn't available and offers the card. The button comes from Tap's `@tap-payments/apple-pay-button` and returns a Tap token, which `/api/charges` charges like a card.

### STC Pay

STC Pay is off on Tap accounts until Tap turns it on. Ask your Tap account manager. Until then Tap answers error 1243, and the checkout shows "STC Pay isn't turned on for this Tap account" next to the card field. Tap's shared test keys don't have it.

The customer enters their STC Pay number, gets a code by SMS and types it in. The server creates the charge with source `src_sa.stcpay`, then sends the code back on it (`/api/charges/<id>/otp`). The result page then checks the charge with Tap like any other. Sandbox numbers from Tap's docs: 0548220713 or 0550955806, code 123456.

### KNET

KNET takes Kuwaiti dinars only, so it shows only on a KWD order. To try it, set `SAMPLE_CURRENCY=KWD` so the sample order is priced in dinars. The customer is sent to KNET's page to enter the card and PIN, then back to the result page. Tap's KNET test card: 8888880000000001, expiry 09/30, PIN 1234.

KNET also needs Tap to turn it on for your account. Tap's shared test keys create KNET charges but decline them straight away (code 515), so test it with your own Tap test account.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
