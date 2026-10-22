import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { setAuthToken, registerUnauthorizedHandler } from "../services/api";
import { login as loginRequest, register as registerRequest } from "../services/authService";

const AuthContext = createContext(undefined);

const STORAGE_KEY = "autopredict_session";

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  const [loading, setLoading] = useState(true);

  // Au chargement de l'app, on récupère la session sauvegardée dans le navigateur.
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const { token, utilisateur: savedUser } = JSON.parse(raw);
        setAuthToken(token);
        setUtilisateur(savedUser);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  // Si le backend répond 401 (token expiré ou invalide), on déconnecte l'utilisateur.
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      setAuthToken(null);
      setUtilisateur(null);
      localStorage.removeItem(STORAGE_KEY);
    });
  }, []);

  async function handleLogin(payload) {
    const { token, utilisateur: user } = await loginRequest(payload);
    setAuthToken(token);
    setUtilisateur(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, utilisateur: user }));
  }

  async function handleRegister(payload) {
    const { token, utilisateur: user } = await registerRequest(payload);
    setAuthToken(token);
    setUtilisateur(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, utilisateur: user }));
  }

  function handleLogout() {
    setAuthToken(null);
    setUtilisateur(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  const value = useMemo(
    () => ({
      utilisateur,
      isAuthenticated: utilisateur !== null,
      isAdmin: utilisateur?.role === "ADMINISTRATEUR",
      loading,
      login: handleLogin,
      register: handleRegister,
      logout: handleLogout,
    }),
    [utilisateur, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé à l'intérieur de <AuthProvider>");
  return ctx;
}
