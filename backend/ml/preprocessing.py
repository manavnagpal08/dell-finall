import pandas as pd
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib
import os

class Preprocessor:
    def __init__(self):
        self.label_encoders = {}
        self.scaler = StandardScaler()
        self.categorical_cols = ['Origin_Hub', 'Destination_Hub', 'Repair_Center', 'Priority', 'Part_Category', 'Flow_Type', 'Logistics_Partner']
        self.numerical_cols = [
            'Quantity',
            'Shipment_Value',
            'Distance_KM',
            'Hub_Congestion_Index',
            'Carrier_Reliability',
            'Weekend_Dispatch',
            'Priority_Score',
            'Value_Quantity_Index',
            'Origin_High_Risk',
            'Dest_High_Risk',
            'Part_Complexity',
            'Is_Reverse_Flow',
            'Corridor_Breach_Rate',
            'Origin_Breach_Rate',
            'Partner_Breach_Rate',
            'Category_Breach_Rate',
            'Priority_Breach_Rate',
            'Stock_Coverage_Ratio',
            'Origin_Utilization'
        ]

    def fit(self, df: pd.DataFrame):
        # Fit Label Encoders
        for col in self.categorical_cols:
            if col in df.columns:
                le = LabelEncoder()
                # fillna with 'Unknown' just in case
                df[col] = df[col].fillna('Unknown')
                le.fit(df[col].astype(str))
                self.label_encoders[col] = le
        
        # Fit Scaler
        available_num_cols = [c for c in self.numerical_cols if c in df.columns]
        if available_num_cols:
            # fillna with median
            for col in available_num_cols:
                df[col] = df[col].fillna(df[col].median())
            self.scaler.fit(df[available_num_cols])

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        df_out = df.copy()
        
        # Transform Categorical
        for col in self.categorical_cols:
            if col in df_out.columns and col in self.label_encoders:
                df_out[col] = df_out[col].fillna('Unknown')
                le = self.label_encoders[col]
                
                # Handle unseen labels by mapping them to a default or handling via try-except
                # For simplicity in production, we map unseen to an 'Unknown' class if fitted, or just to 0
                classes = list(le.classes_)
                df_out[col] = df_out[col].apply(lambda x: x if x in classes else classes[0])
                df_out[col] = le.transform(df_out[col].astype(str))
                
        # Transform Numerical
        available_num_cols = [c for c in self.numerical_cols if c in df_out.columns]
        if available_num_cols:
            for col in available_num_cols:
                df_out[col] = df_out[col].fillna(df_out[col].median() if not df_out[col].isnull().all() else 0)
            df_out[available_num_cols] = self.scaler.transform(df_out[available_num_cols])
            
        return df_out

    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        self.fit(df)
        return self.transform(df)

    def save(self, file_path: str):
        joblib.dump({
            'label_encoders': self.label_encoders,
            'scaler': self.scaler,
            'categorical_cols': self.categorical_cols,
            'numerical_cols': self.numerical_cols
        }, file_path)

    @classmethod
    def load(cls, file_path: str):
        instance = cls()
        data = joblib.load(file_path)
        instance.label_encoders = data['label_encoders']
        instance.scaler = data['scaler']
        instance.categorical_cols = data['categorical_cols']
        instance.numerical_cols = data['numerical_cols']
        return instance
