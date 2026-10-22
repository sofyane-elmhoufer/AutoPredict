"""
api.py : petit serveur Flask qui expose le modèle au backend Node.

Le backend (src/services/mlService.js) appelle ce service en HTTP. Le calcul
du prix est fait par predict.py, ici on s'occupe juste de recevoir la requête
et de formater la réponse.

Lancement :
    cd ml
    pip install -r requirements.txt
    python src/api.py
    -> écoute sur http://localhost:8000 (ML_SERVICE_URL dans backend/.env)

Routes :
  POST /predict
    reçoit : { marque, modele, annee, kilometrage, carburant, boite_vitesses,
               puissance_fiscale, etat, ville, premiere_main }
    renvoie : {
      prixEstime: number,
      margeConfiance: { min: number, max: number },
      facteursExplicatifs: [{ feature: string, impact: number }, ...]
    }
  GET /domaine   villes reconnues + bornes numériques (voir train.py)
  GET /health    { status: "ok", modeleCharge: bool }
"""

import os
import json

from flask import Flask, jsonify, request

from predict import predict_price, load_model, FEATURES_ATTENDUES, MODEL_PATH

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # dossier ml/
METRICS_PATH = os.path.join(BASE_DIR, "models", "metrics.json")
DOMAINE_PATH = os.path.join(BASE_DIR, "models", "domaine_entrainement.json")

app = Flask(__name__)

# La fourchette de confiance = prix estimé +/- la MAE du modèle (erreur moyenne
# mesurée sur le jeu de test, voir metrics.json). Si le fichier de métriques
# n'existe pas, on prend 15 % du prix à la place.
_MARGE_PAR_DEFAUT = 0.15


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


def _variable_d_origine(nom_colonne: str) -> str:
    """
    Après l'encodage one-hot, une variable comme "ville" devient plein de
    colonnes ("cat__ville_Casablanca", "cat__ville_Fès", ...). Cette fonction
    retrouve le nom de la variable d'origine pour pouvoir les regrouper.
    """
    if nom_colonne.startswith("num__"):
        return nom_colonne[len("num__"):]
    sans_prefixe = nom_colonne[len("cat__"):]
    for variable in FEATURES_ATTENDUES:
        if sans_prefixe.startswith(variable + "_"):
            return variable
    return sans_prefixe


def _facteurs_explicatifs(top_n: int = 5):
    """
    Variables qui pèsent le plus dans le modèle (importance globale, additionnée
    par variable d'origine). Ce n'est pas une explication propre à chaque
    voiture : les facteurs sont donc les mêmes pour toutes les prédictions.
    """
    try:
        model = load_model()
        inner_pipeline = model.regressor_
        regressor = inner_pipeline.named_steps["regressor"]
        if not hasattr(regressor, "feature_importances_"):
            return []

        preprocessor = inner_pipeline.named_steps["preprocessing"]
        noms_colonnes = preprocessor.get_feature_names_out()
        importances = regressor.feature_importances_

        par_variable = {}
        for nom, importance in zip(noms_colonnes, importances):
            variable = _variable_d_origine(nom)
            par_variable[variable] = par_variable.get(variable, 0.0) + float(importance)

        top = sorted(par_variable.items(), key=lambda x: x[1], reverse=True)[:top_n]
        return [{"feature": nom, "impact": round(imp, 4)} for nom, imp in top]
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


@app.get("/domaine")
def domaine():
    """Renvoie le domaine d'entraînement généré par train.py (save_domaine_entrainement)."""
    if not os.path.exists(DOMAINE_PATH):
        return jsonify({"message": "Domaine d'entraînement non disponible (modèle jamais entraîné)."}), 503
    with open(DOMAINE_PATH, "r", encoding="utf-8") as f:
        return jsonify(json.load(f))


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
    except ValueError as e:
        # typiquement une année ou un kilométrage qui n'est pas un nombre
        return jsonify({"message": f"Valeurs invalides : {e}"}), 422
    except Exception as e:
        return jsonify({"message": f"Erreur de prédiction : {e}"}), 500

    mae = _charger_mae()
    if mae is not None:
        marge_min = max(0, round(prix - mae))
        marge_max = round(prix + mae)
    else:
        marge_min = max(0, round(prix * (1 - _MARGE_PAR_DEFAUT)))
        marge_max = round(prix * (1 + _MARGE_PAR_DEFAUT))

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
