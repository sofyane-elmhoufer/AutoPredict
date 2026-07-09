const { Op } = require('sequelize');
const { CatalogueVehicule } = require('../models');
const { toCamelCase } = require('../utils/caseConverter');

/**
 * GET /api/catalogue/marques
 * Alimente la liste déroulante "marque" du formulaire.
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
 * Alimente la liste déroulante "modèle", dépendante de la marque choisie.
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
 * Liste complète (pagination), utile côté admin.
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
 * POST /api/catalogue  (admin)
 * Correspond à CatalogueVehicule.ajouterReference()
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
 * PUT /api/catalogue/:id  (admin)
 * Correspond à CatalogueVehicule.modifierReference()
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
 * DELETE /api/catalogue/:id  (admin)
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
  getMarques,
  getModelesByMarque,
  getCatalogue,
  ajouterReference,
  modifierReference,
  supprimerReference,
};
