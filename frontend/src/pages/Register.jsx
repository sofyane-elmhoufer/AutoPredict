import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nom: "", prenom: "", email: "", motDePasse: "" });
  const [erreur, setErreur] = useState(null);
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur(null);
    setLoading(true);
    try {
      await register(form);
      navigate("/compte");
    } catch {
      setErreur("Impossible de créer le compte. Vérifiez les informations saisies.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:py-24">
      <div className="card p-8">
        <p className="mb-1 text-sm font-medium uppercase tracking-widest text-taxi-500">Rejoignez-nous</p>
        <h1 className="mb-6 font-display text-2xl font-bold text-ink-800">Créer un compte</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Prénom</label>
              <input value={form.prenom} onChange={update("prenom")} required className="input" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Nom</label>
              <input value={form.nom} onChange={update("nom")} required className="input" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Email</label>
            <input type="email" value={form.email} onChange={update("email")} required className="input" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Mot de passe</label>
            <input
              type="password"
              value={form.motDePasse}
              onChange={update("motDePasse")}
              required
              minLength={8}
              className="input"
            />
          </div>
          {erreur && <p className="text-sm text-taxi-500">{erreur}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full !py-2.5">
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>
        <p className="mt-5 text-sm text-asphalt-500">
          Déjà inscrit ?{" "}
          <Link to="/login" className="font-medium text-taxi-500 hover:text-taxi-600">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
