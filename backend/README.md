# AutoPredict — Backend (API REST)

API REST du projet **AutoPredict**, réalisée en **Node.js / Express / Sequelize / MySQL**.
Implémente le formulaire d'estimation, le **mécanisme de cache** (section 3.1.b du cahier
des charges), l'authentification JWT, et le back-office administrateur.

## 1. Installation

```bash
cd backend
npm install
cp .env.example .env   # puis renseigner DB_PASSWORD, JWT_SECRET, ML_SERVICE_URL...
```

Créer la base MySQL (ou laisser Sequelize la synchroniser automatiquement en dev) :

```bash
mysql -u root -p -e "CREATE DATABASE autopredict CHARACTER SET utf8mb4;"
```

## 2. Lancer le serveur

```bash
npm run dev        # avec nodemon, rechargement automatique
# ou
npm start
```

En développement, `server.js` appelle `sequelize.sync({ alter: true })` : les tables
sont créées/mises à jour automatiquement à partir des modèles (`src/models/`).
En production, préférez le script `database/schema.sql` + des migrations dédiées.

## 3. Données de démonstration

```bash
npm run db:seed
```

Crée :
- `admin@autopredict.ma` / `Admin123!` (rôle ADMINISTRATEUR)
- `user@autopredict.ma` / `User1234!` (rôle UTILISATEUR)
- Quelques références du catalogue véhicule (Dacia, Renault, Peugeot...)
- Une version `v0.1-mock` du modèle ML, activée par défaut (à remplacer par le vrai
  modèle entraîné par l'équipe Data Science via `POST /api/modeles` puis `/activer`)

## 4. Architecture

```
backend/
├── server.js                  # point d'entrée
├── src/
│   ├── app.js                 # configuration Express (middlewares, routes)
│   ├── config/database.js     # connexion Sequelize/MySQL
│   ├── models/                # Utilisateur, Estimation, ModeleML, CatalogueVehicule
│   ├── controllers/           # logique des routes
│   ├── services/
│   │   ├── estimationService.js  # ⭐ mécanisme de cache (cœur du projet)
│   │   └── mlService.js          # appel HTTP au microservice Python
│   ├── middlewares/           # auth JWT, rôles, gestion d'erreurs
│   ├── validators/            # règles express-validator
│   ├── utils/
│   │   ├── cacheHash.js       # normalisation + SHA-256
│   │   └── jwt.js
│   └── routes/
└── database/
    ├── schema.sql              # schéma SQL de référence (doc / prod)
    ├── initDb.js                # sync Sequelize -> tables
    └── seed.js                  # données de démo
```

## 5. Le mécanisme de cache, en bref

`POST /api/estimations` déclenche `estimationService.obtenirEstimation()` :

1. **Normalisation** des caractéristiques (texte en minuscule sans accents, kilométrage
   arrondi par tranche de 5000 km — configurable via `KM_ROUNDING_STEP`).
2. **Hash SHA-256** de la combinaison normalisée (`cacheHash.js`).
3. **Recherche en base** (`ESTIMATION` indexée sur `hash_caracteristiques + id_modele`)
   filtrée sur le **modèle ML actuellement actif**.
4. Trouvé → retour immédiat, `source: "CACHE"`, **aucun appel au modèle ML**.
5. Non trouvé (ou modèle réentraîné depuis) → appel `mlService.predire()`, sauvegarde,
   `source: "NOUVELLE_PREDICTION"`.

Quand l'admin active une nouvelle version de modèle (`POST /api/modeles/:id/activer`),
les anciennes estimations en cache deviennent automatiquement obsolètes, car la
recherche filtre sur `id_modele`.

## 6. Intégration avec le microservice ML (Python)

Le backend attend un microservice HTTP exposé par l'équipe Data Science (dossier `ml/`),
configuré via `ML_SERVICE_URL` dans `.env` :

**`POST {ML_SERVICE_URL}/predict`**
```json
// Requête
{
  "marque": "Dacia", "modele": "Duster", "annee": 2019,
  "kilometrage": 85000, "carburant": "DIESEL", "boiteVitesses": "MANUELLE",
  "puissanceFiscale": 7, "etatVehicule": "BON", "ville": "Fès",
  "nombreProprietaires": 1
}
// Réponse attendue
{
  "prixEstime": 145000,
  "margeConfiance": { "min": 138000, "max": 152000 },
  "facteursExplicatifs": [
    { "feature": "kilometrage", "impact": -0.18 },
    { "feature": "annee", "impact": 0.25 }
  ]
}
```

**`GET {ML_SERVICE_URL}/health`** → utilisé par le dashboard admin.

## 7. Principaux endpoints

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/api/auth/register` | public | Créer un compte |
| POST | `/api/auth/login` | public | Connexion, retourne un JWT |
| GET | `/api/auth/me` | connecté | Profil courant |
| PUT | `/api/auth/me` | connecté | Modifier le profil |
| DELETE | `/api/auth/me` | connecté | Supprimer/anonymiser le compte |
| POST | `/api/estimations` | public/optionnel | **Soumettre le formulaire (cache)** |
| GET | `/api/estimations` | connecté | Historique paginé |
| GET | `/api/estimations/:id` | connecté | Détail d'une estimation |
| DELETE | `/api/estimations/:id` | connecté | Supprimer une estimation |
| POST | `/api/estimations/comparer` | connecté | Comparer plusieurs estimations |
| GET | `/api/estimations/:id/export?format=pdf\|csv` | connecté | Export |
| GET | `/api/catalogue/marques` | public | Liste des marques |
| GET | `/api/catalogue/modeles?marque=...` | public | Modèles d'une marque |
| POST/PUT/DELETE | `/api/catalogue/:id` | admin | Gestion du catalogue |
| GET | `/api/modeles` | admin | Versions du modèle ML |
| POST | `/api/modeles` | admin | Enregistrer une nouvelle version |
| POST | `/api/modeles/:id/activer` | admin | Activer une version |
| GET | `/api/admin/dashboard` | admin | Statistiques globales |
| GET | `/api/admin/cache/supervision` | admin | Taux de réutilisation du cache |
| GET | `/api/admin/utilisateurs` | admin | Liste des comptes |
| PATCH | `/api/admin/utilisateurs/:id` | admin | Activer/désactiver/changer un rôle |

Toutes les routes protégées attendent l'en-tête :
`Authorization: Bearer <token>`

## 8. Exemple d'appel (formulaire d'estimation)

```bash
curl -X POST http://localhost:5000/api/estimations \
  -H "Content-Type: application/json" \
  -d '{
    "marque": "Dacia", "modele": "Duster", "annee": 2019,
    "kilometrage": 85000, "carburant": "DIESEL", "boiteVitesses": "MANUELLE",
    "puissanceFiscale": 7, "etatVehicule": "BON", "ville": "Fès",
    "nombreProprietaires": 1
  }'
```

## 9. Pour le développeur frontend (React)

- Toutes les réponses sont en JSON.
- CORS est déjà configuré pour `FRONTEND_URL` (par défaut `http://localhost:5173`, à
  adapter si vous utilisez Vite/CRA sur un autre port).
- Stocker le `token` reçu à l'inscription/connexion et l'envoyer dans
  `Authorization: Bearer <token>` pour les routes protégées.
- Le champ `source` (`"CACHE"` ou `"NOUVELLE_PREDICTION"`) dans la réponse
  d'estimation permet d'afficher la mention « résultat instantané » vs « nouvelle
  estimation » demandée dans le cahier des charges.

## 10. Pour le développeur Data Science / ML (Python)

Votre microservice doit exposer `POST /predict` et `GET /health` (voir section 6).
Une fois votre modèle entraîné et évalué, publiez-le via :
```bash
POST /api/modeles         # avec nomVersion, algorithme, cheminFichier, scoreR2, scoreMAE
POST /api/modeles/:id/activer
```
