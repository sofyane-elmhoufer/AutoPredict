# AutoPredict — Frontend (React / JavaScript)

Frontend React (JavaScript, sans TypeScript) pour la plateforme AutoPredict
(estimation de prix de véhicules d'occasion). Ce projet ne fait jamais appel
directement au modèle ML : tout passe par l'API REST du backend.

## Stack

- **Vite + React** (JavaScript / JSX)
- **react-router-dom** — routage, y compris routes protégées par rôle
- **@tanstack/react-query** — appels API, cache réseau, gestion loading/erreur
- **react-hook-form + zod** — formulaire de saisie véhicule et validation
- **axios** — client HTTP central (`src/services/api.js`)
- **recharts** — graphiques (facteurs SHAP, taux de cache)
- **Tailwind CSS** — styles

## Démarrage

```bash
npm install
cp .env.example .env   # puis adapter VITE_API_BASE_URL vers l'URL du backend
npm run dev
```

## Arborescence

```
src/
  types/index.js          # Constantes (enums) + JSDoc décrivant la forme des objets échangés
  services/
    api.js                # Client axios central + gestion du token JWT
    authService.js        # login / register
    estimationService.js  # soumission formulaire, historique, export
    catalogueService.js   # marques/modèles, bornes anneeMin/anneeMax
    adminService.js       # stats, utilisateurs, modèles ML, taux de cache
  context/
    AuthContext.jsx        # session utilisateur, rôle, token
  components/
    Navbar.jsx
    PrivateRoute.jsx        # protège les routes "utilisateur connecté"
    AdminRoute.jsx           # protège les routes "administrateur"
    FactorsChart.jsx         # graphique des facteurs explicatifs (SHAP)
  pages/
    Home.jsx
    EstimationForm.jsx       # formulaire dynamique (cœur du projet)
    EstimationResult.jsx     # affichage prix / fourchette / facteurs
    Login.jsx / Register.jsx
    Account.jsx              # historique, comparaison, export
    admin/
      AdminLayout.jsx
      AdminDashboard.jsx      # stats d'usage
      AdminUsers.jsx          # gestion des comptes
      AdminModels.jsx         # versions du modèle ML, déploiement
      AdminCache.jsx          # taux de réutilisation du cache
  App.jsx                    # déclaration des routes
  main.jsx                   # point d'entrée, providers (Router, QueryClient, Auth)
```

## Contrat d'API à valider avec le backend

Chaque fichier de `src/services/` documente en commentaire les endpoints REST
attendus. Récapitulatif à confirmer avec l'équipe backend avant intégration :

| Endpoint | Méthode | Usage frontend |
|---|---|---|
| `/auth/login`, `/auth/register` | POST | Connexion / inscription |
| `/catalogue/marques` | GET | Liste déroulante marques |
| `/catalogue/modeles?marque=` | GET | Liste déroulante modèles (cascade) |
| `/catalogue/reference?marque=&modele=` | GET | Bornes `anneeMin`/`anneeMax` pour validation |
| `/estimations` | POST | Soumission du formulaire → prix, fourchette, facteurs, source |
| `/utilisateurs/:id/estimations` | GET | Historique utilisateur |
| `/estimations/:id/export?format=` | GET | Export PDF/tableur |
| `/admin/stats` | GET | Dashboard admin |
| `/admin/utilisateurs`, `PUT /admin/utilisateurs/:id` | GET/PUT | Gestion des comptes |
| `/admin/modeles`, `POST /admin/modeles/:id/deployer` | GET/POST | Versions du modèle ML |
| `/admin/cache/taux-reutilisation` | GET | Supervision du cache |

**Points à verrouiller ensemble avant de coder en parallèle :**

1. Format exact des réponses JSON (noms de champs) — idéalement une petite
   spec OpenAPI/Swagger partagée.
2. Emplacement du token JWT dans les requêtes (`Authorization: Bearer ...`)
   et sa durée de vie.
3. Codes d'erreur HTTP à gérer côté front (400 validation, 401/403 auth/rôle,
   503 si le modèle ML est indisponible sans résultat en cache).
4. CORS activé côté backend pour l'origine du frontend (dev et prod).
5. Format des facteurs SHAP renvoyés par l'équipe ML (`{ feature, importance }`
   attendu ici) et liste exacte des valeurs catégorielles (carburant, boîte de
   vitesses, état) utilisées à l'entraînement du modèle — à faire correspondre
   aux constantes de `src/types/index.js`.

## Travailler sans attendre le backend

Tant que l'API n'est pas prête, deux options :

- **json-server** : créer un `db.json` avec des données d'exemple et pointer
  `VITE_API_BASE_URL` dessus.
- **MSW (Mock Service Worker)** : intercepter les appels `axios` dans le
  navigateur avec des réponses mockées, sans changer le code applicatif.
