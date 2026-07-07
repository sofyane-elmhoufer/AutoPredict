"""
=============================================================================
 AutoPredict - train.py
 Entraînement, comparaison et sauvegarde du modèle de prédiction de prix
=============================================================================
Ce script :
  1. charge le dataset nettoyé (data/processed/cars_clean.csv)
  2. construit un pipeline de préprocessing (encodage + normalisation)
  3. entraîne plusieurs modèles de régression et les compare
  4. sauvegarde le meilleur modèle (pipeline complet) + ses métriques

Utilisation :
    python train.py
"""

# =============================================================================
# 1. IMPORTS
# =============================================================================
import os
import json
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.compose import ColumnTransformer, TransformedTargetRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

try:
    from xgboost import XGBRegressor
    XGBOOST_DISPONIBLE = True
except ImportError:
    XGBOOST_DISPONIBLE = False


# =============================================================================
# 2. CONFIGURATION
# =============================================================================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # -> ml/
PROCESSED_PATH = os.path.join(BASE_DIR, "data", "processed", "cars_clean.csv")
MODELS_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODELS_DIR, "model_prix.joblib")
METRICS_PATH = os.path.join(MODELS_DIR, "metrics.json")

RANDOM_STATE = 42
TEST_SIZE = 0.2

FEATURES_NUMERIQUES = ["annee", "kilometrage", "puissance_fiscale"]
FEATURES_CATEGORIELLES = [
    "marque", "modele", "carburant", "boite_vitesses",
    "etat", "ville", "premiere_main",
]
TARGET = "prix"


# =============================================================================
# 3. CHARGEMENT DES DONNÉES
# =============================================================================
def load_processed_data(path: str = PROCESSED_PATH) -> pd.DataFrame:
    df = pd.read_csv(path)
    print(f"[load_processed_data] Dataset chargé : {df.shape[0]} lignes, {df.shape[1]} colonnes")
    return df


# =============================================================================
# 4. SPLIT TRAIN / TEST
# =============================================================================
def split_data(df: pd.DataFrame):
    X = df[FEATURES_NUMERIQUES + FEATURES_CATEGORIELLES]
    y = df[TARGET]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )
    print(f"[split_data] Train : {X_train.shape[0]} lignes | Test : {X_test.shape[0]} lignes")
    return X_train, X_test, y_train, y_test


# =============================================================================
# 5. PRÉPROCESSING (encodage catégoriel + normalisation numérique)
# =============================================================================
def build_preprocessor() -> ColumnTransformer:
    """
    - variables numériques -> standardisation (utile pour la régression linéaire,
      neutre pour les modèles à base d'arbres)
    - variables catégorielles -> one-hot encoding (handle_unknown='ignore' pour
      absorber les catégories jamais vues en production, ex. nouvelle ville)
    """
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), FEATURES_NUMERIQUES),
            ("cat", OneHotEncoder(handle_unknown="ignore"), FEATURES_CATEGORIELLES),
        ]
    )


# =============================================================================
# 6. DÉFINITION DES MODÈLES À COMPARER
# =============================================================================
def build_candidate_models() -> dict:
    """
    Le prix étant fortement asymétrique (queue de distribution vers le haut),
    chaque modèle est enveloppé dans un TransformedTargetRegressor qui
    entraîne sur log(1 + prix) puis retransforme la prédiction en MAD réels.
    """
    modeles = {
        "LinearRegression": LinearRegression(),
        "RandomForest": RandomForestRegressor(
            n_estimators=300, max_depth=None, min_samples_leaf=2,
            random_state=RANDOM_STATE, n_jobs=-1,
        ),
        "GradientBoosting": GradientBoostingRegressor(
            n_estimators=300, learning_rate=0.05, max_depth=3,
            random_state=RANDOM_STATE,
        ),
    }
    if XGBOOST_DISPONIBLE:
        modeles["XGBoost"] = XGBRegressor(
            n_estimators=400, learning_rate=0.05, max_depth=5,
            subsample=0.8, colsample_bytree=0.8,
            random_state=RANDOM_STATE, n_jobs=-1,
        )
    return modeles


def wrap_with_pipeline(preprocessor: ColumnTransformer, modele) -> Pipeline:
    base_pipeline = Pipeline(steps=[
        ("preprocessing", preprocessor),
        ("regressor", modele),
    ])
    return TransformedTargetRegressor(
        regressor=base_pipeline, func=np.log1p, inverse_func=np.expm1
    )


# =============================================================================
# 7. ENTRAÎNEMENT + COMPARAISON DES MODÈLES
# =============================================================================
def evaluate_model(model, X_test, y_test) -> dict:
    y_pred = model.predict(X_test)
    return {
        "R2": round(r2_score(y_test, y_pred), 4),
        "MAE": round(mean_absolute_error(y_test, y_pred), 2),
        "RMSE": round(mean_squared_error(y_test, y_pred) ** 0.5, 2),
    }


def train_and_compare(X_train, X_test, y_train, y_test, preprocessor) -> tuple:
    """Entraîne chaque modèle candidat, l'évalue, et retourne le meilleur (par R2 test)."""
    resultats = {}
    modeles_entraines = {}

    for nom, modele in build_candidate_models().items():
        print(f"\n[train_and_compare] Entraînement : {nom}")
        pipeline = wrap_with_pipeline(preprocessor, modele)

        # Validation croisée sur le train set (robustesse de l'estimation)
        cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5, scoring="r2", n_jobs=-1)
        print(f"  -> R2 cross-val (5 folds) : {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

        pipeline.fit(X_train, y_train)
        scores = evaluate_model(pipeline, X_test, y_test)
        scores["R2_cv_mean"] = round(cv_scores.mean(), 4)
        print(f"  -> Test set : R2={scores['R2']} | MAE={scores['MAE']} MAD | RMSE={scores['RMSE']} MAD")

        resultats[nom] = scores
        modeles_entraines[nom] = pipeline

    meilleur_nom = max(resultats, key=lambda n: resultats[n]["R2"])
    print(f"\n[train_and_compare] Meilleur modèle : {meilleur_nom} (R2 test = {resultats[meilleur_nom]['R2']})")
    return meilleur_nom, modeles_entraines[meilleur_nom], resultats


# =============================================================================
# 8. IMPORTANCE DES VARIABLES (si modèle à base d'arbres)
# =============================================================================
def print_feature_importance(model, top_n: int = 15) -> None:
    inner_pipeline = model.regressor_
    regressor = inner_pipeline.named_steps["regressor"]
    if not hasattr(regressor, "feature_importances_"):
        return

    preprocessor = inner_pipeline.named_steps["preprocessing"]
    noms_features = preprocessor.get_feature_names_out()
    importances = regressor.feature_importances_

    top = sorted(zip(noms_features, importances), key=lambda x: x[1], reverse=True)[:top_n]
    print(f"\n[print_feature_importance] Top {top_n} variables les plus influentes :")
    for nom, imp in top:
        print(f"  {nom:35s} {imp:.4f}")


# =============================================================================
# 9. SAUVEGARDE DU MODÈLE ET DES MÉTRIQUES
# =============================================================================
def save_model(model, nom_modele: str, resultats: dict) -> None:
    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"\n[save_model] Modèle sauvegardé -> {MODEL_PATH}")

    metrics_export = {
        "modele_selectionne": nom_modele,
        "resultats_comparaison": resultats,
        "features_numeriques": FEATURES_NUMERIQUES,
        "features_categorielles": FEATURES_CATEGORIELLES,
    }
    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics_export, f, indent=2, ensure_ascii=False)
    print(f"[save_model] Métriques sauvegardées -> {METRICS_PATH}")


# =============================================================================
# 10. EXÉCUTION DU SCRIPT
# =============================================================================
def main():
    df = load_processed_data()
    X_train, X_test, y_train, y_test = split_data(df)
    preprocessor = build_preprocessor()

    meilleur_nom, meilleur_modele, resultats = train_and_compare(
        X_train, X_test, y_train, y_test, preprocessor
    )

    print("\n[main] Tableau récapitulatif des performances :")
    print(pd.DataFrame(resultats).T)

    print_feature_importance(meilleur_modele)
    save_model(meilleur_modele, meilleur_nom, resultats)


if __name__ == "__main__":
    main()
