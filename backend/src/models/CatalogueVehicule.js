const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class CatalogueVehicule extends Model {}

CatalogueVehicule.init(
  {
    id_vehicule_ref: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    marque: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    modele: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    // Première année de production de cette génération du modèle
    annee_min: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // Dernière année de production connue (année en cours si toujours produit)
    annee_max: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'CatalogueVehicule',
    tableName: 'catalogue_vehicule',
    indexes: [{ fields: ['marque', 'modele'] }],
  }
);

module.exports = CatalogueVehicule;
