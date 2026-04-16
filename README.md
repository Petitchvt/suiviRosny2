# Gestion unifiee

Application web unique qui regroupe :

- le challenge operateurs,
- le comparatif laboratoires,
- le suivi des tetes de gondole,
- la vigilance references.

## Demarrage

### Prerequis

- Node.js installe
- acces aux services utilises par l'application

### Configuration

Copier `.env.example` vers `.env.local` puis renseigner les valeurs reelles.

Variables attendues :

```env
VITE_BASE44_APP_ID=
VITE_BASE44_FUNCTIONS_VERSION=
VITE_BASE44_APP_BASE_URL=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Scripts

```bash
npm install
npm run dev
npm run build
```

## Securite

- Ne pas commiter `.env.local`
- Ne pas remettre de cles ou mots de passe en dur dans `src/`
- Les scripts PowerShell d'import doivent eux aussi lire leurs secrets depuis des variables d'environnement ou un fichier local non versionne

## Hebergement

Le projet est prepare pour Netlify :

- build : `npm run build`
- publish directory : `dist`
- rewrite SPA incluse pour les routes React

Voir aussi [docs/ARCHITECTURE.md](C:\Users\Pharmacie\OneDrive - ARPILABE\Documents\New project\gestion-unifiee\docs\ARCHITECTURE.md), [docs/SECURITY.md](C:\Users\Pharmacie\OneDrive - ARPILABE\Documents\New project\gestion-unifiee\docs\SECURITY.md) et [docs/NETLIFY.md](C:\Users\Pharmacie\OneDrive - ARPILABE\Documents\New project\gestion-unifiee\docs\NETLIFY.md).
