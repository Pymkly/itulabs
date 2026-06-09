-- ----------------------------------------------------------------------------
-- enregistrer_achat : enregistre un achat + ses lignes + les mouvements
-- d'entrée correspondants, en une seule transaction.
--
-- SECURITY INVOKER : la RLS s'applique normalement, donc seul un super peut
-- réussir (achats / achat_details sont super-only ; la transaction sera
-- rollbackée pour un non-super).
--
-- p_lignes : tableau JSON. Chaque élément a la forme :
--   { "materiel_id": uuid, "quantite": int,
--     "palier_id": uuid | null,
--     "prix_unitaire": int | null }
--
-- Règle palier :
--   - Si palier_id renseigné → utilisé directement.
--   - Sinon prix_unitaire est requis → on crée le palier (ou on réutilise
--     celui qui existe déjà pour ce couple matériel + prix).
-- ----------------------------------------------------------------------------

create or replace function public.enregistrer_achat(
  p_fournisseur     text,
  p_date_achat      date,
  p_responsable_id  uuid,
  p_notes           text,
  p_lignes          jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_achat_id    uuid;
  v_line        jsonb;
  v_materiel_id uuid;
  v_palier_id   uuid;
  v_prix        integer;
  v_qte         integer;
begin
  if p_lignes is null or jsonb_array_length(p_lignes) = 0 then
    raise exception 'Un achat doit comporter au moins une ligne.';
  end if;

  insert into achats(fournisseur, date_achat, responsable_id, notes)
  values (
    nullif(btrim(coalesce(p_fournisseur, '')), ''),
    coalesce(p_date_achat, current_date),
    p_responsable_id,
    nullif(btrim(coalesce(p_notes, '')), '')
  )
  returning id into v_achat_id;

  for v_line in select jsonb_array_elements(p_lignes)
  loop
    v_materiel_id := (v_line->>'materiel_id')::uuid;
    v_qte := (v_line->>'quantite')::integer;

    if v_materiel_id is null then
      raise exception 'Chaque ligne doit avoir un matériel.';
    end if;
    if v_qte is null or v_qte <= 0 then
      raise exception 'Quantité doit être un entier strictement positif (matériel %).', v_materiel_id;
    end if;

    if v_line ? 'palier_id' and (v_line->>'palier_id') is not null then
      v_palier_id := (v_line->>'palier_id')::uuid;
      -- garde-fou : le palier doit appartenir au matériel
      perform 1 from materiel_pu
        where id = v_palier_id and materiel_id = v_materiel_id;
      if not found then
        raise exception 'Palier % n''appartient pas au matériel %.', v_palier_id, v_materiel_id;
      end if;
    else
      v_prix := (v_line->>'prix_unitaire')::integer;
      if v_prix is null or v_prix < 0 then
        raise exception 'Prix unitaire entier ≥ 0 requis (matériel %).', v_materiel_id;
      end if;
      -- crée le palier s'il n'existe pas, sinon retourne celui qui existe.
      -- ON CONFLICT DO UPDATE permet à RETURNING de renvoyer la ligne
      -- dans tous les cas (le SET est un no-op fonctionnel).
      insert into materiel_pu(materiel_id, prix_unitaire)
      values (v_materiel_id, v_prix)
      on conflict (materiel_id, prix_unitaire)
        do update set prix_unitaire = excluded.prix_unitaire
      returning id into v_palier_id;
    end if;

    insert into achat_details(achat_id, materiel_pu_id, quantite)
    values (v_achat_id, v_palier_id, v_qte);

    insert into mouvements(type, quantite, materiel_pu_id, achat_id, empruntretour_id)
    values ('entree', v_qte, v_palier_id, v_achat_id, null);
  end loop;

  return v_achat_id;
end;
$$;

grant execute on function public.enregistrer_achat(text, date, uuid, text, jsonb)
  to authenticated;
