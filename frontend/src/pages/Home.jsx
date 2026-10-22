import { Link } from "react-router-dom";
import { PricePlate } from "../components/ui/PricePlate";

export function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 px-4 py-16 sm:py-24 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-taxi-500">
            Marché marocain de l'occasion
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight text-ink-800 sm:text-5xl">
            Combien vaut réellement votre voiture ?
          </h1>
          <p className="mt-5 max-w-md text-asphalt-600">
            Renseignez les caractéristiques de votre véhicule et obtenez en quelques
            secondes un prix estimé, une fourchette de confiance et les facteurs qui
            l'expliquent — à partir de vraies annonces du marché marocain.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/estimation" className="btn-primary !px-7 !py-3 !text-base">
              Estimer mon véhicule
            </Link>
            <a href="#comment-ca-marche" className="btn-secondary !px-7 !py-3 !text-base">
              Voir comment ça marche
            </a>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="card w-full max-w-sm p-6">
            <p className="mb-4 text-xs font-medium uppercase tracking-widest text-asphalt-400">
              Exemple — Dacia Duster 2018
            </p>
            <PricePlate prix={149530} />
            <p className="mt-4 text-xs text-asphalt-500">
              Fourchette de confiance : 136 735 — 162 325 DH
            </p>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment-ca-marche" className="border-y border-asphalt-200 bg-paper-raised">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="mb-10 text-center font-display text-2xl font-bold text-ink-800">
            Comment fonctionne l'estimation
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <Etape
              numero="1"
              titre="Renseignez votre véhicule"
              texte="Marque, modèle, année, kilométrage, ville... uniquement des choix que le modèle sait réellement reconnaître, pas de saisie libre hasardeuse."
            />
            <Etape
              numero="2"
              titre="Le modèle compare"
              texte="Si un véhicule aux caractéristiques très proches a déjà été estimé, le résultat est réutilisé instantanément. Sinon, le modèle ML calcule une nouvelle prédiction."
            />
            <Etape
              numero="3"
              titre="Recevez un prix expliqué"
              texte="Prix estimé, fourchette de confiance et facteurs qui pèsent le plus dans le calcul — pas juste un chiffre brut."
            />
          </div>
        </div>
      </section>

      {/* Transparence */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="mb-8 text-center font-display text-2xl font-bold text-ink-800">
          Une estimation honnête sur ses propres limites
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Fait
            titre="Champs bornés"
            texte="Année, kilométrage et puissance fiscale sont limités à ce que le modèle a réellement appris — pas d'extrapolation hasardeuse hors de ce périmètre."
          />
          <Fait
            titre="Villes reconnues"
            texte="La liste des villes proposées correspond exactement à celles que le modèle sait distinguer individuellement dans ses données d'entraînement."
          />
          <Fait
            titre="Cache visible"
            texte="Chaque estimation indique clairement si elle vient d'un nouveau calcul ou d'un résultat déjà connu, avec le nombre de réutilisations."
          />
        </div>
      </section>
    </div>
  );
}

function Etape({ numero, titre, texte }) {
  return (
    <div className="text-center sm:text-left">
      <span className="font-plate text-3xl font-bold text-taxi-500">{numero}</span>
      <h3 className="mt-2 font-display font-semibold text-ink-800">{titre}</h3>
      <p className="mt-1.5 text-sm text-asphalt-500">{texte}</p>
    </div>
  );
}

function Fait({ titre, texte }) {
  return (
    <div className="card p-6">
      <h3 className="font-display font-semibold text-ink-800">{titre}</h3>
      <p className="mt-2 text-sm text-asphalt-500">{texte}</p>
    </div>
  );
}
