import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Protège les pages réservées aux utilisateurs connectés (ex. /compte).
// Un visiteur est redirigé vers /login.
export function PrivateRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null; // on attend la fin de la restauration de la session

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
