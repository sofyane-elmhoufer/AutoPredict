-- ============================================================
-- AutoPredict - Schéma de base de données MySQL
-- Correspond au MCD (section 5.2 du cahier des charges)
-- Ce fichier est fourni à titre de documentation / déploiement prod.
-- En développement, Sequelize (sync alter) crée déjà ces tables.
-- ============================================================

CREATE DATABASE IF NOT EXISTS autopredict CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE autopredict;

-- ------------------------------------------------------------
-- Table UTILISATEUR (inclut la spécialisation Administrateur via `role`)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS utilisateurs (
  id_utilisateur     INT AUTO_INCREMENT PRIMARY KEY,
  nom                VARCHAR(100) NOT NULL,
  prenom             VARCHAR(100) NOT NULL,
  email              VARCHAR(150) NOT NULL UNIQUE,
  mot_de_passe_hash  VARCHAR(255) NOT NULL,
  role               ENUM('UTILISATEUR', 'ADMINISTRATEUR') NOT NULL DEFAULT 'UTILISATEUR',
  droits_acces       ENUM('ADMIN', 'SUPER_ADMIN') NULL,
  date_inscription   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  statut_compte      TINYINT(1) NOT NULL DEFAULT 1,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Table CATALOGUE_VEHICULE (référentiel marque/modèle/années de production)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS catalogue_vehicule (
  id_vehicule_ref  INT AUTO_INCREMENT PRIMARY KEY,
  marque           VARCHAR(80) NOT NULL,
  modele           VARCHAR(80) NOT NULL,
  annee_min        INT NOT NULL,
  annee_max        INT NOT NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_marque_modele (marque, modele)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Table MODELE_ML (versions successives du modèle de prédiction)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS modele_ml (
  id_modele          INT AUTO_INCREMENT PRIMARY KEY,
  nom_version        VARCHAR(50) NOT NULL,
  algorithme         VARCHAR(100) NOT NULL,
  chemin_fichier     VARCHAR(255) NOT NULL,
  score_r2           FLOAT NULL,
  score_mae          FLOAT NULL,
  date_entrainement  DATETIME NOT NULL,
  statut_actif       TINYINT(1) NOT NULL DEFAULT 0,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Table ESTIMATION (cœur du mécanisme de cache)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS estimation (
  id_estimation          INT AUTO_INCREMENT PRIMARY KEY,
  id_utilisateur         INT NULL,
  id_vehicule_ref        INT NULL,
  id_modele              INT NOT NULL,

  marque                 VARCHAR(80) NOT NULL,
  modele                 VARCHAR(80) NOT NULL,
  annee                  INT NOT NULL,
  kilometrage            INT NOT NULL,
  carburant              ENUM('ESSENCE','DIESEL','HYBRIDE','ELECTRIQUE','GPL') NOT NULL,
  boite_vitesses         ENUM('MANUELLE','AUTOMATIQUE') NOT NULL,
  etat_vehicule          ENUM('EXCELLENT','BON','MOYEN','A_REPARER') NOT NULL,
  puissance_fiscale      INT NOT NULL,
  ville                  VARCHAR(80) NOT NULL,
  premiere_main          BOOLEAN NOT NULL DEFAULT TRUE,
  nb_reutilisations      INT NOT NULL DEFAULT 0,

  hash_caracteristiques  CHAR(64) NOT NULL COMMENT 'SHA-256 des caractéristiques normalisées',
  source_resultat        ENUM('CACHE','NOUVELLE_PREDICTION') NOT NULL,

  prix_estime            FLOAT NOT NULL,
  marge_confiance_min    FLOAT NOT NULL,
  marge_confiance_max    FLOAT NOT NULL,
  facteurs_explicatifs   JSON NULL,

  date_estimation        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_estimation_utilisateur FOREIGN KEY (id_utilisateur)
    REFERENCES utilisateurs(id_utilisateur) ON DELETE SET NULL,
  CONSTRAINT fk_estimation_vehicule_ref FOREIGN KEY (id_vehicule_ref)
    REFERENCES catalogue_vehicule(id_vehicule_ref) ON DELETE SET NULL,
  CONSTRAINT fk_estimation_modele FOREIGN KEY (id_modele)
    REFERENCES modele_ml(id_modele) ON DELETE RESTRICT,

  -- Index composite essentiel : accès en un seul hit pour vérifier le cache
  INDEX idx_cache_lookup (hash_caracteristiques, id_modele),
  INDEX idx_estimation_utilisateur (id_utilisateur)
) ENGINE=InnoDB;
