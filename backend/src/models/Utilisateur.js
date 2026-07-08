const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Utilisateur extends Model {}

Utilisateur.init(
  {
    id_utilisateur: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nom: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    prenom: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    mot_de_passe_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('UTILISATEUR', 'ADMINISTRATEUR'),
      allowNull: false,
      defaultValue: 'UTILISATEUR',
    },
    // Spécifique à la spécialisation Administrateur (nul pour un simple utilisateur)
    droits_acces: {
      type: DataTypes.ENUM('ADMIN', 'SUPER_ADMIN'),
      allowNull: true,
    },
    date_inscription: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    statut_compte: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true, // actif par défaut
    },
  },
  {
    sequelize,
    modelName: 'Utilisateur',
    tableName: 'utilisateurs',
  }
);

module.exports = Utilisateur;
