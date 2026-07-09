"""
=============================================================================
 AutoPredict - api.py
 Microservice HTTP exposant le modèle ML au backend Node (mlService.js)
=============================================================================
Ce fichier manquait dans le projet : le backend Node (src/services/mlService.js)
appelle déjà http://localhost:8000/predict et http://localhost:8000/health en
HTTP, mais rien ne servait ces routes. Ce petit serveur Flask comble ce vide en
s'appuyant sur predict.py (déjà fonctionnel) pour le calcul réel.

Lancement :
    cd ml
    pip install -r requirements.txt
    python src/api.py
    -> écoute sur http://localhost:8000 (cf. ML_SERVICE_URL dans backend/.env)

Contrat (voir backend/src/services/mlService.js -> versPayloadML) :
  POST /predict
    Requête : { marque, modele, annee, kilometrage, carburant, boite_vitesses,
                puissance_fiscale, etat, ville, premiere_main }
    Réponse : {
      prixEstime: number,
      margeConfiance: { min: number, max: number },
      facteursExplicatifs: [{ feature: string, impact: number }, ...]
    }
  GET /health
    Réponse : { status: "ok", modeleCharge: bool }
"""

import os
import json

from flask import Flask, jsonify, request

from predict import predict_price, load_model, FEATURES_ATTENDUES, MODEL_PATH

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # -> ml/
METRICS_PATH = os.path.join(BASE_DIR, "models", "metrics.json")

app = Flask(__name__)

# Marge de confiance approximative : on utilise l'erreur absolue moyenne (MAE)
# du modèle sélectionné, mesurée sur le jeu de test (cf. train.py / metrics.json).
# À défaut de métriques disponibles, on retombe sur une marge relative de 15%.
_MAE_PAR_DEFAUT_RATIO = 0.15


def _charger_mae():
    if not os.path.exists(METRICS_PATH):
        return None
    try:
        with open(METRICS_PATH, "r", encoding="utf-8") as f:
            metrics = json.load(f)
        meilleur = metrics.get("modele_selectionne")
        resultats = metrics.get("resultats_comparaison", {})
        if meilleur and meilleur in resultats:
            return resultats[meilleur].get("MAE")
    except (json.JSONDecodeError, OSError):
        return None
    return None


def _facteurs_explicatifs(top_n: int = 5):
    """
    Importance globale des variables du modèle chargé (et non une explication
    SHAP par prédiction individuelle, ce qui demanderait une dépendance
    supplémentaire non installée ici). C'est une approximation raisonnable
    pour donner une intuition des variables qui pèsent le plus dans le prix.
    """
    try:
        model = load_model()
        inner_pipeline = model.regressor_
        regressor = inner_pipeline.named_steps["regressor"]
        if not hasattr(regressor, "feature_importances_"):
            return []

        preprocessor = inner_pipeline.named_steps["preprocessing"]
        noms_features = preprocessor.get_feature_names_out()
        importances = regressor.feature_importances_

        top = sorted(zip(noms_features, importances), key=lambda x: x[1], reverse=True)[:top_n]
        return [{"feature": nom, "impact": round(float(imp), 4)} for nom, imp in top]
    except Exception:
        return []


@app.get("/health")
def health():
    modele_charge = True
    try:
        load_model()
    except Exception:
        modele_charge = False
    return jsonify({"status": "ok", "modeleCharge": modele_charge, "modelPath": MODEL_PATH})


@app.post("/predict")
def predict():
    payload = request.get_json(silent=True) or {}

    manquantes = [f for f in FEATURES_ATTENDUES if f not in payload]
    if manquantes:
        return jsonify({"message": f"Caractéristiques manquantes : {manquantes}"}), 422

    try:
        prix = predict_price(payload)
    except FileNotFoundError as e:
        return jsonify({"message": str(e)}), 503
    except Exception as e:
        return jsonify({"message": f"Erreur de prédiction : {e}"}), 500

    mae = _charger_mae()
    if mae is not None:
        marge_min = max(0, round(prix - mae))
        marge_max = round(prix + mae)
    else:
        marge_min = max(0, round(prix * (1 - _MAE_PAR_DEFAUT_RATIO)))
        marge_max = round(prix * (1 + _MAE_PAR_DEFAUT_RATIO))

    return jsonify(
        {
            "prixEstime": prix,
            "margeConfiance": {"min": marge_min, "max": marge_max},
            "facteursExplicatifs": _facteurs_explicatifs(),
        }
    )


if __name__ == "__main__":
    port = int(os.environ.get("ML_SERVICE_PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)
