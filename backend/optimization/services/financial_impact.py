class FinancialImpactEngine:
    def calculate_impact(
        self,
        savings: float,
        capital_outlay: float,
        sla_gain: float = 0.0,
        transit_days_saved: float = 0.0,
        distance_saved_km: float = 0.0
    ) -> dict:
        """
        Standardizes financial metrics, ROI ratios, carbon footprint estimates, 
        and impact priority rankings.
        """
        # Protect division
        monthly_savings = savings / 12.0
        
        roi = 150.0
        payback_months = 0.0
        if capital_outlay > 0.0:
            roi = (savings / capital_outlay) * 100.0
            if monthly_savings > 0.0:
                payback_months = capital_outlay / monthly_savings

        # Environmental carbon emission math: 0.22 kg CO2 saved per kilometer shortened
        co2_saved = distance_saved_km * 0.22

        # Priority matrix rules
        priority = "Low"
        if savings >= 50000.0 and sla_gain >= 10.0:
            priority = "Critical"
        elif savings >= 20000.0 or sla_gain >= 5.0:
            priority = "High"
        elif savings >= 5000.0:
            priority = "Medium"

        # Executive impact score logic
        impact_score = (savings / 10000.0) * 30.0 + (sla_gain * 2.0) + (transit_days_saved * 8.0)
        impact_score = max(10.0, min(100.0, impact_score))

        return {
            "monthly_savings": float(monthly_savings),
            "annual_savings": float(savings),
            "roi": float(roi),
            "payback_months": float(payback_months),
            "co2_saved": float(co2_saved),
            "priority": priority,
            "impact_score": float(impact_score)
        }

financial_impact_engine = FinancialImpactEngine()
