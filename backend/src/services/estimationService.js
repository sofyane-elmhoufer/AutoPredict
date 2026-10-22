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

// Vérifie que l'année saisie est dans la plage connue du modèle de voiture
// (table CatalogueVehicule, colonnes annee_min / annee_max).
async function validerAnneeVehicule(marque, modele, annee) {
  const ref = await CatalogueVehicule.findOne({
    where: { marque, modele },
  });

  if (!ref) {
    // Modèle absent du catalogue : on laisse passer, l'estimation reste possible
    return { reference: null };
  }

  if (annee < ref.annee_min || annee > ref.annee_max) {
    throw new AnneeInvalideError(
      `Année incohérente pour ${marque} ${modele} : plage de production connue ${ref.annee_min}-${ref.annee_max}.`
    );
  }

  return { reference: ref };
}

// Enregistre une ligne dans la table estimation. On s'en sert pour une nouvelle
// prédiction ET pour une réponse venue du cache : comme ça chaque demande
// laisse une trace (historique de l'utilisateur, stats de l'admin).
async function enregistrerEstimation({
  caracteristiques,
  idUtilisateur,
  reference,
  modeleActif,
  hash,
  source,
  resultat,
}) {
  return Estimation.create({
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
    premiere_main: Boolean(caracteristiques.premiereMain),
    hash_caracteristiques: hash,
    source_resultat: source,
    prix_estime: resultat.prix_estime,
    marge_confiance_min: resultat.marge_confiance_min,
    marge_confiance_max: resultat.marge_confiance_max,
    facteurs_explicatifs: resultat.facteurs_explicatifs || [],
    date_estimation: new Date(),
  });
}

/**
 * Fonctionnement (voir le cahier des charges, section 3.1.b) :
 *  1. on normalise les caractéristiques et on calcule leur hash
 *  2. on cherche en base une estimation avec le même hash, faite par le modèle ML actif
 *  3a. trouvée : on réutilise son résultat (source = CACHE)
 *  3b. pas trouvée : on appelle le service ML (source = NOUVELLE_PREDICTION)
 *  4. on renvoie le résultat dans le même format dans les deux cas
 *
 * idUtilisateur vaut null si la personne n'est pas connectée (visiteur).
 */
async function obtenirEstimation(caracteristiques, idUtilisateur = null) {
  const { reference } = await validerAnneeVehicule(
    caracteristiques.marque,
    caracteristiques.modele,
    Number(caracteristiques.annee)
  );

  // Le cache n'est valable que pour le modèle actif : si on en active un autre,
  // les anciennes estimations ne sont plus retrouvées.
  const modeleActif = await ModeleML.findOne({ where: { statut_actif: true } });
  if (!modeleActif) {
    throw new MLIndisponibleError();
  }

  const { hash } = computeCacheHash(caracteristiques);

  // On cherche seulement parmi les vraies prédictions (pas parmi les lignes
  // CACHE, qui ne sont que des copies).
  const estimationExistante = await Estimation.findOne({
    where: {
      hash_caracteristiques: hash,
      id_modele: modeleActif.id_modele,
      source_resultat: 'NOUVELLE_PREDICTION',
    },
    order: [['date_estimation', 'DESC']],
  });

  if (estimationExistante) {
    // Compteur de réutilisations de la prédiction d'origine
    estimationExistante.nb_reutilisations += 1;
    await estimationExistante.save();

    // Et on ajoute une ligne pour cette demande-ci, avec le prix déjà calculé.
    const copie = await enregistrerEstimation({
      caracteristiques,
      idUtilisateur,
      reference,
      modeleActif,
      hash,
      source: 'CACHE',
      resultat: estimationExistante,
    });
    return formatResultat(copie, 'CACHE', estimationExistante.nb_reutilisations);
  }

  // Pas dans le cache (ou modèle changé depuis) : on interroge le service ML
  let predictionML;
  try {
    predictionML = await mlService.predire(caracteristiques);
  } catch (err) {
    throw new MLIndisponibleError();
  }

  const nouvelleEstimation = await enregistrerEstimation({
    caracteristiques,
    idUtilisateur,
    reference,
    modeleActif,
    hash,
    source: 'NOUVELLE_PREDICTION',
    resultat: {
      prix_estime: predictionML.prixEstime,
      marge_confiance_min: predictionML.margeConfiance.min,
      marge_confiance_max: predictionML.margeConfiance.max,
      facteurs_explicatifs: predictionML.facteursExplicatifs,
    },
  });

  return formatResultat(nouvelleEstimation, 'NOUVELLE_PREDICTION');
}

// Met l'estimation au format de la réponse de l'API.
// nbReutilisations est optionnel : pour une réponse venue du cache, on donne
// le compteur de l'estimation d'origine.
function formatResultat(estimation, source, nbReutilisations) {
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
      premiereMain: estimation.premiere_main,
    },
    prixEstime: estimation.prix_estime,
    margeConfiance: {
      min: estimation.marge_confiance_min,
      max: estimation.marge_confiance_max,
    },
    facteursExplicatifs: estimation.facteurs_explicatifs,
    source, // 'CACHE' ou 'NOUVELLE_PREDICTION'
    dateEstimation: estimation.date_estimation,
    modeleVersion: estimation.modeleUtilise ? estimation.modeleUtilise.nom_version : undefined,
    nombreReutilisations:
      nbReutilisations !== undefined ? nbReutilisations : estimation.nb_reutilisations || 0,
  };
}

module.exports = {
  obtenirEstimation,
  validerAnneeVehicule,
  formatResultat,
  MLIndisponibleError,
  AnneeInvalideError,
};
