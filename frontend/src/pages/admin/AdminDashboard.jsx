import { useQuery } from "@tanstack/react-query";
import { getStatsAdmin } from "../../services/adminService";

export function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: getStatsAdmin,
  });

  if (isLoading) return <p className="p-6 text-gray-500">Chargement...</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Utilisateurs inscrits" value={stats?.utilisateurs?.total ?? 0} />
        <StatCard label="Estimations demandées" value={stats?.estimations?.total ?? 0} />
        <StatCard
          label="Taux de réutilisation du cache"
          value={`${(stats?.cache?.tauxReutilisationPourcent ?? 0).toFixed(1)} %`}
        />
        <StatCard label="Estimations (7 derniers jours)" value={stats?.estimations?.septDerniersJours ?? 0} />
        <StatCard label="Depuis le cache" value={stats?.estimations?.depuisCache ?? 0} />
        <StatCard label="Nouvelles prédictions" value={stats?.estimations?.nouvellesPredictions ?? 0} />
      </div>

      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-3 text-lg font-semibold text-primary-700">Modèle ML actif</h2>
        {stats?.modeleActif ? (
          <div className="grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-2">
            <p>Version : <span className="font-medium">{stats.modeleActif.nomVersion}</span></p>
            <p>Algorithme : <span className="font-medium">{stats.modeleActif.algorithme}</span></p>
            <p>Score R² : <span className="font-medium">{stats.modeleActif.scoreR2}</span></p>
            <p>MAE : <span className="font-medium">{stats.modeleActif.scoreMae} DH</span></p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Aucun modèle actif.</p>
        )}
        <p className="mt-4 text-sm">
          Service ML :{" "}
          <span className={stats?.serviceML?.up ? "font-medium text-green-600" : "font-medium text-red-600"}>
            {stats?.serviceML?.up ? "en ligne" : "indisponible"}
          </span>
        </p>
      </div>
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
