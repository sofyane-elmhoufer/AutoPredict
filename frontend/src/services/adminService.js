import { api } from "./api";

// --- Liaison backend réelle (routes réservées au rôle ADMINISTRATEUR) ---
// GET   /admin/dashboard            -> { utilisateurs:{total}, estimations:{total,...},
//                                          cache:{tauxReutilisationPourcent,...},
//                                          modeleActif, serviceML:{up} }
// GET   /admin/utilisateurs         -> { utilisateurs: Utilisateur[], total, page, totalPages }
// PATCH /admin/utilisateurs/:id     body: { role?, statutCompte? } -> { utilisateur }
// GET   /modeles                    -> { modeles: ModeleML[] }   (pas sous /admin)
// POST  /modeles/:id/activer        -> { modele }                (verbe "activer", pas "deployer")
// GET   /admin/cache/supervision    -> { repartitionParModele, parJour } (détail, pas un simple taux)

export async function getStatsAdmin() {
  const { data } = await api.get("/admin/dashboard");
  return data;
}

export async function getUtilisateurs() {
  const { data } = await api.get("/admin/utilisateurs");
  return data.utilisateurs;
}

export async function modifierUtilisateur(id, changes) {
  const { data } = await api.patch(`/admin/utilisateurs/${id}`, changes);
  return data.utilisateur;
}

export async function getModelesML() {
  const { data } = await api.get("/modeles");
  return data.modeles;
}

export async function deployerModele(idModele) {
  const { data } = await api.post(`/modeles/${idModele}/activer`);
  return data.modele;
}

// Le backend n'expose pas de "taux" isolé : on réutilise le pourcentage déjà
// calculé par le dashboard, ce qui évite un aller-retour réseau superflu.
export async function getTauxReutilisationCache() {
  const stats = await getStatsAdmin();
  return stats.cache?.tauxReutilisationPourcent ?? 0;
}

export async function getSupervisionCache() {
  const { data } = await api.get("/admin/cache/supervision");
  return data;
}
