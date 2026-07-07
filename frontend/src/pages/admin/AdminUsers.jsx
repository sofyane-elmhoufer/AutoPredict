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

  if (isLoading) return <p className="text-gray-500">Chargement...</p>;

  return (
    <div className="overflow-x-auto rounded border bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="p-3 text-left">Nom</th>
            <th className="p-3 text-left">Email</th>
            <th className="p-3 text-left">Rôle</th>
            <th className="p-3 text-left">Statut</th>
            <th className="p-3 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {utilisateurs.map((u) => (
            <tr key={u.idUtilisateur} className="border-b last:border-0">
              <td className="p-3">{u.prenom} {u.nom}</td>
              <td className="p-3">{u.email}</td>
              <td className="p-3">{u.role}</td>
              <td className="p-3">{u.statutCompte ? "Actif" : "Désactivé"}</td>
              <td className="p-3">
                <button
                  onClick={() =>
                    mutation.mutate({ id: u.idUtilisateur, statutCompte: !u.statutCompte })
                  }
                  className="rounded border px-3 py-1 hover:bg-gray-50"
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
