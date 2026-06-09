// Génère un magic link pour l'email donné, via la clé service_role.
// Sert UNIQUEMENT au test E2E local (vérifier la connexion sans avoir le mdp).
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.argv[2]
const redirectTo = process.argv[3] ?? 'http://localhost:3001/'
if (!url || !serviceKey || !email) {
  console.error('Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node magic-link.mjs <email> [redirectTo]')
  process.exit(1)
}
const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const { data, error } = await admin.auth.admin.generateLink({
  type: 'magiclink',
  email,
  options: { redirectTo },
})
if (error) {
  console.error('ERROR:', error.message)
  process.exit(1)
}
console.log(data.properties.action_link)
