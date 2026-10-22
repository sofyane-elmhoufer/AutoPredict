import { useEffect, useId, useMemo, useRef, useState } from "react";

/**
 * Liste déroulante avec recherche pour choisir une ville parmi celles que le
 * modèle ML connaît. On ne peut pas valider une ville hors liste : si le texte
 * ne correspond à aucune option quand on quitte le champ, il revient à la
 * dernière valeur valide. Sans librairie externe.
 */
export function VilleCombobox({ value, onChange, options, placeholder = "Rechercher une ville...", error }) {
  const [saisie, setSaisie] = useState(value || "");
  const [ouvert, setOuvert] = useState(false);
  const [surligne, setSurligne] = useState(0);
  const containerRef = useRef(null);
  const listboxId = useId();

  useEffect(() => setSaisie(value || ""), [value]);

  const filtres = useMemo(() => {
    const q = saisie.trim().toLowerCase();
    if (!q) return options.slice(0, 50);
    return options.filter((v) => v.toLowerCase().includes(q)).slice(0, 50);
  }, [saisie, options]);

  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOuvert(false);
        // Texte qui ne correspond à aucune ville : on remet la dernière valeur valide
        if (!options.includes(saisie)) setSaisie(value || "");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [saisie, options, value]);

  function choisir(ville) {
    setSaisie(ville);
    onChange(ville);
    setOuvert(false);
  }

  function onKeyDown(e) {
    if (!ouvert && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOuvert(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSurligne((i) => Math.min(i + 1, filtres.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSurligne((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtres[surligne]) choisir(filtres[surligne]);
    } else if (e.key === "Escape") {
      setOuvert(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-asphalt-400"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          role="combobox"
          aria-expanded={ouvert}
          aria-controls={listboxId}
          aria-autocomplete="list"
          value={saisie}
          placeholder={placeholder}
          onChange={(e) => {
            setSaisie(e.target.value);
            setOuvert(true);
            setSurligne(0);
          }}
          onFocus={() => setOuvert(true)}
          onKeyDown={onKeyDown}
          className={`w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-taxi-500/40 ${
            error ? "border-taxi-500" : "border-asphalt-200"
          }`}
        />
      </div>

      {ouvert && filtres.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-asphalt-200 bg-white py-1 shadow-card"
        >
          {filtres.map((ville, idx) => (
            <li
              key={ville}
              role="option"
              aria-selected={ville === value}
              onMouseDown={() => choisir(ville)}
              className={`cursor-pointer px-3 py-1.5 text-sm ${
                idx === surligne ? "bg-ink-50 text-ink-800" : "text-ink-700"
              }`}
            >
              {ville}
            </li>
          ))}
        </ul>
      )}

      {ouvert && filtres.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-asphalt-200 bg-white px-3 py-2 text-sm text-asphalt-400 shadow-card">
          Aucune ville ne correspond. Choisissez « Autre » si votre ville n'est pas listée.
        </div>
      )}
    </div>
  );
}
