import { HouseholdCalcResult } from '@/types/household';

// Formatierung für EUR
const formatEUR = (amount: number) => 
  new Intl.NumberFormat('de-AT', { 
    style: 'currency', 
    currency: 'EUR',
    maximumFractionDigits: 0 
  }).format(amount);


/**
 * Exportiert die Haushaltsrechnung als JSON
 */
export function exportToJSON(result: HouseholdCalcResult): void {
  const dataStr = JSON.stringify(result, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `haushaltsrechnung_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exportiert die Haushaltsrechnung als CSV
 */
export function exportToCSV(result: HouseholdCalcResult): void {
  const { inputs, computed, assumptions } = result;
  
  const csvData = [
    // Header
    ['Haushaltsrechnung - Tragfähigkeitsprüfung', ''],
    ['Erstellt am', new Date().toLocaleString('de-AT')],
    [''],
    
    // Entscheidung
    ['ENTSCHEIDUNG', ''],
    ['Tragfähig', computed.overallPass ? 'JA' : 'NEIN'],
    ['Nominal tragfähig', computed.passNominal ? 'JA' : 'NEIN'],
    ['Stress-Test bestanden', computed.passStress ? 'JA' : 'NEIN'],
    [''],
    
    // Haushaltsdaten
    ['HAUSHALTSDATEN', ''],
    ['Erwachsene', inputs.adults],
    ['Kinder', inputs.children],
    [''],
    
    // Einkommen
    ['EINKOMMEN', ''],
    ['Angepasstes Einkommen (€/Monat)', computed.adjustedIncome.toFixed(2)],
    ['Erwerbseinkommen (€/Monat)', inputs.employmentIncomes.reduce((sum, income) => {
      let haircutPct = 0;
      switch (income.employmentType) {
        case 'employee': haircutPct = 0; break;
        case 'selfEmployed': haircutPct = inputs.haircut.selfEmployedPct; break;
        case 'pension': haircutPct = 0; break;
      }
      return sum + income.netMonthly * (1 - haircutPct / 100);
    }, 0).toFixed(2)],
    ['Mieteinkommen (€/Monat)', inputs.rentalIncomes.reduce((sum, income) => 
      sum + income.netMonthly * (1 - inputs.haircut.rentalPct / 100), 0).toFixed(2)],
    ['Sonstige Einkommen (€/Monat)', inputs.otherIncomes.reduce((sum, income) => 
      sum + income.netMonthly * (1 - inputs.haircut.otherPct / 100), 0).toFixed(2)],
    [''],
    
    // Ausgaben
    ['AUSGABEN', ''],
    ['Wohnen (€/Monat)', inputs.rentOrHousingCost.toFixed(2)],
    ['Nebenkosten/Energie (€/Monat)', inputs.utilitiesEnergy.toFixed(2)],
    ['Telekom/Internet (€/Monat)', inputs.telecomInternet.toFixed(2)],
    ['Versicherungen (€/Monat)', inputs.insurance.toFixed(2)],
    ['Transport/Leasing (€/Monat)', inputs.transportLeases.toFixed(2)],
    ['Unterhalt (€/Monat)', inputs.alimony.toFixed(2)],
    ['Sonstige Fixkosten (€/Monat)', inputs.otherFixedExpenses.toFixed(2)],
    ['Bestehende Kredite (€/Monat)', inputs.existingLoans.reduce((sum, loan) => sum + loan.monthlyPayment, 0).toFixed(2)],
    ['Bank-Pauschalen (€/Monat)', ((inputs.adults * inputs.pauschalePerAdult) + (inputs.children * inputs.pauschalePerChild)).toFixed(2)],
    ['Gesamtausgaben (€/Monat)', computed.fixedCosts.toFixed(2)],
    [''],
    
    // Kredit
    ['KREDIT', ''],
    ['Kreditbetrag (€)', inputs.targetLoanAmount.toFixed(2)],
    ['Nominalzins (% p.a.)', inputs.nominalInterestPct.toFixed(2)],
    ['Laufzeit (Jahre)', inputs.termYears],
    ['Annuität nominal (€/Monat)', computed.annuity.toFixed(2)],
    ['Annuität Stress-Test (€/Monat)', computed.annuityStress.toFixed(2)],
    [''],
    
    // Kennzahlen
    ['KENNZAHLEN', ''],
    ['Überschuss vor Kredit (€/Monat)', computed.surplus.toFixed(2)],
    ['DSCR', computed.dscr.toFixed(2)],
    ['Puffer nominal (€/Monat)', computed.bufferAfterNominal.toFixed(2)],
    ['Puffer Stress-Test (€/Monat)', computed.bufferAfterStress.toFixed(2)],
    ['Max. Kreditbetrag (€)', computed.maxLoan.toFixed(2)],
    ['Anteil Fixkosten (%)', computed.fixedCostShare.toFixed(2)],
    [''],
    
    // Annahmen
    ['ANNAHMEN', ''],
    ['Pauschale pro Erwachsener (€/Monat)', assumptions.pauschalePerAdult.toFixed(2)],
    ['Pauschale pro Kind (€/Monat)', assumptions.pauschalePerChild.toFixed(2)],
    ['Haircut Selbständige (%)', assumptions.haircut.selfEmployedPct.toFixed(2)],
    ['Haircut Mieteinkommen (%)', assumptions.haircut.rentalPct.toFixed(2)],
    ['Haircut Sonstige (%)', assumptions.haircut.otherPct.toFixed(2)],
    ['Stress-Zins-Add (% p.a.)', assumptions.stressInterestAddPct.toFixed(2)],
    ['Mindestpuffer (€/Monat)', assumptions.minMonthlyBuffer.toFixed(2)],
  ];
  
  const csvContent = csvData.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `haushaltsrechnung_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exportiert die Haushaltsrechnung als PDF
 */
export function exportToPDF(result: HouseholdCalcResult): void {
  // Da react-pdf möglicherweise nicht installiert ist, verwenden wir eine einfache HTML-zu-PDF Lösung
  // In einer echten Implementierung würde man react-pdf oder jsPDF verwenden
  
  const { inputs, computed, assumptions } = result;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Haushaltsrechnung - Tragfähigkeitsprüfung</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .section { margin-bottom: 25px; }
            .section h2 { background-color: #f5f5f5; padding: 8px; margin-bottom: 10px; border-left: 4px solid #333; }
            .decision { padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .decision.pass { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
            .decision.fail { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
            .decision.warning { background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .number { text-align: right; }
            .footer { margin-top: 30px; font-size: 0.8em; color: #666; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Haushaltsrechnung - Tragfähigkeitsprüfung</h1>
            <p>Erstellt am: ${new Date().toLocaleString('de-AT')}</p>
        </div>
        
        <div class="section">
            <h2>Entscheidung</h2>
            <div class="decision ${computed.overallPass ? 'pass' : computed.passNominal ? 'warning' : 'fail'}">
                <h3>${computed.overallPass ? '✅ TRAGFÄHIG' : computed.passNominal ? '⚠️ BEDINGT TRAGFÄHIG' : '❌ NICHT TRAGFÄHIG'}</h3>
                <p>
                    ${computed.overallPass 
                        ? 'Der Kredit ist tragfähig. Sowohl der nominale als auch der Stress-Test wurden bestanden.'
                        : computed.passNominal 
                            ? 'Der Kredit ist nominal tragfähig, aber der Stress-Test wurde nicht bestanden.'
                            : 'Der Kredit ist nicht tragfähig. Der nominale Test wurde nicht bestanden.'
                    }
                </p>
            </div>
        </div>
        
        <div class="section">
            <h2>Haushaltsdaten</h2>
            <table>
                <tr><td>Erwachsene</td><td class="number">${inputs.adults}</td></tr>
                <tr><td>Kinder</td><td class="number">${inputs.children}</td></tr>
            </table>
        </div>
        
        <div class="section">
            <h2>Einkommen (nach Haircuts)</h2>
            <table>
                <tr><td>Angepasstes Einkommen</td><td class="number">${formatEUR(computed.adjustedIncome)}</td></tr>
                <tr><td>Erwerbseinkommen</td><td class="number">${formatEUR(inputs.employmentIncomes.reduce((sum, income) => {
                  let haircutPct = 0;
                  switch (income.employmentType) {
                    case 'employee': haircutPct = 0; break;
                    case 'selfEmployed': haircutPct = inputs.haircut.selfEmployedPct; break;
                    case 'pension': haircutPct = 0; break;
                  }
                  return sum + income.netMonthly * (1 - haircutPct / 100);
                }, 0))}</td></tr>
                <tr><td>Mieteinkommen</td><td class="number">${formatEUR(inputs.rentalIncomes.reduce((sum, income) => 
                  sum + income.netMonthly * (1 - inputs.haircut.rentalPct / 100), 0))}</td></tr>
                <tr><td>Sonstige Einkommen</td><td class="number">${formatEUR(inputs.otherIncomes.reduce((sum, income) => 
                  sum + income.netMonthly * (1 - inputs.haircut.otherPct / 100), 0))}</td></tr>
            </table>
        </div>
        
        <div class="section">
            <h2>Ausgaben</h2>
            <table>
                <tr><td>Wohnen</td><td class="number">${formatEUR(inputs.rentOrHousingCost)}</td></tr>
                <tr><td>Nebenkosten/Energie</td><td class="number">${formatEUR(inputs.utilitiesEnergy)}</td></tr>
                <tr><td>Telekom/Internet</td><td class="number">${formatEUR(inputs.telecomInternet)}</td></tr>
                <tr><td>Versicherungen</td><td class="number">${formatEUR(inputs.insurance)}</td></tr>
                <tr><td>Transport/Leasing</td><td class="number">${formatEUR(inputs.transportLeases)}</td></tr>
                <tr><td>Unterhalt</td><td class="number">${formatEUR(inputs.alimony)}</td></tr>
                <tr><td>Sonstige Fixkosten</td><td class="number">${formatEUR(inputs.otherFixedExpenses)}</td></tr>
                <tr><td>Bestehende Kredite</td><td class="number">${formatEUR(inputs.existingLoans.reduce((sum, loan) => sum + loan.monthlyPayment, 0))}</td></tr>
                <tr><td>Bank-Pauschalen</td><td class="number">${formatEUR((inputs.adults * inputs.pauschalePerAdult) + (inputs.children * inputs.pauschalePerChild))}</td></tr>
                <tr><th>Gesamtausgaben</th><th class="number">${formatEUR(computed.fixedCosts)}</th></tr>
            </table>
        </div>
        
        <div class="section">
            <h2>Kredit</h2>
            <table>
                <tr><td>Kreditbetrag</td><td class="number">${formatEUR(inputs.targetLoanAmount)}</td></tr>
                <tr><td>Nominalzins</td><td class="number">${inputs.nominalInterestPct}% p.a.</td></tr>
                <tr><td>Laufzeit</td><td class="number">${inputs.termYears} Jahre</td></tr>
                <tr><td>Annuität (nominal)</td><td class="number">${formatEUR(computed.annuity)}</td></tr>
                <tr><td>Annuität (Stress-Test)</td><td class="number">${formatEUR(computed.annuityStress)}</td></tr>
            </table>
        </div>
        
        <div class="section">
            <h2>Kennzahlen</h2>
            <table>
                <tr><td>Überschuss vor Kredit</td><td class="number">${formatEUR(computed.surplus)}</td></tr>
                <tr><td>DSCR</td><td class="number">${computed.dscr.toFixed(2)}</td></tr>
                <tr><td>Puffer nominal</td><td class="number">${formatEUR(computed.bufferAfterNominal)}</td></tr>
                <tr><td>Puffer Stress-Test</td><td class="number">${formatEUR(computed.bufferAfterStress)}</td></tr>
                <tr><td>Max. Kreditbetrag</td><td class="number">${formatEUR(computed.maxLoan)}</td></tr>
                <tr><td>Anteil Fixkosten</td><td class="number">${computed.fixedCostShare.toFixed(1)}%</td></tr>
            </table>
        </div>
        
        <div class="section">
            <h2>Annahmen</h2>
            <table>
                <tr><td>Pauschale pro Erwachsener</td><td class="number">${formatEUR(assumptions.pauschalePerAdult)}/Monat</td></tr>
                <tr><td>Pauschale pro Kind</td><td class="number">${formatEUR(assumptions.pauschalePerChild)}/Monat</td></tr>
                <tr><td>Haircut Selbständige</td><td class="number">${assumptions.haircut.selfEmployedPct}%</td></tr>
                <tr><td>Haircut Mieteinkommen</td><td class="number">${assumptions.haircut.rentalPct}%</td></tr>
                <tr><td>Haircut Sonstige</td><td class="number">${assumptions.haircut.otherPct}%</td></tr>
                <tr><td>Stress-Zins-Add</td><td class="number">${assumptions.stressInterestAddPct}% p.a.</td></tr>
                <tr><td>Mindestpuffer</td><td class="number">${formatEUR(assumptions.minMonthlyBuffer)}/Monat</td></tr>
            </table>
        </div>
        
        <div class="footer">
            <p>Diese Berechnung dient nur als Orientierungshilfe. Die tatsächliche Kreditvergabe hängt von weiteren Faktoren ab, die von der Bank geprüft werden.</p>
        </div>
    </body>
    </html>
  `;
  
  // Erstelle ein neues Fenster für den PDF-Export
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Warte kurz, dann drucke
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}

