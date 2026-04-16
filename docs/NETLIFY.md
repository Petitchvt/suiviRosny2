# Deploiement Netlify

## Configuration deja preparee

Le projet contient maintenant :

- `netlify.toml`
- `public/_redirects`

Cela permet a Netlify de :

- lancer `npm run build`
- publier le dossier `dist`
- gerer correctement les routes React (`/challenge`, `/laboratoires`, `/tg`, `/vigilance`) avec une rewrite vers `index.html`

## Variables d'environnement a definir dans Netlify

Dans `Site configuration > Environment variables`, ajouter :

- `VITE_BASE44_APP_ID`
- `VITE_BASE44_FUNCTIONS_VERSION`
- `VITE_BASE44_APP_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Mise en ligne

### Option simple via interface Netlify

1. Creer un depot Git pour `gestion-unifiee`
2. Connecter ce depot a Netlify
3. Verifier les valeurs detectees :
   - Build command : `npm run build`
   - Publish directory : `dist`
4. Ajouter les variables d'environnement
5. Lancer le premier deploy

### Option via Netlify CLI

```bash
npm install -g netlify-cli
netlify init
netlify deploy --build
netlify deploy --prod
```

## Sources officielles

- [Vite on Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/)
- [Redirects and rewrites](https://docs.netlify.com/routing/redirects/)
