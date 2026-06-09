# Guide : initialiser un projet TanStack Start sur Cloudflare Workers

Mémo des pièges rencontrés et de la méthode qui marche. À relire **avant** de scaffolder un nouveau projet TanStack Start déployé sur Cloudflare Workers.

Dernière mise à jour : 2026-06-08 — versions vérifiées : `create-cloudflare@2.70.0`, template `TanStack/router#main`, `vite@8`, `@tanstack/react-start@1.168`, `wrangler@4`.

---

## TL;DR

```bash
# 1. Cloner le template officiel TanStack (PAS create-cloudflare)
npx degit TanStack/router/examples/react/start-basic-cloudflare#main mon-projet
cd mon-projet

# 2. Adapter wrangler.jsonc (nom + compatibility_date du jour)
# 3. Adapter package.json (nom)
# 4. Installer
npm install

# 5. Lancer
npm run dev   # → http://localhost:3000/
```

---

## Pièges connus

### ❌ Ne PAS utiliser `npm create cloudflare@latest`

La doc Cloudflare et la doc TanStack recommandent toutes les deux :

```bash
npm create cloudflare@latest -- mon-app --framework=tanstack-start
```

**Ça ne marche pas dans `create-cloudflare@2.70.0`** : la commande échoue avec `Error: Unsupported framework: tanstack-start`, alors même que `tanstack-start` est listé dans `npm create cloudflare@latest -- --info` comme valeur autorisée pour `--framework`. C'est un bug du C3, à re-tester quand une version postérieure sort.

Variantes testées qui échouent aussi :
- `--framework=tanstack-start --platform=workers --lang=ts --no-deploy --no-git`
- `--category=web-framework --framework=tanstack-start`

`--accept-defaults` est encore pire : il *override* `--framework` et bascule sur le template "Hello World example" Workers (pas du tout TanStack Start).

### ✅ La méthode qui marche : `degit` du template officiel

Le repo `TanStack/router` contient un dossier `examples/react/start-basic-cloudflare` qui est le template officiel TanStack Start pour Cloudflare Workers. On le clone tel quel :

```bash
npx --yes degit TanStack/router/examples/react/start-basic-cloudflare#main mon-projet
```

(`degit` télécharge une copie sans historique git, plus rapide qu'un `git clone`.)

D'autres exemples utiles dans le même repo (à connaître au cas où) : `start-basic`, `start-basic-auth`, `start-basic-authjs`, `start-basic-react-query`, `start-clerk-basic`, `start-convex-trellaux`.

---

## Ce que contient le template `start-basic-cloudflare`

```
.devcontainer/         # config dev container VS Code (optionnel, peut être supprimé)
.vscode/               # settings VS Code (optionnel)
.prettierignore
.gitignore             # node_modules, .env, .wrangler, dist, .cache
public/                # favicon, manifest, etc.
src/
  components/          # DefaultCatchBoundary, NotFound, PostError, UserError
  routes/              # routes de démo : index, posts, users, deferred, ...
  utils/               # middleware logging, fetchers posts/users, seo
  styles/app.css       # Tailwind 4
  router.tsx           # config TanStack Router
  routeTree.gen.ts     # généré automatiquement
package.json           # React 19, TanStack Router/Start 1.170+
tsconfig.json          # alias ~ → ./src
vite.config.ts         # plugins : cloudflare + tanstackStart + viteReact + tailwindcss
worker-configuration.d.ts  # types Worker (régénéré par `wrangler types`)
wrangler.jsonc         # config CF Workers
```

Les routes `posts`, `users`, `deferred`, etc. sont des démos — à supprimer dès que tu commences à coder ton vrai métier.

---

## Adaptations à faire après scaffold

### `wrangler.jsonc`

- Change `name` (apparaît dans le sous-domaine `<name>.<account>.workers.dev`)
- Mets `compatibility_date` au jour J (`date +%F`)
- Ajoute `"observability": { "enabled": true }` si tu veux les logs CF
- Vire le `vars.MY_VAR` de démo si tu n'en as pas besoin

Exemple minimal :

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "mon-projet",
  "compatibility_date": "2026-06-08",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@tanstack/react-start/server-entry",
  "observability": { "enabled": true }
}
```

### `package.json`

- Change `name`
- Le `postinstall: npm run cf-typegen` est utile, garde-le

---

## Variables d'environnement avec Vite

Piège classique côté navigateur : **Vite n'expose au bundle client que les variables préfixées `VITE_`**, via `import.meta.env.VITE_FOO`. Une variable `FOO` sans préfixe n'est *pas* accessible depuis le code qui tourne dans le navigateur.

Convention propre :

```env
# Serveur (server functions, jamais bundlé côté client) — lus via process.env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # SECRET : jamais côté client, jamais commité

# Navigateur (bundle Vite) — lus via import.meta.env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Pour la **prod sur Cloudflare**, ne pas mettre les secrets dans `wrangler.jsonc`. Utiliser :

```bash
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

Le `.env` local n'est PAS lu par Cloudflare Workers en prod ; il est lu par Vite en dev.

---

## Greffer Supabase

```bash
npm install @supabase/supabase-js
npm install --save-dev supabase
npx supabase init       # crée supabase/config.toml + supabase/.gitignore
npx supabase login      # interactif — à faire une fois
npx supabase link --project-ref <project-ref>
```

Migrations dans `supabase/migrations/` au format `YYYYMMDDHHMMSS_nom.sql`. Appliquer avec :

```bash
npx supabase db push
```

Générer les types TypeScript depuis le schéma distant :

```bash
npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

⚠️ **Quirk Windows/bash** : le CLI Supabase écrit `Initialising login role...` sur stderr, qui peut fuiter dans stdout et se retrouver en tête du fichier `.ts` généré. Vérifier la première ligne après chaque génération et la supprimer si nécessaire — sinon TypeScript râle.

---

## Vérifications de fin

```bash
npm run dev
# → http://localhost:3000/ doit afficher "Welcome Home!!!" et "Running in Cloudflare-Workers"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/  # → 200
```

Build de prod (sanity check, sans déployer) :

```bash
npm run build
```

---

## Sources

- Doc officielle Cloudflare (à re-vérifier mais commande C3 cassée à date) : <https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/>
- Doc TanStack — hosting CF : <https://tanstack.com/start/latest/docs/framework/react/guide/hosting>
- Template officiel cloné : <https://github.com/TanStack/router/tree/main/examples/react/start-basic-cloudflare>
- Autres templates `start-*` dans le même repo : <https://github.com/TanStack/router/tree/main/examples/react>
