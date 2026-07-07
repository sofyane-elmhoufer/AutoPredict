import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { isAuthenticated, isAdmin, utilisateur, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="border-b border-primary-100 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold text-primary-700">
          AutoPredict
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/estimation" className="hover:text-primary-600">
            Estimer un véhicule
          </Link>
          {isAuthenticated && (
            <Link to="/compte" className="hover:text-primary-600">
              Mon compte
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="hover:text-primary-600">
              Administration
            </Link>
          )}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-gray-500">Bonjour {utilisateur?.prenom}</span>
              <button
                onClick={handleLogout}
                className="rounded bg-gray-100 px-3 py-1.5 hover:bg-gray-200"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded bg-primary-500 px-3 py-1.5 text-white hover:bg-primary-600"
            >
              Connexion
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
