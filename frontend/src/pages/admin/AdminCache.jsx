import { useQuery } from "@tanstack/react-query";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { getTauxReutilisationCache } from "../../services/adminService";

export function AdminCache() {
  const { data: taux, isLoading } = useQuery({
    queryKey: ["admin-cache"],
    queryFn: getTauxReutilisationCache,
  });

  if (isLoading) return <p className="text-gray-500">Chargement...</p>;

  const data = [
    { name: "Servies depuis le cache", value: taux ?? 0 },
    { name: "Nouvelles prédictions", value: 100 - (taux ?? 0) },
  ];
  const colors = ["#1f7a4d", "#d1d5db"];

  return (
    <div className="rounded-lg border bg-white p-6">
      <h2 className="mb-4 font-semibold">
        Taux de réutilisation du cache : {(taux ?? 0).toFixed(1)} %
      </h2>
      <p className="mb-4 text-sm text-gray-500">
        Proportion des estimations servies directement depuis la base de données
        (sans nouvel appel au modèle ML) par rapport aux nouveaux calculs.
      </p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label>
              {data.map((_, index) => (
                <Cell key={index} fill={colors[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
