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
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold text-primary-700">Créer un compte</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Prénom</label>
          <input
            value={form.prenom}
            onChange={update("prenom")}
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Nom</label>
          <input
            value={form.nom}
            onChange={update("nom")}
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={update("email")}
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Mot de passe</label>
          <input
            type="password"
            value={form.motDePasse}
            onChange={update("motDePasse")}
            required
            minLength={8}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        {erreur && <p className="text-sm text-red-600">{erreur}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-primary-500 px-4 py-2 text-white hover:bg-primary-600 disabled:opacity-50"
        >
          {loading ? "Création..." : "Créer mon compte"}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-500">
        Déjà inscrit ? <Link to="/login" className="text-primary-600">Se connecter</Link>
      </p>
    </div>
  );
}
