import { api } from "./api";

// Routes du backend utilisées (backend/src/routes/catalogue.routes.js) :
// GET /catalogue/domaine               -> { villes: string[], limites: {annee,kilometrage,puissanceFiscale} }
// GET /catalogue/marques               -> { marques: string[] }
// GET /catalogue/modeles?marque=Dacia  -> { modeles: { idVehiculeRef, modele, anneeMin, anneeMax }[] }
//
// Les bornes anneeMin / anneeMax du modèle choisi sont déjà dans la réponse de
// getModeles, donc pas besoin d'une route séparée.
// Les fonctions renvoient directement le tableau (sans l'objet { marques } / { modeles }).

export async function getDomaineEntrainement() {
  const { data } = await api.get("/catalogue/domaine");
  return data;
}

export async function getMarques() {
  const { data } = await api.get("/catalogue/marques");
  return data.marques;
}

export async function getModeles(marque) {
  const { data } = await api.get("/catalogue/modeles", { params: { marque } });
  return data.modeles;
}
