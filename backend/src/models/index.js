const { sequelize } = require('../config/database');
const Utilisateur = require('./Utilisateur');
const Estimation = require('./Estimation');
const ModeleML = require('./ModeleML');
const CatalogueVehicule = require('./CatalogueVehicule');

// --- ENREGISTRER : Utilisateur (0,N) -- Estimation (0,1) ---
Utilisateur.hasMany(Estimation, {
  foreignKey: 'id_utilisateur',
  as: 'estimations',
  onDelete: 'SET NULL', // si le compte est supprimé, l'historique n'est pas perdu (anonymisé)
});
Estimation.belongsTo(Utilisateur, {
  foreignKey: 'id_utilisateur',
  as: 'utilisateur',
});

// --- GENERER : ModeleML (1,1) -- Estimation (0,N) ---
ModeleML.hasMany(Estimation, {
  foreignKey: 'id_modele',
  as: 'estimations',
});
Estimation.belongsTo(ModeleML, {
  foreignKey: 'id_modele',
  as: 'modeleUtilise',
});

// --- CONCERNER : Estimation (1,1) -- CatalogueVehicule (0,N) ---
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
