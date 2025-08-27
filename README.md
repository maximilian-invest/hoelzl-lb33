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

## Upside-Potenzial

Die Webapp unterstützt frei definierbare Upside-Szenarien (z. B. Hotel-Umwidmung oder Dachausbau). Jedes aktive Szenario fügt ab dem eingestellten Startjahr zusätzliche Erträge hinzu und berücksichtigt einmalige CapEx-Kosten. Aus den Cashflows wird ein neuer IRR berechnet.

**Berechnungsschritte:**

1. Zusätzlicher Jahresertrag = `addedSqm × newRentPerSqm × 12 × occupancyPct/100`
2. Upside-Cashflow = Basis-Cashflow + Σ Zusatzerträge − CapEx im Startjahr
3. `irrDelta = max(0, irrUpside − irrBasis)`
4. `pAvg = Durchschnitt der Wahrscheinlichkeit aller aktiven Upsides`
5. `pWeighted = irrDelta × (pAvg/100)`
6. Bonus-Punkte `= clamp((pWeighted / 0.03) × 10, 0, 10)`

Beispiel: Erhöht ein Upside den IRR um 1.5 pp und hat eine Eintrittswahrscheinlichkeit von 50 %, ergibt das `pWeighted = 0.75` pp und somit rund `2.5` Bonuspunkte.
