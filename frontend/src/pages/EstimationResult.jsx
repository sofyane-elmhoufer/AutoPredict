import { Link, Navigate, useLocation } from "react-router-dom";
import { FactorsChart } from "../components/FactorsChart";

export function EstimationResult() {
  const location = useLocation();
  const estimation = location.state?.estimation;

  // Si la page est rechargée directement, le state est perdu :
  // on renvoie vers le formulaire plutôt que d'afficher une page vide.
  if (!estimation) {
    return <Navigate to="/estimation" replace />;
  }

  const [borneBasse, borneHaute] = estimation.margeConfiance;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-700">Résultat de l'estimation</h1>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            estimation.sourceResultat === "CACHE"
              ? "bg-blue-100 text-blue-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {estimation.sourceResultat === "CACHE" ? "Résultat instantané" : "Nouvelle estimation"}
        </span>
      </div>

      <div className="rounded-lg border bg-white p-6 text-center">
        <p className="text-sm text-gray-500">Prix estimé</p>
        <p className="text-4xl font-bold text-primary-700">
          {estimation.prixEstime.toLocaleString("fr-FR")} DH
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Fourchette de confiance : {borneBasse.toLocaleString("fr-FR")} DH —{" "}
          {borneHaute.toLocaleString("fr-FR")} DH
        </p>
      </div>

      <div className="mt-6 rounded-lg border bg-white p-6">
        <h2 className="mb-3 font-semibold">Facteurs qui expliquent ce prix</h2>
        <FactorsChart facteurs={estimation.facteurs} />
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <Link to="/estimation" className="rounded border px-4 py-2 hover:bg-gray-50">
          Nouvelle estimation
        </Link>
        <Link
          to="/compte"
          className="rounded bg-primary-500 px-4 py-2 text-white hover:bg-primary-600"
        >
          Voir mon historique
        </Link>
      </div>
    </div>
  );
}
