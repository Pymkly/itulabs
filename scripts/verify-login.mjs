/**
 * Test E2E sans mot de passe :
 *   1. Génère un magic link via service_role
 *   2. Suit la redirection pour extraire access_token + refresh_token
 *   3. Construit un cookie au format `@supabase/ssr` (base64-<...>)
 *   4. fetch http://localhost:3001/ avec ce cookie
 *   5. Vérifie que la coquille "Administrateur" est rendue (pas de redirect /login)
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.argv[2] ?? 'hrivonandrasana@gmail.com'
const appOrigin = process.argv[3] ?? 'http://localhost:3001'
if (!url || !serviceKey) {
  console.error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans l’env')
  process.exit(1)
}

const projectRef = new URL(url).hostname.split('.')[0]
const cookieName = `sb-${projectRef}-auth-token`

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// 1) magic link
const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
  type: 'magiclink',
  email,
  options: { redirectTo: `${appOrigin}/` },
})
if (linkErr) {
  console.error('generateLink:', linkErr.message)
  process.exit(1)
}
const actionLink = link.properties.action_link

// 2) suivre le magic link (sans redirect auto) — on cherche le Location avec le hash
const resp = await fetch(actionLink, { redirect: 'manual' })
const loc = resp.headers.get('location')
if (!loc) {
  console.error('Pas de Location header (status=' + resp.status + ')')
  process.exit(1)
}
const hashIdx = loc.indexOf('#')
if (hashIdx === -1) {
  console.error('Pas de fragment dans la redirection. URL =', loc)
  process.exit(1)
}
const params = new URLSearchParams(loc.slice(hashIdx + 1))
const access_token = params.get('access_token')
const refresh_token = params.get('refresh_token')
const expires_in = Number(params.get('expires_in') ?? '3600')
if (!access_token || !refresh_token) {
  console.error('Tokens manquants. params =', loc.slice(hashIdx + 1))
  process.exit(1)
}

// Décoder le payload du JWT pour reconstituer la session attendue par goTrue.
const [, payloadB64] = access_token.split('.')
const payload = JSON.parse(
  Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
)
const session = {
  access_token,
  refresh_token,
  expires_in,
  expires_at: payload.exp,
  token_type: 'bearer',
  user: {
    id: payload.sub,
    aud: payload.aud,
    role: payload.role,
    email: payload.email ?? email,
    app_metadata: payload.app_metadata ?? {},
    user_metadata: payload.user_metadata ?? {},
  },
}

// 3) encoder au format `base64-<base64url(JSON)>`
function base64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const cookieValue =
  'base64-' + base64url(Buffer.from(JSON.stringify(session), 'utf8'))

// 4) hit la racine avec le cookie
const homeResp = await fetch(`${appOrigin}/`, {
  redirect: 'manual',
  headers: { cookie: `${cookieName}=${cookieValue}` },
})
console.log('GET / →', homeResp.status, homeResp.headers.get('location') ?? '')
const body = await homeResp.text()
const tag = body.includes('Administrateur')
  ? 'OK — coquille super rendue'
  : body.includes('/login') || homeResp.status === 307
    ? 'FAIL — redirige vers /login (session non reconnue)'
    : 'PARTIEL — la page n’est pas /login mais ne contient pas "Administrateur"'
console.log(tag)

// Sauve le body pour debug
const fs = await import('node:fs/promises')
const path = await import('node:path')
const os = await import('node:os')
const dest = path.join(os.tmpdir(), 'verify-home.html')
await fs.writeFile(dest, body, 'utf8')
console.log('body écrit dans', dest)
