const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Estimation extends Model {}

Estimation.init(
  {
    id_estimation: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // ENREGISTRER : Utilisateur (0,N) -- Estimation (0,1) -> null si Visiteur
    id_utilisateur: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // CONCERNER : Estimation (1,1) -- CatalogueVehicule (0,N)
    id_vehicule_ref: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // GENERER : ModeleML (1,1) -- Estimation (0,N)
    id_modele: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Caractéristiques déclaratives du véhicule (formulaire)
    marque: { type: DataTypes.STRING(80), allowNull: false },
    modele: { type: DataTypes.STRING(80), allowNull: false },
    annee: { type: DataTypes.INTEGER, allowNull: false },
    kilometrage: { type: DataTypes.INTEGER, allowNull: false },
    carburant: {
      type: DataTypes.ENUM('ESSENCE', 'DIESEL', 'HYBRIDE', 'ELECTRIQUE', 'GPL'),
      allowNull: false,
    },
    boite_vitesses: {
      type: DataTypes.ENUM('MANUELLE', 'AUTOMATIQUE'),
      allowNull: false,
    },
    etat_vehicule: {
      type: DataTypes.ENUM('EXCELLENT', 'BON', 'MOYEN', 'A_REPARER'),
      allowNull: false,
    },
    puissance_fiscale: { type: DataTypes.INTEGER, allowNull: false },
    ville: { type: DataTypes.STRING(80), allowNull: false },
    nombre_proprietaires: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },

    // --- Mécanisme de cache ---
    hash_caracteristiques: {
      type: DataTypes.STRING(64), // SHA-256 -> 64 caractères hex
      allowNull: false,
    },
    source_resultat: {
      type: DataTypes.ENUM('CACHE', 'NOUVELLE_PREDICTION'),
      allowNull: false,
    },

    // Résultat
    prix_estime: { type: DataTypes.FLOAT, allowNull: false },
    marge_confiance_min: { type: DataTypes.FLOAT, allowNull: false },
    marge_confiance_max: { type: DataTypes.FLOAT, allowNull: false },
    facteurs_explicatifs: {
      type: DataTypes.JSON, // sortie type SHAP : [{feature, impact}, ...]
      allowNull: true,
    },

    date_estimation: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Estimation',
    tableName: 'estimation',
    indexes: [
      // Index composite : accès en un seul hit pour vérifier le cache
      { fields: ['hash_caracteristiques', 'id_modele'], name: 'idx_cache_lookup' },
      { fields: ['id_utilisateur'] },
    ],
  }
);

module.exports = Estimation;
