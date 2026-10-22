# AutoPredict

Application web qui estime le prix d'une voiture d'occasion au Maroc.
On saisit les caractéristiques du véhicule (marque, modèle, année, kilométrage,
carburant, ville...) et un modèle de machine learning, entraîné sur des annonces
Avito, donne un prix estimé avec une fourchette.

Le point central du projet est le **cache des estimations** : si la même voiture
(mêmes caractéristiques, kilométrage arrondi par tranche de 5000 km) a déjà été
estimée avec la version actuelle du modèle, on réutilise le résultat au lieu de
relancer le modèle.

## Les trois parties

| Dossier | Contenu | Technologies | Port |
|---|---|---|---|
| `ml/` | nettoyage des données, entraînement, service de prédiction | Python, pandas, scikit-learn, Flask | 8000 |
| `backend/` | API REST, base de données, cache, comptes et admin | Node.js, Express, Sequelize, MySQL | 5000 |
| `frontend/` | interface web | React, Vite, Tailwind CSS | 5173 |

```
Navigateur  ->  frontend (React)  ->  backend (Express)  ->  ml (Flask)
                                          |
                                       MySQL (utilisateurs, estimations, modèles, catalogue)
```

Le frontend ne parle jamais au service ML directement : tout passe par le backend.

## Lancer le projet

Il faut Python 3.10+, Node.js 18+ et MySQL. On lance les trois parties dans trois terminaux.

### 1. Service ML (port 8000)

```bash
cd ml
pip install -r requirements.txt
python src/api.py
```

Le modèle entraîné est déjà dans `ml/models/`. Pour le réentraîner (environ 2 minutes) :

```bash
python src/preprocessing.py   # nettoie le CSV Avito -> data/processed/cars_clean.csv
python src/train.py           # compare les modèles et sauvegarde le meilleur dans models/
```

Après un réentraînement, relancer `python src/api.py` pour charger le nouveau modèle.

### 2. Backend (port 5000)

```bash
cd backend
npm install
cp .env.example .env          # puis mettre le mot de passe MySQL (DB_PASSWORD) et un JWT_SECRET
mysql -u root -p -e "CREATE DATABASE autopredict CHARACTER SET utf8mb4;"
npm run db:seed               # crée les tables, les comptes de test, le catalogue et le modèle actif
npm run dev
```

Comptes créés par le seed :

- administrateur : `admin@autopredict.ma` / `Admin123!`
- utilisateur : `user@autopredict.ma` / `User1234!`

### 3. Frontend (port 5173)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Ouvrir ensuite http://localhost:5173.

## Comment tester à la main

1. Sans compte, aller sur « Estimer un véhicule » et remplir le formulaire (ex. Dacia Duster 2018, 90 000 km, Diesel).
   Le résultat s'affiche avec la fourchette de prix et le message « Nouvelle estimation calculée par le modèle ».
2. Refaire exactement la même estimation : le message devient « Résultat instantané (déjà calculé) », le résultat vient du cache.
3. Se connecter avec le compte utilisateur : l'historique (page « Mon compte ») garde les estimations,
   on peut les comparer, les exporter en PDF ou CSV, ou les supprimer.
4. Se connecter avec le compte admin : tableau de bord (taux de cache, modèle actif, état du service ML),
   gestion des utilisateurs, des versions du modèle et supervision du cache.
5. En admin, activer une autre version du modèle : le cache est invalidé et la même estimation
   redevient un « nouveau calcul ».

## Performances du modèle

Le meilleur modèle sur le jeu de test est un Random Forest (R² = 0,84, erreur moyenne d'environ 12 800 MAD).
Le détail de la comparaison avec les autres modèles est dans `ml/models/metrics.json`.

Limites à connaître :

- les données sont des annonces (prix demandés, pas prix de vente) ;
- 7 903 annonces seulement après nettoyage, dont 91 % de diesel : les voitures essence, hybrides
  et électriques sont mal couvertes ;
- le modèle réagit peu à l'état déclaré du véhicule et au kilométrage ;
- les facteurs affichés après l'estimation sont l'importance globale de chaque variable dans le modèle,
  ils ne sont pas calculés pour chaque voiture.

## Documentation par partie

- [`backend/README.md`](backend/README.md) : API, base de données, fonctionnement du cache
- [`frontend/README.md`](frontend/README.md) : structure de l'interface
- les fichiers de `ml/src/` commencent tous par une description de leur rôle

## Équipe

- partie ML (données, modèle, service de prédiction) : Sofyane (Sofyane00)
- backend : Othmane El Mghari (othmaneelmghari)
- frontend : El-abbadi05
