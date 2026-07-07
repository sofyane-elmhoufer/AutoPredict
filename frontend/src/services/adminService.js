import { api } from "./api";

// --- Liaison backend attendue (routes réservées au rôle ADMINISTRATEUR) ---
// GET  /admin/stats                        -> { nombreVisites, nombreEstimations, tauxReutilisationCache }
// GET  /admin/utilisateurs                 -> Utilisateur[]
// PUT  /admin/utilisateurs/:id             body: { role?, statutCompte? } -> Utilisateur
// GET  /admin/modeles                      -> ModeleML[]
// POST /admin/modeles/:id/deployer         -> ModeleML (nouvelle version active)
// GET  /admin/cache/taux-reutilisation     -> { taux: number }

export async function getStatsAdmin() {
  const { data } = await api.get("/admin/stats");
  return data;
}

export async function getUtilisateurs() {
  const { data } = await api.get("/admin/utilisateurs");
  return data;
}

export async function modifierUtilisateur(id, changes) {
  const { data } = await api.put(`/admin/utilisateurs/${id}`, changes);
  return data;
}

export async function getModelesML() {
  const { data } = await api.get("/admin/modeles");
  return data;
}

export async function deployerModele(idModele) {
  const { data } = await api.post(`/admin/modeles/${idModele}/deployer`);
  return data;
}

export async function getTauxReutilisationCache() {
  const { data } = await api.get("/admin/cache/taux-reutilisation");
  return data.taux;
}
