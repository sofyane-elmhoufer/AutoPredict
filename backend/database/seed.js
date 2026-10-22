/**
 * Remplit la base avec des données de départ :
 * - un compte admin et un compte utilisateur de test
 * - le catalogue des véhicules (marques / modèles du dataset d'entraînement)
 * - la version du modèle ML active, avec ses vrais scores
 *
 * Le catalogue et les scores viennent de ml/models/ (fichiers générés par
 * ml/src/train.py). On peut relancer le script sans risque : ce qui existe
 * déjà n'est pas dupliqué.
 *
 * Usage : npm run db:seed
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { sequelize, testConnection } = require('../src/config/database');
const { Utilisateur, CatalogueVehicule, ModeleML } = require('../src/models');

const ML_MODELS_DIR = path.join(__dirname, '..', '..', 'ml', 'models');

// Lit un fichier JSON du dossier ml/models. Renvoie null s'il n'existe pas
// ou s'il est illisible.
function lireJsonML(nomFichier) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ML_MODELS_DIR, nomFichier), 'utf-8'));
  } catch (err) {
    return null;
  }
}

// Petit catalogue de secours, utilisé seulement si catalogue_vehicules.json est absent
const CATALOGUE_DE_SECOURS = [
  { marque: 'Dacia', modele: 'Duster', annee_min: 2010, annee_max: 2024 },
  { marque: 'Dacia', modele: 'Logan', annee_min: 2005, annee_max: 2024 },
  { marque: 'Renault', modele: 'Clio', annee_min: 2000, annee_max: 2024 },
  { marque: 'Peugeot', modele: '208', annee_min: 2012, annee_max: 2024 },
  { marque: 'Volkswagen', modele: 'Golf', annee_min: 1997, annee_max: 2024 },
  { marque: 'Hyundai', modele: 'Tucson', annee_min: 2004, annee_max: 2024 },
  { marque: 'Toyota', modele: 'Yaris', annee_min: 1999, annee_max: 2024 },
];

// Dans les données d'entraînement, l'année maximale d'un modèle dépend surtout
// de ce qui était en vente sur Avito au moment de la collecte. On autorise donc
// les années récentes jusqu'à celle-ci pour ne pas bloquer une voiture récente.
const ANNEE_MAX_CATALOGUE = 2024;

function construireCatalogue() {
  const fichier = lireJsonML('catalogue_vehicules.json');
  if (!fichier || fichier.length === 0) {
    console.log('⚠️  ml/models/catalogue_vehicules.json introuvable : catalogue réduit utilisé.');
    return CATALOGUE_DE_SECOURS;
  }
  return fichier.map((v) => ({
    marque: v.marque,
    modele: v.modele,
    annee_min: v.anneeMin,
    annee_max: Math.max(v.anneeMax, ANNEE_MAX_CATALOGUE),
  }));
}

// Infos du modèle entraîné (nom de l'algorithme + scores) d'après metrics.json
function lireInfosModele() {
  const metrics = lireJsonML('metrics.json');
  const algorithme = metrics && metrics.modele_selectionne;
  const scores = metrics && algorithme && metrics.resultats_comparaison[algorithme];
  if (!scores) {
    return { algorithme: 'RandomForest', r2: null, mae: null };
  }
  return { algorithme, r2: scores.R2, mae: scores.MAE };
}

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

  // --- Catalogue des véhicules ---
  const catalogue = construireCatalogue();
  for (const ref of catalogue) {
    await CatalogueVehicule.findOrCreate({
      where: { marque: ref.marque, modele: ref.modele },
      defaults: ref,
    });
  }
  console.log(`✅ ${catalogue.length} références catalogue vérifiées/créées.`);

  // --- Version du modèle ML ---
  const infos = lireInfosModele();
  const nomVersion = `v1-${infos.algorithme.toLowerCase()}`;
  const modeleActif = await ModeleML.findOne({ where: { statut_actif: true } });

  if (!modeleActif) {
    await ModeleML.create({
      nom_version: nomVersion,
      algorithme: infos.algorithme,
      chemin_fichier: 'ml/models/model_prix.joblib',
      score_r2: infos.r2,
      score_mae: infos.mae,
      date_entrainement: new Date(),
      statut_actif: true,
    });
    console.log(`✅ Modèle ML ${nomVersion} activé (R² = ${infos.r2}, MAE = ${infos.mae} MAD).`);
  } else if (modeleActif.nom_version === 'v0.1-mock') {
    // Base créée avec l'ancien seed : on remplace la fausse version par la vraie
    await modeleActif.update({
      nom_version: nomVersion,
      algorithme: infos.algorithme,
      chemin_fichier: 'ml/models/model_prix.joblib',
      score_r2: infos.r2,
      score_mae: infos.mae,
    });
    console.log(`✅ Ancienne version de test remplacée par ${nomVersion}.`);
  }

  console.log('🌱 Seed terminé.');
  process.exit(0);
})().catch((err) => {
  console.error('❌ Erreur lors du seed :', err);
  process.exit(1);
});
