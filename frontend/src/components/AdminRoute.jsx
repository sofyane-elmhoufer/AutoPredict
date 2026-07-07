import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Protège les routes du back-office : seul le rôle ADMINISTRATEUR passe.
// Un utilisateur standard connecté est renvoyé à l'accueil, pas au login
// (il est bien authentifié, juste pas autorisé).
export function AdminRoute() {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}
