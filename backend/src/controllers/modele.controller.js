const { ModeleML } = require('../models');
const { sequelize } = require('../models');
const { toCamelCase } = require('../utils/caseConverter');

/**
 * GET /api/modeles
 * Liste toutes les versions du modèle (l'ancienne et l'active).
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
 * POST /api/modeles (admin)
 * Enregistre une nouvelle version du modèle entraînée par l'équipe ML.
 * Elle n'est pas activée automatiquement, voir activer() ci-dessous.
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
 * POST /api/modeles/:id/activer (admin)
 * Active une version du modèle. Une seule version est active à la fois :
 * les autres sont désactivées dans la même transaction.
 *
 * Attention : le cache est lié au modèle actif. Dès qu'on active une autre
 * version, les anciennes estimations ne sont plus réutilisées.
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
