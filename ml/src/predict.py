"""
predict.py : charge le modèle entraîné et prédit le prix d'une voiture.

Le backend passe par api.py, qui appelle predict_price() d'ici.

Test rapide en ligne de commande :
    python src/predict.py

Utilisation depuis un autre fichier :
    from predict import predict_price
    prix = predict_price({...})
"""

import os

import joblib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # dossier ml/
MODEL_PATH = os.path.join(BASE_DIR, "models", "model_prix.joblib")

# Les colonnes attendues par le modèle, dans l'ordre de train.py
FEATURES_ATTENDUES = [
    "marque", "modele", "annee", "kilometrage", "carburant",
    "boite_vitesses", "puissance_fiscale", "etat", "ville", "premiere_main",
]

# Le modèle pèse plusieurs dizaines de Mo : on le charge une seule fois
# puis on le garde en mémoire pour les appels suivants.
_model = None


def load_model(path: str = MODEL_PATH):
    """Charge le pipeline sauvegardé par train.py (préprocessing + régression)."""
    global _model
    if _model is None:
        if not os.path.exists(path):
            raise FileNotFoundError(
                f"Modèle introuvable : {path}. Lancez d'abord train.py."
            )
        _model = joblib.load(path)
        print(f"[load_model] Modèle chargé depuis {path}")
    return _model


def validate_input(caracteristiques: dict) -> None:
    """Vérifie qu'il ne manque aucune caractéristique."""
    manquantes = [f for f in FEATURES_ATTENDUES if f not in caracteristiques]
    if manquantes:
        raise ValueError(f"Caractéristiques manquantes : {manquantes}")


def predict_price(caracteristiques: dict) -> float:
    """
    Renvoie le prix estimé (en MAD, arrondi à l'unité).

    `caracteristiques` est un dict avec les clés : marque, modele, annee,
    kilometrage, carburant, boite_vitesses, puissance_fiscale, etat, ville,
    premiere_main. Les valeurs textuelles doivent être écrites comme dans le
    dataset d'entraînement (ex. "Diesel", "Manuelle", "Oui").
    """
    validate_input(caracteristiques)
    model = load_model()

    X = pd.DataFrame([caracteristiques])[FEATURES_ATTENDUES]
    prix_estime = model.predict(X)[0]
    return round(float(prix_estime))


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
