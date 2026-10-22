import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { getDomaineEntrainement, getMarques, getModeles } from "../services/catalogueService";
import { soumettreEstimation } from "../services/estimationService";
import { StepIndicator } from "../components/ui/StepIndicator";
import { VilleCombobox } from "../components/ui/VilleCombobox";
import { ChoixOuiNon } from "../components/ui/ChoixOuiNon";

const currentYear = new Date().getFullYear();

// Validation de base (types et champs obligatoires). Les vraies bornes (année,
// kilométrage, puissance fiscale, villes) viennent de /catalogue/domaine et sont
// vérifiées plus bas, pour ne pas accepter ce que le modèle ne connaît pas.
const schema = z.object({
  marque: z.string().min(1, "Choisissez une marque"),
  modele: z.string().min(1, "Choisissez un modèle"),
  annee: z.number({ invalid_type_error: "Année requise" }).int(),
  kilometrage: z.number({ invalid_type_error: "Kilométrage requis" }).int().min(0),
  carburant: z.enum(["ESSENCE", "DIESEL", "HYBRIDE", "ELECTRIQUE", "GPL"]),
  boiteVitesses: z.enum(["MANUELLE", "AUTOMATIQUE"]),
  puissanceFiscale: z.number({ invalid_type_error: "Puissance fiscale requise" }).int(),
  etatVehicule: z.enum(["EXCELLENT", "BON", "MOYEN", "A_REPARER"]),
  ville: z.string().min(1, "Ville requise"),
  premiereMain: z.boolean({ invalid_type_error: "Merci de préciser première main ou non" }),
});

const ETAPES = ["Véhicule", "Caractéristiques", "Localisation", "Récapitulatif"];
const CHAMPS_PAR_ETAPE = [
  ["marque", "modele", "annee"],
  ["kilometrage", "carburant", "boiteVitesses", "puissanceFiscale", "etatVehicule"],
  ["ville", "premiereMain"],
  [],
];

const LIBELLES = {
  carburant: { ESSENCE: "Essence", DIESEL: "Diesel", HYBRIDE: "Hybride", ELECTRIQUE: "Électrique", GPL: "GPL" },
  boiteVitesses: { MANUELLE: "Manuelle", AUTOMATIQUE: "Automatique" },
  etatVehicule: { EXCELLENT: "Excellent", BON: "Bon état", MOYEN: "État moyen", A_REPARER: "À réparer" },
};

export function EstimationForm() {
  const navigate = useNavigate();
  const [etape, setEtape] = useState(1);
  const [marqueChoisie, setMarqueChoisie] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { premiereMain: true } });

  const valeurs = watch();
  const modeleChoisi = watch("modele");

  // Domaine d'entraînement du modèle : villes connues et bornes numériques
  // (voir ml/src/train.py, save_domaine_entrainement).
  const { data: domaine } = useQuery({ queryKey: ["domaine-ml"], queryFn: getDomaineEntrainement });

  const { data: marques = [] } = useQuery({ queryKey: ["marques"], queryFn: getMarques });
  const { data: modeles = [] } = useQuery({
    queryKey: ["modeles", marqueChoisie],
    queryFn: () => getModeles(marqueChoisie),
    enabled: !!marqueChoisie,
  });

  // Bornes d'année du modèle choisi (déjà présentes dans `modeles`).
  const reference = modeles.find((m) => m.modele === modeleChoisi);

  // Bornes globales (année, kilométrage, puissance) utilisées tant que le modèle
  // de voiture n'est pas choisi.
  const limites = domaine?.limites;
  const anneeMin = reference?.anneeMin ?? limites?.annee.min ?? 1990;
  const anneeMax = reference?.anneeMax ?? limites?.annee.max ?? currentYear;

  const mutation = useMutation({
    mutationFn: soumettreEstimation,
    onSuccess: (estimation) => navigate("/estimation/resultat", { state: { estimation } }),
  });

  async function etapeSuivante() {
    const champs = CHAMPS_PAR_ETAPE[etape - 1];
    const valide = champs.length === 0 || (await trigger(champs));
    if (valide) setEtape((e) => Math.min(e + 1, ETAPES.length));
  }

  function etapePrecedente() {
    setEtape((e) => Math.max(e - 1, 1));
  }

  function onSubmit(values) {
    mutation.mutate(values);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <p className="mb-1 text-sm font-medium uppercase tracking-widest text-taxi-500">Estimation</p>
      <h1 className="mb-8 font-display text-3xl font-bold text-ink-800">Combien vaut votre véhicule ?</h1>

      <div className="mb-8">
        <StepIndicator steps={ETAPES} current={etape} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl border border-asphalt-200 bg-white p-6 shadow-card sm:p-8">
        {etape === 1 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Champ label="Marque" error={errors.marque}>
              <select
                {...register("marque")}
                onChange={(e) => {
                  setMarqueChoisie(e.target.value);
                  setValue("marque", e.target.value);
                  setValue("modele", "");
                }}
                className="input"
              >
                <option value="">Sélectionner...</option>
                {marques.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Champ>

            <Champ label="Modèle" error={errors.modele}>
              <select {...register("modele")} className="input" disabled={!marqueChoisie}>
                <option value="">{marqueChoisie ? "Sélectionner..." : "Choisissez d'abord une marque"}</option>
                {modeles.map((m) => (
                  <option key={m.modele} value={m.modele}>{m.modele}</option>
                ))}
              </select>
            </Champ>

            <Champ
              label="Année"
              hint={`Le modèle sait estimer les véhicules de ${anneeMin} à ${anneeMax}.`}
              error={errors.annee}
            >
              <input
                type="number"
                min={anneeMin}
                max={anneeMax}
                {...register("annee", { valueAsNumber: true })}
                className="input"
              />
            </Champ>
          </div>
        )}

        {etape === 2 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Champ
              label="Kilométrage (km)"
              hint={limites && `Plage d'entraînement : ${limites.kilometrage.min.toLocaleString("fr-FR")} — ${limites.kilometrage.max.toLocaleString("fr-FR")} km`}
              error={errors.kilometrage}
            >
              <input
                type="number"
                min={limites?.kilometrage.min}
                max={limites?.kilometrage.max}
                {...register("kilometrage", { valueAsNumber: true })}
                className="input"
              />
            </Champ>

            <Champ
              label="Puissance fiscale (CV)"
              hint={limites && `Plage d'entraînement : ${limites.puissanceFiscale.min} — ${limites.puissanceFiscale.max} CV`}
              error={errors.puissanceFiscale}
            >
              <input
                type="number"
                min={limites?.puissanceFiscale.min}
                max={limites?.puissanceFiscale.max}
                {...register("puissanceFiscale", { valueAsNumber: true })}
                className="input"
              />
            </Champ>

            <Champ label="Carburant">
              <select {...register("carburant")} className="input">
                {Object.entries(LIBELLES.carburant).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </Champ>

            <Champ label="Boîte de vitesses">
              <select {...register("boiteVitesses")} className="input">
                {Object.entries(LIBELLES.boiteVitesses).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </Champ>

            <Champ label="État du véhicule">
              <select {...register("etatVehicule")} className="input">
                {Object.entries(LIBELLES.etatVehicule).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </Champ>
          </div>
        )}

        {etape === 3 && (
          <div className="grid grid-cols-1 gap-5">
            <Champ
              label="Ville"
              hint="Choisissez dans la liste : ce sont les villes que le modèle sait reconnaître individuellement."
              error={errors.ville}
            >
              <VilleCombobox
                value={valeurs.ville}
                onChange={(v) => setValue("ville", v, { shouldValidate: true })}
                options={domaine?.villes || []}
                error={errors.ville}
              />
            </Champ>

            <ChoixOuiNon
              label="Première main ?"
              description="Le véhicule n'a-t-il eu qu'un seul propriétaire depuis sa sortie d'usine ?"
              value={valeurs.premiereMain}
              onChange={(v) => setValue("premiereMain", v)}
            />
          </div>
        )}

        {etape === 4 && <Recapitulatif valeurs={valeurs} />}

        {mutation.isError && (
          <p className="mt-4 rounded-lg bg-taxi-50 px-4 py-3 text-sm text-taxi-600">
            Le service d'estimation est momentanément indisponible. Merci de réessayer.
          </p>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={etapePrecedente}
            className={`text-sm font-medium text-asphalt-600 hover:text-ink-800 ${etape === 1 ? "invisible" : ""}`}
          >
            ← Précédent
          </button>

          {/* Les deux boutons ont une key différente : sans ça React réutilise le même
              bouton et le clic sur "Continuer" de l'étape 3 envoyait le formulaire
              directement, sans passer par le récapitulatif. */}
          {etape < ETAPES.length ? (
            <button key="continuer" type="button" onClick={etapeSuivante} className="btn-primary">
              Continuer
            </button>
          ) : (
            <button key="envoyer" type="submit" disabled={mutation.isPending} className="btn-primary">
              {mutation.isPending ? "Calcul en cours..." : "Obtenir l'estimation"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Champ({ label, error, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-700">{label}</label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-taxi-500">{error.message}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-asphalt-400">{hint}</p>
      )}
    </div>
  );
}

function Recapitulatif({ valeurs }) {
  const lignes = [
    ["Marque / Modèle", `${valeurs.marque} ${valeurs.modele}`],
    ["Année", valeurs.annee],
    ["Kilométrage", valeurs.kilometrage != null ? `${Number(valeurs.kilometrage).toLocaleString("fr-FR")} km` : "—"],
    ["Carburant", LIBELLES.carburant[valeurs.carburant]],
    ["Boîte de vitesses", LIBELLES.boiteVitesses[valeurs.boiteVitesses]],
    ["Puissance fiscale", valeurs.puissanceFiscale != null ? `${valeurs.puissanceFiscale} CV` : "—"],
    ["État", LIBELLES.etatVehicule[valeurs.etatVehicule]],
    ["Ville", valeurs.ville],
    ["Première main", valeurs.premiereMain ? "Oui" : "Non"],
  ];

  return (
    <div>
      <p className="mb-4 text-sm text-asphalt-600">
        Vérifiez les informations avant de lancer l'estimation.
      </p>
      <dl className="divide-y divide-asphalt-100 rounded-lg border border-asphalt-200">
        {lignes.map(([k, v]) => (
          <div key={k} className="flex justify-between px-4 py-2.5 text-sm">
            <dt className="text-asphalt-500">{k}</dt>
            <dd className="font-medium text-ink-800">{v ?? "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
