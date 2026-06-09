/**
 * Server functions des achats.
 *
 * Tout passe par getServerSupabase() (clé anon + cookies session).
 * La RLS limite l'accès aux super (policies achats_super / achat_details_super).
 * L'enregistrement passe par la RPC enregistrer_achat (transaction atomique).
 */
import { createServerFn } from '@tanstack/react-start'
import { getServerSupabase } from '../supabase/server'

export interface AchatRow {
  id: string
  date_achat: string
  fournisseur: string | null
  notes: string | null
  responsable_id: string | null
  responsable_nom: string | null
  nb_lignes: number
  valeur_totale: number
}

export interface Responsable {
  id: string
  nom: string
  role: string | null
  actif: boolean
}

export interface LigneAchatPayload {
  materiel_id: string
  quantite: number
  /** Soit palier_id existant, soit prix_unitaire pour créer/réutiliser le palier. */
  palier_id?: string | null
  prix_unitaire?: number | null
}

export interface EnregistrerAchatPayload {
  fournisseur: string | null
  date_achat: string
  responsable_id: string | null
  notes: string | null
  lignes: LigneAchatPayload[]
}

/** Liste des achats avec leurs agrégats (nb lignes, valeur totale). */
export const getAchats = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AchatRow[]> => {
    const supabase = getServerSupabase()
    // On charge :
    //  - achats (date, fournisseur, notes, responsable_id)
    //  - responsables (id, nom) pour le label
    //  - achat_details + materiel_pu pour agréger nb_lignes + valeur_totale
    const [achatsRes, respRes, detailsRes] = await Promise.all([
      supabase
        .from('achats')
        .select('id, date_achat, fournisseur, notes, responsable_id')
        .order('date_achat', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('responsables').select('id, nom'),
      supabase
        .from('achat_details')
        .select('achat_id, quantite, materiel_pu(prix_unitaire)'),
    ])
    if (achatsRes.error) throw new Error(achatsRes.error.message)
    if (respRes.error) throw new Error(respRes.error.message)
    if (detailsRes.error) throw new Error(detailsRes.error.message)

    const respById = new Map(
      (respRes.data ?? []).map((r) => [r.id, r.nom as string]),
    )

    const agg = new Map<string, { nb: number; valeur: number }>()
    for (const d of detailsRes.data ?? []) {
      const cur = agg.get(d.achat_id) ?? { nb: 0, valeur: 0 }
      cur.nb += 1
      const pu = (d.materiel_pu as { prix_unitaire: number } | null)?.prix_unitaire ?? 0
      cur.valeur += pu * (d.quantite ?? 0)
      agg.set(d.achat_id, cur)
    }

    return (achatsRes.data ?? []).map((a) => {
      const { nb = 0, valeur = 0 } = agg.get(a.id) ?? {}
      return {
        id: a.id,
        date_achat: a.date_achat,
        fournisseur: a.fournisseur,
        notes: a.notes,
        responsable_id: a.responsable_id,
        responsable_nom: a.responsable_id ? respById.get(a.responsable_id) ?? null : null,
        nb_lignes: nb,
        valeur_totale: valeur,
      }
    })
  },
)

/** Liste des responsables actifs (pour le select du formulaire). */
export const getResponsables = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Responsable[]> => {
    const supabase = getServerSupabase()
    const { data, error } = await supabase
      .from('responsables')
      .select('id, nom, role, actif')
      .eq('actif', true)
      .order('nom', { ascending: true })
    if (error) throw new Error(error.message)
    return (data ?? []) as Responsable[]
  },
)

/** Crée un responsable. Super uniquement (RLS). */
export const createResponsable = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const d = data as Record<string, unknown>
    const nom = typeof d.nom === 'string' ? d.nom.trim() : ''
    if (!nom) throw new Error('Nom requis.')
    if (nom.length > 200) throw new Error('Nom trop long (200 max).')
    const role = typeof d.role === 'string' ? d.role.trim() : ''
    return { nom, role: role || null }
  })
  .handler(async ({ data }): Promise<Responsable> => {
    const supabase = getServerSupabase()
    const { data: row, error } = await supabase
      .from('responsables')
      .insert({ nom: data.nom, role: data.role })
      .select('id, nom, role, actif')
      .single()
    if (error) throw new Error(error.message)
    return row as Responsable
  })

/** Enregistre un achat complet via la RPC (atomique). Retourne l'id de l'achat. */
export const enregistrerAchat = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const d = data as Record<string, unknown>
    const fournisseur =
      typeof d.fournisseur === 'string' ? d.fournisseur.trim() : ''
    const date_achat =
      typeof d.date_achat === 'string' && d.date_achat
        ? d.date_achat
        : new Date().toISOString().slice(0, 10)
    const responsable_id =
      typeof d.responsable_id === 'string' && d.responsable_id
        ? d.responsable_id
        : null
    const notes = typeof d.notes === 'string' ? d.notes.trim() : ''
    if (!Array.isArray(d.lignes) || d.lignes.length === 0) {
      throw new Error('Au moins une ligne est requise.')
    }
    const lignes: LigneAchatPayload[] = d.lignes.map((raw, idx) => {
      const l = raw as Record<string, unknown>
      const materiel_id = typeof l.materiel_id === 'string' ? l.materiel_id : ''
      if (!materiel_id) throw new Error(`Ligne ${idx + 1} : matériel requis.`)
      const qteRaw = l.quantite
      const qte =
        typeof qteRaw === 'number'
          ? qteRaw
          : typeof qteRaw === 'string'
            ? Number(qteRaw)
            : NaN
      if (!Number.isInteger(qte) || qte <= 0) {
        throw new Error(`Ligne ${idx + 1} : quantité entière > 0 requise.`)
      }
      const palier_id =
        typeof l.palier_id === 'string' && l.palier_id ? l.palier_id : null
      let prix_unitaire: number | null = null
      if (!palier_id) {
        const pRaw = l.prix_unitaire
        const p =
          typeof pRaw === 'number'
            ? pRaw
            : typeof pRaw === 'string'
              ? Number(String(pRaw).replace(/\s+/g, ''))
              : NaN
        if (!Number.isInteger(p) || p < 0) {
          throw new Error(`Ligne ${idx + 1} : prix unitaire entier ≥ 0 requis.`)
        }
        prix_unitaire = p
      }
      return { materiel_id, quantite: qte, palier_id, prix_unitaire }
    })
    return {
      fournisseur: fournisseur || null,
      date_achat,
      responsable_id,
      notes: notes || null,
      lignes,
    }
  })
  .handler(async ({ data }): Promise<{ achatId: string }> => {
    const supabase = getServerSupabase()
    const { data: id, error } = await supabase.rpc('enregistrer_achat', {
      p_fournisseur: data.fournisseur ?? '',
      p_date_achat: data.date_achat,
      p_responsable_id: data.responsable_id as string, // peut être null en SQL
      p_notes: data.notes ?? '',
      p_lignes: data.lignes as unknown as never,
    })
    if (error) throw new Error(error.message)
    if (!id) throw new Error('Aucun id retourné par la RPC.')
    return { achatId: id as string }
  })
