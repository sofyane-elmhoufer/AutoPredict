const { Estimation, ModeleML, CatalogueVehicule } = require('../models');
const { computeCacheHash } = require('../utils/cacheHash');
const mlService = require('./mlService');

class MLIndisponibleError extends Error {
  constructor() {
    super("Le modèle ML est indisponible et aucune estimation en cache n'a été trouvée.");
    this.status = 503;
  }
}

class AnneeInvalideError extends Error {
  constructor(msg) {
    super(msg);
    this.status = 422;
  }
}

/**
 * Valide que l'année saisie correspond à la plage de production réelle du modèle,
 * via le référentiel CatalogueVehicule (anneeMin / anneeMax). Cf. section 5.4 du CDC.
 */
async function validerAnneeVehicule(marque, modele, annee) {
  const ref = await CatalogueVehicule.findOne({
    where: { marque, modele },
  });

  if (!ref) {
    // Pas de référence connue : on n'empêche pas l'estimation mais on log pour l'admin
    return { reference: null };
  }

  if (annee < ref.annee_min || annee > ref.annee_max) {
    throw new AnneeInvalideError(
      `Année incohérente pour ${marque} ${modele} : plage de production connue ${ref.annee_min}-${ref.annee_max}.`
    );
  }

  return { reference: ref };
}

/**
 * Implémente les étapes 1 à 4 de la section 3.1.b du cahier des charges :
 *  1. Normalisation + calcul du hash
 *  2. Recherche en base (table ESTIMATION) sur hash + modèle actif
 *  3a. Trouvé -> renvoyer depuis le cache (source = CACHE)
 *  3b. Non trouvé / modèle obsolète -> appel ML, sauvegarde (source = NOUVELLE_PREDICTION)
 *  4. Retour du résultat au format uniforme
 *
 * @param {Object} caracteristiques - payload du formulaire véhicule
 * @param {number|null} idUtilisateur - null si Visiteur
 */
async function obtenirEstimation(caracteristiques, idUtilisateur = null) {
  // Validation métier : cohérence de l'année vs. catalogue
  const { reference } = await validerAnneeVehicule(
    caracteristiques.marque,
    caracteristiques.modele,
    Number(caracteristiques.annee)
  );

  // Modèle ML actuellement actif : seule référence valable pour juger la fraîcheur du cache
  const modeleActif = await ModeleML.findOne({ where: { statut_actif: true } });
  if (!modeleActif) {
    throw new MLIndisponibleError();
  }

  // Étape 1 : normalisation + hash
  const { hash } = computeCacheHash(caracteristiques);

  // Étape 2 : recherche en base d'une estimation avec la même empreinte,
  // générée par la version de modèle actuellement active
  const estimationExistante = await Estimation.findOne({
    where: {
      hash_caracteristiques: hash,
      id_modele: modeleActif.id_modele,
    },
    order: [['date_estimation', 'DESC']],
  });

  // Étape 3a : cache trouvé et à jour
  if (estimationExistante) {
    return formatResultat(estimationExistante, 'CACHE');
  }

  // Étape 3b : aucune correspondance (ou modèle réentraîné depuis) -> appel au modèle ML
  let predictionML;
  try {
    predictionML = await mlService.predire(caracteristiques);
  } catch (err) {
    // Le modèle ML est indisponible et il n'existe aucune estimation en cache utilisable
    throw new MLIndisponibleError();
  }

  const nouvelleEstimation = await Estimation.create({
    id_utilisateur: idUtilisateur,
    id_vehicule_ref: reference ? reference.id_vehicule_ref : null,
    id_modele: modeleActif.id_modele,
    marque: caracteristiques.marque,
    modele: caracteristiques.modele,
    annee: caracteristiques.annee,
    kilometrage: caracteristiques.kilometrage,
    carburant: caracteristiques.carburant,
    boite_vitesses: caracteristiques.boiteVitesses,
    etat_vehicule: caracteristiques.etatVehicule,
    puissance_fiscale: caracteristiques.puissanceFiscale,
    ville: caracteristiques.ville,
    nombre_proprietaires: caracteristiques.nombreProprietaires || 1,
    hash_caracteristiques: hash,
    source_resultat: 'NOUVELLE_PREDICTION',
    prix_estime: predictionML.prixEstime,
    marge_confiance_min: predictionML.margeConfiance.min,
    marge_confiance_max: predictionML.margeConfiance.max,
    facteurs_explicatifs: predictionML.facteursExplicatifs || [],
    date_estimation: new Date(),
  });

  // Étape 4 : retour du résultat
  return formatResultat(nouvelleEstimation, 'NOUVELLE_PREDICTION');
}

function formatResultat(estimation, source) {
  return {
    idEstimation: estimation.id_estimation,
    vehicule: {
      marque: estimation.marque,
      modele: estimation.modele,
      annee: estimation.annee,
      kilometrage: estimation.kilometrage,
      carburant: estimation.carburant,
      boiteVitesses: estimation.boite_vitesses,
      etatVehicule: estimation.etat_vehicule,
      puissanceFiscale: estimation.puissance_fiscale,
      ville: estimation.ville,
    },
    prixEstime: estimation.prix_estime,
    margeConfiance: {
      min: estimation.marge_confiance_min,
      max: estimation.marge_confiance_max,
    },
    facteursExplicatifs: estimation.facteurs_explicatifs,
    source, // 'CACHE' | 'NOUVELLE_PREDICTION'
    dateEstimation: estimation.date_estimation,
  };
}

module.exports = { obtenirEstimation, validerAnneeVehicule, MLIndisponibleError, AnneeInvalideError };
