/**
 * Capture la coquille super sans avoir le mdp : démarre un mini-proxy qui
 * injecte le cookie de session sur chaque requête vers le dev server,
 * puis lance Chrome headless dessus et capture.
 */
import http from 'node:http'
import { spawn } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'
import { existsSync } from 'node:fs'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.argv[2] ?? 'hrivonandrasana@gmail.com'
const upstream = process.argv[3] ?? 'http://localhost:3001'
const proxyPort = Number(process.argv[4] ?? 3099)
const outFile = process.argv[5] ?? `${process.env.TEMP}\\itcollege\\super-shell-via-proxy.png`

const projectRef = new URL(url).hostname.split('.')[0]
const cookieName = `sb-${projectRef}-auth-token`

// 1) cookie de session
const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
  type: 'magiclink', email, options: { redirectTo: `${upstream}/` },
})
if (linkErr) { console.error(linkErr.message); process.exit(1) }
const verifyResp = await fetch(link.properties.action_link, { redirect: 'manual' })
const loc = verifyResp.headers.get('location') ?? ''
const params = new URLSearchParams(loc.slice(loc.indexOf('#') + 1))
const access_token = params.get('access_token')
const refresh_token = params.get('refresh_token')
const expires_in = Number(params.get('expires_in') ?? '3600')
const [, payloadB64] = access_token.split('.')
const payload = JSON.parse(
  Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
)
const session = {
  access_token, refresh_token, expires_in, expires_at: payload.exp,
  token_type: 'bearer',
  user: {
    id: payload.sub, aud: payload.aud, role: payload.role,
    email: payload.email ?? email, app_metadata: payload.app_metadata ?? {},
    user_metadata: payload.user_metadata ?? {},
  },
}
function b64url(buf) { return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') }
const cookieValue = 'base64-' + b64url(Buffer.from(JSON.stringify(session), 'utf8'))
const COOKIE = `${cookieName}=${cookieValue}`

// 2) proxy minimal
const upstreamUrl = new URL(upstream)
const proxy = http.createServer((req, res) => {
  const headers = { ...req.headers }
  headers.cookie = headers.cookie ? `${headers.cookie}; ${COOKIE}` : COOKIE
  delete headers.host
  const fwd = http.request(
    { hostname: upstreamUrl.hostname, port: upstreamUrl.port, path: req.url, method: req.method, headers },
    (up) => {
      res.writeHead(up.statusCode, up.headers)
      up.pipe(res)
    },
  )
  fwd.on('error', (e) => { res.writeHead(502); res.end('proxy: ' + e.message) })
  req.pipe(fwd)
})
await new Promise((r) => proxy.listen(proxyPort, r))
console.log('proxy ready on', proxyPort)

// 3) Chrome headless → screenshot via le proxy
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
if (!existsSync(chrome)) { console.error('Chrome introuvable'); proxy.close(); process.exit(1) }
const args = [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--window-size=1440,1200', '--virtual-time-budget=8000',
  `--screenshot=${outFile}`, `http://localhost:${proxyPort}/`,
]
await new Promise((resolve) => {
  const p = spawn(chrome, args, { stdio: 'ignore' })
  p.on('exit', resolve)
})

proxy.close()
console.log('screenshot:', outFile)
