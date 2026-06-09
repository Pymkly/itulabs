/**
 * Server functions du catalogue.
 *
 * Toutes utilisent `getServerSupabase()` (client SSR avec la session de
 * l'utilisateur) : la RLS s'applique automatiquement. Un non-super qui
 * tente une écriture aura une erreur Postgres remontée telle quelle.
 */
import { createServerFn } from '@tanstack/react-start'
import { getServerSupabase } from '../supabase/server'
import type { Database } from '../supabase/database.types'

export type TypeMateriel = Database['public']['Enums']['type_materiel']

export interface Materiel {
  id: string
  nom: string
  categorie: string | null
  type: TypeMateriel
}

export interface Palier {
  id: string
  materiel_id: string
  prix_unitaire: number
}

export interface StockLigne {
  materiel_pu_id: string
  materiel_id: string
  prix_unitaire: number
  quantite_disponible: number
  valeur_disponible: number
}

/** Charge tout le nécessaire pour la page catalogue, en parallèle. */
export const getCatalogue = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{
    materiels: Materiel[]
    paliers: Palier[]
    stock: StockLigne[]
  }> => {
    const supabase = getServerSupabase()
    const [matRes, puRes, stockRes] = await Promise.all([
      supabase
        .from('materiels')
        .select('id, nom, categorie, type')
        .order('nom', { ascending: true }),
      supabase
        .from('materiel_pu')
        .select('id, materiel_id, prix_unitaire')
        .order('prix_unitaire', { ascending: true }),
      supabase
        .from('stock_par_palier')
        .select(
          'materiel_pu_id, materiel_id, prix_unitaire, quantite_disponible, valeur_disponible',
        ),
    ])
    if (matRes.error) throw new Error(matRes.error.message)
    if (puRes.error) throw new Error(puRes.error.message)
    if (stockRes.error) throw new Error(stockRes.error.message)
    return {
      materiels: (matRes.data ?? []) as Materiel[],
      paliers: (puRes.data ?? []) as Palier[],
      stock: (stockRes.data ?? []) as StockLigne[],
    }
  },
)

function normaliseNom(s: unknown): string {
  if (typeof s !== 'string') throw new Error('Nom requis.')
  const v = s.trim()
  if (!v) throw new Error('Nom requis.')
  if (v.length > 200) throw new Error('Nom trop long (200 max).')
  return v
}

function normaliseCategorie(s: unknown): string | null {
  if (s == null) return null
  if (typeof s !== 'string') return null
  const v = s.trim()
  if (!v) return null
  if (v.length > 100) throw new Error('Catégorie trop longue (100 max).')
  return v
}

function normaliseType(s: unknown): TypeMateriel {
  if (s !== 'durable' && s !== 'consommable') {
    throw new Error('Type doit être « durable » ou « consommable ».')
  }
  return s
}

export const createMateriel = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const d = data as Record<string, unknown>
    return {
      nom: normaliseNom(d.nom),
      categorie: normaliseCategorie(d.categorie),
      type: normaliseType(d.type),
    }
  })
  .handler(async ({ data }): Promise<Materiel> => {
    const supabase = getServerSupabase()
    const { data: row, error } = await supabase
      .from('materiels')
      .insert(data)
      .select('id, nom, categorie, type')
      .single()
    if (error) throw new Error(error.message)
    return row as Materiel
  })

export const updateMateriel = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const d = data as Record<string, unknown>
    if (typeof d.id !== 'string' || !d.id) throw new Error('Id requis.')
    return {
      id: d.id,
      nom: normaliseNom(d.nom),
      categorie: normaliseCategorie(d.categorie),
      type: normaliseType(d.type),
    }
  })
  .handler(async ({ data }): Promise<Materiel> => {
    const supabase = getServerSupabase()
    const { id, ...patch } = data
    const { data: row, error } = await supabase
      .from('materiels')
      .update(patch)
      .eq('id', id)
      .select('id, nom, categorie, type')
      .single()
    if (error) throw new Error(error.message)
    return row as Materiel
  })

/**
 * Crée un palier de prix pour un matériel. La contrainte UNIQUE
 * (materiel_id, prix_unitaire) en base garantit l'unicité. Si le palier
 * existe déjà → on le réutilise et on signale `reused: true`.
 */
export const createPalier = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const d = data as Record<string, unknown>
    if (typeof d.materielId !== 'string' || !d.materielId) {
      throw new Error('materielId requis.')
    }
    const raw = d.prixUnitaire
    const n =
      typeof raw === 'number'
        ? raw
        : typeof raw === 'string'
          ? Number(raw.replace(/\s+/g, ''))
          : NaN
    if (!Number.isInteger(n) || n < 0) {
      throw new Error('Prix unitaire entier ≥ 0 requis (en Ariary).')
    }
    return { materielId: d.materielId, prixUnitaire: n }
  })
  .handler(
    async ({
      data,
    }): Promise<{ palier: Palier; reused: boolean }> => {
      const supabase = getServerSupabase()
      const { data: row, error } = await supabase
        .from('materiel_pu')
        .insert({
          materiel_id: data.materielId,
          prix_unitaire: data.prixUnitaire,
        })
        .select('id, materiel_id, prix_unitaire')
        .single()

      if (!error && row) {
        return { palier: row as Palier, reused: false }
      }

      // Postgres unique violation = 23505. Dans ce cas, on relit la ligne
      // existante et on la renvoie avec reused: true (le caller n'a pas
      // à distinguer en pratique — le palier est là dans tous les cas).
      const isUnique =
        (error as { code?: string } | null)?.code === '23505' ||
        (error?.message ?? '').includes('duplicate key')
      if (isUnique) {
        const { data: existing, error: selErr } = await supabase
          .from('materiel_pu')
          .select('id, materiel_id, prix_unitaire')
          .eq('materiel_id', data.materielId)
          .eq('prix_unitaire', data.prixUnitaire)
          .single()
        if (selErr) throw new Error(selErr.message)
        return { palier: existing as Palier, reused: true }
      }

      throw new Error(error?.message ?? 'Création du palier échouée.')
    },
  )
