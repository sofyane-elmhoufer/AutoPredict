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

  if (isLoading) return <p className="text-gray-500">Chargement...</p>;

  return (
    <div className="overflow-x-auto rounded border bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="p-3 text-left">Version</th>
            <th className="p-3 text-left">Algorithme</th>
            <th className="p-3 text-left">R²</th>
            <th className="p-3 text-left">MAE</th>
            <th className="p-3 text-left">Entraîné le</th>
            <th className="p-3 text-left">Statut</th>
            <th className="p-3 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {modeles.map((m) => (
            <tr key={m.idModele} className="border-b last:border-0">
              <td className="p-3">{m.nomVersion}</td>
              <td className="p-3">{m.algorithme}</td>
              <td className="p-3">{m.scoreR2.toFixed(3)}</td>
              <td className="p-3">{m.scoreMAE.toLocaleString("fr-FR")}</td>
              <td className="p-3">{new Date(m.dateEntrainement).toLocaleDateString("fr-FR")}</td>
              <td className="p-3">
                {m.statutActif ? (
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                    Actif
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="p-3">
                {!m.statutActif && (
                  <button
                    onClick={() => mutation.mutate(m.idModele)}
                    className="rounded border px-3 py-1 hover:bg-gray-50"
                  >
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
