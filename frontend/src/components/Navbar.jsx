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
    <header className="border-b border-asphalt-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-ink-800 font-plate text-xs font-bold text-white">
            MA
          </span>
          <span className="font-display text-lg font-bold text-ink-800">
            Auto<span className="text-taxi-500">Predict</span>
          </span>
        </Link>

        <div className="flex items-center gap-5 text-sm">
          <Link to="/estimation" className="font-medium text-ink-600 hover:text-taxi-500">
            Estimer un véhicule
          </Link>
          {isAuthenticated && (
            <Link to="/compte" className="font-medium text-ink-600 hover:text-taxi-500">
              Mon compte
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="font-medium text-ink-600 hover:text-taxi-500">
              Administration
            </Link>
          )}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-asphalt-500 sm:inline">Bonjour {utilisateur?.prenom}</span>
              <button onClick={handleLogout} className="btn-secondary !px-3 !py-1.5">
                Déconnexion
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary !px-4 !py-1.5">
              Connexion
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
