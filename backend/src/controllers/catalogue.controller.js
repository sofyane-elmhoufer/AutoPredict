const { Op } = require('sequelize');
const { CatalogueVehicule } = require('../models');
const { toCamelCase } = require('../utils/caseConverter');
const mlService = require('../services/mlService');

/**
 * GET /api/catalogue/domaine
 * Renvoie ce que le modèle ML connaît : les villes et les bornes (année,
 * kilométrage, puissance fiscale). Le formulaire s'en sert pour ne pas
 * laisser saisir une valeur que le modèle n'a jamais vue.
 */
async function getDomaineEntrainement(req, res, next) {
  try {
    const domaine = await mlService.getDomaine();
    res.json(domaine);
  } catch (err) {
    // Si le service ML est arrêté, on n'empêche pas d'afficher le formulaire :
    // on renvoie juste qu'il n'y a pas de restriction pour l'instant.
    res.json({ villes: [], limites: null, indisponible: true });
  }
}

/**
 * GET /api/catalogue/marques
 * Remplit la liste déroulante des marques du formulaire.
 */
async function getMarques(req, res, next) {
  try {
    const marques = await CatalogueVehicule.findAll({
      attributes: [[CatalogueVehicule.sequelize.fn('DISTINCT', CatalogueVehicule.sequelize.col('marque')), 'marque']],
      order: [['marque', 'ASC']],
    });
    res.json({ marques: marques.map((m) => m.marque) });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/catalogue/modeles?marque=Dacia
 * Remplit la liste des modèles, selon la marque choisie.
 */
async function getModelesByMarque(req, res, next) {
  try {
    const { marque } = req.query;
    if (!marque) return res.status(422).json({ message: 'Le paramètre "marque" est requis.' });

    const references = await CatalogueVehicule.findAll({
      where: { marque },
      attributes: ['id_vehicule_ref', 'modele', 'annee_min', 'annee_max'],
      order: [['modele', 'ASC']],
    });
    res.json({ modeles: toCamelCase(references) });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/catalogue
 * Liste complète avec pagination (utilisée côté admin).
 */
async function getCatalogue(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.q) {
      where[Op.or] = [
        { marque: { [Op.like]: `%${req.query.q}%` } },
        { modele: { [Op.like]: `%${req.query.q}%` } },
      ];
    }

    const { rows, count } = await CatalogueVehicule.findAndCountAll({
      where,
      order: [['marque', 'ASC'], ['modele', 'ASC']],
      limit,
      offset,
    });

    res.json({
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      references: toCamelCase(rows),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/catalogue (admin)
 * Ajoute une référence marque / modèle.
 */
async function ajouterReference(req, res, next) {
  try {
    const { marque, modele, anneeMin, anneeMax } = req.body;
    if (!marque || !modele || !anneeMin || !anneeMax) {
      return res.status(422).json({ message: 'Champs requis : marque, modele, anneeMin, anneeMax.' });
    }
    if (Number(anneeMin) > Number(anneeMax)) {
      return res.status(422).json({ message: 'anneeMin ne peut pas être supérieure à anneeMax.' });
    }

    const reference = await CatalogueVehicule.create({
      marque,
      modele,
      annee_min: anneeMin,
      annee_max: anneeMax,
    });
    res.status(201).json({ message: 'Référence ajoutée au catalogue.', reference: toCamelCase(reference) });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/catalogue/:id (admin)
 * Modifie une référence.
 */
async function modifierReference(req, res, next) {
  try {
    const reference = await CatalogueVehicule.findByPk(req.params.id);
    if (!reference) return res.status(404).json({ message: 'Référence introuvable.' });

    const { marque, modele, anneeMin, anneeMax } = req.body;
    if (marque) reference.marque = marque;
    if (modele) reference.modele = modele;
    if (anneeMin) reference.annee_min = anneeMin;
    if (anneeMax) reference.annee_max = anneeMax;
    if (reference.annee_min > reference.annee_max) {
      return res.status(422).json({ message: 'anneeMin ne peut pas être supérieure à anneeMax.' });
    }

    await reference.save();
    res.json({ message: 'Référence mise à jour.', reference: toCamelCase(reference) });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/catalogue/:id (admin)
 */
async function supprimerReference(req, res, next) {
  try {
    const reference = await CatalogueVehicule.findByPk(req.params.id);
    if (!reference) return res.status(404).json({ message: 'Référence introuvable.' });
    await reference.destroy();
    res.json({ message: 'Référence supprimée.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDomaineEntrainement,
  getMarques,
  getModelesByMarque,
  getCatalogue,
  ajouterReference,
  modifierReference,
  supprimerReference,
};
