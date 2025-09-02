# Exit Scenarios Feature - Architektur

## Übersicht

Das Exit Scenarios Feature ermöglicht es Benutzern, verschiedene Exit-Strategien für Immobilieninvestitionen zu planen und zu vergleichen.

## Architektur-Diagramm

```
┌─────────────────────────────────────────────────────────────────┐
│                    Exit Scenarios Feature                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   UI Layer      │    │  Business Logic │    │  Data Layer  │ │
│  │                 │    │                 │    │              │ │
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌──────────┐ │ │
│  │ │    Form     │ │    │ │ Calculations│ │    │ │   Types  │ │ │
│  │ │             │ │    │ │             │ │    │ │          │ │ │
│  │ │ • Inputs    │ │    │ │ • IRR       │ │    │ │ • Inputs │ │ │
│  │ │ • Validation│ │    │ │ • ROI       │ │    │ │ • Results│ │ │
│  │ │ • Sections  │ │    │ │ • NPV       │ │    │ │ • Reports│ │ │
│  │ └─────────────┘ │    │ │ • Cashflows │ │    │ └──────────┘ │ │
│  │                 │    │ └─────────────┘ │    │              │ │
│  │ ┌─────────────┐ │    │                 │    │              │ │
│  │ │   Results   │ │    │ ┌─────────────┐ │    │              │ │
│  │ │             │ │    │ │ Strategies  │ │    │              │ │
│  │ │ • Comparison│ │    │ │             │ │    │              │ │
│  │ │ • Warnings  │ │    │ │ • Verkauf   │ │    │              │ │
│  │ │ • Metrics   │ │    │ │ • Refinanz. │ │    │              │ │
│  │ └─────────────┘ │    │ │ • Buy&Hold  │ │    │              │ │
│  │                 │    │ │ • Fix&Flip  │ │    │              │ │
│  │ ┌─────────────┐ │    │ └─────────────┘ │    │              │ │
│  │ │   Charts    │ │    │                 │    │              │ │
│  │ │             │ │    │ ┌─────────────┐ │    │              │ │
│  │ │ • Cashflow  │ │    │ │ Sensitivity │ │    │              │ │
│  │ │ • IRR Comp. │ │    │ │ Analysis    │ │    │              │ │
│  │ │ • Sensitivity│ │    │ │             │ │    │              │ │
│  │ └─────────────┘ │    │ └─────────────┘ │    │              │ │
│  │                 │    │                 │    │              │ │
│  │ ┌─────────────┐ │    │                 │    │              │ │
│  │ │   Export    │ │    │                 │    │              │ │
│  │ │             │ │    │                 │    │              │ │
│  │ │ • CSV       │ │    │                 │    │              │ │
│  │ │ • PDF       │ │    │                 │    │              │ │
│  │ │ • ZIP       │ │    │                 │    │              │ │
│  │ │ • Share     │ │    │                 │    │              │ │
│  │ └─────────────┘ │    │                 │    │              │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Komponenten-Struktur

### 1. Types & Interfaces (`src/types/exit-scenarios.ts`)
- `ExitStrategy`: Enum für verschiedene Exit-Strategien
- `ExitScenarioInputs`: Eingabeparameter für Berechnungen
- `ExitScenarioResult`: Ergebnis einer einzelnen Strategie
- `ExitScenarioComparison`: Vergleich mehrerer Strategien
- `ExitScenarioReport`: Vollständiger Bericht mit Charts

### 2. Business Logic (`src/lib/exit-scenarios.ts`)
- **Hauptfunktionen:**
  - `berechneExitSzenarien()`: Orchestriert alle Berechnungen
  - `berechneVerkaufSzenario()`: Verkaufs-Strategie
  - `berechneRefinanzierungSzenario()`: Refinanzierungs-Strategie
  - `berechneBuyAndHoldSzenario()`: Buy & Hold Strategie
  - `berechneFixAndFlipSzenario()`: Fix & Flip Strategie

- **Hilfsfunktionen:**
  - `berechneImmobilienwert()`: Wertentwicklung über Zeit
  - `berechneVerkaufskosten()`: Transaktionskosten
  - `berechneKapitalertragssteuer()`: Steuerberechnung
  - `berechneSensitivitaet()`: Risiko-Analyse

### 3. UI Components (`src/components/ExitScenarios/`)

#### Form.tsx
- Eingabeformular mit kollabierbaren Sektionen
- Validierung der Eingabedaten
- Auto-Suggestions basierend auf bestehenden Daten

#### Results.tsx
- Tabellarischer Vergleich der Strategien
- Empfehlungen und Warnungen
- Detaillierte Kennzahlen pro Strategie

#### Charts.tsx
- Cashflow-Verläufe (jährlich und kumuliert)
- IRR/ROI-Vergleich
- Sensitivitätsanalyse
- Interaktive Recharts-Visualisierungen

#### Export.tsx
- CSV-Export für Excel/Google Sheets
- PDF-Bericht zum Drucken
- ZIP-Package mit allen Formaten
- Sharing-Funktionalität

#### index.tsx
- Hauptkomponente mit Navigation
- State-Management
- Integration aller Sub-Komponenten

## Datenfluss

```
1. User Input (Form) 
   ↓
2. Validation & Processing
   ↓
3. Business Logic Calculations
   ↓
4. Results Generation
   ↓
5. Visualization (Charts)
   ↓
6. Export Options
```

## Integration in Haupt-App

- **TopBar**: Neuer "Exit-Szenarien" Button
- **Modal**: Vollbild-Modal für die Analyse
- **Data Transfer**: Automatische Übertragung der aktuellen Kalkulationsdaten
- **State Management**: Lokaler State für Modal-Sichtbarkeit

## Unterstützte Exit-Strategien

1. **Verkauf**: Direkter Verkauf mit Wertsteigerung
2. **Refinanzierung**: Kapitalfreisetzung ohne Verkauf
3. **Buy & Hold**: Langfristige Haltung mit Verkauf
4. **Fix & Flip**: Renovierung und schneller Verkauf
5. **1031 Exchange**: Steueroptimierter Tausch (US)
6. **Wholesaling**: Weiterverkauf ohne Renovierung
7. **Rent-to-Own**: Miete mit Kaufoption
8. **Vererbung**: Langfristige Haltung

## Berechnete Kennzahlen

- **IRR** (Interne Rendite)
- **ROI** (Return on Investment)
- **NPV** (Net Present Value)
- **Cash-on-Cash Return**
- **Payback Period**
- **Break-Even Jahr**
- **Max Drawdown**
- **Sensitivitätsanalyse**

## Technische Features

- **Responsive Design**: Mobile-optimiert
- **Dark Mode**: Unterstützung für Dark/Light Theme
- **Accessibility**: ARIA-Labels und Keyboard-Navigation
- **Performance**: Optimierte Berechnungen
- **Error Handling**: Robuste Fehlerbehandlung
- **TypeScript**: Vollständige Typisierung
- **Testing**: Jest-Tests für Business Logic

## Sicherheitshinweise

- Alle Berechnungen sind Schätzungen
- Keine Garantien für Renditen
- Professionelle Beratung empfohlen
- Steuerliche Aspekte können variieren
- Marktrisiken nicht vollständig abbildbar

