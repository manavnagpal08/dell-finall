def get_feature_importance(model, feature_names):
    """
    Extract and rank feature importance from tree-based models.
    """
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
        # Combine feature names and importances
        feature_importance_list = [
            {"feature": name, "importance": float(imp)}
            for name, imp in zip(feature_names, importances)
        ]
        # Sort descending
        feature_importance_list.sort(key=lambda x: x["importance"], reverse=True)
        return feature_importance_list
    return []
