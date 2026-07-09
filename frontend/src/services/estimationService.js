import { api } from "./api";

// --- Liaison backend réelle (cf. backend/src/routes/estimation.routes.js) ---
// POST /estimations                    body: CaracteristiquesVehicule -> Estimation
//   Le backend s'occupe en interne de : normalisation, calcul du
//   hashCaracteristiques, recherche en cache, appel au modèle ML si besoin.
//   Le front n'a JAMAIS à connaître ni calculer ce hash.
//
// GET  /estimations                        -> { estimations: Estimation[], total, page, totalPages }
//   (toujours l'historique de l'utilisateur connecté, déduit du token JWT ;
//   il n'y a pas de route /utilisateurs/:id/estimations côté backend)
// GET  /estimations/:id                    -> { estimation: Estimation }
// GET  /estimations/:id/export?format=pdf|csv -> fichier (blob)

export async function soumettreEstimation(caracteristiques) {
  const { data } = await api.post("/estimations", caracteristiques);
  return data;
}

export async function getHistorique() {
  const { data } = await api.get("/estimations");
  return data.estimations;
}

export async function getEstimationParId(idEstimation) {
  const { data } = await api.get(`/estimations/${idEstimation}`);
  return data.estimation;
}

export async function exporterEstimation(idEstimation, format) {
  const { data } = await api.get(`/estimations/${idEstimation}/export`, {
    params: { format },
    responseType: "blob",
  });
  return data;
}
