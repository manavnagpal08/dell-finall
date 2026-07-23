import os
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from backend.ml.preprocessing import Preprocessor
from backend.ml.feature_engineering import engineer_features
import pandas as pd
import joblib

class ModelTrainer:
    def __init__(self, models_dir: str = "backend/ml/models_storage"):
        self.models_dir = models_dir
        if not os.path.exists(self.models_dir):
            os.makedirs(self.models_dir)

    def train(self, df: pd.DataFrame, target_variable: str, model_type: str = "RandomForest", test_size: float = 0.2, random_state: int = 42):
        """
        Train a new ML model.
        Returns:
            model_info (dict), preprocessor (Preprocessor), model (fitted estimator), 
            X_test (DataFrame), y_test (Series)
        """
        # 1. Feature Engineering
        df_engineered = engineer_features(df)
        
        # 2. Define Features (X) and Target (y)
        # We exclude the target variables and any raw ID columns
        exclude_cols = ['sla_breach', 'transit_days', 'Transaction_ID', 'Date']
        feature_cols = [c for c in df_engineered.columns if c not in exclude_cols]
        
        X = df_engineered[feature_cols]
        y = df_engineered[target_variable]

        # 3. Train/Test Split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=random_state)
        
        # 4. Preprocessing
        preprocessor = Preprocessor()
        X_train_processed = preprocessor.fit_transform(X_train)
        X_test_processed = preprocessor.transform(X_test)
        
        # 5. Model Selection & Training
        if target_variable == 'sla_breach':
            if model_type == "RandomForest":
                model = RandomForestClassifier(n_estimators=100, random_state=random_state, class_weight='balanced')
            else:
                raise ValueError(f"Unsupported model type: {model_type}")
        elif target_variable == 'transit_days':
            if model_type == "RandomForest":
                model = RandomForestRegressor(n_estimators=100, random_state=random_state)
            else:
                raise ValueError(f"Unsupported model type: {model_type}")
        else:
            raise ValueError(f"Unsupported target variable: {target_variable}")

        model.fit(X_train_processed, y_train)
        
        # Prepare return info
        model_info = {
            'target_variable': target_variable,
            'model_type': model_type,
            'features': list(X_train_processed.columns)
        }
        
        return model_info, preprocessor, model, X_test_processed, y_test

    def save_model(self, model_name: str, model_version: str, preprocessor: Preprocessor, model):
        """Save the trained model and its preprocessor to disk."""
        filename = f"{model_name}_v{model_version}.joblib"
        file_path = os.path.join(self.models_dir, filename)
        
        payload = {
            'preprocessor': preprocessor,
            'model': model
        }
        joblib.dump(payload, file_path)
        return file_path
