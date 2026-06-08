# Système de prêt de matériel — Hackathon IT College

Application interne de gestion du prêt de matériel électronique du laboratoire de robotique d'IT College, pour le hackathon de juin 2026 (12 équipes : 5 en Première, 7 en Seconde). Objectif : suivre qui emprunte quoi, l'état des retours, et la valeur du stock. Outil pensé pour être réutilisé d'une édition à l'autre, et pour alimenter le stock durable du labo.

## Stack (confirmée)
- **Frontend + serveur** : TanStack Start (React), déployé sur **Cloudflare Workers**.
- **Données / auth** : **Supabase** (PostgreSQL + Auth + Row Level Security).
- Accès données : `supabase-js` côté server functions ; types TypeScript générés depuis le schéma.
- Langue : **tout en français** (UI et termes métier). Prix en **Ariary**, en entiers.
- À vérifier à l'installation : l'adaptateur de déploiement Cloudflare de TanStack Start (l'outillage évolue vite — confirmer la méthode courante).

## Modèle de données
Voir `schema_pret_materiel.sql` (première migration). Patron : un **grand livre** (`mouvements`) alimenté par des **documents sources**.

- `materiels` : catalogue, sans prix. `type` = durable / consommable (enum).
- `materiel_pu` : **palier de prix** = un matériel + un prix unitaire. **Un seul palier par valeur de prix**. C'est l'unité de valorisation : `mouvements`, `achat_details` et `empruntretour_details` pointent tous vers `materiel_pu`.
- `achats` / `achat_details` : entrées de stock par achat.
- `empruntretour` / `empruntretour_details` : emprunts et retours. `etat` (emprunt/retour) + `statut` (demande/valide/refuse).
- `mouvements` : grand livre **append-only**. `type` = entree / sortie. Source tracée par `empruntretour_id` **OU** `achat_id` (un `vente_id` pourra s'ajouter plus tard).
- `equipes`, `responsables`, `profils`. `membres` existe mais est **réservé** (non utilisé en v1).
- Vues : `stock_par_palier` (stock disponible au labo + valeur), `detention_equipe` (ce que chaque équipe détient encore).

## Décisions verrouillées — NE PAS défaire
1. **`mouvements` est append-only** : INSERT uniquement, jamais UPDATE ni DELETE. La RLS l'impose (aucune policy update/delete). 
2. **Le stock se calcule, ne se stocke jamais.** Pas de colonne `quantite_disponible` : c'est la somme des mouvements (vue `stock_par_palier`). Idem pour le total possédé.
3. **Les mouvements sont créés par le code applicatif**, au moment de la validation (`statut = valide`), pas par un trigger DB. Un `emprunt`/`retour` en `demande` ne génère **aucun** mouvement.
4. **Pas de contrainte d'exclusivité en base** entre `empruntretour_id` et `achat_id` (pour ne pas casser à l'ajout d'une vente). La règle « exactement une source » est garantie côté code.
5. **`materiel_pu` = palier de prix, sélection 100 % manuelle.** Pas de FIFO (aucune notion de péremption). Si le prix revient à une valeur existante, réutiliser le palier.
6. **Enums Postgres** pour les types et états.
7. **Un profil par équipe** (pas de comptes par élève en v1 ; table `membres` réservée pour plus tard).

## Rôles & permissions (implémentés en RLS)
- **super** : tout — catalogue, achats, équipes, responsables, validation, vue globale.
- **responsable** : voit catalogue / quantités / stock et **tous** les emprunts ; crée et valide directement les emprunts **et** les retours ; **pas** d'accès aux achats ; ne gère pas les équipes ni les responsables.
- **equipe** : voit catalogue / quantités / stock ; fait des **demandes** d'emprunt et de retour pour sa propre équipe ; ne voit que ses propres emprunts.

Flux : *équipe demande* → *responsable/super valide* → le **code crée les mouvements**. Les retours suivent le même circuit ; le responsable peut aussi les enregistrer directement (création + validation immédiate).

## Écrans à construire
- Authentification + vue adaptée au rôle.
- **Catalogue** : matériels et paliers de prix (gestion : super ; lecture : tous).
- **Achats** : enregistrer une arrivée (super) — sert aussi à amorcer le stock initial.
- **Emprunt** : demande (équipe) ; création + validation directe (responsable/super) ; **choix manuel du palier**.
- **Retour** : même logique que l'emprunt.
- **Tableau de bord** : `stock_par_palier` + `detention_equipe`, et les emprunts en retard.

## Workflow de développement (Supabase)
- Migrations dans `supabase/migrations/`. Le SQL fourni est la première migration.
- Appliquer : `supabase db push` (ou `supabase db reset` en local).
- Générer les types : `supabase gen types typescript` → fichier de types pour le front.
- Les vues sont en `security_invoker = true` : la RLS des tables s'applique à travers elles, donc une équipe ne voit que ses propres lignes dans `detention_equipe`.

## Conventions & garde-fous
- Français partout. PK en UUID. Prix entiers (Ariary). Horodatage en `timestamptz`.
- Tout passe par les rôles. **Ne jamais** contourner la RLS avec la clé service côté client.
- À noter : les prix (`materiel_pu`) sont actuellement visibles par tous. Si l'on veut les masquer aux équipes, exposer une vue « quantités sans prix » et restreindre `materiel_pu` — décision ouverte.
