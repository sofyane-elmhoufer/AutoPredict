const { Op } = require('sequelize');
const { Parser: CsvParser } = require('json2csv');
const PDFDocument = require('pdfkit');
const { Estimation, ModeleML } = require('../models');
const estimationService = require('../services/estimationService');

/**
 * POST /api/estimations
 * Point d'entrée principal : soumettreFormulaire().
 * Accessible au Visiteur (req.user peut être null) et à l'Utilisateur connecté.
 */
async function creerEstimation(req, res, next) {
  try {
    const resultat = await estimationService.obtenirEstimation(
      req.body,
      req.user ? req.user.id : null
    );
    res.status(200).json(resultat);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/estimations
 * Historique de l'utilisateur connecté, avec pagination simple.
 */
async function getHistorique(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const { rows, count } = await Estimation.findAndCountAll({
      where: { id_utilisateur: req.user.id },
      order: [['date_estimation', 'DESC']],
      limit,
      offset,
      include: [{ model: ModeleML, as: 'modeleUtilise', attributes: ['nom_version'] }],
    });

    res.json({
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      estimations: rows,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/estimations/:id
 */
async function getEstimationById(req, res, next) {
  try {
    const estimation = await Estimation.findOne({
      where: { id_estimation: req.params.id, id_utilisateur: req.user.id },
    });
    if (!estimation) return res.status(404).json({ message: 'Estimation introuvable.' });
    res.json({ estimation });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/estimations/:id
 * Correspond à Estimation.supprimer()
 */
async function supprimerEstimation(req, res, next) {
  try {
    const estimation = await Estimation.findOne({
      where: { id_estimation: req.params.id, id_utilisateur: req.user.id },
    });
    if (!estimation) return res.status(404).json({ message: 'Estimation introuvable.' });
    await estimation.destroy();
    res.json({ message: 'Estimation supprimée.' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/estimations/comparer
 * Body : { ids: [1, 2, 3] }
 * Comparaison de plusieurs estimations entre elles.
 */
async function comparerEstimations(req, res, next) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length < 2) {
      return res.status(422).json({ message: 'Veuillez fournir au moins deux identifiants à comparer.' });
    }

    const estimations = await Estimation.findAll({
      where: { id_estimation: { [Op.in]: ids }, id_utilisateur: req.user.id },
    });

    res.json({ estimations });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/estimations/:id/export?format=pdf|csv
 * Correspond à Estimation.exporter()
 */
async function exporterEstimation(req, res, next) {
  try {
    const format = (req.query.format || 'pdf').toLowerCase();
    const estimation = await Estimation.findOne({
      where: { id_estimation: req.params.id, id_utilisateur: req.user.id },
    });
    if (!estimation) return res.status(404).json({ message: 'Estimation introuvable.' });

    if (format === 'csv') {
      const parser = new CsvParser();
      const csv = parser.parse(estimation.toJSON());
      res.header('Content-Type', 'text/csv');
      res.attachment(`estimation_${estimation.id_estimation}.csv`);
      return res.send(csv);
    }

    // Export PDF par défaut
    const doc = new PDFDocument({ margin: 50 });
    res.header('Content-Type', 'application/pdf');
    res.attachment(`estimation_${estimation.id_estimation}.pdf`);
    doc.pipe(res);

    doc.fontSize(18).text('AutoPredict — Rapport d\'estimation', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Véhicule : ${estimation.marque} ${estimation.modele} (${estimation.annee})`);
    doc.text(`Kilométrage : ${estimation.kilometrage} km`);
    doc.text(`Carburant : ${estimation.carburant}   |   Boîte : ${estimation.boite_vitesses}`);
    doc.text(`Puissance fiscale : ${estimation.puissance_fiscale} CV`);
    doc.text(`Ville : ${estimation.ville}`);
    doc.text(`État : ${estimation.etat_vehicule}`);
    doc.moveDown();
    doc.fontSize(14).text(`Prix estimé : ${estimation.prix_estime} DH`, { underline: true });
    doc.fontSize(12).text(
      `Fourchette de confiance : ${estimation.marge_confiance_min} DH — ${estimation.marge_confiance_max} DH`
    );
    doc.moveDown();
    doc.text(`Source du résultat : ${estimation.source_resultat}`);
    doc.text(`Date de l'estimation : ${new Date(estimation.date_estimation).toLocaleString('fr-FR')}`);

    if (estimation.facteurs_explicatifs && estimation.facteurs_explicatifs.length) {
      doc.moveDown();
      doc.fontSize(13).text('Facteurs explicatifs principaux :');
      doc.fontSize(11);
      estimation.facteurs_explicatifs.forEach((f) => {
        doc.text(`• ${f.feature} : impact ${f.impact}`);
      });
    }

    doc.end();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  creerEstimation,
  getHistorique,
  getEstimationById,
  supprimerEstimation,
  comparerEstimations,
  exporterEstimation,
};
