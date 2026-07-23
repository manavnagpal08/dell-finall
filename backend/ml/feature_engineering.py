import pandas as pd
import numpy as np

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineer meaningful logistics features from the raw dataset.
    This creates the final feature set for model training and inference.
    """
    df_out = df.copy()
    
    # Example feature engineering (these would normally be calculated based on historical data or complex logic)
    # If these columns do not exist at inference time, derive them or provide operational defaults.
    
    # Base columns to ensure exist
    if 'Quantity' not in df_out.columns:
        df_out['Quantity'] = 1
    if 'Shipment_Value' not in df_out.columns:
        df_out['Shipment_Value'] = 500.0
    if 'Distance_KM' not in df_out.columns:
        df_out['Distance_KM'] = 600.0
    if 'Hub_Congestion_Index' not in df_out.columns:
        df_out['Hub_Congestion_Index'] = 0.45
    if 'Carrier_Reliability' not in df_out.columns:
        df_out['Carrier_Reliability'] = 0.9
    if 'Weekend_Dispatch' not in df_out.columns:
        df_out['Weekend_Dispatch'] = 0
    if 'Corridor_Breach_Rate' not in df_out.columns:
        df_out['Corridor_Breach_Rate'] = 0.35
    if 'Origin_Breach_Rate' not in df_out.columns:
        df_out['Origin_Breach_Rate'] = 0.35
    if 'Partner_Breach_Rate' not in df_out.columns:
        df_out['Partner_Breach_Rate'] = 0.35
    if 'Category_Breach_Rate' not in df_out.columns:
        df_out['Category_Breach_Rate'] = 0.35
    if 'Priority_Breach_Rate' not in df_out.columns:
        df_out['Priority_Breach_Rate'] = 0.35
    if 'Stock_Coverage_Ratio' not in df_out.columns:
        df_out['Stock_Coverage_Ratio'] = 4.0
    if 'Origin_Utilization' not in df_out.columns:
        df_out['Origin_Utilization'] = 0.65

    # 1. Flow Direction Logic
    if 'Flow_Type' in df_out.columns:
        df_out['Is_Reverse_Flow'] = (df_out['Flow_Type'] == 'Reverse').astype(int)
    else:
        df_out['Is_Reverse_Flow'] = 0

    # 2. Priority Risk Score
    priority_map = {'P1': 4, 'P2': 3, 'P3': 2, 'P4': 1}
    if 'Priority' in df_out.columns:
        df_out['Priority_Score'] = df_out['Priority'].map(priority_map).fillna(2)
    else:
        df_out['Priority_Score'] = 2

    # 3. Shipment Value and Quantity interaction (High Value & High Quantity = High Risk)
    df_out['Value_Quantity_Index'] = np.log1p(df_out['Quantity']) * np.log1p(df_out['Shipment_Value'])
    
    # 4. Hub/TPR historical delay proxies used when lane history is not present in the feature frame.
    # Assign known higher-risk locations so baseline training has operational signal.
    if 'Origin_Hub' in df_out.columns:
        high_risk_hubs = ['HUB-DEL', 'HUB-AMS']
        df_out['Origin_High_Risk'] = df_out['Origin_Hub'].isin(high_risk_hubs).astype(int)
    else:
        df_out['Origin_High_Risk'] = 0

    if 'Repair_Center' in df_out.columns:
        high_risk_tprs = ['TPR-DEL-01']
        df_out['Dest_High_Risk'] = df_out['Repair_Center'].isin(high_risk_tprs).astype(int)
    else:
        df_out['Dest_High_Risk'] = 0

    # 5. Part Category Complexity
    part_complexity = {'CPU': 3, 'RAM': 1, 'Storage': 2}
    if 'Part_Category' in df_out.columns:
        df_out['Part_Complexity'] = df_out['Part_Category'].map(part_complexity).fillna(1)
    else:
        df_out['Part_Complexity'] = 1

    # Keep original categorical columns so Preprocessor can encode them later
    
    risk_score = (
        df_out['Priority_Score'] * 0.3 + 
        df_out['Is_Reverse_Flow'] * 0.2 + 
        df_out['Origin_High_Risk'] * 0.4 + 
        df_out['Dest_High_Risk'] * 0.3 +
        (df_out['Value_Quantity_Index'] / df_out['Value_Quantity_Index'].max()).fillna(0) * 0.2 +
        df_out['Hub_Congestion_Index'].fillna(0.45) * 0.45 +
        (1 - df_out['Carrier_Reliability'].fillna(0.9)) * 0.35 +
        df_out['Weekend_Dispatch'].fillna(0) * 0.18
        + df_out['Corridor_Breach_Rate'].fillna(0.35) * 0.55
        + df_out['Origin_Breach_Rate'].fillna(0.35) * 0.25
        + df_out['Partner_Breach_Rate'].fillna(0.35) * 0.35
        + df_out['Category_Breach_Rate'].fillna(0.35) * 0.20
        + df_out['Priority_Breach_Rate'].fillna(0.35) * 0.20
        + (1 / (1 + df_out['Stock_Coverage_Ratio'].fillna(4.0))) * 0.45
        + df_out['Origin_Utilization'].fillna(0.65) * 0.25
    )

    # Target variable generation for seeded training frames when labels are not supplied.
    if 'sla_breach' not in df_out.columns:
        noise = np.random.normal(0, 0.1, size=len(df_out))
        final_risk = risk_score + noise
        threshold = np.percentile(final_risk, 80)
        df_out['sla_breach'] = (final_risk >= threshold).astype(int)

    if 'transit_days' not in df_out.columns:
        base_days = 1.15 + (df_out['Distance_KM'].fillna(600) / 520)
        priority_adjustment = (5 - df_out['Priority_Score']) * 0.16
        reverse_adjustment = df_out['Is_Reverse_Flow'] * 0.85
        congestion_adjustment = df_out['Hub_Congestion_Index'].fillna(0.45) * 3.1
        reliability_adjustment = (1 - df_out['Carrier_Reliability'].fillna(0.9)) * 4.0
        weekend_adjustment = df_out['Weekend_Dispatch'].fillna(0) * 0.65
        category_adjustment = df_out['Part_Complexity'] * 0.18
        noise = np.random.normal(0, 0.22, size=len(df_out))

        df_out['transit_days'] = np.clip(
            base_days +
            priority_adjustment +
            reverse_adjustment +
            congestion_adjustment +
            reliability_adjustment +
            weekend_adjustment +
            category_adjustment +
            noise,
            1,
            30
        )

    return df_out
