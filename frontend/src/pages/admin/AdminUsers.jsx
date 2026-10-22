import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUtilisateurs, modifierUtilisateur } from "../../services/adminService";

export function AdminUsers() {
  const queryClient = useQueryClient();
  const { data: utilisateurs = [], isLoading } = useQuery({
    queryKey: ["admin-utilisateurs"],
    queryFn: getUtilisateurs,
  });

  const mutation = useMutation({
    mutationFn: ({ id, statutCompte }) => modifierUtilisateur(id, { statutCompte }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-utilisateurs"] }),
  });

  if (isLoading) return <p className="text-asphalt-500">Chargement...</p>;

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-asphalt-100 bg-asphalt-50 text-left text-asphalt-500">
            <th className="p-3 font-medium">Nom</th>
            <th className="p-3 font-medium">Email</th>
            <th className="p-3 font-medium">Rôle</th>
            <th className="p-3 font-medium">Statut</th>
            <th className="p-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {utilisateurs.map((u) => (
            <tr key={u.idUtilisateur} className="border-b border-asphalt-100 last:border-0">
              <td className="p-3 font-medium text-ink-800">{u.prenom} {u.nom}</td>
              <td className="p-3 text-asphalt-600">{u.email}</td>
              <td className="p-3">
                <span className="rounded-full bg-ink-50 px-2 py-0.5 text-xs font-medium text-ink-700">{u.role}</span>
              </td>
              <td className="p-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    u.statutCompte ? "bg-teal-50 text-teal-600" : "bg-taxi-50 text-taxi-600"
                  }`}
                >
                  {u.statutCompte ? "Actif" : "Désactivé"}
                </span>
              </td>
              <td className="p-3">
                <button
                  onClick={() => mutation.mutate({ id: u.idUtilisateur, statutCompte: !u.statutCompte })}
                  className="btn-secondary !px-3 !py-1 !text-xs"
                >
                  {u.statutCompte ? "Désactiver" : "Activer"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
