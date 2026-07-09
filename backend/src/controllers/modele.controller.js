const { ModeleML } = require('../models');
const { sequelize } = require('../models');
const { toCamelCase } = require('../utils/caseConverter');

/**
 * GET /api/modeles
 * Liste toutes les versions du modèle (historique + active).
 */
async function listModeles(req, res, next) {
  try {
    const modeles = await ModeleML.findAll({ order: [['date_entrainement', 'DESC']] });
    res.json({ modeles: toCamelCase(modeles) });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/modeles  (admin)
 * Enregistre une nouvelle version de modèle entraînée par l'équipe ML.
 * Ne l'active pas automatiquement : cf. mettreAJourModele() / deployer().
 */
async function creerModele(req, res, next) {
  try {
    const { nomVersion, algorithme, cheminFichier, scoreR2, scoreMAE, dateEntrainement } = req.body;
    if (!nomVersion || !algorithme || !cheminFichier) {
      return res
        .status(422)
        .json({ message: 'Champs requis : nomVersion, algorithme, cheminFichier.' });
    }

    const modele = await ModeleML.create({
      nom_version: nomVersion,
      algorithme,
      chemin_fichier: cheminFichier,
      score_r2: scoreR2 ?? null,
      score_mae: scoreMAE ?? null,
      date_entrainement: dateEntrainement || new Date(),
      statut_actif: false,
    });

    res.status(201).json({ message: 'Nouvelle version du modèle enregistrée.', modele: toCamelCase(modele) });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/modeles/:id/activer  (admin)
 * Correspond à Administrateur.mettreAJourModele() / ModeleML.deployer().
 * Une seule version active à la fois : désactive les autres dans une transaction.
 *
 * IMPORTANT : dès qu'une nouvelle version est activée, toute estimation en cache
 * générée par une version différente devient automatiquement obsolète, puisque
 * la recherche de cache filtre sur id_modele = modèle actif (cf. estimationService).
 */
async function activerModele(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const modele = await ModeleML.findByPk(req.params.id, { transaction: t });
    if (!modele) {
      await t.rollback();
      return res.status(404).json({ message: 'Version de modèle introuvable.' });
    }

    await ModeleML.update({ statut_actif: false }, { where: {}, transaction: t });
    modele.statut_actif = true;
    await modele.save({ transaction: t });

    await t.commit();
    res.json({ message: `Version ${modele.nom_version} activée avec succès.`, modele: toCamelCase(modele) });
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

module.exports = { listModeles, creerModele, activerModele };
