const { sequelize } = require('../config/database');
const Utilisateur = require('./Utilisateur');
const Estimation = require('./Estimation');
const ModeleML = require('./ModeleML');
const CatalogueVehicule = require('./CatalogueVehicule');

// Utilisateur -> Estimation
Utilisateur.hasMany(Estimation, {
  foreignKey: 'id_utilisateur',
  as: 'estimations',
  onDelete: 'SET NULL', // si le compte est supprimé, on garde l'estimation (sans utilisateur)
});
Estimation.belongsTo(Utilisateur, {
  foreignKey: 'id_utilisateur',
  as: 'utilisateur',
});

// ModeleML -> Estimation
ModeleML.hasMany(Estimation, {
  foreignKey: 'id_modele',
  as: 'estimations',
});
Estimation.belongsTo(ModeleML, {
  foreignKey: 'id_modele',
  as: 'modeleUtilise',
});

// Estimation -> CatalogueVehicule
CatalogueVehicule.hasMany(Estimation, {
  foreignKey: 'id_vehicule_ref',
  as: 'estimations',
});
Estimation.belongsTo(CatalogueVehicule, {
  foreignKey: 'id_vehicule_ref',
  as: 'referenceVehicule',
});

module.exports = {
  sequelize,
  Utilisateur,
  Estimation,
  ModeleML,
  CatalogueVehicule,
};
