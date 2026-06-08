-- =============================================================
-- Systeme de pret de materiel — Hackathon IT College
-- Schema Supabase (PostgreSQL) : tables, RLS, vues
--
-- Patron : grand livre "mouvements" (append-only) alimente par des
-- documents sources (achats, emprunts/retours). Stock calcule, jamais
-- stocke. Valorisation par palier de prix (selection manuelle).
-- Les mouvements sont crees par le CODE applicatif au moment de la
-- validation (statut = valide), pas par un trigger.
-- =============================================================

-- ---------- Types enumeres ----------
create type type_materiel        as enum ('durable', 'consommable');
create type type_mouvement       as enum ('entree', 'sortie');
create type etat_empruntretour   as enum ('emprunt', 'retour');
create type statut_empruntretour as enum ('demande', 'valide', 'refuse');
create type role_profil          as enum ('super', 'responsable', 'equipe');

-- ---------- Catalogue ----------

create table materiels (
  id         uuid primary key default gen_random_uuid(),
  nom        text not null,
  categorie  text,
  type       type_materiel not null,        -- durable / consommable
  created_at timestamptz not null default now()
);

-- Palier de prix : une ligne par valeur de prix distincte d'un materiel.
create table materiel_pu (
  id            uuid primary key default gen_random_uuid(),
  materiel_id   uuid not null references materiels(id) on delete restrict,
  prix_unitaire integer not null check (prix_unitaire >= 0),  -- en Ariary
  created_at    timestamptz not null default now(),
  unique (materiel_id, prix_unitaire)        -- un seul palier par prix
);

-- ---------- Acteurs ----------

create table equipes (
  id         uuid primary key default gen_random_uuid(),
  nom        text not null,
  niveau     text,
  classe     text,
  projet     text,
  created_at timestamptz not null default now()
);

create table responsables (
  id         uuid primary key default gen_random_uuid(),
  nom        text not null,
  role       text,
  actif      boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- Comptes / roles ----------
-- Un profil par compte d'authentification Supabase.
-- role = equipe       -> equipe_id renseigne (un compte par equipe)
-- role = responsable  -> responsable_id renseigne
-- role = super        -> responsable_id renseigne (pour estampiller ses actes)
create table profils (
  id             uuid primary key references auth.users(id) on delete cascade,
  role           role_profil not null,
  equipe_id      uuid references equipes(id) on delete set null,
  responsable_id uuid references responsables(id) on delete set null,
  created_at     timestamptz not null default now()
);

-- ---------- Document source : achats ----------

create table achats (
  id             uuid primary key default gen_random_uuid(),
  responsable_id uuid references responsables(id) on delete set null,
  fournisseur    text,
  date_achat     date not null default current_date,
  notes          text,
  created_at     timestamptz not null default now()
);

create table achat_details (
  id             uuid primary key default gen_random_uuid(),
  achat_id       uuid not null references achats(id) on delete cascade,
  materiel_pu_id uuid not null references materiel_pu(id) on delete restrict,
  quantite       integer not null check (quantite > 0)
);

-- ---------- Document source : emprunts / retours ----------
-- etat   : emprunt / retour (direction)
-- statut : demande -> valide / refuse (circuit de validation)
-- Les mouvements ne sont generes (par le code) que lorsque statut = valide.
create table empruntretour (
  id                 uuid primary key default gen_random_uuid(),
  equipe_id          uuid not null references equipes(id) on delete restrict,
  responsable_id     uuid references responsables(id) on delete set null,
  etat               etat_empruntretour not null,
  statut             statut_empruntretour not null default 'demande',
  date_op            date not null default current_date,
  date_retour_prevue date,
  notes              text,
  created_at         timestamptz not null default now()
);

create table empruntretour_details (
  id               uuid primary key default gen_random_uuid(),
  empruntretour_id uuid not null references empruntretour(id) on delete cascade,
  materiel_pu_id   uuid not null references materiel_pu(id) on delete restrict,
  quantite         integer not null check (quantite > 0)
);

-- ---------- Grand livre : mouvements (append-only) ----------
-- Source tracee par empruntretour_id OU achat_id (un futur vente_id pourra
-- s'ajouter). Pas de contrainte d'exclusivite : garantie cote code.
create table mouvements (
  id               uuid primary key default gen_random_uuid(),
  materiel_pu_id   uuid not null references materiel_pu(id) on delete restrict,
  type             type_mouvement not null,
  quantite         integer not null check (quantite > 0),
  empruntretour_id uuid references empruntretour(id) on delete set null,
  achat_id         uuid references achats(id) on delete set null,
  date_mouvement   timestamptz not null default now()
);

-- ---------- (Plus tard / optionnel) membres ----------
create table membres (
  id        uuid primary key default gen_random_uuid(),
  equipe_id uuid not null references equipes(id) on delete cascade,
  nom       text not null,
  numero    text
);

-- ---------- Fonctions utilitaires pour la RLS ----------
-- security definer : lisent profils sans declencher la RLS (evite la recursion).
create or replace function profil_role()
returns role_profil
language sql stable security definer set search_path = public
as $$ select role from profils where id = auth.uid() $$;

create or replace function profil_equipe()
returns uuid
language sql stable security definer set search_path = public
as $$ select equipe_id from profils where id = auth.uid() $$;

-- ---------- Activation de la RLS ----------
alter table materiels             enable row level security;
alter table materiel_pu           enable row level security;
alter table equipes               enable row level security;
alter table responsables          enable row level security;
alter table profils               enable row level security;
alter table achats                enable row level security;
alter table achat_details         enable row level security;
alter table empruntretour         enable row level security;
alter table empruntretour_details enable row level security;
alter table mouvements            enable row level security;
alter table membres               enable row level security;

-- ---------- Policies ----------

-- profils : chacun lit le sien ; super gere tout.
create policy profils_self_select on profils for select
  using (id = auth.uid());
create policy profils_super_all on profils for all
  using (profil_role() = 'super') with check (profil_role() = 'super');

-- materiels : lecture pour tous les connectes ; ecriture super.
create policy materiels_read on materiels for select
  using (profil_role() is not null);
create policy materiels_super_write on materiels for all
  using (profil_role() = 'super') with check (profil_role() = 'super');

-- materiel_pu : idem (les prix sont visibles par tous ; voir note dans CLAUDE.md).
create policy materiel_pu_read on materiel_pu for select
  using (profil_role() is not null);
create policy materiel_pu_super_write on materiel_pu for all
  using (profil_role() = 'super') with check (profil_role() = 'super');

-- equipes : super/responsable voient tout ; une equipe voit la sienne ; ecriture super.
create policy equipes_read on equipes for select
  using (profil_role() in ('super','responsable') or id = profil_equipe());
create policy equipes_super_write on equipes for all
  using (profil_role() = 'super') with check (profil_role() = 'super');

-- responsables : visibles par super/responsable ; ecriture super.
create policy responsables_read on responsables for select
  using (profil_role() in ('super','responsable'));
create policy responsables_super_write on responsables for all
  using (profil_role() = 'super') with check (profil_role() = 'super');

-- achats / achat_details : super uniquement (responsable n'y a pas acces).
create policy achats_super on achats for all
  using (profil_role() = 'super') with check (profil_role() = 'super');
create policy achat_details_super on achat_details for all
  using (profil_role() = 'super') with check (profil_role() = 'super');

-- empruntretour
create policy er_read on empruntretour for select
  using (profil_role() in ('super','responsable') or equipe_id = profil_equipe());
create policy er_equipe_demande on empruntretour for insert
  with check (profil_role() = 'equipe' and equipe_id = profil_equipe() and statut = 'demande');
create policy er_staff_insert on empruntretour for insert
  with check (profil_role() in ('super','responsable'));
create policy er_staff_update on empruntretour for update
  using (profil_role() in ('super','responsable'))
  with check (profil_role() in ('super','responsable'));
create policy er_super_delete on empruntretour for delete
  using (profil_role() = 'super');

-- empruntretour_details : suivent le document parent.
create policy erd_read on empruntretour_details for select
  using (exists (
    select 1 from empruntretour er
    where er.id = empruntretour_id
      and (profil_role() in ('super','responsable') or er.equipe_id = profil_equipe())
  ));
create policy erd_equipe_own on empruntretour_details for all
  using (exists (
    select 1 from empruntretour er
    where er.id = empruntretour_id
      and profil_role() = 'equipe' and er.equipe_id = profil_equipe()
      and er.statut = 'demande'
  ))
  with check (exists (
    select 1 from empruntretour er
    where er.id = empruntretour_id
      and profil_role() = 'equipe' and er.equipe_id = profil_equipe()
      and er.statut = 'demande'
  ));
create policy erd_staff_write on empruntretour_details for all
  using (profil_role() in ('super','responsable'))
  with check (profil_role() in ('super','responsable'));

-- mouvements : lecture pour tous (stock). INSERT par super/responsable.
-- Aucune policy UPDATE/DELETE -> grand livre IMMUABLE (append-only).
create policy mouvements_read on mouvements for select
  using (profil_role() is not null);
create policy mouvements_insert on mouvements for insert
  with check (profil_role() in ('super','responsable'));

-- membres : gestion super ; lecture super/responsable (reserve, usage futur).
create policy membres_read on membres for select
  using (profil_role() in ('super','responsable'));
create policy membres_super_write on membres for all
  using (profil_role() = 'super') with check (profil_role() = 'super');

-- ---------- Index (les FK ne sont pas indexees par defaut) ----------
create index idx_materiel_pu_materiel on materiel_pu(materiel_id);
create index idx_achat_details_achat  on achat_details(achat_id);
create index idx_achat_details_pu     on achat_details(materiel_pu_id);
create index idx_er_equipe            on empruntretour(equipe_id);
create index idx_er_statut            on empruntretour(statut);
create index idx_er_details_er        on empruntretour_details(empruntretour_id);
create index idx_er_details_pu        on empruntretour_details(materiel_pu_id);
create index idx_mouvements_pu        on mouvements(materiel_pu_id);
create index idx_mouvements_er        on mouvements(empruntretour_id);
create index idx_mouvements_achat     on mouvements(achat_id);
create index idx_profils_equipe       on profils(equipe_id);

-- ---------- Vues (security_invoker : la RLS des tables s'applique) ----------

-- Stock disponible au labo, par palier : entree - sortie.
create view stock_par_palier with (security_invoker = true) as
select
  pu.id          as materiel_pu_id,
  pu.materiel_id,
  m.nom          as materiel,
  m.type         as type_materiel,
  pu.prix_unitaire,
  coalesce(sum(
    case mv.type when 'entree' then mv.quantite
                 when 'sortie' then -mv.quantite end), 0)                    as quantite_disponible,
  coalesce(sum(
    case mv.type when 'entree' then mv.quantite
                 when 'sortie' then -mv.quantite end), 0) * pu.prix_unitaire as valeur_disponible
from materiel_pu pu
join materiels m on m.id = pu.materiel_id
left join mouvements mv on mv.materiel_pu_id = pu.id
group by pu.id, pu.materiel_id, m.nom, m.type, pu.prix_unitaire;

-- Ce que chaque equipe detient encore : emprunts - retours (statut valide).
create view detention_equipe with (security_invoker = true) as
select
  er.equipe_id,
  e.nom          as equipe,
  erd.materiel_pu_id,
  m.nom          as materiel,
  pu.prix_unitaire,
  sum(
    case er.etat when 'emprunt' then erd.quantite
                 when 'retour'  then -erd.quantite end)                    as quantite_detenue,
  sum(
    case er.etat when 'emprunt' then erd.quantite
                 when 'retour'  then -erd.quantite end) * pu.prix_unitaire as valeur_detenue
from empruntretour er
join empruntretour_details erd on erd.empruntretour_id = er.id
join materiel_pu pu on pu.id = erd.materiel_pu_id
join materiels m on m.id = pu.materiel_id
join equipes e on e.id = er.equipe_id
where er.statut = 'valide'
group by er.equipe_id, e.nom, erd.materiel_pu_id, m.nom, pu.prix_unitaire
having sum(
    case er.etat when 'emprunt' then erd.quantite
                 when 'retour'  then -erd.quantite end) <> 0;

-- ---------- Privileges (modele Supabase : GRANT large + RLS qui filtre) ----------
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on stock_par_palier, detention_equipe to authenticated;
grant execute on function profil_role(), profil_equipe() to authenticated;
