const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class ModeleML extends Model {}

ModeleML.init(
  {
    id_modele: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nom_version: {
      type: DataTypes.STRING(50),
      allowNull: false, // ex. "v1.2"
    },
    algorithme: {
      type: DataTypes.STRING(100),
      allowNull: false, // ex. "XGBoost", "Random Forest"
    },
    chemin_fichier: {
      type: DataTypes.STRING(255),
      allowNull: false, // chemin vers le .pkl / .joblib côté service ML
    },
    score_r2: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    score_mae: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    date_entrainement: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    // Une seule version active à la fois (contrainte gérée en base + logique métier)
    statut_actif: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'ModeleML',
    tableName: 'modele_ml',
  }
);

module.exports = ModeleML;
