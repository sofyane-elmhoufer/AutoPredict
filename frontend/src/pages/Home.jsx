import { Link } from "react-router-dom";

export function Home() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-primary-700">
        Estimez le prix de revente de votre véhicule
      </h1>
      <p className="mt-4 text-gray-600">
        Renseignez les caractéristiques de votre véhicule et obtenez en quelques
        secondes un prix estimé, une fourchette de confiance et les facteurs qui
        l'expliquent — basé sur des données du marché marocain.
      </p>
      <Link
        to="/estimation"
        className="mt-8 inline-block rounded bg-primary-500 px-6 py-3 font-medium text-white hover:bg-primary-600"
      >
        Estimer mon véhicule
      </Link>
    </div>
  );
}
