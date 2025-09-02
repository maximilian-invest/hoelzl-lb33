"""
Exit Scenarios Analysis Tool - Streamlit Version
Ein umfassendes Tool zur Analyse von Exit-Strategien für Immobilieninvestitionen
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import json
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

# Page Configuration
st.set_page_config(
    page_title="Exit Scenarios Analyzer",
    page_icon="🏠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 2rem;
    }
    .metric-card {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 4px solid #1f77b4;
    }
    .warning-box {
        background-color: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 0.5rem;
        padding: 1rem;
        margin: 1rem 0;
    }
    .success-box {
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        border-radius: 0.5rem;
        padding: 1rem;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

class ExitScenarioCalculator:
    """Hauptklasse für Exit-Szenario-Berechnungen"""
    
    def __init__(self):
        self.strategies = {
            "Verkauf": "verkauf",
            "Refinanzierung": "refinanzierung", 
            "Buy & Hold": "buy_and_hold",
            "Fix & Flip": "fix_and_flip",
            "1031 Exchange": "exchange_1031",
            "Wholesaling": "wholesaling",
            "Rent-to-Own": "rent_to_own",
            "Vererbung": "vererbung"
        }
        
        self.market_scenarios = {
            "Bullenmarkt (+20%)": "bull",
            "Basis-Szenario": "base", 
            "Bärenmarkt (-40%)": "bear"
        }
    
    def calculate_property_value(self, purchase_price: float, growth_rate: float, 
                               years: int, market_scenario: str = "base") -> float:
        """Berechnet den Immobilienwert nach n Jahren"""
        effective_growth = growth_rate
        
        if market_scenario == "bull":
            effective_growth *= 1.2
        elif market_scenario == "bear":
            effective_growth *= 0.6
            
        return purchase_price * (1 + effective_growth / 100) ** years
    
    def calculate_sale_costs(self, sale_price: float, broker_fee: float, 
                           notary_costs: float, transfer_tax: float) -> float:
        """Berechnet Verkaufskosten"""
        return sale_price * (broker_fee / 100) + notary_costs + transfer_tax
    
    def calculate_capital_gains_tax(self, sale_price: float, purchase_price: float,
                                  acquisition_costs: float, depreciation: float,
                                  holding_period: int, tax_rate: float) -> float:
        """Berechnet Kapitalertragssteuer"""
        acquisition_value = purchase_price + acquisition_costs
        book_value = acquisition_value - (depreciation * holding_period)
        gain = sale_price - book_value
        return max(0, gain * (tax_rate / 100))
    
    def calculate_irr(self, cashflows: List[float], guess: float = 0.1) -> float:
        """Berechnet IRR mit Newton-Raphson Methode"""
        rate = guess
        for _ in range(1000):
            npv = 0
            dnpv = 0
            for t, cf in enumerate(cashflows):
                denom = (1 + rate) ** t
                npv += cf / denom
                dnpv -= (t * cf) / (denom * (1 + rate))
            
            if dnpv == 0:
                break
                
            new_rate = rate - npv / dnpv
            if not np.isfinite(new_rate):
                break
            if abs(new_rate - rate) < 1e-7:
                return new_rate
            rate = new_rate
            
        return rate if np.isfinite(rate) else 0
    
    def calculate_sale_scenario(self, inputs: Dict) -> Dict:
        """Berechnet Verkaufs-Szenario"""
        sale_price = inputs.get('sale_price') or self.calculate_property_value(
            inputs['purchase_price'], inputs['growth_rate'], 
            inputs['exit_year'], inputs['market_scenario']
        )
        
        sale_costs = self.calculate_sale_costs(
            sale_price, inputs['broker_fee'], 
            inputs['notary_costs'], inputs['transfer_tax']
        )
        
        tax_liability = self.calculate_capital_gains_tax(
            sale_price, inputs['purchase_price'], inputs['acquisition_costs'],
            inputs['depreciation'], inputs['exit_year'], inputs['tax_rate']
        )
        
        net_proceeds = sale_price - sale_costs - tax_liability
        
        # Jährliche Cashflows
        annual_cashflows = [-inputs['equity'] - inputs['acquisition_costs']]
        for year in range(1, inputs['exit_year'] + 1):
            annual_income = inputs.get('annual_rent', 30000)
            annual_expenses = inputs.get('annual_expenses', 8000)
            annual_interest = inputs.get('annual_interest', 16000)
            annual_principal = inputs.get('annual_principal', 20000)
            
            cashflow = annual_income - annual_expenses - annual_interest - annual_principal
            annual_cashflows.append(cashflow)
        
        # Exit-Cashflow hinzufügen
        annual_cashflows[-1] += net_proceeds
        
        # Kennzahlen berechnen
        irr = self.calculate_irr(annual_cashflows) * 100
        total_return = (net_proceeds - inputs['equity']) / inputs['equity'] * 100
        cash_on_cash = total_return / inputs['exit_year']
        
        # NPV berechnen
        discount_rate = 0.05
        npv = sum(cf / (1 + discount_rate) ** i for i, cf in enumerate(annual_cashflows))
        
        return {
            'strategy': 'Verkauf',
            'exit_year': inputs['exit_year'],
            'irr': irr,
            'roi': total_return,
            'npv': npv,
            'cash_on_cash_return': cash_on_cash,
            'exit_value': sale_price,
            'exit_costs': sale_costs,
            'net_proceeds': net_proceeds,
            'tax_liability': tax_liability,
            'annual_cashflows': annual_cashflows,
            'cumulative_cashflows': np.cumsum(annual_cashflows).tolist()
        }
    
    def calculate_refinancing_scenario(self, inputs: Dict) -> Dict:
        """Berechnet Refinanzierungs-Szenario"""
        current_value = self.calculate_property_value(
            inputs['purchase_price'], inputs['growth_rate'],
            inputs['exit_year'], inputs['market_scenario']
        )
        
        new_loan_amount = current_value * (inputs.get('payout_ratio', 70) / 100)
        remaining_loan = inputs['initial_loan'] - sum(
            inputs.get('annual_principal', 20000) for _ in range(inputs['exit_year'])
        )
        payout = new_loan_amount - remaining_loan
        
        # Jährliche Cashflows
        annual_cashflows = [-inputs['equity'] - inputs['acquisition_costs']]
        for year in range(1, inputs['exit_year'] + 1):
            annual_income = inputs.get('annual_rent', 30000)
            annual_expenses = inputs.get('annual_expenses', 8000)
            annual_interest = inputs.get('annual_interest', 16000)
            annual_principal = inputs.get('annual_principal', 20000)
            
            cashflow = annual_income - annual_expenses - annual_interest - annual_principal
            annual_cashflows.append(cashflow)
        
        # Exit-Cashflow (Auszahlung) hinzufügen
        annual_cashflows[-1] += payout
        
        # Kennzahlen berechnen
        irr = self.calculate_irr(annual_cashflows) * 100
        total_return = (payout - inputs['equity']) / inputs['equity'] * 100
        cash_on_cash = total_return / inputs['exit_year']
        
        discount_rate = 0.05
        npv = sum(cf / (1 + discount_rate) ** i for i, cf in enumerate(annual_cashflows))
        
        return {
            'strategy': 'Refinanzierung',
            'exit_year': inputs['exit_year'],
            'irr': irr,
            'roi': total_return,
            'npv': npv,
            'cash_on_cash_return': cash_on_cash,
            'exit_value': current_value,
            'exit_costs': 0,
            'net_proceeds': payout,
            'tax_liability': 0,
            'annual_cashflows': annual_cashflows,
            'cumulative_cashflows': np.cumsum(annual_cashflows).tolist()
        }
    
    def calculate_fix_flip_scenario(self, inputs: Dict) -> Dict:
        """Berechnet Fix & Flip Szenario"""
        renovation_months = inputs.get('renovation_duration', 6)
        renovation_years = renovation_months / 12
        
        # Wertsteigerung durch Renovierung
        value_increase = inputs.get('renovation_costs', 50000) * 1.5  # 50% ROI
        sale_price = inputs['purchase_price'] + value_increase
        
        sale_costs = self.calculate_sale_costs(
            sale_price, inputs['broker_fee'],
            inputs['notary_costs'], inputs['transfer_tax']
        )
        
        tax_liability = self.calculate_capital_gains_tax(
            sale_price, inputs['purchase_price'], inputs['acquisition_costs'],
            inputs['depreciation'], renovation_years, inputs['tax_rate']
        )
        
        net_proceeds = sale_price - sale_costs - tax_liability - inputs.get('renovation_costs', 50000)
        
        # Cashflows: Initiale Investition + Renovierung, dann Verkauf
        annual_cashflows = [
            -inputs['equity'] - inputs['acquisition_costs'] - inputs.get('renovation_costs', 50000),
            net_proceeds
        ]
        
        # Kennzahlen berechnen
        irr = self.calculate_irr(annual_cashflows) * 100
        total_return = (net_proceeds - inputs['equity']) / inputs['equity'] * 100
        cash_on_cash = total_return / renovation_years
        
        discount_rate = 0.05
        npv = sum(cf / (1 + discount_rate) ** i for i, cf in enumerate(annual_cashflows))
        
        return {
            'strategy': 'Fix & Flip',
            'exit_year': renovation_years,
            'irr': irr,
            'roi': total_return,
            'npv': npv,
            'cash_on_cash_return': cash_on_cash,
            'exit_value': sale_price,
            'exit_costs': sale_costs + inputs.get('renovation_costs', 50000),
            'net_proceeds': net_proceeds,
            'tax_liability': tax_liability,
            'annual_cashflows': annual_cashflows,
            'cumulative_cashflows': np.cumsum(annual_cashflows).tolist()
        }
    
    def calculate_all_scenarios(self, inputs: Dict) -> List[Dict]:
        """Berechnet alle verfügbaren Szenarien"""
        scenarios = []
        
        # Verkauf
        scenarios.append(self.calculate_sale_scenario(inputs))
        
        # Refinanzierung (nur wenn Parameter vorhanden)
        if inputs.get('new_interest_rate') and inputs.get('new_term'):
            scenarios.append(self.calculate_refinancing_scenario(inputs))
        
        # Fix & Flip (nur wenn Renovierungsparameter vorhanden)
        if inputs.get('renovation_costs') and inputs.get('renovation_duration'):
            scenarios.append(self.calculate_fix_flip_scenario(inputs))
        
        return scenarios
    
    def generate_warnings(self, scenarios: List[Dict]) -> List[Dict]:
        """Generiert Warnungen basierend auf den Ergebnissen"""
        warnings = []
        
        # Niedrige IRR
        low_irr = [s for s in scenarios if s['irr'] < 5]
        if low_irr:
            warnings.append({
                'type': 'risiko',
                'severity': 'hoch',
                'message': 'Niedrige IRR-Werte (<5%) deuten auf unattraktive Renditen hin.',
                'recommendation': 'Überprüfen Sie die Investitionsparameter oder erwägen Sie alternative Strategien.'
            })
        
        # Negative Cashflows
        negative_cashflows = [s for s in scenarios if any(cf < 0 for cf in s['annual_cashflows'][1:])]
        if negative_cashflows:
            warnings.append({
                'type': 'liquiditaet',
                'severity': 'mittel',
                'message': 'Einige Szenarien zeigen negative Cashflows in bestimmten Jahren.',
                'recommendation': 'Stellen Sie ausreichende Liquiditätsreserven für diese Perioden bereit.'
            })
        
        # Hohe Steuerlast
        high_tax = [s for s in scenarios if s['tax_liability'] > s['net_proceeds'] * 0.3]
        if high_tax:
            warnings.append({
                'type': 'steuer',
                'severity': 'mittel',
                'message': 'Hohe Steuerlast (>30% des Nettoerlöses) reduziert die Rendite erheblich.',
                'recommendation': 'Erwägen Sie steueroptimierte Exit-Strategien wie Refinanzierung.'
            })
        
        return warnings

def main():
    """Hauptfunktion der Streamlit-App"""
    
    # Header
    st.markdown('<h1 class="main-header">🏠 Exit Scenarios Analyzer</h1>', unsafe_allow_html=True)
    st.markdown("**Ein umfassendes Tool zur Analyse von Exit-Strategien für Immobilieninvestitionen**")
    
    # Sidebar für Eingaben
    st.sidebar.header("📊 Eingabeparameter")
    
    # Grunddaten
    st.sidebar.subheader("Grunddaten")
    purchase_price = st.sidebar.number_input("Kaufpreis (€)", min_value=0, value=500000, step=10000)
    acquisition_costs = st.sidebar.number_input("Nebenkosten (€)", min_value=0, value=25000, step=1000)
    initial_loan = st.sidebar.number_input("Darlehen Start (€)", min_value=0, value=400000, step=10000)
    equity = st.sidebar.number_input("Eigenkapital (€)", min_value=0, value=125000, step=10000)
    
    # Exit-Parameter
    st.sidebar.subheader("Exit-Parameter")
    exit_year = st.sidebar.slider("Exit-Jahr", min_value=1, max_value=30, value=10)
    market_scenario = st.sidebar.selectbox("Markt-Szenario", list(calculator.market_scenarios.keys()))
    growth_rate = st.sidebar.slider("Wachstumsrate p.a. (%)", min_value=0.0, max_value=10.0, value=3.0, step=0.1)
    
    # Verkaufs-Parameter
    st.sidebar.subheader("Verkaufs-Parameter")
    sale_price = st.sidebar.number_input("Verkäuferpreis (€) - optional", min_value=0, value=0, step=10000)
    broker_fee = st.sidebar.slider("Maklerprovision (%)", min_value=0.0, max_value=10.0, value=5.0, step=0.1)
    notary_costs = st.sidebar.number_input("Notarkosten (€)", min_value=0, value=5000, step=500)
    transfer_tax = st.sidebar.number_input("Grunderwerbsteuer (€)", min_value=0, value=15000, step=1000)
    
    # Refinanzierungs-Parameter
    st.sidebar.subheader("Refinanzierungs-Parameter")
    new_interest_rate = st.sidebar.number_input("Neue Zinsrate (%)", min_value=0.0, max_value=10.0, value=4.0, step=0.1)
    new_term = st.sidebar.number_input("Neue Laufzeit (Jahre)", min_value=1, max_value=30, value=20)
    payout_ratio = st.sidebar.slider("Auszahlungsquote (%)", min_value=0, max_value=100, value=70)
    
    # Renovierungs-Parameter
    st.sidebar.subheader("Renovierungs-Parameter")
    renovation_costs = st.sidebar.number_input("Renovierungskosten (€)", min_value=0, value=50000, step=5000)
    renovation_duration = st.sidebar.slider("Renovierungsdauer (Monate)", min_value=1, max_value=24, value=6)
    
    # Steuer-Parameter
    st.sidebar.subheader("Steuer-Parameter")
    tax_rate = st.sidebar.slider("Steuersatz (%)", min_value=0.0, max_value=50.0, value=25.0, step=0.1)
    depreciation = st.sidebar.slider("Abschreibung p.a. (%)", min_value=0.0, max_value=5.0, value=2.0, step=0.1)
    
    # Cashflow-Parameter
    st.sidebar.subheader("Cashflow-Parameter")
    annual_rent = st.sidebar.number_input("Jährliche Mieteinnahmen (€)", min_value=0, value=30000, step=1000)
    annual_expenses = st.sidebar.number_input("Jährliche Betriebskosten (€)", min_value=0, value=8000, step=500)
    annual_interest = st.sidebar.number_input("Jährliche Zinsen (€)", min_value=0, value=16000, step=1000)
    annual_principal = st.sidebar.number_input("Jährliche Tilgung (€)", min_value=0, value=20000, step=1000)
    
    # Eingaben zusammenfassen
    inputs = {
        'purchase_price': purchase_price,
        'acquisition_costs': acquisition_costs,
        'initial_loan': initial_loan,
        'equity': equity,
        'exit_year': exit_year,
        'market_scenario': calculator.market_scenarios[market_scenario],
        'growth_rate': growth_rate,
        'sale_price': sale_price if sale_price > 0 else None,
        'broker_fee': broker_fee,
        'notary_costs': notary_costs,
        'transfer_tax': transfer_tax,
        'new_interest_rate': new_interest_rate,
        'new_term': new_term,
        'payout_ratio': payout_ratio,
        'renovation_costs': renovation_costs,
        'renovation_duration': renovation_duration,
        'tax_rate': tax_rate,
        'depreciation': depreciation,
        'annual_rent': annual_rent,
        'annual_expenses': annual_expenses,
        'annual_interest': annual_interest,
        'annual_principal': annual_principal
    }
    
    # Berechnung durchführen
    if st.sidebar.button("🚀 Exit-Szenarien berechnen", type="primary"):
        with st.spinner("Berechne Exit-Szenarien..."):
            scenarios = calculator.calculate_all_scenarios(inputs)
            warnings = calculator.generate_warnings(scenarios)
            
            # Ergebnisse in Session State speichern
            st.session_state.scenarios = scenarios
            st.session_state.warnings = warnings
            st.session_state.inputs = inputs
    
    # Ergebnisse anzeigen
    if 'scenarios' in st.session_state:
        scenarios = st.session_state.scenarios
        warnings = st.session_state.warnings
        
        # Empfehlung
        if scenarios:
            best_scenario = max(scenarios, key=lambda x: x['irr'])
            st.markdown(f"""
            <div class="success-box">
                <h3>🎯 Empfehlung: {best_scenario['strategy']}</h3>
                <p><strong>IRR:</strong> {best_scenario['irr']:.1f}% | 
                <strong>ROI:</strong> {best_scenario['roi']:.1f}% | 
                <strong>NPV:</strong> €{best_scenario['npv']:,.0f}</p>
            </div>
            """, unsafe_allow_html=True)
        
        # Warnungen
        if warnings:
            st.subheader("⚠️ Warnungen & Risiken")
            for warning in warnings:
                severity_color = {
                    'niedrig': '#fff3cd',
                    'mittel': '#ffeaa7', 
                    'hoch': '#f8d7da'
                }.get(warning['severity'], '#fff3cd')
                
                st.markdown(f"""
                <div class="warning-box" style="background-color: {severity_color};">
                    <strong>{warning['type'].upper()} - {warning['severity'].upper()}</strong><br>
                    {warning['message']}<br>
                    <em>Empfehlung: {warning['recommendation']}</em>
                </div>
                """, unsafe_allow_html=True)
        
        # Szenario-Vergleich
        st.subheader("📊 Szenario-Vergleich")
        
        # Tabelle
        df = pd.DataFrame(scenarios)
        df_display = df[['strategy', 'irr', 'roi', 'npv', 'cash_on_cash_return', 'exit_value', 'net_proceeds']].copy()
        df_display.columns = ['Strategie', 'IRR (%)', 'ROI (%)', 'NPV (€)', 'Cash-on-Cash (%)', 'Exit-Wert (€)', 'Netto-Erlös (€)']
        
        # Formatierung
        for col in ['IRR (%)', 'ROI (%)', 'Cash-on-Cash (%)']:
            df_display[col] = df_display[col].round(1)
        for col in ['NPV (€)', 'Exit-Wert (€)', 'Netto-Erlös (€)']:
            df_display[col] = df_display[col].apply(lambda x: f"€{x:,.0f}")
        
        st.dataframe(df_display, use_container_width=True)
        
        # Charts
        st.subheader("📈 Visualisierungen")
        
        # Cashflow-Chart
        fig_cashflow = go.Figure()
        
        for scenario in scenarios:
            years = list(range(len(scenario['annual_cashflows'])))
            fig_cashflow.add_trace(go.Scatter(
                x=years,
                y=scenario['annual_cashflows'],
                mode='lines+markers',
                name=scenario['strategy'],
                line=dict(width=3)
            ))
        
        fig_cashflow.update_layout(
            title="Jährliche Cashflows",
            xaxis_title="Jahr",
            yaxis_title="Cashflow (€)",
            hovermode='x unified'
        )
        
        st.plotly_chart(fig_cashflow, use_container_width=True)
        
        # IRR-Vergleich
        fig_irr = px.bar(
            x=[s['strategy'] for s in scenarios],
            y=[s['irr'] for s in scenarios],
            title="IRR-Vergleich",
            labels={'x': 'Strategie', 'y': 'IRR (%)'}
        )
        fig_irr.update_layout(showlegend=False)
        st.plotly_chart(fig_irr, use_container_width=True)
        
        # Kumulierte Cashflows
        fig_cumulative = go.Figure()
        
        for scenario in scenarios:
            years = list(range(len(scenario['cumulative_cashflows'])))
            fig_cumulative.add_trace(go.Scatter(
                x=years,
                y=scenario['cumulative_cashflows'],
                mode='lines+markers',
                name=scenario['strategy'],
                fill='tonexty' if scenario != scenarios[0] else 'tozeroy',
                line=dict(width=3)
            ))
        
        fig_cumulative.update_layout(
            title="Kumulierte Cashflows",
            xaxis_title="Jahr",
            yaxis_title="Kumulierter Cashflow (€)",
            hovermode='x unified'
        )
        
        st.plotly_chart(fig_cumulative, use_container_width=True)
        
        # Export-Optionen
        st.subheader("💾 Export")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            csv = df_display.to_csv(index=False)
            st.download_button(
                label="📄 CSV herunterladen",
                data=csv,
                file_name=f"exit_scenarios_{datetime.now().strftime('%Y%m%d')}.csv",
                mime="text/csv"
            )
        
        with col2:
            json_data = json.dumps({
                'scenarios': scenarios,
                'warnings': warnings,
                'inputs': st.session_state.inputs,
                'generated_at': datetime.now().isoformat()
            }, indent=2, default=str)
            
            st.download_button(
                label="📋 JSON herunterladen",
                data=json_data,
                file_name=f"exit_scenarios_{datetime.now().strftime('%Y%m%d')}.json",
                mime="application/json"
            )
        
        with col3:
            if st.button("🔄 Neu berechnen"):
                st.rerun()
    
    # Footer
    st.markdown("---")
    st.markdown("""
    <div style="text-align: center; color: #666; font-size: 0.9rem;">
        <p><strong>Hinweise:</strong></p>
        <ul style="text-align: left; max-width: 600px; margin: 0 auto;">
            <li>Alle Berechnungen sind Schätzungen und können von der tatsächlichen Performance abweichen</li>
            <li>Steuerliche Aspekte können je nach individueller Situation variieren</li>
            <li>Konsultieren Sie einen Finanzberater für professionelle Beratung</li>
            <li>Marktrisiken und unvorhersehbare Ereignisse sind nicht berücksichtigt</li>
        </ul>
    </div>
    """, unsafe_allow_html=True)

# Calculator-Instanz erstellen
calculator = ExitScenarioCalculator()

if __name__ == "__main__":
    main()

