/**
 * Peuple la base avec des données de démonstration :
 * - un compte admin
 * - un compte utilisateur
 * - quelques références du catalogue véhicule
 * - une version de modèle ML active (mock, en attendant le vrai modèle entraîné)
 *
 * Usage : npm run db:seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, testConnection } = require('../src/config/database');
const { Utilisateur, CatalogueVehicule, ModeleML } = require('../src/models');

(async () => {
  await testConnection();
  await sequelize.sync({ alter: true });

  // --- Compte administrateur ---
  const adminExiste = await Utilisateur.findOne({ where: { email: 'admin@autopredict.ma' } });
  if (!adminExiste) {
    await Utilisateur.create({
      nom: 'Admin',
      prenom: 'AutoPredict',
      email: 'admin@autopredict.ma',
      mot_de_passe_hash: await bcrypt.hash('Admin123!', 12),
      role: 'ADMINISTRATEUR',
      droits_acces: 'SUPER_ADMIN',
    });
    console.log('✅ Compte admin créé : admin@autopredict.ma / Admin123!');
  }

  // --- Compte utilisateur de test ---
  const userExiste = await Utilisateur.findOne({ where: { email: 'user@autopredict.ma' } });
  if (!userExiste) {
    await Utilisateur.create({
      nom: 'Test',
      prenom: 'Utilisateur',
      email: 'user@autopredict.ma',
      mot_de_passe_hash: await bcrypt.hash('User1234!', 12),
      role: 'UTILISATEUR',
    });
    console.log('✅ Compte utilisateur créé : user@autopredict.ma / User1234!');
  }

  // --- Catalogue véhicule (échantillon marché marocain) ---
  const catalogue = [
    { marque: 'Dacia', modele: 'Duster', annee_min: 2010, annee_max: 2024 },
    { marque: 'Dacia', modele: 'Logan', annee_min: 2005, annee_max: 2024 },
    { marque: 'Renault', modele: 'Clio', annee_min: 2000, annee_max: 2024 },
    { marque: 'Peugeot', modele: '208', annee_min: 2012, annee_max: 2024 },
    { marque: 'Volkswagen', modele: 'Golf', annee_min: 1997, annee_max: 2024 },
    { marque: 'Hyundai', modele: 'Tucson', annee_min: 2004, annee_max: 2024 },
    { marque: 'Toyota', modele: 'Yaris', annee_min: 1999, annee_max: 2024 },
  ];
  for (const ref of catalogue) {
    await CatalogueVehicule.findOrCreate({ where: { marque: ref.marque, modele: ref.modele }, defaults: ref });
  }
  console.log(`✅ ${catalogue.length} références catalogue vérifiées/créées.`);

  // --- Version initiale du modèle ML (à remplacer par le vrai modèle entraîné) ---
  const modeleExiste = await ModeleML.findOne({ where: { statut_actif: true } });
  if (!modeleExiste) {
    await ModeleML.create({
      nom_version: 'v0.1-mock',
      algorithme: 'RandomForestRegressor',
      chemin_fichier: 'ml/models/model_v0.1.pkl',
      score_r2: 0.0,
      score_mae: 0.0,
      date_entrainement: new Date(),
      statut_actif: true,
    });
    console.log('✅ Version de modèle ML initiale activée (v0.1-mock). À remplacer via /api/modeles.');
  }

  console.log('🌱 Seed terminé.');
  process.exit(0);
})().catch((err) => {
  console.error('❌ Erreur lors du seed :', err);
  process.exit(1);
});
