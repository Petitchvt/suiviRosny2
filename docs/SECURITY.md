# Securite et secrets

## Ce qui a ete corrige dans l'application unifiee

- La configuration Supabase n'est plus ecrite en dur dans le code frontend.
- L'application lit maintenant ses valeurs sensibles depuis des variables d'environnement.
- Un fichier `.env.example` documente les variables attendues sans exposer de vraies cles.

## Variables frontend

Le frontend attend :

- `VITE_BASE44_APP_ID`
- `VITE_BASE44_FUNCTIONS_VERSION`
- `VITE_BASE44_APP_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Attention importante

Les anciennes cles et mots de passe vus dans les scripts ou fichiers historiques doivent etre consideres comme exposes.

Il faut idealement :

1. regenerer les cles Base44 et Supabase exposees ;
2. changer le mot de passe PostgreSQL si possible ;
3. sortir toutes les valeurs sensibles des scripts PowerShell.

## Recommandation pour les scripts PowerShell

Au lieu de ceci :

```powershell
$base44Key = "cle-en-dur"
$supabaseKey = "cle-en-dur"
$env:PGPASSWORD = "motdepasse-en-dur"
```

Utiliser ceci :

```powershell
$base44Key = $env:BASE44_API_KEY
$supabaseKey = $env:SUPABASE_ANON_KEY
$env:PGPASSWORD = $env:VINDILIS_PGPASSWORD
```

Ou charger un fichier local non versionne, par exemple `local.secrets.ps1`, avant execution.

## Etape suivante recommandee

Creer une couche commune pour les scripts d'import avec :

- une lecture centralisee des secrets,
- des fonctions communes pour les appels Base44 et Supabase,
- des logs homogenes,
- un orchestrateur unique pour lancer les synchronisations.
