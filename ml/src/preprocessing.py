"""
=============================================================================
 AutoPredict - preprocessing.py
 Nettoyage et préparation du dataset Avito (véhicules d'occasion - Maroc)
=============================================================================
Ce script lit le fichier brut (data/raw/avito_car_dataset_ALL.csv), ne garde
que les colonnes utiles au modèle, nettoie / transforme les valeurs, gère les
valeurs manquantes et les outliers, puis sauvegarde un dataset propre dans
data/processed/.

Utilisation :
    python preprocessing.py
"""

# =============================================================================
# 1. IMPORTS
# =============================================================================
import os
import re
import numpy as np
import pandas as pd


# =============================================================================
# 2. CONFIGURATION
# =============================================================================
# Chemins relatifs au dossier "ml/" (indépendants du dossier courant d'exécution)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # -> ml/
RAW_PATH = os.path.join(BASE_DIR, "data", "raw", "avito_car_dataset_ALL.csv")
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
PROCESSED_PATH = os.path.join(PROCESSED_DIR, "cars_clean.csv")

# Colonnes retenues (les critères métier définis pour le modèle)
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
    "Prix",  # target
]

# Renommage vers des noms de colonnes propres (sans accents/espaces) pour la suite du pipeline
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

# Seuil de fréquence minimale pour garder une modalité de "modele"/"ville" telle quelle
# (les modalités trop rares sont regroupées sous "Autre" pour limiter la cardinalité)
SEUIL_RARETE = 15

# Bornes plausibles pour le prix d'un véhicule d'occasion au Maroc (en MAD)
# Utilisées comme garde-fou avant le filtrage IQR sur le log-prix.
PRIX_MIN_PLAUSIBLE = 8_000
PRIX_MAX_PLAUSIBLE = 2_000_000


# =============================================================================
# 3. CHARGEMENT DES DONNÉES BRUTES
# =============================================================================
def load_raw_data(path: str = RAW_PATH) -> pd.DataFrame:
    """Charge le CSV brut Avito (encodage latin-1)."""
    df = pd.read_csv(path, encoding="latin-1")
    print(f"[load_raw_data] Fichier chargé : {df.shape[0]} lignes, {df.shape[1]} colonnes")
    return df


# =============================================================================
# 4. SÉLECTION DES COLONNES UTILES
# =============================================================================
def select_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Ne garde que les colonnes nécessaires au modèle (features + target)."""
    df = df[COLONNES_A_GARDER].copy()
    df = df.rename(columns=RENAME_MAP)
    print(f"[select_columns] Colonnes conservées : {list(df.columns)}")
    return df


# =============================================================================
# 5. TRANSFORMATION DU KILOMÉTRAGE (plage textuelle -> valeur numérique)
# =============================================================================
def parse_kilometrage(valeur: str) -> float:
    """
    Convertit une plage du type '200 000 - 249 999' en sa valeur médiane (224999.5).
    Retourne np.nan si la valeur est manquante ou mal formée.
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
    """Applique parse_kilometrage et remplace la colonne texte par une colonne numérique."""
    df["kilometrage"] = df["kilometrage"].apply(parse_kilometrage)
    n_missing = df["kilometrage"].isna().sum()
    print(f"[transform_kilometrage] Kilométrage converti en numérique ({n_missing} valeurs manquantes)")
    return df


# =============================================================================
# 6. NETTOYAGE DES VALEURS MANQUANTES / ABERRANTES DANS LES COLONNES CATÉGORIELLES
# =============================================================================
def clean_categorical(df: pd.DataFrame) -> pd.DataFrame:
    """
    - Remplace les marqueurs de valeur manquante ('--') par NaN
    - Impute les catégories manquantes par 'Inconnu' (catégorie explicite,
      plus informative qu'une suppression de ligne)
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


# =============================================================================
# 7. REGROUPEMENT DES MODALITÉS RARES (réduction de cardinalité)
# =============================================================================
def regrouper_modalites_rares(df: pd.DataFrame, colonne: str, seuil: int = SEUIL_RARETE) -> pd.DataFrame:
    """Remplace les modalités apparaissant moins de `seuil` fois par 'Autre'."""
    freq = df[colonne].value_counts()
    rares = freq[freq < seuil].index
    n_rares = len(rares)
    df[colonne] = df[colonne].where(~df[colonne].isin(rares), "Autre")
    print(f"[regrouper_modalites_rares] '{colonne}': {n_rares} modalités rares regroupées sous 'Autre'")
    return df


# =============================================================================
# 8. SUPPRESSION DES LIGNES DUPLIQUÉES
# =============================================================================
def drop_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    n_before = len(df)
    df = df.drop_duplicates()
    print(f"[drop_duplicates] {n_before - len(df)} doublons supprimés")
    return df


# =============================================================================
# 9. TRAITEMENT DES OUTLIERS SUR LE PRIX (target)
# =============================================================================
def remove_price_outliers(df: pd.DataFrame) -> pd.DataFrame:
    """
    Le prix brut contient des valeurs aberrantes extrêmes (ex. erreurs de saisie
    avec des zéros en trop : prix > 600 millions de MAD). On applique :
      1. un garde-fou métier (prix plausible pour un véhicule d'occasion au Maroc)
      2. un filtrage IQR sur le log(prix), plus robuste sur une distribution
         fortement asymétrique que l'IQR sur le prix brut.
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


# =============================================================================
# 10. SUPPRESSION DES LIGNES SANS KILOMÉTRAGE (feature indispensable)
# =============================================================================
def drop_missing_essentials(df: pd.DataFrame) -> pd.DataFrame:
    n_before = len(df)
    df = df.dropna(subset=["kilometrage", "annee", "puissance_fiscale"])
    print(f"[drop_missing_essentials] {n_before - len(df)} lignes supprimées (features numériques essentielles manquantes)")
    return df


# =============================================================================
# 11. PIPELINE COMPLET DE NETTOYAGE
# =============================================================================
def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Enchaîne toutes les étapes de nettoyage sur le dataframe brut."""
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


# =============================================================================
# 12. SAUVEGARDE DU DATASET NETTOYÉ
# =============================================================================
def save_processed(df: pd.DataFrame, path: str = PROCESSED_PATH) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    df.to_csv(path, index=False)
    print(f"[save_processed] Dataset nettoyé sauvegardé -> {path} ({df.shape[0]} lignes, {df.shape[1]} colonnes)")


# =============================================================================
# 13. EXÉCUTION DU SCRIPT
# =============================================================================
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
