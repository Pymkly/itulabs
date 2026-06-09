/**
 * Seed minimal pour tester /catalogue :
 *   - matériels d'exemple
 *   - paliers de prix
 *   - une équipe + un compte equipe (pour vérifier la RLS lecture seule)
 *
 * Tout via service_role (bypass RLS) — ce script est un outil de dev,
 * pas du code applicatif.
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.')
  process.exit(1)
}
const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const MATERIELS = [
  { nom: 'Arduino Uno R3', categorie: 'Microcontrôleur', type: 'durable' },
  { nom: 'Servo SG90', categorie: 'Actionneur', type: 'durable' },
  { nom: 'Câble jumper 20 cm', categorie: 'Câblage', type: 'consommable' },
]
const PALIERS = {
  'Arduino Uno R3': [12000, 14500],
  'Servo SG90': [4500],
  'Câble jumper 20 cm': [300, 350],
}

console.log('--- Matériels ---')
for (const m of MATERIELS) {
  const { data: existing } = await admin
    .from('materiels')
    .select('id, nom')
    .eq('nom', m.nom)
    .maybeSingle()
  let row = existing
  if (!row) {
    const { data, error } = await admin
      .from('materiels')
      .insert(m)
      .select('id, nom')
      .single()
    if (error) { console.error('insert materiel', m.nom, error.message); continue }
    row = data
    console.log('  créé :', row.nom)
  } else {
    console.log('  déjà là :', row.nom)
  }
  for (const prix of PALIERS[m.nom] ?? []) {
    const { error } = await admin
      .from('materiel_pu')
      .insert({ materiel_id: row.id, prix_unitaire: prix })
    if (error) {
      if (error.code === '23505') {
        console.log(`    palier ${prix} Ar : déjà là`)
      } else {
        console.error(`    palier ${prix} Ar :`, error.message)
      }
    } else {
      console.log(`    palier ${prix} Ar : créé`)
    }
  }
}

console.log('\n--- Équipe + compte equipe ---')
const NOM_EQUIPE = 'ALPHA · 1ère'
const EMAIL_EQUIPE = 'equipe-alpha@test.itc.local'

let equipe
{
  const { data: ex } = await admin.from('equipes').select('id, nom').eq('nom', NOM_EQUIPE).maybeSingle()
  if (ex) {
    equipe = ex
    console.log('  équipe déjà là :', ex.nom, ex.id)
  } else {
    const { data, error } = await admin
      .from('equipes')
      .insert({ nom: NOM_EQUIPE, niveau: 'Première', classe: '1ère', projet: 'Démo' })
      .select('id, nom')
      .single()
    if (error) { console.error('insert equipe', error.message); process.exit(1) }
    equipe = data
    console.log('  équipe créée :', equipe.nom, equipe.id)
  }
}

let userId
{
  // listUsers ne permet pas de filtrer par email — on fait un getUserByEmail via le admin API
  const { data: list, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) { console.error('listUsers', error.message); process.exit(1) }
  const ex = list.users.find((u) => u.email === EMAIL_EQUIPE)
  if (ex) {
    userId = ex.id
    console.log('  user déjà là :', EMAIL_EQUIPE, userId)
  } else {
    const { data: created, error: cerr } = await admin.auth.admin.createUser({
      email: EMAIL_EQUIPE,
      password: 'changeme-test-only',
      email_confirm: true,
    })
    if (cerr) { console.error('createUser', cerr.message); process.exit(1) }
    userId = created.user.id
    console.log('  user créé :', EMAIL_EQUIPE, userId)
  }
}

{
  const { data: ex } = await admin.from('profils').select('id, role, equipe_id').eq('id', userId).maybeSingle()
  if (ex) {
    console.log('  profil déjà là :', ex.role, ex.equipe_id)
    if (ex.role !== 'equipe' || ex.equipe_id !== equipe.id) {
      const { error } = await admin
        .from('profils')
        .update({ role: 'equipe', equipe_id: equipe.id })
        .eq('id', userId)
      if (error) console.error('update profil', error.message)
      else console.log('  profil mis à jour → equipe', equipe.id)
    }
  } else {
    const { error } = await admin
      .from('profils')
      .insert({ id: userId, role: 'equipe', equipe_id: equipe.id })
    if (error) { console.error('insert profil', error.message); process.exit(1) }
    console.log('  profil créé : equipe', equipe.id)
  }
}

console.log('\nDone.')
