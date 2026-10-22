import { useQuery } from "@tanstack/react-query";
import { getStatsAdmin } from "../../services/adminService";

export function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: getStatsAdmin,
  });

  if (isLoading) return <p className="text-asphalt-500">Chargement...</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Utilisateurs inscrits" value={stats?.utilisateurs?.total ?? 0} />
        <StatCard label="Estimations demandées" value={stats?.estimations?.total ?? 0} />
        <StatCard
          label="Taux de réutilisation du cache"
          value={`${(stats?.cache?.tauxReutilisationPourcent ?? 0).toFixed(1)} %`}
          accent="ochre"
        />
        <StatCard label="Estimations (7 derniers jours)" value={stats?.estimations?.septDerniersJours ?? 0} />
        <StatCard label="Depuis le cache" value={stats?.estimations?.depuisCache ?? 0} accent="ochre" />
        <StatCard label="Nouvelles prédictions" value={stats?.estimations?.nouvellesPredictions ?? 0} accent="teal" />
      </div>

      <div className="card p-6">
        <h2 className="mb-3 font-display text-lg font-semibold text-ink-800">Modèle ML actif</h2>
        {stats?.modeleActif ? (
          <div className="grid grid-cols-1 gap-2 text-sm text-ink-700 sm:grid-cols-2">
            <p>Version : <span className="font-medium">{stats.modeleActif.nomVersion}</span></p>
            <p>Algorithme : <span className="font-medium">{stats.modeleActif.algorithme}</span></p>
            <p>Score R² : <span className="font-medium">{stats.modeleActif.scoreR2 ?? "—"}</span></p>
            <p>MAE : <span className="font-medium">{stats.modeleActif.scoreMae != null ? `${stats.modeleActif.scoreMae.toLocaleString("fr-FR")} DH` : "—"}</span></p>
          </div>
        ) : (
          <p className="text-sm text-asphalt-500">Aucun modèle actif.</p>
        )}
        <p className="mt-4 text-sm">
          Service ML :{" "}
          <span className={stats?.serviceML?.up ? "font-medium text-teal-600" : "font-medium text-taxi-500"}>
            {stats?.serviceML?.up ? "en ligne" : "indisponible"}
          </span>
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent = "ink" }) {
  const couleurs = {
    ink: "text-ink-800",
    ochre: "text-ochre-600",
    teal: "text-teal-600",
  };
  return (
    <div className="card p-6 text-center">
      <p className="text-sm text-asphalt-500">{label}</p>
      <p className={`mt-2 font-plate text-3xl font-bold ${couleurs[accent]}`}>{value}</p>
    </div>
  );
}
