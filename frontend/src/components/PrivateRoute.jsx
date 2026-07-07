import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Protège les routes réservées aux utilisateurs connectés (ex. /compte).
// Le Visiteur qui tente d'y accéder est redirigé vers /login.
export function PrivateRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null; // ou un spinner de chargement de session

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
