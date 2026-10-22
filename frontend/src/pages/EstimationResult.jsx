import { Link, Navigate, useLocation } from "react-router-dom";
import { FactorsChart } from "../components/FactorsChart";
import { PricePlate } from "../components/ui/PricePlate";
import { CacheBadge } from "../components/ui/CacheBadge";

const LIBELLES = {
  carburant: { ESSENCE: "Essence", DIESEL: "Diesel", HYBRIDE: "Hybride", ELECTRIQUE: "Électrique", GPL: "GPL" },
  boiteVitesses: { MANUELLE: "Manuelle", AUTOMATIQUE: "Automatique" },
  etatVehicule: { EXCELLENT: "Excellent", BON: "Bon état", MOYEN: "État moyen", A_REPARER: "À réparer" },
};

export function EstimationResult() {
  const location = useLocation();
  const estimation = location.state?.estimation;

  // Si on recharge la page, le state de la navigation est perdu :
  // on renvoie vers le formulaire au lieu d'afficher une page vide.
  if (!estimation) {
    return <Navigate to="/estimation" replace />;
  }

  const { min: borneBasse, max: borneHaute } = estimation.margeConfiance;
  const v = estimation.vehicule;

  const details = [
    ["Marque / Modèle", `${v.marque} ${v.modele}`],
    ["Année", v.annee],
    ["Kilométrage", `${Number(v.kilometrage).toLocaleString("fr-FR")} km`],
    ["Carburant", LIBELLES.carburant[v.carburant] ?? v.carburant],
    ["Boîte de vitesses", LIBELLES.boiteVitesses[v.boiteVitesses] ?? v.boiteVitesses],
    ["Puissance fiscale", `${v.puissanceFiscale} CV`],
    ["État", LIBELLES.etatVehicule[v.etatVehicule] ?? v.etatVehicule],
    ["Ville", v.ville],
    ["Première main", v.premiereMain ? "Oui" : "Non"],
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <p className="mb-1 text-sm font-medium uppercase tracking-widest text-taxi-500">Résultat</p>
      <h1 className="mb-6 font-display text-3xl font-bold text-ink-800">Votre estimation</h1>

      <div className="card flex flex-col items-center gap-4 p-8 text-center">
        <PricePlate prix={estimation.prixEstime} />
        <p className="text-sm text-asphalt-500">
          Fourchette de confiance : {borneBasse.toLocaleString("fr-FR")} — {borneHaute.toLocaleString("fr-FR")} DH
        </p>
      </div>

      <div className="mt-4">
        <CacheBadge source={estimation.source} nombreReutilisations={estimation.nombreReutilisations} />
      </div>

      <div className="card mt-6 p-6">
        <h2 className="mb-3 font-display font-semibold text-ink-800">Caractéristiques prises en compte</h2>
        <dl className="grid grid-cols-1 divide-y divide-asphalt-100 sm:grid-cols-2 sm:divide-y-0 sm:gap-x-6">
          {details.map(([k, val]) => (
            <div key={k} className="flex justify-between py-2 text-sm sm:justify-start sm:gap-2 sm:border-b sm:border-asphalt-100">
              <dt className="text-asphalt-500">{k}</dt>
              <dd className="font-medium text-ink-800">{val}</dd>
            </div>
          ))}
        </dl>
      </div>

      {estimation.facteursExplicatifs?.length > 0 && (
        <div className="card mt-6 p-6">
          <h2 className="font-display font-semibold text-ink-800">Ce qui pèse le plus dans le modèle</h2>
          <p className="mb-3 text-xs text-asphalt-500">
            Importance moyenne de chaque critère dans les prédictions du modèle (valable pour toutes les voitures).
          </p>
          <FactorsChart facteurs={estimation.facteursExplicatifs} />
        </div>
      )}

      <div className="mt-8 flex justify-center gap-3">
        <Link to="/estimation" className="btn-secondary">
          Nouvelle estimation
        </Link>
        <Link to="/compte" className="btn-primary">
          Voir mon historique
        </Link>
      </div>
    </div>
  );
}
