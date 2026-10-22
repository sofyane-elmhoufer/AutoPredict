import axios from "axios";

// Toutes les requêtes du frontend passent par ce client. On n'appelle jamais
// le modèle ML directement, toujours via l'API du backend.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Ajoute le token JWT à chaque requête quand l'utilisateur est connecté.
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

// En cas de 401 (token expiré), on appelle la fonction enregistrée par AuthContext, qui déconnecte l'utilisateur.
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
