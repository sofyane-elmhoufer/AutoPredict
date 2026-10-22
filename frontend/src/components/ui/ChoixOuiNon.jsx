/**
 * Choix Oui / Non pour "Première main ?". C'est directement la variable
 * utilisée par le modèle ML (voir backend/src/services/mlService.js).
 */
export function ChoixOuiNon({ label, value, onChange, description }) {
  return (
    <div>
      {label && <label className="mb-1.5 block text-sm font-medium text-ink-700">{label}</label>}
      <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-asphalt-200 bg-white p-1">
        {[
          { v: true, texte: "Oui" },
          { v: false, texte: "Non" },
        ].map((opt) => (
          <button
            key={String(opt.v)}
            type="button"
            role="radio"
            aria-checked={value === opt.v}
            onClick={() => onChange(opt.v)}
            className={`rounded-md px-5 py-1.5 text-sm font-medium transition-colors ${
              value === opt.v ? "bg-ink-800 text-white" : "text-ink-600 hover:bg-asphalt-50"
            }`}
          >
            {opt.texte}
          </button>
        ))}
      </div>
      {description && <p className="mt-1.5 text-xs text-asphalt-400">{description}</p>}
    </div>
  );
}
