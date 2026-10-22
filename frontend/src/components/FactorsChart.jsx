import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Noms lisibles pour les variables du modèle (le service ML renvoie les noms
// des colonnes, comme "puissance_fiscale")
const NOMS_VARIABLES = {
  annee: "Année",
  kilometrage: "Kilométrage",
  puissance_fiscale: "Puissance fiscale",
  marque: "Marque",
  modele: "Modèle",
  carburant: "Carburant",
  boite_vitesses: "Boîte de vitesses",
  etat: "État",
  ville: "Ville",
  premiere_main: "Première main",
};

// Montre les variables qui pèsent le plus dans le modèle de prédiction.
// C'est l'importance globale du modèle (calculée à l'entraînement), pas une
// explication propre à cette voiture : elle est donc la même pour toutes.
export function FactorsChart({ facteurs = [] }) {
  if (!facteurs || facteurs.length === 0) {
    return <p className="text-sm text-gray-500">Aucun facteur explicatif disponible.</p>;
  }

  // Le backend renvoie { feature, impact } avec impact entre 0 et 1.
  // On passe en pourcentage et on trie du plus important au moins important.
  const data = facteurs
    .map((f) => ({
      nom: NOMS_VARIABLES[f.feature] ?? f.feature,
      poids: Math.round(f.impact * 1000) / 10,
    }))
    .sort((a, b) => b.poids - a.poids);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" unit=" %" />
          <YAxis type="category" dataKey="nom" width={120} />
          <Tooltip formatter={(valeur) => [`${valeur} %`, "Poids dans le modèle"]} />
          <Bar dataKey="poids" fill="#2F6F62" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
