/**
 * Comme verify-screenshot.mjs, mais pilote Chrome via CDP pour forcer
 * un viewport précis (Emulation.setDeviceMetricsOverride). Indispensable
 * car `--window-size` ne suffit pas pour les captures mobile.
 */
import http from 'node:http'
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.argv[2] ?? 'hrivonandrasana@gmail.com'
const upstream = process.argv[3] ?? 'http://localhost:3001'
const proxyPort = Number(process.argv[4] ?? 3199)
const outFile = process.argv[5] ?? path.join(os.tmpdir(), 'itcollege', 'shell-cdp.png')
const width = Number(process.argv[6] ?? 390)
const height = Number(process.argv[7] ?? 1300)
const cdpPort = Number(process.argv[8] ?? 9222)

const projectRef = new URL(url).hostname.split('.')[0]
const cookieName = `sb-${projectRef}-auth-token`

// ---- 1) cookie ----
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
    email: payload.email ?? email, app_metadata: payload.app_metadata ?? {}, user_metadata: payload.user_metadata ?? {},
  },
}
const b64url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const cookieValue = 'base64-' + b64url(Buffer.from(JSON.stringify(session), 'utf8'))
const COOKIE = `${cookieName}=${cookieValue}`

// ---- 2) proxy local qui injecte le cookie ----
const upstreamUrl = new URL(upstream)
const proxy = http.createServer((req, res) => {
  const headers = { ...req.headers }
  headers.cookie = headers.cookie ? `${headers.cookie}; ${COOKIE}` : COOKIE
  delete headers.host
  const fwd = http.request(
    { hostname: upstreamUrl.hostname, port: upstreamUrl.port, path: req.url, method: req.method, headers },
    (up) => { res.writeHead(up.statusCode, up.headers); up.pipe(res) },
  )
  fwd.on('error', (e) => { res.writeHead(502); res.end('proxy: ' + e.message) })
  req.pipe(fwd)
})
await new Promise((r) => proxy.listen(proxyPort, r))

// ---- 3) Chrome avec --remote-debugging-port ----
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
if (!existsSync(chromePath)) { console.error('Chrome introuvable'); process.exit(1) }
const userDataDir = path.join(os.tmpdir(), 'itcollege-cdp-' + process.pid)
if (existsSync(userDataDir)) rmSync(userDataDir, { recursive: true, force: true })
mkdirSync(userDataDir, { recursive: true })

const chrome = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--user-data-dir=${userDataDir}`,
  `--remote-debugging-port=${cdpPort}`,
  '--hide-scrollbars',
  'about:blank',
], { stdio: 'ignore' })

// wait for CDP port to respond
let version
for (let i = 0; i < 50; i++) {
  try { version = await fetch(`http://127.0.0.1:${cdpPort}/json/version`).then(r => r.json()); break } catch { await new Promise(r => setTimeout(r, 100)) }
}
if (!version) { console.error('CDP non disponible'); chrome.kill(); proxy.close(); process.exit(1) }

let page
for (let i = 0; i < 30; i++) {
  const list = await fetch(`http://127.0.0.1:${cdpPort}/json/list`).then(r => r.json())
  page = list.find((t) => t.type === 'page')
  if (page?.webSocketDebuggerUrl) break
  await new Promise((r) => setTimeout(r, 150))
}
if (!page?.webSocketDebuggerUrl) {
  console.error('Pas de page target après attente')
  chrome.kill(); proxy.close(); process.exit(1)
}

// ---- 4) WS CDP ----
const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((r, rej) => { ws.onopen = r; ws.onerror = rej })
let nextId = 1
const pending = new Map()
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data)
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id) }
}
const send = (method, params = {}) => {
  const id = nextId++
  ws.send(JSON.stringify({ id, method, params }))
  return new Promise((r) => pending.set(id, r))
}

// 5) viewport + nav + screenshot
await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', {
  width, height, deviceScaleFactor: 1, mobile: width < 768,
})
const navigated = new Promise((r) => {
  const onMsg = (ev) => {
    const m = JSON.parse(ev.data)
    if (m.method === 'Page.loadEventFired') { ws.removeEventListener('message', onMsg); r() }
  }
  ws.addEventListener('message', onMsg)
})
await send('Page.navigate', { url: `http://localhost:${proxyPort}/` })
await navigated
// petite attente pour fonts + hydration
await new Promise((r) => setTimeout(r, 1500))

// Click sur le hamburger si la var d'env CLICK_BURGER est posée
if (process.env.CLICK_BURGER === '1') {
  await send('Runtime.evaluate', {
    expression: `document.querySelector('[aria-controls="mobile-menu"]')?.click()`,
  })
  await new Promise((r) => setTimeout(r, 400))
}

const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
const data = result.result.data
mkdirSync(path.dirname(outFile), { recursive: true })
await fs.writeFile(outFile, Buffer.from(data, 'base64'))

ws.close()
chrome.kill()
proxy.close()
try { rmSync(userDataDir, { recursive: true, force: true }) } catch {}
console.log('screenshot:', outFile, `viewport ${width}x${height}`)
