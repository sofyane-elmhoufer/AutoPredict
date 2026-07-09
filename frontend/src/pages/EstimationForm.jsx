import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { getMarques, getModeles } from "../services/catalogueService";
import { soumettreEstimation } from "../services/estimationService";

const currentYear = new Date().getFullYear();

// Schéma de validation aligné sur la section 3.1.a du cahier des charges.
// Les bornes d'année réelles (anneeMin/anneeMax) sont vérifiées séparément,
// une fois le modèle sélectionné, car elles dépendent du catalogue véhicule.
const schema = z.object({
  marque: z.string().min(1, "Choisissez une marque"),
  modele: z.string().min(1, "Choisissez un modèle"),
  annee: z
    .number({ invalid_type_error: "Année requise" })
    .int()
    .min(1990)
    .max(currentYear),
  kilometrage: z.number({ invalid_type_error: "Kilométrage requis" }).int().min(0),
  carburant: z.enum(["ESSENCE", "DIESEL", "HYBRIDE", "ELECTRIQUE", "GPL"]),
  boiteVitesses: z.enum(["MANUELLE", "AUTOMATIQUE"]),
  puissanceFiscale: z.number({ invalid_type_error: "Puissance fiscale requise" }).int().min(1),
  // Doit correspondre exactement à l'ENUM défini côté backend
  // (backend/src/models/Estimation.js + validators/estimation.validator.js).
  etatVehicule: z.enum(["EXCELLENT", "BON", "MOYEN", "A_REPARER"]),
  ville: z.string().min(1, "Ville requise"),
  nombreProprietaires: z.number({ invalid_type_error: "Champ requis" }).int().min(1),
});

export function EstimationForm() {
  const navigate = useNavigate();
  const [marqueChoisie, setMarqueChoisie] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const modeleChoisi = watch("modele");

  // Listes déroulantes alimentées par le catalogue véhicules (backend),
  // pour éviter toute saisie incohérente (exigence 3.1.a).
  const { data: marques = [] } = useQuery({ queryKey: ["marques"], queryFn: getMarques });
  const { data: modeles = [] } = useQuery({
    queryKey: ["modeles", marqueChoisie],
    queryFn: () => getModeles(marqueChoisie),
    enabled: !!marqueChoisie,
  });

  // Bornes anneeMin/anneeMax du modèle choisi : déjà présentes dans la liste
  // `modeles` (getModeles renvoie { idVehiculeRef, modele, anneeMin, anneeMax }),
  // pas besoin d'un second appel réseau.
  const reference = modeles.find((m) => m.modele === modeleChoisi);

  const mutation = useMutation({
    mutationFn: soumettreEstimation,
    onSuccess: (estimation) => {
      navigate("/estimation/resultat", { state: { estimation } });
    },
  });

  function onSubmit(values) {
    if (reference && (values.annee < reference.anneeMin || values.annee > reference.anneeMax)) {
      return; // sécurité en plus de l'affichage d'erreur ci-dessous
    }
    mutation.mutate(values);
  }

  const anneeSaisie = watch("annee");
  const anneeHorsPlage =
    reference && (anneeSaisie < reference.anneeMin || anneeSaisie > reference.anneeMax);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-primary-700">
        Caractéristiques du véhicule
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Marque</label>
          <select
            {...register("marque")}
            onChange={(e) => setMarqueChoisie(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          >
            <option value="">Sélectionner...</option>
            {marques.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {errors.marque && <p className="mt-1 text-sm text-red-600">{errors.marque.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Modèle</label>
          <select {...register("modele")} className="mt-1 w-full rounded border px-3 py-2">
            <option value="">Sélectionner...</option>
            {modeles.map((m) => (
              <option key={m.modele} value={m.modele}>
                {m.modele}
              </option>
            ))}
          </select>
          {errors.modele && <p className="mt-1 text-sm text-red-600">{errors.modele.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">
            Année
            {reference && (
              <span className="ml-1 text-xs text-gray-500">
                (de {reference.anneeMin} à {reference.anneeMax})
              </span>
            )}
          </label>
          <input
            type="number"
            {...register("annee", { valueAsNumber: true })}
            className="mt-1 w-full rounded border px-3 py-2"
          />
          {(errors.annee || anneeHorsPlage) && (
            <p className="mt-1 text-sm text-red-600">
              {errors.annee?.message ?? "Année incompatible avec ce modèle"}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Kilométrage</label>
          <input
            type="number"
            {...register("kilometrage", { valueAsNumber: true })}
            className="mt-1 w-full rounded border px-3 py-2"
          />
          {errors.kilometrage && (
            <p className="mt-1 text-sm text-red-600">{errors.kilometrage.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Carburant</label>
          <select {...register("carburant")} className="mt-1 w-full rounded border px-3 py-2">
            <option value="ESSENCE">Essence</option>
            <option value="DIESEL">Diesel</option>
            <option value="HYBRIDE">Hybride</option>
            <option value="ELECTRIQUE">Électrique</option>
            <option value="GPL">GPL</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Boîte de vitesses</label>
          <select {...register("boiteVitesses")} className="mt-1 w-full rounded border px-3 py-2">
            <option value="MANUELLE">Manuelle</option>
            <option value="AUTOMATIQUE">Automatique</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Puissance fiscale</label>
          <input
            type="number"
            {...register("puissanceFiscale", { valueAsNumber: true })}
            className="mt-1 w-full rounded border px-3 py-2"
          />
          {errors.puissanceFiscale && (
            <p className="mt-1 text-sm text-red-600">{errors.puissanceFiscale.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">État du véhicule</label>
          <select {...register("etatVehicule")} className="mt-1 w-full rounded border px-3 py-2">
            <option value="EXCELLENT">Excellent</option>
            <option value="BON">Bon état</option>
            <option value="MOYEN">État moyen</option>
            <option value="A_REPARER">À réparer</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Ville</label>
          <input {...register("ville")} className="mt-1 w-full rounded border px-3 py-2" />
          {errors.ville && <p className="mt-1 text-sm text-red-600">{errors.ville.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Nombre de propriétaires</label>
          <input
            type="number"
            {...register("nombreProprietaires", { valueAsNumber: true })}
            className="mt-1 w-full rounded border px-3 py-2"
          />
          {errors.nombreProprietaires && (
            <p className="mt-1 text-sm text-red-600">{errors.nombreProprietaires.message}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          {mutation.isError && (
            <p className="mb-3 text-sm text-red-600">
              Le service d'estimation est momentanément indisponible. Merci de réessayer.
            </p>
          )}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded bg-primary-500 px-6 py-3 font-medium text-white hover:bg-primary-600 disabled:opacity-50"
          >
            {mutation.isPending ? "Calcul en cours..." : "Obtenir l'estimation"}
          </button>
        </div>
      </form>
    </div>
  );
}
