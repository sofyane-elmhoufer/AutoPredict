/**
 * Indique si le résultat vient du cache ou d'un nouveau calcul du modèle ML.
 */
export function CacheBadge({ source, nombreReutilisations = 0 }) {
  const estCache = source === "CACHE";

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
        estCache ? "border-ochre-500/40 bg-ochre-50" : "border-teal-500/40 bg-teal-50"
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          estCache ? "bg-ochre-500 text-white" : "bg-teal-500 text-white"
        }`}
      >
        {estCache ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="currentColor" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <div>
        <p className={`text-sm font-semibold ${estCache ? "text-ochre-600" : "text-teal-600"}`}>
          {estCache ? "Résultat instantané (déjà calculé)" : "Nouvelle estimation calculée par le modèle"}
        </p>
        <p className="text-xs text-asphalt-400">
          {estCache
            ? nombreReutilisations > 0
              ? `Ce véhicule (mêmes caractéristiques) a déjà été estimé — résultat réutilisé ${nombreReutilisations} fois.`
              : "Une estimation identique existait déjà en base : aucun nouveau calcul ML n'a été nécessaire."
            : "Aucune estimation identique n'existait : le modèle a été sollicité, ce résultat est maintenant mis en cache."}
        </p>
      </div>
    </div>
  );
}
