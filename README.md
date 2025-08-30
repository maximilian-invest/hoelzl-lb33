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

## Live Marktanalyse

Die Anwendung verfügt über einen Live-Markt-Ticker, der aktuelle Makro-Signale für Immobilieninvestments anzeigt:

### Verfügbare Indikatoren:
- **Zinsniveau (EUR)**: MRO, DFR und Euribor 3M von der ECB
- **Inflation**: HICP für Österreich und Eurozone (YoY)
- **Immofonds-Flüsse**: Wöchentliche Nettozuflüsse in europäische Immobilienfonds

### Signal-Engine:
- **Zins-Signal**: Grün ≤ 2.5%, Gelb 2.5-3.5%, Rot > 3.5%
- **Inflation-Signal**: Grün ≤ 2%, Gelb 2-4%, Rot > 4%
- **Fondsflüsse**: Grün > 0, Gelb ≈ 0 (±2%), Rot < 0

### Technische Features:
- Auto-Refresh alle 10 Minuten
- Redis-Caching (optional)
- ETag-basiertes Caching
- Responsive Design mit Ampel-Indikatoren

## Upside-Potenzial

**Berechnungsschritte:**

1. Zusätzlicher Jahresertrag je Szenario:
   - *Mehr Fläche*: `addedSqm × newRentPerSqm × 12 × occupancyPct/100`
   - *Miete erhöhen*: `existingSqm × rentIncreasePerSqm × 12 × occupancyPct/100`
2. Upside-Cashflow = Basis-Cashflow + Σ Zusatzerträge − CapEx im Startjahr
3. `irrDelta = max(0, irrUpside − irrBasis)`
4. `pAvg = Durchschnitt der Wahrscheinlichkeit aller aktiven Upsides`
5. `pWeighted = irrDelta × (pAvg/100)`
6. Gewichtete Differenz in Prozentpunkten `weightedPP = pWeighted × 100`
7. Bonus-Punkte (0..10):
   - `weightedPP < 5` → `weightedPP/5 × 3`
   - `5 ≤ weightedPP < 10` → `3 + (weightedPP−5)/5 × 3`
   - `10 ≤ weightedPP < 15` → `6 + (weightedPP−10)/5 × 4`
   - `≥15` → `10`

Beispiel: Erhöht ein Upside den IRR um 1.5 pp und hat eine Eintrittswahrscheinlichkeit von 50 %, ergibt das `pWeighted = 0.75` pp und damit knapp `0.5` Bonuspunkte.
