import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Visualise les facteurs explicatifs (importance SHAP) renvoyés par le
// modèle ML via le backend. Positif = pousse le prix à la hausse,
// négatif = pousse le prix à la baisse.
export function FactorsChart({ facteurs = [] }) {
  if (!facteurs || facteurs.length === 0) {
    return <p className="text-sm text-gray-500">Aucun facteur explicatif disponible.</p>;
  }

  // Le backend (cf. ml/src/api.py) renvoie des objets { feature, impact }.
  const data = [...facteurs].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" />
          <YAxis type="category" dataKey="feature" width={120} />
          <Tooltip />
          <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.impact >= 0 ? "#1f7a4d" : "#b45309"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
