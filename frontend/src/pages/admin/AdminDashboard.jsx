import { useQuery } from "@tanstack/react-query";
import { getStatsAdmin } from "../../services/adminService";

export function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: getStatsAdmin,
  });

  if (isLoading) return <p className="p-6 text-gray-500">Chargement...</p>;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard label="Visites" value={stats?.nombreVisites ?? 0} />
      <StatCard label="Estimations demandées" value={stats?.nombreEstimations ?? 0} />
      <StatCard
        label="Taux de réutilisation du cache"
        value={`${(stats?.tauxReutilisationCache ?? 0).toFixed(1)} %`}
      />
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border bg-white p-6 text-center">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-primary-700">{value}</p>
    </div>
  );
}
