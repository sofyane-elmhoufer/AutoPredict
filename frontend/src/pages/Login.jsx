import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur(null);
    setLoading(true);
    try {
      await login({ email, motDePasse });
      navigate("/compte");
    } catch {
      setErreur("Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:py-24">
      <div className="card p-8">
        <p className="mb-1 text-sm font-medium uppercase tracking-widest text-taxi-500">Bienvenue</p>
        <h1 className="mb-6 font-display text-2xl font-bold text-ink-800">Connexion</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Mot de passe</label>
            <input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              required
              className="input"
            />
          </div>
          {erreur && <p className="text-sm text-taxi-500">{erreur}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full !py-2.5">
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <p className="mt-5 text-sm text-asphalt-500">
          Pas encore de compte ?{" "}
          <Link to="/register" className="font-medium text-taxi-500 hover:text-taxi-600">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
