import { api } from "./api";

// --- Liaison backend attendue ---
// POST /estimations                body: CaracteristiquesVehicule -> Estimation
//   Le backend s'occupe en interne de : normalisation, calcul du
//   hashCaracteristiques, recherche en cache, appel au modèle ML si besoin.
//   Le front n'a JAMAIS à connaître ni calculer ce hash.
//
// GET  /utilisateurs/:id/estimations           -> Estimation[]
// GET  /estimations/:id                        -> Estimation
// GET  /estimations/:id/export?format=pdf|xlsx -> fichier (blob)

export async function soumettreEstimation(caracteristiques) {
  const { data } = await api.post("/estimations", caracteristiques);
  return data;
}

export async function getHistoriqueUtilisateur(idUtilisateur) {
  const { data } = await api.get(`/utilisateurs/${idUtilisateur}/estimations`);
  return data;
}

export async function getEstimationParId(idEstimation) {
  const { data } = await api.get(`/estimations/${idEstimation}`);
  return data;
}

export async function exporterEstimation(idEstimation, format) {
  const { data } = await api.get(`/estimations/${idEstimation}/export`, {
    params: { format },
    responseType: "blob",
  });
  return data;
}
