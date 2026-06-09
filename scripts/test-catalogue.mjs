import { createClient } from '@supabase/supabase-js'
const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.argv[2] ?? 'hrivonandrasana@gmail.com'
const origin = process.argv[3] ?? 'http://localhost:3000'
const path = process.argv[4] ?? '/catalogue'
const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
const { data: link } = await admin.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo: `${origin}/` } })
const verifyResp = await fetch(link.properties.action_link, { redirect: 'manual' })
const loc = verifyResp.headers.get('location') ?? ''
const params = new URLSearchParams(loc.slice(loc.indexOf('#') + 1))
const at = params.get('access_token'), rt = params.get('refresh_token')
const [, payloadB64] = at.split('.')
const payload = JSON.parse(Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'))
const session = { access_token: at, refresh_token: rt, expires_in: 3600, expires_at: payload.exp, token_type: 'bearer', user: { id: payload.sub, aud: payload.aud, role: payload.role, email, app_metadata: {}, user_metadata: {} } }
const b64u = (b) => b.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
const projectRef = new URL(url).hostname.split('.')[0]
const cookie = `sb-${projectRef}-auth-token=base64-${b64u(Buffer.from(JSON.stringify(session)))}`

const r = await fetch(`${origin}${path}`, { headers: { cookie }, redirect: 'manual' })
console.log(`GET ${path} →`, r.status, r.headers.get('location') ?? '')
const body = await r.text()
console.log('size:', body.length, 'bytes')
console.log('contient "Catalogue" :', body.includes('Catalogue'))
console.log('contient "Nouveau matériel" :', body.includes('Nouveau matériel'))
console.log('error/stack :', /Error:|at \w+ \(|stack/.test(body) ? 'OUI' : 'non')
const m = body.match(/Error[\s\S]{0,400}/)
if (m) console.log('--- match Error ---\n' + m[0].slice(0, 300))