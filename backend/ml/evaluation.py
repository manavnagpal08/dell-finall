from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix,
    mean_absolute_error, mean_squared_error, r2_score
)
import numpy as np

def evaluate_classifier(model, X_test, y_test):
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1] if hasattr(model, 'predict_proba') else y_pred
    
    return {
        'accuracy': accuracy_score(y_test, y_pred),
        'precision': precision_score(y_test, y_pred, zero_division=0),
        'recall': recall_score(y_test, y_pred, zero_division=0),
        'f1_score': f1_score(y_test, y_pred, zero_division=0),
        'roc_auc': roc_auc_score(y_test, y_prob) if len(np.unique(y_test)) > 1 else None,
        'confusion_matrix': confusion_matrix(y_test, y_pred).tolist()
    }

def evaluate_regressor(model, X_test, y_test):
    y_pred = model.predict(X_test)
    return {
        'mae': mean_absolute_error(y_test, y_pred),
        'rmse': np.sqrt(mean_squared_error(y_test, y_pred)),
        'r2_score': r2_score(y_test, y_pred)
    }

def evaluate_model(model, target_variable: str, X_test, y_test):
    if target_variable == 'sla_breach':
        return evaluate_classifier(model, X_test, y_test)
    elif target_variable == 'transit_days':
        return evaluate_regressor(model, X_test, y_test)
    else:
        raise ValueError(f"Unknown target variable: {target_variable}")
