import { useQuery } from "@tanstack/react-query";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { getTauxReutilisationCache } from "../../services/adminService";

export function AdminCache() {
  const { data: taux, isLoading } = useQuery({
    queryKey: ["admin-cache"],
    queryFn: getTauxReutilisationCache,
  });

  if (isLoading) return <p className="text-asphalt-500">Chargement...</p>;

  const data = [
    { name: "Servies depuis le cache", value: taux ?? 0 },
    { name: "Nouvelles prédictions", value: 100 - (taux ?? 0) },
  ];
  const colors = ["#D9A441", "#D8DBD4"];

  return (
    <div className="card p-6">
      <h2 className="mb-1 font-display text-lg font-semibold text-ink-800">
        Taux de réutilisation du cache : <span className="text-ochre-600">{(taux ?? 0).toFixed(1)} %</span>
      </h2>
      <p className="mb-4 text-sm text-asphalt-500">
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
