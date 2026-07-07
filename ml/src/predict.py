"""
=============================================================================
 AutoPredict - predict.py
 Chargement du modèle entraîné et prédiction du prix d'un véhicule
=============================================================================
Ce module expose la fonction predict_price(), destinée à être appelée par
l'API back-end (voir cahier des charges : ModèleML.predire(caracteristiques)).

Utilisation en script :
    python predict.py

Utilisation en import :
    from predict import predict_price
    prix = predict_price({...})
"""

# =============================================================================
# 1. IMPORTS
# =============================================================================
import os
import joblib
import pandas as pd


# =============================================================================
# 2. CONFIGURATION
# =============================================================================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # -> ml/
MODEL_PATH = os.path.join(BASE_DIR, "models", "model_prix.joblib")

FEATURES_ATTENDUES = [
    "marque", "modele", "annee", "kilometrage", "carburant",
    "boite_vitesses", "puissance_fiscale", "etat", "ville", "premiere_main",
]


# =============================================================================
# 3. CHARGEMENT DU MODÈLE (une seule fois, mis en cache)
# =============================================================================
_model = None


def load_model(path: str = MODEL_PATH):
    """Charge le pipeline complet (préprocessing + modèle) sauvegardé par train.py."""
    global _model
    if _model is None:
        if not os.path.exists(path):
            raise FileNotFoundError(
                f"Modèle introuvable : {path}. Lancez d'abord train.py."
            )
        _model = joblib.load(path)
        print(f"[load_model] Modèle chargé depuis {path}")
    return _model


# =============================================================================
# 4. VALIDATION DES CARACTÉRISTIQUES REÇUES
# =============================================================================
def validate_input(caracteristiques: dict) -> None:
    """Vérifie que toutes les caractéristiques nécessaires sont présentes."""
    manquantes = [f for f in FEATURES_ATTENDUES if f not in caracteristiques]
    if manquantes:
        raise ValueError(f"Caractéristiques manquantes : {manquantes}")


# =============================================================================
# 5. PRÉDICTION
# =============================================================================
def predict_price(caracteristiques: dict) -> float:
    """
    Prédit le prix (en MAD) d'un véhicule à partir de ses caractéristiques.

    Paramètre :
        caracteristiques : dict avec les clés suivantes
            marque, modele, annee, kilometrage, carburant,
            boite_vitesses, puissance_fiscale, etat, ville, premiere_main

    Retour :
        float : prix estimé en MAD (arrondi à l'unité)
    """
    validate_input(caracteristiques)
    model = load_model()

    X = pd.DataFrame([caracteristiques])[FEATURES_ATTENDUES]
    prix_estime = model.predict(X)[0]
    return round(float(prix_estime))


# =============================================================================
# 6. EXEMPLE D'UTILISATION
# =============================================================================
def main():
    exemple_vehicule = {
        "marque": "Dacia",
        "modele": "Duster",
        "annee": 2018,
        "kilometrage": 90000,
        "carburant": "Diesel",
        "boite_vitesses": "Manuelle",
        "puissance_fiscale": 6,
        "etat": "Très bon",
        "ville": "Casablanca",
        "premiere_main": "Oui",
    }
    prix = predict_price(exemple_vehicule)
    print(f"\n[main] Véhicule : {exemple_vehicule}")
    print(f"[main] Prix estimé : {prix} MAD")


if __name__ == "__main__":
    main()
