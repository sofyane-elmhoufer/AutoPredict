# AutoPredict : backend

API REST de AutoPredict, en **Node.js / Express / Sequelize / MySQL**.
Elle gère le formulaire d'estimation avec son **cache**, les comptes (JWT) et le
back-office administrateur. Le calcul du prix est fait par le service ML Python (dossier `ml/`).

## 1. Installation

```bash
cd backend
npm install
cp .env.example .env     # puis renseigner DB_PASSWORD, JWT_SECRET (et ML_SERVICE_URL si besoin)
mysql -u root -p -e "CREATE DATABASE autopredict CHARACTER SET utf8mb4;"
```

## 2. Données de départ et lancement

```bash
npm run db:seed          # crée les tables et les données de départ
npm run dev              # nodemon (rechargement automatique), ou npm start
```

Le seed crée :

- `admin@autopredict.ma` / `Admin123!` (administrateur)
- `user@autopredict.ma` / `User1234!` (utilisateur)
- le catalogue des véhicules : les 224 couples marque / modèle présents dans les données
  d'entraînement (lus dans `ml/models/catalogue_vehicules.json`)
- la version active du modèle ML, avec ses vrais scores (lus dans `ml/models/metrics.json`)

On peut relancer `npm run db:seed` sans risque : ce qui existe déjà n'est pas dupliqué.

Pour que le seed trouve le catalogue et les scores, le dossier `ml/models/` doit être
à côté du dossier `backend/`. S'il n'existe pas, un petit catalogue de secours est utilisé.

En développement, `server.js` appelle `sequelize.sync({ alter: true })` et met les tables
à jour tout seul. En production il vaut mieux utiliser `database/schema.sql`.

## 3. Structure

```
backend/
├── server.js                    point d'entrée
├── src/
│   ├── app.js                   configuration Express (sécurité, routes)
│   ├── config/database.js       connexion Sequelize / MySQL
│   ├── models/                  Utilisateur, Estimation, ModeleML, CatalogueVehicule
│   ├── controllers/             logique de chaque route
│   ├── services/
│   │   ├── estimationService.js  le cache (cœur du projet)
│   │   └── mlService.js          appels HTTP au service Python
│   ├── middlewares/             authentification JWT, rôles, erreurs
│   ├── validators/              règles express-validator
│   ├── utils/                   cacheHash (normalisation + SHA-256), jwt, caseConverter
│   └── routes/
└── database/
    ├── schema.sql               schéma SQL de référence
    ├── initDb.js                crée les tables
    └── seed.js                  données de départ
```

## 4. Le cache

`POST /api/estimations` appelle `estimationService.obtenirEstimation()` :

1. Les caractéristiques sont normalisées (texte en minuscules sans accents, kilométrage
   arrondi par tranche de 5000 km, réglable avec `KM_ROUNDING_STEP`).
2. On calcule un hash SHA-256 de cette combinaison (`utils/cacheHash.js`).
3. On cherche en base une estimation avec ce hash, faite par le **modèle ML actif**.
4. Trouvée : on renvoie son résultat avec `source: "CACHE"`, sans appeler le modèle.
   Une ligne est quand même ajoutée dans la table `estimation` pour cette demande (elle apparaît
   dans l'historique de l'utilisateur et dans les stats), et le compteur `nb_reutilisations`
   de l'estimation d'origine augmente.
5. Pas trouvée : on appelle le service ML, on enregistre le résultat et on renvoie
   `source: "NOUVELLE_PREDICTION"`.

Quand l'admin active une autre version du modèle (`POST /api/modeles/:id/activer`),
le cache est invalidé de lui-même, puisque la recherche se fait sur l'identifiant du modèle actif.

## 5. Service ML

Le backend appelle le service Flask de `ml/src/api.py` (adresse dans `ML_SERVICE_URL`,
`http://localhost:8000` par défaut).

`POST /predict` reçoit les noms de colonnes du dataset, dans leur forme d'entraînement.
`src/services/mlService.js` fait la traduction depuis les valeurs du formulaire :

```json
{
  "marque": "Dacia", "modele": "Duster", "annee": 2018, "kilometrage": 90000,
  "carburant": "Diesel", "boite_vitesses": "Manuelle", "puissance_fiscale": 6,
  "etat": "Bon", "ville": "Casablanca", "premiere_main": "Oui"
}
```

Réponse :

```json
{
  "prixEstime": 148486,
  "margeConfiance": { "min": 135691, "max": 161281 },
  "facteursExplicatifs": [{ "feature": "annee", "impact": 0.4076 }]
}
```

`GET /health` et `GET /domaine` (villes connues, bornes numériques) sont aussi utilisés.

Correspondance des valeurs du formulaire avec le dataset :

| Formulaire | Envoyé au modèle |
|---|---|
| carburant ESSENCE / DIESEL / HYBRIDE / ELECTRIQUE | Essence / Diesel / Hybride / Electrique |
| carburant GPL | Essence (le GPL n'existe pas dans les données) |
| boîte MANUELLE / AUTOMATIQUE | Manuelle / Automatique |
| état EXCELLENT / BON / MOYEN / A_REPARER | Excellent / Bon / Correct / Endommagé |
| première main (booléen) | Oui / Non |

## 6. Routes

| Méthode | Route | Accès | Rôle |
|---|---|---|---|
| POST | `/api/auth/register` | public | créer un compte |
| POST | `/api/auth/login` | public | connexion, renvoie un JWT |
| GET / PUT / DELETE | `/api/auth/me` | connecté | voir, modifier, supprimer (anonymiser) son compte |
| POST | `/api/estimations` | public | faire une estimation (rattachée au compte si connecté) |
| GET | `/api/estimations` | connecté | historique avec pagination |
| GET / DELETE | `/api/estimations/:id` | connecté | détail, suppression |
| POST | `/api/estimations/comparer` | connecté | comparer plusieurs estimations (`{ ids: [...] }`) |
| GET | `/api/estimations/:id/export?format=pdf\|csv` | connecté | export |
| GET | `/api/catalogue/domaine` | public | villes et bornes connues du modèle |
| GET | `/api/catalogue/marques` | public | liste des marques |
| GET | `/api/catalogue/modeles?marque=...` | public | modèles d'une marque |
| GET | `/api/catalogue` | public | catalogue complet avec pagination |
| POST / PUT / DELETE | `/api/catalogue[/:id]` | admin | gérer les références |
| GET | `/api/modeles` | admin | versions du modèle ML |
| POST | `/api/modeles` | admin | enregistrer une version |
| POST | `/api/modeles/:id/activer` | admin | activer une version (invalide le cache) |
| GET | `/api/admin/dashboard` | admin | statistiques |
| GET | `/api/admin/cache/supervision` | admin | estimations par modèle et par jour |
| GET | `/api/admin/utilisateurs` | admin | liste des utilisateurs |
| PATCH | `/api/admin/utilisateurs/:id` | admin | activer/désactiver un compte, changer le rôle |
| GET | `/api/health` | public | le serveur répond |

Les requêtes sont limitées à 300 par IP toutes les 15 minutes.
