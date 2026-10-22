# AutoPredict : frontend

Interface web de AutoPredict, en React (JavaScript). Elle ne parle jamais au modèle ML :
toutes les requêtes passent par l'API du backend (`backend/`).

## Technologies

- Vite + React (JSX)
- react-router-dom : pages et routes protégées (connecté / administrateur)
- @tanstack/react-query : appels à l'API, chargement et erreurs
- react-hook-form + zod : formulaire d'estimation et validation
- axios : client HTTP unique (`src/services/api.js`)
- recharts : graphique des variables importantes du modèle
- Tailwind CSS : styles

## Lancer

```bash
npm install
cp .env.example .env     # VITE_API_BASE_URL = adresse de l'API (http://localhost:5000/api par défaut)
npm run dev              # http://localhost:5173
npm run build            # version de production dans dist/
```

Le backend doit tourner pour que les pages fonctionnent (voir le README à la racine du projet).

## Structure

```
src/
  main.jsx                   point d'entrée (Router, react-query, AuthContext)
  App.jsx                    liste des routes
  types/index.js             listes du formulaire (carburants, boîtes, états) + JSDoc des objets de l'API
  services/
    api.js                   client axios + ajout du token JWT
    authService.js           connexion, inscription
    estimationService.js     estimation, historique, comparaison, export
    catalogueService.js      domaine du modèle, marques, modèles
    adminService.js          dashboard, utilisateurs, versions du modèle, cache
  context/AuthContext.jsx    session de l'utilisateur (token, rôle)
  components/
    Navbar.jsx
    PrivateRoute.jsx         réservé aux utilisateurs connectés
    AdminRoute.jsx           réservé aux administrateurs
    FactorsChart.jsx         graphique des variables qui pèsent le plus dans le modèle
    ui/                      CacheBadge, ChoixOuiNon, PricePlate, StepIndicator, VilleCombobox
  pages/
    Home.jsx
    EstimationForm.jsx       formulaire en plusieurs étapes
    EstimationResult.jsx     prix, fourchette, caractéristiques, origine (cache ou nouveau calcul)
    Login.jsx, Register.jsx
    Account.jsx              historique, comparaison, export, suppression
    admin/                   AdminLayout, AdminDashboard, AdminUsers, AdminModels, AdminCache
```

## Routes de l'application

| URL | Page | Accès |
|---|---|---|
| `/` | accueil | tous |
| `/estimation`, `/estimation/resultat` | formulaire et résultat | tous |
| `/login`, `/register` | connexion, inscription | tous |
| `/compte` | historique de l'utilisateur | connecté |
| `/admin`, `/admin/utilisateurs`, `/admin/modeles`, `/admin/cache` | back-office | administrateur |

## Points à connaître

- Les listes de marques et de modèles viennent du catalogue de la base, et les villes du service ML.
  Le formulaire ne propose donc que ce que le modèle connaît.
- Le graphique du résultat montre le poids moyen de chaque variable dans le modèle. Ce n'est pas
  une explication spécifique à la voiture estimée.
- Le token JWT est gardé dans le navigateur (voir `AuthContext.jsx`). Une réponse 401 déconnecte l'utilisateur.
