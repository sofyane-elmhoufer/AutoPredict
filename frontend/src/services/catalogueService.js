import { api } from "./api";

// --- Liaison backend attendue ---
// GET /catalogue/marques                      -> string[]
// GET /catalogue/modeles?marque=Dacia         -> string[]
// GET /catalogue/reference?marque=&modele=    -> { idVehiculeRef, marque, modele, anneeMin, anneeMax }
// Sert à alimenter les listes déroulantes ET à valider l'année saisie
// en temps réel dans le formulaire (section 3.1.a du cahier des charges).

export async function getMarques() {
  const { data } = await api.get("/catalogue/marques");
  return data;
}

export async function getModeles(marque) {
  const { data } = await api.get("/catalogue/modeles", { params: { marque } });
  return data;
}

export async function getReference(marque, modele) {
  const { data } = await api.get("/catalogue/reference", { params: { marque, modele } });
  return data;
}
