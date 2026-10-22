/**
 * Affiche le prix estimé comme une plaque d'immatriculation marocaine
 * (bande bleue "MA" à gauche, chiffres en monospace).
 */
export function PricePlate({ prix, taille = "grande" }) {
  const formatted = Math.round(prix).toLocaleString("fr-FR");
  const isLarge = taille === "grande";

  return (
    <div
      className={`inline-flex items-stretch rounded-plate border-2 border-ink-800 bg-white shadow-plate overflow-hidden ${
        isLarge ? "h-24" : "h-14"
      }`}
    >
      <div
        className={`flex flex-col items-center justify-center bg-ink-800 text-white ${
          isLarge ? "w-14 gap-1 px-1" : "w-9"
        }`}
      >
        <span className={`font-display font-bold leading-none ${isLarge ? "text-sm" : "text-[10px]"}`}>MA</span>
        {isLarge && (
          <svg width="20" height="12" viewBox="0 0 24 14" fill="none" aria-hidden="true">
            <path
              d="M2 11h20M4 11l1.5-5.5A2 2 0 0 1 7.4 4h9.2a2 2 0 0 1 1.9 1.5L20 11M6 8h12"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="7" cy="11" r="1.6" fill="currentColor" />
            <circle cx="17" cy="11" r="1.6" fill="currentColor" />
          </svg>
        )}
      </div>
      <div className={`flex flex-1 flex-col items-center justify-center ${isLarge ? "px-6" : "px-3"}`}>
        <span
          className={`font-plate font-semibold tracking-wider text-ink-900 ${
            isLarge ? "text-4xl sm:text-5xl" : "text-xl"
          }`}
        >
          {formatted}
        </span>
        <span className={`font-plate text-ink-500 tracking-[0.3em] ${isLarge ? "text-xs mt-1" : "text-[10px]"}`}>
          DIRHAMS
        </span>
      </div>
    </div>
  );
}
