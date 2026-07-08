import axios from "axios";

// Toutes les requêtes passent par ce client unique. C'est le SEUL point
// de contact du frontend avec le monde extérieur : jamais d'appel direct
// au modèle ML, toujours via l'API REST du backend.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Ajoute automatiquement le token JWT (stocké en mémoire via AuthContext)
// à chaque requête sortante, une fois l'utilisateur connecté.
let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Redirige proprement en cas de 401 (token expiré) — à brancher sur le
// router une fois l'app montée (voir App.jsx).
export let onUnauthorized = () => {};
export function registerUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);
