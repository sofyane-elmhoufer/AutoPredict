/**
 * Indicateur d'étapes du formulaire d'estimation. Ce sont de vraies étapes dans
 * l'ordre : le choix de la marque et du modèle détermine les années possibles.
 */
export function StepIndicator({ steps, current }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-4">
      {steps.map((label, idx) => {
        const step = idx + 1;
        const etat = step < current ? "fait" : step === current ? "courant" : "avenir";
        return (
          <li key={label} className="flex flex-1 items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold font-plate transition-colors ${
                  etat === "fait"
                    ? "bg-teal-500 text-white"
                    : etat === "courant"
                    ? "bg-taxi-500 text-white"
                    : "bg-asphalt-100 text-asphalt-400"
                }`}
              >
                {etat === "fait" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  step
                )}
              </span>
              <span
                className={`hidden text-sm font-medium sm:block ${
                  etat === "avenir" ? "text-asphalt-400" : "text-ink-800"
                }`}
              >
                {label}
              </span>
            </div>
            {step < steps.length && <div className={`h-px flex-1 ${etat === "fait" ? "bg-teal-500" : "bg-asphalt-200"}`} />}
          </li>
        );
      })}
    </ol>
  );
}
