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
    // Utilisateur qui a fait la demande (null si c'est un visiteur)
    id_utilisateur: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // Référence du catalogue correspondant au véhicule
    id_vehicule_ref: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // Version du modèle ML qui a donné le résultat
    id_modele: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Caractéristiques saisies dans le formulaire
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
    premiere_main: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    nb_reutilisations: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

    // Cache : empreinte des caractéristiques
    hash_caracteristiques: {
      type: DataTypes.STRING(64), // SHA-256 = 64 caractères hexadécimaux
      allowNull: false,
    },
    source_resultat: {
      type: DataTypes.ENUM('CACHE', 'NOUVELLE_PREDICTION'),
      allowNull: false,
    },

    // Résultat de l'estimation
    prix_estime: { type: DataTypes.FLOAT, allowNull: false },
    marge_confiance_min: { type: DataTypes.FLOAT, allowNull: false },
    marge_confiance_max: { type: DataTypes.FLOAT, allowNull: false },
    facteurs_explicatifs: {
      type: DataTypes.JSON, // [{feature, impact}, ...] : importance de chaque variable dans le modèle
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
      // Index sur (hash, modèle) pour retrouver vite une estimation du cache
      { fields: ['hash_caracteristiques', 'id_modele'], name: 'idx_cache_lookup' },
      { fields: ['id_utilisateur'] },
    ],
  }
);

module.exports = Estimation;
