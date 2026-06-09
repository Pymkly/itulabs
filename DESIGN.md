# Design system — Système de prêt de matériel IT College

Source de vérité visuelle. **Tous** les écrans métier réutilisent les tokens et composants
définis ici. La page `/styleguide` est le miroir vivant : si un écran diverge d'elle, c'est un bug.

- Tokens : `src/styles/app.css` (`@theme` Tailwind v4)
- Composants : `src/components/ui/`
- Démo : route `/styleguide`

## Couleurs

### Marque (extraite du logo officiel d'IT College)
- **Marine** (primaire) — base `marine-600 #3A3B92`. Vient du fond du logo. Sert au branding, aux boutons primaires, aux liens actifs.
- **Lime** (accent) — base `lime-400 #BEDA58`. Vient du carré intérieur du logo. **Toujours avec texte foncé dessus** (`text-marine-900`) — texte blanc échoue le contraste.

### Sémantiques
- `success` (emerald) — confirmations, retours validés, stock disponible.
- `warning` (amber) — demandes en attente, alertes non bloquantes.
- `danger`  (red)    — actions destructives, refus, validations échouées, emprunts en retard.
- `info`    (sky)    — messages informationnels neutres.

### Neutres
Échelle `neutral-50 → neutral-950`, légèrement bleutée pour s'harmoniser avec le marine (plutôt qu'un gris pur).

### Rôles sémantiques (alias)
À préférer dans les composants pour permettre une évolution future (dark mode, theming) sans toucher chaque écran :

| Alias                       | Valeur actuelle  | Usage                          |
|-----------------------------|------------------|--------------------------------|
| `bg-background`             | `neutral-50`     | fond de l'application          |
| `bg-surface`                | `#FFFFFF`        | cartes, modales, panneaux      |
| `bg-surface-muted`          | `neutral-100`    | zones secondaires              |
| `border-border`             | `neutral-200`    | séparateurs standards          |
| `border-border-strong`      | `neutral-300`    | séparateurs marqués            |
| `text-foreground`           | `marine-900`     | titres, texte principal        |
| `text-foreground-muted`     | `neutral-700`    | corps de texte                 |
| `text-foreground-subtle`    | `neutral-500`    | libellés, méta                 |

### Règles d'usage couleur
- **Un seul ton dominant par écran** : marine. Lime n'est utilisé que par petites touches (badge sélectionné, élément d'accentuation, jamais un grand aplat).
- **Boutons primaires en marine, pas en lime.** Le lime est trop clair pour servir d'action principale sur fond blanc (contraste 1.57, échec AA).
- **Couleurs sémantiques** uniquement pour leur sens : ne pas mettre du `success` en décoration neutre.
- **Tout en accessible AA** : valider sur https://webaim.org/resources/contrastchecker/ si vous combinez couleurs hors composants existants.

## Typographie

- **Police** : [Inter](https://rsms.me/inter/) (variable). Chargée via CDN dans `app.css`. Choix : police de gestion neutre, optimisée pour la lecture dense.
- **Échelle modulaire** (ratio ≈ 1.2) :

| Token       | Taille  | Usage                          |
|-------------|---------|--------------------------------|
| `text-xs`   | 12 px   | méta, captions                 |
| `text-sm`   | 14 px   | UI dense (table, formulaire)   |
| `text-base` | 16 px   | corps                          |
| `text-lg`   | 18 px   | introduction                   |
| `text-xl`   | 20 px   | H4                             |
| `text-2xl`  | 24 px   | H3 / titre de page             |
| `text-3xl`  | 30 px   | H2                             |
| `text-4xl`  | 36 px   | H1                             |
| `text-5xl`  | 48 px   | display                        |

- **Graisses** : 400 (corps), 500 (label, accents), 600 (titres). Pas de 700+ pour rester sobre.
- **Chiffres tabulaires** : obligatoires sur prix (Ariary) et quantités. Utiliser `tabular-nums` ou `.num` / `td.num`. Cf. CLAUDE.md : prix entiers en Ariary.

## Espacement
Échelle Tailwind par défaut (base 4 px). Pas de tokens custom — utiliser `p-2`, `gap-4`, `mt-6`, etc.

## Rayons d'angle

| Token         | Valeur  | Usage             |
|---------------|---------|-------------------|
| `rounded-xs`  | 4 px    | badge, tag        |
| `rounded-sm`  | 6 px    | input, select     |
| `rounded-md`  | 8 px    | bouton            |
| `rounded-lg`  | 12 px   | carte             |
| `rounded-xl`  | 16 px   | modal, large card |

## Ombres / élévation

| Token       | Usage                                    |
|-------------|------------------------------------------|
| `shadow-xs` | dépôt léger sur un fond clair            |
| `shadow-sm` | élévation 1 (bouton primaire, dropdown)  |
| `shadow-md` | carte interactive en survol              |
| `shadow-lg` | popover, panneau flottant                |
| `shadow-xl` | modal                                    |

Tonalité bleutée plutôt que noir pur pour rester en harmonie avec le marine.

## Focus
Un seul style cohérent : anneau marine (`--shadow-ring`) — défini globalement sur `:focus-visible`. Sur les actions danger, anneau rouge automatique. **Ne jamais désactiver l'outline pour la navigation clavier.**

## Composants (`src/components/ui/`)

| Composant             | Variantes / props                                   |
|-----------------------|-----------------------------------------------------|
| `Button`              | `variant` : primary, secondary, ghost, danger · `size` : sm, md, lg |
| `Input`               | `invalid?` — applique l'état d'erreur               |
| `Textarea`            | idem                                                |
| `Select`              | idem, chevron SVG inline                            |
| `Label` / `FieldHint` | toujours avec `htmlFor` ; `tone="error"` pour les erreurs |
| `Card` + sous-blocs   | `CardHeader`, `CardTitle`, `CardDescription`, `CardBody`, `CardFooter` |
| `Table` + sous-blocs  | `THead`, `TBody`, `TR`, `TH`, `TD`                  |
| `Badge`               | `tone` : neutral, marine, lime, success, warning, danger, info |
| `StatutBadge`         | **wrapper métier** : `statut` ∈ `demande` / `valide` / `refuse` |
| `EtatBadge`           | **wrapper métier** : `etat` ∈ `en_cours` / `rendu`  |
| `AppLayout`           | header + nav + footer + main                        |
| `PageHeader`          | titre + description + actions à droite              |

### Règles d'usage composants
- **Toujours passer par `StatutBadge` / `EtatBadge`** pour les statuts métier. Ne jamais composer un Badge à la main avec un libellé tapé en dur — sinon les écrans divergent à la moindre évolution.
- **Un seul bouton primaire par écran.** Les actions secondaires utilisent `variant="secondary"` ou `"ghost"`.
- **Pas de couleur en dur dans les écrans** (`bg-[#3A3B92]`, `text-red-500`). Toujours via les tokens (`bg-marine-600`, `text-danger-600`). Si un écran a besoin d'une couleur qui n'existe pas, étendre `@theme`.
- **Pas de tailles en dur** (`text-[15px]`). Toujours via l'échelle.
- **Pas de nouvelle police** sans validation : Inter couvre tous les besoins.

## Conventions d'écriture
- Français partout (UI, libellés métier, commentaires de composants UI).
- Prix : entier en Ariary, jamais de décimale, séparateur de milliers = espace (`12 000 Ar`).
- Dates : `YYYY-MM-DD` (les locales français peuvent rester pour l'affichage final mais le tri logique reste ISO).

## Évolutions prévues
- **Dark mode** : structuré pour, via les alias de rôles. À ajouter plus tard en redéfinissant `--color-background`, `--color-surface`, etc. dans un sélecteur `:where([data-theme="dark"])`.
- **Logo officiel** : pour l'instant `LogoMark` est une référence libre en SVG. À remplacer par le SVG officiel quand récupéré en source vectorielle.
