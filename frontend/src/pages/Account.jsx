import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { exporterEstimation, getHistorique } from "../services/estimationService";

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
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-primary-700">Mon historique</h1>

      {isLoading && <p className="text-gray-500">Chargement...</p>}
      {!isLoading && historique.length === 0 && (
        <p className="text-gray-500">Aucune estimation enregistrée pour le moment.</p>
      )}

      <ul className="space-y-3">
        {historique.map((e) => (
          <li key={e.idEstimation} className="flex items-center justify-between rounded border bg-white p-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selection.includes(e.idEstimation)}
                onChange={() => toggleSelection(e.idEstimation)}
              />
              <span>
                {e.marque} {e.modele} ({e.annee}) —{" "}
                <strong>{e.prixEstime.toLocaleString("fr-FR")} DH</strong>
              </span>
            </label>
            <button
              onClick={() => handleExport(e.idEstimation)}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
            >
              Exporter
            </button>
          </li>
        ))}
      </ul>

      {selectionnees.length >= 2 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Comparaison</h2>
          <ComparisonTable estimations={selectionnees} />
        </div>
      )}
    </div>
  );
}

function ComparisonTable({ estimations }) {
  return (
    <div className="overflow-x-auto rounded border bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="p-3 text-left">Véhicule</th>
            <th className="p-3 text-left">Kilométrage</th>
            <th className="p-3 text-left">Prix estimé</th>
            <th className="p-3 text-left">Fourchette</th>
          </tr>
        </thead>
        <tbody>
          {estimations.map((e) => (
            <tr key={e.idEstimation} className="border-b last:border-0">
              <td className="p-3">
                {e.marque} {e.modele} ({e.annee})
              </td>
              <td className="p-3">{e.kilometrage.toLocaleString("fr-FR")} km</td>
              <td className="p-3 font-medium">{e.prixEstime.toLocaleString("fr-FR")} DH</td>
              <td className="p-3">
                {e.margeConfiance.min.toLocaleString("fr-FR")} — {e.margeConfiance.max.toLocaleString("fr-FR")} DH
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
