import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deployerModele, getModelesML } from "../../services/adminService";

export function AdminModels() {
  const queryClient = useQueryClient();
  const { data: modeles = [], isLoading } = useQuery({
    queryKey: ["admin-modeles"],
    queryFn: getModelesML,
  });

  const mutation = useMutation({
    mutationFn: deployerModele,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-modeles"] }),
  });

  if (isLoading) return <p className="text-asphalt-500">Chargement...</p>;

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-asphalt-100 bg-asphalt-50 text-left text-asphalt-500">
            <th className="p-3 font-medium">Version</th>
            <th className="p-3 font-medium">Algorithme</th>
            <th className="p-3 font-medium">R²</th>
            <th className="p-3 font-medium">MAE</th>
            <th className="p-3 font-medium">Entraîné le</th>
            <th className="p-3 font-medium">Statut</th>
            <th className="p-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {modeles.map((m) => (
            <tr key={m.idModele} className="border-b border-asphalt-100 last:border-0">
              <td className="p-3 font-plate font-medium text-ink-800">{m.nomVersion}</td>
              <td className="p-3 text-asphalt-600">{m.algorithme}</td>
              <td className="p-3">{m.scoreR2 != null ? m.scoreR2.toFixed(3) : "—"}</td>
              <td className="p-3">{m.scoreMae != null ? `${m.scoreMae.toLocaleString("fr-FR")} DH` : "—"}</td>
              <td className="p-3 text-asphalt-500">{new Date(m.dateEntrainement).toLocaleDateString("fr-FR")}</td>
              <td className="p-3">
                {m.statutActif ? (
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-600">
                    Actif
                  </span>
                ) : (
                  <span className="text-asphalt-400">—</span>
                )}
              </td>
              <td className="p-3">
                {!m.statutActif && (
                  <button onClick={() => mutation.mutate(m.idModele)} className="btn-secondary !px-3 !py-1 !text-xs">
                    Déployer
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
