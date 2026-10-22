import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { exporterEstimation, getHistorique } from "../services/estimationService";

const LIBELLES = {
  carburant: { ESSENCE: "Essence", DIESEL: "Diesel", HYBRIDE: "Hybride", ELECTRIQUE: "Électrique", GPL: "GPL" },
  boiteVitesses: { MANUELLE: "Manuelle", AUTOMATIQUE: "Automatique" },
  etatVehicule: { EXCELLENT: "Excellent", BON: "Bon état", MOYEN: "État moyen", A_REPARER: "À réparer" },
};

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function Account() {
  const { utilisateur } = useAuth();
  const [selection, setSelection] = useState([]);

  const { data: historique = [], isLoading } = useQuery({
    queryKey: ["historique", utilisateur?.idUtilisateur],
    queryFn: getHistorique,
    enabled: !!utilisateur,
  });

  function toggleSelection(id) {
    setSelection((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleExport(id) {
    const blob = await exporterEstimation(id, "pdf");
    downloadBlob(blob, `estimation-${id}.pdf`);
  }

  const selectionnees = historique.filter((e) => selection.includes(e.idEstimation));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <p className="mb-1 text-sm font-medium uppercase tracking-widest text-taxi-500">Compte</p>
      <h1 className="mb-8 font-display text-3xl font-bold text-ink-800">Mon historique d'estimations</h1>

      {isLoading && <p className="text-asphalt-500">Chargement...</p>}
      {!isLoading && historique.length === 0 && (
        <div className="card p-8 text-center text-asphalt-500">
          Aucune estimation enregistrée pour le moment.
        </div>
      )}

      <div className="space-y-3">
        {historique.map((e) => (
          <EstimationCard
            key={e.idEstimation}
            estimation={e}
            selectionne={selection.includes(e.idEstimation)}
            onToggle={() => toggleSelection(e.idEstimation)}
            onExport={() => handleExport(e.idEstimation)}
          />
        ))}
      </div>

      {selectionnees.length >= 2 && (
        <div className="mt-10">
          <h2 className="mb-3 font-display text-lg font-semibold text-ink-800">
            Comparaison ({selectionnees.length} véhicules)
          </h2>
          <ComparisonTable estimations={selectionnees} />
        </div>
      )}
    </div>
  );
}

function EstimationCard({ estimation: e, selectionne, onToggle, onExport }) {
  const v = e.vehicule;
  const estCache = e.source === "CACHE";

  const puces = [
    `${Number(v.kilometrage).toLocaleString("fr-FR")} km`,
    LIBELLES.carburant[v.carburant] ?? v.carburant,
    LIBELLES.boiteVitesses[v.boiteVitesses] ?? v.boiteVitesses,
    `${v.puissanceFiscale} CV`,
    LIBELLES.etatVehicule[v.etatVehicule] ?? v.etatVehicule,
    v.ville,
    v.premiereMain ? "1ʳᵉ main" : "Occasion (2ᵉ main+)",
  ];

  return (
    <div className={`card p-4 transition-shadow sm:p-5 ${selectionne ? "ring-2 ring-taxi-500" : ""}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <label className="flex flex-1 items-start gap-3">
          <input
            type="checkbox"
            checked={selectionne}
            onChange={onToggle}
            className="mt-1.5 h-4 w-4 rounded border-asphalt-300 text-taxi-500 focus:ring-taxi-500/40"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display font-semibold text-ink-800">
                {v.marque} {v.modele} · {v.annee}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  estCache ? "bg-ochre-50 text-ochre-600" : "bg-teal-50 text-teal-600"
                }`}
              >
                {estCache ? "Cache" : "Nouvelle prédiction"}
              </span>
            </div>
            <p className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-asphalt-500">
              {puces.map((p, i) => (
                <span key={i}>{p}{i < puces.length - 1 ? " ·" : ""}</span>
              ))}
            </p>
            <p className="mt-1 text-xs text-asphalt-400">
              {new Date(e.dateEstimation).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              {e.modeleVersion && ` · modèle ${e.modeleVersion}`}
            </p>
          </div>
        </label>

        <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
          <span className="font-plate text-xl font-semibold text-ink-900">
            {e.prixEstime.toLocaleString("fr-FR")} DH
          </span>
          <button onClick={onExport} className="text-xs font-medium text-taxi-500 hover:text-taxi-600">
            Exporter en PDF
          </button>
        </div>
      </div>
    </div>
  );
}

function ComparisonTable({ estimations }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-asphalt-100 bg-asphalt-50 text-left text-asphalt-500">
            <th className="p-3 font-medium">Véhicule</th>
            <th className="p-3 font-medium">Kilométrage</th>
            <th className="p-3 font-medium">État</th>
            <th className="p-3 font-medium">Ville</th>
            <th className="p-3 font-medium">1ʳᵉ main</th>
            <th className="p-3 font-medium">Prix estimé</th>
            <th className="p-3 font-medium">Fourchette</th>
          </tr>
        </thead>
        <tbody>
          {estimations.map((e) => {
            const v = e.vehicule;
            return (
              <tr key={e.idEstimation} className="border-b border-asphalt-100 last:border-0">
                <td className="p-3">{v.marque} {v.modele} ({v.annee})</td>
                <td className="p-3">{Number(v.kilometrage).toLocaleString("fr-FR")} km</td>
                <td className="p-3">{LIBELLES.etatVehicule[v.etatVehicule] ?? v.etatVehicule}</td>
                <td className="p-3">{v.ville}</td>
                <td className="p-3">{v.premiereMain ? "Oui" : "Non"}</td>
                <td className="p-3 font-medium text-ink-800">{e.prixEstime.toLocaleString("fr-FR")} DH</td>
                <td className="p-3">
                  {e.margeConfiance.min.toLocaleString("fr-FR")} — {e.margeConfiance.max.toLocaleString("fr-FR")} DH
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
