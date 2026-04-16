# Architecture cible

## Objectif

Fusionner les 4 sites existants dans une seule application web, puis préparer une déclinaison iOS basée sur le même socle.

## Modules fonctionnels

1. `Challenge opérateurs`
   Suit les ventes des opérateurs, les équipes, le podium et les bonus de cartes.
2. `Comparatif laboratoires`
   Compare le CA HT des laboratoires par mois entre l'année en cours et N-1.
3. `Têtes de gondole`
   Mesure la présence, la rotation et l'efficacité commerciale des produits placés en TG.
4. `Vigilance références`
   Surveille des références sensibles à partir des listes acheteurs, du stock et des ventes hebdomadaires.

## État actuel constaté

- Fronts séparés mais très proches techniquement :
  - React
  - Vite
  - Tailwind
  - Base44 SDK
- Sources de données multiples :
  - Vindilis / PostgreSQL
  - Google Sheets
  - Base44
  - Supabase
- Secrets présents en dur dans plusieurs scripts et fichiers front.

## Architecture recommandée

### Frontend

- Une seule application React.
- Une navigation principale par module.
- Des sous-routes métier dans chaque module.
- Une authentification et un design system communs.

### Données

- Une seule couche d'ingestion qui lit Vindilis.
- Des connecteurs annexes pour Google Sheets si nécessaire.
- Une couche de transformation commune avec schémas métiers normalisés.
- Une seule stratégie de publication vers le stockage cible.

### Stockage cible

Deux options réalistes :

1. `Base44 centralisé`
   Le plus simple pour aller vite si tu veux conserver l'existant.
2. `Backend dédié + base SQL`
   Le plus propre à moyen terme si tu veux durcir, historiser et faire évoluer l'app iOS.

## Pipeline cible

### Étape 1

Créer un script orchestrateur unique, par exemple :

- `sync-challenge.ps1`
- `sync-labos.ps1`
- `sync-tg.ps1`
- `sync-vigilance.ps1`
- `run-all-sync.ps1`

### Étape 2

Mutualiser les fonctions partagées :

- connexion PostgreSQL
- appels API Base44
- appels Supabase
- logs
- retry
- normalisation des textes
- gestion des dates

### Étape 3

Sortir tous les secrets du code :

- mot de passe PostgreSQL
- clés Base44
- clés Supabase
- identifiants d'apps
- URLs d'API

Via :

- variables d'environnement
- ou fichier `.env` local non versionné

## iOS

La cible recommandée n'est pas une app iOS native dès maintenant.

Chemin conseillé :

1. stabiliser le web unifié ;
2. centraliser les flux de données ;
3. adapter l'UX mobile ;
4. emballer la webapp pour iOS.

## Priorités de réalisation

1. stabiliser le shell web unifié ;
2. reconnecter proprement les 4 modules ;
3. regrouper les scripts d'alimentation ;
4. sécuriser les secrets ;
5. préparer la version iOS.
