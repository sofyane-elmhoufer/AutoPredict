import { api } from "./api";

// --- Liaison backend réelle (cf. backend/src/routes/catalogue.routes.js) ---
// GET /catalogue/marques               -> { marques: string[] }
// GET /catalogue/modeles?marque=Dacia  -> { modeles: { idVehiculeRef, modele, anneeMin, anneeMax }[] }
//
// Il n'existe pas de route /catalogue/reference séparée : les bornes
// anneeMin/anneeMax du modèle choisi sont déjà présentes dans la réponse
// de getModeles ci-dessus, pas besoin d'un second appel réseau.
//
// Ces fonctions déballent directement la réponse (retirent l'enveloppe
// { marques } / { modeles }) pour que les composants manipulent des
// tableaux directement utilisables.

export async function getMarques() {
  const { data } = await api.get("/catalogue/marques");
  return data.marques;
}

export async function getModeles(marque) {
  const { data } = await api.get("/catalogue/modeles", { params: { marque } });
  return data.modeles;
}
