"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/InfoTooltip";
import { ExitScenarioReport } from "@/types/exit-scenarios";

// Erweiterter Typ für Export mit Vergleichsdaten
interface ExtendedExitScenarioReport extends ExitScenarioReport {
  vergleich: {
    szenarien: Array<{
      strategie: string;
      exitJahr: number;
      irr: number;
      roi: number;
      npv: number;
      cashOnCashReturn: number;
      totalReturn: number;
      exitWert: number;
      exitKosten: number;
      nettoExitErloes: number;
      steuerlast: number;
      paybackPeriod: number;
      breakEvenJahr: number;
      maxDrawdown: number;
    }>;
    empfehlung: {
      besteStrategie: string;
      risikobewertung: string;
      begruendung: string;
    };
  };
}
import { 
  FileDown, 
  FileText, 
  Download,
  Share2,
  Printer
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface ExitScenarioExportProps {
  report: ExtendedExitScenarioReport;
}

export function ExitScenarioExport({ report }: ExitScenarioExportProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat("de-AT", { 
      style: "currency", 
      currency: "EUR", 
      maximumFractionDigits: 0 
    }).format(value);

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const formatDate = (date: Date) => 
    new Intl.DateTimeFormat("de-AT", {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);

  const getStrategyLabel = (strategy: string) => {
    const labels: { [key: string]: string } = {
      verkauf: "Verkauf",
      refinanzierung: "Refinanzierung", 
      buy_and_hold: "Buy & Hold",
      fix_and_flip: "Fix & Flip",
      exchange_1031: "1031 Exchange",
      wholesaling: "Wholesaling",
      rent_to_own: "Rent-to-Own",
      vererbung: "Vererbung"
    };
    return labels[strategy] || strategy;
  };

  const generateCSV = () => {
    const headers = [
      "Strategie",
      "Exit-Jahr", 
      "IRR (%)",
      "ROI (%)",
      "NPV (€)",
      "Cash-on-Cash Return (%)",
      "Total Return (%)",
      "Exit-Wert (€)",
      "Exit-Kosten (€)",
      "Netto-Exit-Erlös (€)",
      "Steuerlast (€)",
      "Payback Period (Jahre)",
      "Break-Even Jahr",
      "Max Drawdown (%)"
    ];

    const rows = report.vergleich.szenarien.map(szenario => [
      getStrategyLabel(szenario.strategie),
      szenario.exitJahr,
      szenario.irr.toFixed(2),
      szenario.roi.toFixed(2),
      szenario.npv.toFixed(0),
      szenario.cashOnCashReturn.toFixed(2),
      szenario.totalReturn.toFixed(2),
      szenario.exitWert.toFixed(0),
      szenario.exitKosten.toFixed(0),
      szenario.nettoExitErloes.toFixed(0),
      szenario.steuerlast.toFixed(0),
      szenario.paybackPeriod,
      szenario.breakEvenJahr,
      szenario.maxDrawdown.toFixed(2)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `exit-szenarien-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const generatePDF = () => {
    // Erstelle HTML-Inhalt für PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Exit-Szenarien Bericht</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .section h2 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 5px; }
            .section h3 { color: #374151; margin-top: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .warning { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 10px; margin: 10px 0; border-radius: 4px; }
            .recommendation { background-color: #dbeafe; border: 1px solid #3b82f6; padding: 15px; margin: 15px 0; border-radius: 4px; }
            .metric { display: inline-block; margin: 5px 10px 5px 0; }
            .metric-value { font-weight: bold; color: #059669; }
            .footer { margin-top: 40px; font-size: 12px; color: #6b7280; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Exit-Szenarien Bericht</h1>
            <p>Erstellt am: ${formatDate(report.erstelltAm)}</p>
          </div>

          <div class="section">
            <h2>Empfehlung</h2>
            <div class="recommendation">
              <h3>Beste Strategie: ${getStrategyLabel(report.vergleich.empfehlung.besteStrategie)}</h3>
              <p><strong>Risikobewertung:</strong> ${report.vergleich.empfehlung.risikobewertung.toUpperCase()}</p>
              <p><strong>Begründung:</strong> ${report.vergleich.empfehlung.begruendung}</p>
            </div>
          </div>

          <div class="section">
            <h2>Szenario-Vergleich</h2>
            <table>
              <thead>
                <tr>
                  <th>Strategie</th>
                  <th>Exit-Jahr</th>
                  <th>IRR (%)</th>
                  <th>ROI (%)</th>
                  <th>NPV (€)</th>
                  <th>Cash-on-Cash (%)</th>
                  <th>Exit-Wert (€)</th>
                  <th>Netto-Erlös (€)</th>
                </tr>
              </thead>
              <tbody>
                ${report.vergleich.szenarien.map(szenario => `
                  <tr>
                    <td>${getStrategyLabel(szenario.strategie)}</td>
                    <td>${szenario.exitJahr}</td>
                    <td>${formatPercent(szenario.irr)}</td>
                    <td>${formatPercent(szenario.roi)}</td>
                    <td>${formatCurrency(szenario.npv)}</td>
                    <td>${formatPercent(szenario.cashOnCashReturn)}</td>
                    <td>${formatCurrency(szenario.exitWert)}</td>
                    <td>${formatCurrency(szenario.nettoExitErloes)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          ${report.warnings.length > 0 ? `
          <div class="section">
            <h2>Warnungen & Risiken</h2>
            ${report.warnings.map(warning => `
              <div class="warning">
                <h3>${warning.typ.toUpperCase()} - ${warning.schweregrad.toUpperCase()}</h3>
                <p>${warning.nachricht}</p>
                ${warning.empfehlung ? `<p><strong>Empfehlung:</strong> ${warning.empfehlung}</p>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}

          <div class="section">
            <h2>Input-Parameter</h2>
            <table>
              <tr><td>Kaufpreis</td><td>${formatCurrency(report.inputs.kaufpreis)}</td></tr>
              <tr><td>Nebenkosten</td><td>${formatCurrency(report.inputs.nebenkosten)}</td></tr>
              <tr><td>Darlehen Start</td><td>${formatCurrency(report.inputs.darlehenStart)}</td></tr>
              <tr><td>Eigenkapital</td><td>${formatCurrency(report.inputs.eigenkapital)}</td></tr>
              <tr><td>Exit-Jahr</td><td>${report.inputs.exitJahr}</td></tr>
              <tr><td>Wachstumsrate</td><td>${formatPercent(report.inputs.wachstumsrate || 0)}</td></tr>
              <tr><td>Markt-Szenario</td><td>${report.inputs.marktSzenario || "Standard"}</td></tr>
              <tr><td>Steuersatz</td><td>${formatPercent(report.inputs.steuersatz)}</td></tr>
            </table>
          </div>

          <div class="footer">
            <p>Dieser Bericht wurde automatisch generiert. Bitte konsultieren Sie einen Finanzberater für professionelle Beratung.</p>
            <p>© ${new Date().getFullYear()} Immobilienkalkulationstool</p>
          </div>
        </body>
      </html>
    `;

    // Öffne neues Fenster für PDF-Druck
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generateZipPackage = async () => {
    const zip = new JSZip();
    
    // CSV-Datei hinzufügen
    const csvContent = generateCSVContent();
    zip.file("exit-szenarien.csv", csvContent);
    
    // JSON-Datei hinzufügen
    const jsonContent = JSON.stringify(report, null, 2);
    zip.file("exit-szenarien.json", jsonContent);
    
    // HTML-Bericht hinzufügen
    const htmlContent = generateHTMLContent();
    zip.file("exit-szenarien.html", htmlContent);
    
    // ZIP generieren und herunterladen
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `exit-szenarien-package-${new Date().toISOString().split('T')[0]}.zip`);
  };

  const generateCSVContent = () => {
    const headers = [
      "Strategie", "Exit-Jahr", "IRR (%)", "ROI (%)", "NPV (€)", 
      "Cash-on-Cash Return (%)", "Total Return (%)", "Exit-Wert (€)", 
      "Exit-Kosten (€)", "Netto-Exit-Erlös (€)", "Steuerlast (€)", 
      "Payback Period (Jahre)", "Break-Even Jahr", "Max Drawdown (%)"
    ];

    const rows = report.vergleich.szenarien.map(szenario => [
      getStrategyLabel(szenario.strategie),
      szenario.exitJahr,
      szenario.irr.toFixed(2),
      szenario.roi.toFixed(2),
      szenario.npv.toFixed(0),
      szenario.cashOnCashReturn.toFixed(2),
      szenario.totalReturn.toFixed(2),
      szenario.exitWert.toFixed(0),
      szenario.exitKosten.toFixed(0),
      szenario.nettoExitErloes.toFixed(0),
      szenario.steuerlast.toFixed(0),
      szenario.paybackPeriod,
      szenario.breakEvenJahr,
      szenario.maxDrawdown.toFixed(2)
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");
  };

  const generateHTMLContent = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Exit-Szenarien Bericht</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .section h2 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .warning { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 10px; margin: 10px 0; border-radius: 4px; }
            .recommendation { background-color: #dbeafe; border: 1px solid #3b82f6; padding: 15px; margin: 15px 0; border-radius: 4px; }
            .footer { margin-top: 40px; font-size: 12px; color: #6b7280; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Exit-Szenarien Bericht</h1>
            <p>Erstellt am: ${formatDate(report.erstelltAm)}</p>
          </div>
          
          <div class="section">
            <h2>Empfehlung</h2>
            <div class="recommendation">
              <h3>Beste Strategie: ${getStrategyLabel(report.vergleich.empfehlung.besteStrategie)}</h3>
              <p><strong>Risikobewertung:</strong> ${report.vergleich.empfehlung.risikobewertung.toUpperCase()}</p>
              <p><strong>Begründung:</strong> ${report.vergleich.empfehlung.begruendung}</p>
            </div>
          </div>
          
          <div class="section">
            <h2>Szenario-Vergleich</h2>
            <table>
              <thead>
                <tr>
                  <th>Strategie</th>
                  <th>IRR (%)</th>
                  <th>ROI (%)</th>
                  <th>NPV (€)</th>
                  <th>Exit-Wert (€)</th>
                  <th>Netto-Erlös (€)</th>
                </tr>
              </thead>
              <tbody>
                ${report.vergleich.szenarien.map(szenario => `
                  <tr>
                    <td>${getStrategyLabel(szenario.strategie)}</td>
                    <td>${formatPercent(szenario.irr)}</td>
                    <td>${formatPercent(szenario.roi)}</td>
                    <td>${formatCurrency(szenario.npv)}</td>
                    <td>${formatCurrency(szenario.exitWert)}</td>
                    <td>${formatCurrency(szenario.nettoExitErloes)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            <p>Dieser Bericht wurde automatisch generiert. Bitte konsultieren Sie einen Finanzberater für professionelle Beratung.</p>
          </div>
        </body>
      </html>
    `;
  };

  const shareReport = async () => {
    if (navigator.share) {
      try {
        const csvContent = generateCSVContent();
        const blob = new Blob([csvContent], { type: "text/csv" });
        const file = new File([blob], "exit-szenarien.csv", { type: "text/csv" });
        
        await navigator.share({
          title: "Exit-Szenarien Bericht",
          text: "Hier ist mein Exit-Szenarien Bericht für die Immobilieninvestition",
          files: [file]
        });
      } catch (error) {
        console.log("Sharing failed:", error);
      }
    } else {
      // Fallback: Kopiere Bericht in Zwischenablage
      const summary = `
Exit-Szenarien Bericht
Erstellt: ${formatDate(report.erstelltAm)}

Empfehlung: ${getStrategyLabel(report.vergleich.empfehlung.besteStrategie)}
Risiko: ${report.vergleich.empfehlung.risikobewertung.toUpperCase()}

Szenario-Vergleich:
${report.vergleich.szenarien.map(s => 
  `${getStrategyLabel(s.strategie)}: IRR ${formatPercent(s.irr)}, ROI ${formatPercent(s.roi)}, NPV ${formatCurrency(s.npv)}`
).join('\n')}
      `;
      
      navigator.clipboard.writeText(summary).then(() => {
        alert("Bericht in Zwischenablage kopiert!");
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileDown className="h-5 w-5" />
          Export & Berichte
          <InfoTooltip content="Exportieren Sie Ihre Exit-Szenarien in verschiedenen Formaten. Verfügbare Formate: PDF-Bericht, Excel-Tabelle, CSV-Daten" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            onClick={generateCSV}
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto p-4"
          >
            <FileText className="h-6 w-6" />
            <span>CSV Export</span>
            <span className="text-xs text-gray-500">Tabellendaten</span>
          </Button>

          <Button 
            onClick={generatePDF}
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto p-4"
          >
            <Printer className="h-6 w-6" />
            <span>PDF Bericht</span>
            <span className="text-xs text-gray-500">Drucken/Speichern</span>
          </Button>

          <Button 
            onClick={generateZipPackage}
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto p-4"
          >
            <Download className="h-6 w-6" />
            <span>ZIP Package</span>
            <span className="text-xs text-gray-500">Alle Formate</span>
          </Button>

          <Button 
            onClick={shareReport}
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto p-4"
          >
            <Share2 className="h-6 w-6" />
            <span>Teilen</span>
            <span className="text-xs text-gray-500">Bericht teilen</span>
          </Button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Export-Optionen:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li><strong>CSV:</strong> Tabellendaten für Excel/Google Sheets</li>
            <li><strong>PDF:</strong> Formatierter Bericht zum Drucken</li>
            <li><strong>ZIP:</strong> Alle Formate in einem Paket</li>
            <li><strong>Teilen:</strong> Bericht per E-Mail oder Messaging teilen</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

