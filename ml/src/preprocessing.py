"""
preprocessing.py : nettoyage du dataset Avito (voitures d'occasion au Maroc).

On part du fichier brut data/raw/avito_car_dataset_ALL.csv, on garde les
colonnes utiles, on nettoie et on sauvegarde le résultat dans
data/processed/cars_clean.csv.

Lancement :
    python src/preprocessing.py
"""

import os
import re

import numpy as np
import pandas as pd

# Les chemins sont calculés à partir de l'emplacement du fichier, comme ça le
# script marche peu importe d'où on le lance.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # dossier ml/
RAW_PATH = os.path.join(BASE_DIR, "data", "raw", "avito_car_dataset_ALL.csv")
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
PROCESSED_PATH = os.path.join(PROCESSED_DIR, "cars_clean.csv")

# Colonnes du fichier brut qu'on garde (la dernière, "Prix", c'est la cible)
COLONNES_A_GARDER = [
    "Marque",
    "Modèle",
    "Année-Modèle",
    "Kilométrage",
    "Type de carburant",
    "Boite de vitesses",
    "Puissance fiscale",
    "État",
    "Ville",
    "Première main",
    "Prix",
]

# Noms plus simples pour la suite (pas d'accents ni d'espaces)
RENAME_MAP = {
    "Marque": "marque",
    "Modèle": "modele",
    "Année-Modèle": "annee",
    "Kilométrage": "kilometrage",
    "Type de carburant": "carburant",
    "Boite de vitesses": "boite_vitesses",
    "Puissance fiscale": "puissance_fiscale",
    "État": "etat",
    "Ville": "ville",
    "Première main": "premiere_main",
    "Prix": "prix",
}

# Un modèle ou une ville qui apparaît moins de 15 fois est regroupé dans "Autre",
# sinon l'encodage one-hot crée trop de colonnes quasi vides.
SEUIL_RARETE = 15

# Fourchette de prix réaliste (en MAD) pour une occasion au Maroc.
# On l'applique avant le filtre IQR pour virer les erreurs de saisie grossières.
PRIX_MIN_PLAUSIBLE = 8_000
PRIX_MAX_PLAUSIBLE = 2_000_000


def load_raw_data(path: str = RAW_PATH) -> pd.DataFrame:
    """Charge le CSV brut (il est encodé en latin-1)."""
    df = pd.read_csv(path, encoding="latin-1")
    print(f"[load_raw_data] Fichier chargé : {df.shape[0]} lignes, {df.shape[1]} colonnes")
    return df


def select_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Garde uniquement les colonnes utiles et les renomme."""
    df = df[COLONNES_A_GARDER].copy()
    df = df.rename(columns=RENAME_MAP)
    print(f"[select_columns] Colonnes conservées : {list(df.columns)}")
    return df


def parse_kilometrage(valeur: str) -> float:
    """
    Sur Avito le kilométrage est une tranche, par exemple '200 000 - 249 999'.
    On la remplace par le milieu de la tranche (224999.5).
    Renvoie NaN si la valeur est vide ou illisible.
    """
    if pd.isna(valeur):
        return np.nan
    nombres = re.findall(r"\d[\d\s]*\d|\d", str(valeur))
    nombres = [int(n.replace(" ", "")) for n in nombres]
    if len(nombres) == 2:
        return (nombres[0] + nombres[1]) / 2
    if len(nombres) == 1:
        return float(nombres[0])
    return np.nan


def transform_kilometrage(df: pd.DataFrame) -> pd.DataFrame:
    """Applique parse_kilometrage sur toute la colonne."""
    df["kilometrage"] = df["kilometrage"].apply(parse_kilometrage)
    n_missing = df["kilometrage"].isna().sum()
    print(f"[transform_kilometrage] Kilométrage converti en nombre ({n_missing} valeurs manquantes)")
    return df


def clean_categorical(df: pd.DataFrame) -> pd.DataFrame:
    """
    Dans le fichier brut, '--' veut dire "non renseigné" pour la boîte de vitesses.
    On le remplace par NaN, puis tous les NaN des colonnes catégorielles
    deviennent "Inconnu". On préfère garder la ligne que la supprimer.
    """
    df["boite_vitesses"] = df["boite_vitesses"].replace("--", np.nan)

    colonnes_categorielles = [
        "marque", "modele", "carburant", "boite_vitesses",
        "etat", "ville", "premiere_main",
    ]
    for col in colonnes_categorielles:
        n_missing = df[col].isna().sum()
        if n_missing > 0:
            df[col] = df[col].fillna("Inconnu")
            print(f"[clean_categorical] '{col}': {n_missing} valeurs manquantes -> 'Inconnu'")

    return df


def regrouper_modalites_rares(df: pd.DataFrame, colonne: str, seuil: int = SEUIL_RARETE) -> pd.DataFrame:
    """Les valeurs vues moins de `seuil` fois dans la colonne deviennent 'Autre'."""
    freq = df[colonne].value_counts()
    rares = freq[freq < seuil].index
    n_rares = len(rares)
    df[colonne] = df[colonne].where(~df[colonne].isin(rares), "Autre")
    print(f"[regrouper_modalites_rares] '{colonne}': {n_rares} modalités rares regroupées sous 'Autre'")
    return df


def drop_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    """Supprime les annonces en double (le même véhicule posté plusieurs fois)."""
    n_before = len(df)
    df = df.drop_duplicates()
    print(f"[drop_duplicates] {n_before - len(df)} doublons supprimés")
    return df


def remove_price_outliers(df: pd.DataFrame) -> pd.DataFrame:
    """
    Il y a des prix complètement faux (erreurs de saisie, par exemple plus de
    600 millions de MAD). Deux étapes :
      1. on garde seulement les prix dans la fourchette réaliste ci-dessus
      2. on applique la règle de l'IQR sur log(prix), plus adaptée que sur le
         prix brut parce que la distribution est très étalée vers le haut
    """
    n_before = len(df)
    df = df[(df["prix"] >= PRIX_MIN_PLAUSIBLE) & (df["prix"] <= PRIX_MAX_PLAUSIBLE)]

    log_prix = np.log1p(df["prix"])
    q1, q3 = log_prix.quantile([0.25, 0.75])
    iqr = q3 - q1
    borne_basse = q1 - 1.5 * iqr
    borne_haute = q3 + 1.5 * iqr
    mask = (log_prix >= borne_basse) & (log_prix <= borne_haute)
    df = df[mask]

    print(f"[remove_price_outliers] {n_before - len(df)} lignes supprimées "
          f"(prix hors de [{np.expm1(borne_basse):.0f}, {np.expm1(borne_haute):.0f}] MAD env.)")
    return df


def drop_missing_essentials(df: pd.DataFrame) -> pd.DataFrame:
    """Supprime les lignes où il manque une valeur numérique indispensable."""
    n_before = len(df)
    df = df.dropna(subset=["kilometrage", "annee", "puissance_fiscale"])
    print(f"[drop_missing_essentials] {n_before - len(df)} lignes supprimées (valeurs numériques manquantes)")
    return df


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Enchaîne toutes les étapes de nettoyage, dans l'ordre."""
    df = select_columns(df)
    df = transform_kilometrage(df)
    df = clean_categorical(df)
    df = regrouper_modalites_rares(df, "modele")
    df = regrouper_modalites_rares(df, "ville")
    df = drop_duplicates(df)
    df = drop_missing_essentials(df)
    df = remove_price_outliers(df)
    df = df.reset_index(drop=True)
    return df


def save_processed(df: pd.DataFrame, path: str = PROCESSED_PATH) -> None:
    """Écrit le dataset nettoyé dans data/processed/."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    df.to_csv(path, index=False)
    print(f"[save_processed] Dataset nettoyé sauvegardé -> {path} ({df.shape[0]} lignes, {df.shape[1]} colonnes)")


def main():
    df_raw = load_raw_data()
    df_clean = clean_data(df_raw)
    print("\nAperçu du dataset final :")
    print(df_clean.head())
    print("\nStatistiques du prix après nettoyage :")
    print(df_clean["prix"].describe())
    save_processed(df_clean)


if __name__ == "__main__":
    main()
