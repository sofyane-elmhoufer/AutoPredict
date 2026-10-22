import { api } from "./api";

// POST /auth/login    body: { email, motDePasse }              -> { token, utilisateur }
// POST /auth/register body: { nom, prenom, email, motDePasse } -> { token, utilisateur }

export async function login({ email, motDePasse }) {
  const { data } = await api.post("/auth/login", { email, motDePasse });
  return data;
}

export async function register({ nom, prenom, email, motDePasse }) {
  const { data } = await api.post("/auth/register", { nom, prenom, email, motDePasse });
  return data;
}
