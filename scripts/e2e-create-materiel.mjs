/**
 * Test E2E : un super crée un matériel via l'UI (server function avec cookie).
 * Pilote Chrome via CDP. Réussite si "Test E2E" apparait dans la table après submit.
 */
import http from 'node:http'
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.argv[2] ?? 'hrivonandrasana@gmail.com'
const upstream = process.argv[3] ?? 'http://localhost:3000'
const proxyPort = Number(process.argv[4] ?? 3299)
const cdpPort = Number(process.argv[5] ?? 9399)
const TEST_NAME = `Test E2E ${Date.now()}`

const projectRef = new URL(url).hostname.split('.')[0]
const cookieName = `sb-${projectRef}-auth-token`

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const { data: link } = await admin.auth.admin.generateLink({
  type: 'magiclink', email, options: { redirectTo: `${upstream}/` },
})
const verifyResp = await fetch(link.properties.action_link, { redirect: 'manual' })
const loc = verifyResp.headers.get('location') ?? ''
const params = new URLSearchParams(loc.slice(loc.indexOf('#') + 1))
const access_token = params.get('access_token'), refresh_token = params.get('refresh_token')
const [, payloadB64] = access_token.split('.')
const payload = JSON.parse(Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'))
const session = {
  access_token, refresh_token, expires_in: 3600, expires_at: payload.exp,
  token_type: 'bearer',
  user: { id: payload.sub, aud: payload.aud, role: payload.role, email, app_metadata: {}, user_metadata: {} },
}
const b64u = (b) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const cookieValue = 'base64-' + b64u(Buffer.from(JSON.stringify(session)))
const COOKIE = `${cookieName}=${cookieValue}`

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

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
if (!existsSync(chromePath)) { console.error('Chrome introuvable'); process.exit(1) }
const userDataDir = path.join(os.tmpdir(), 'itc-e2e-' + process.pid)
if (existsSync(userDataDir)) rmSync(userDataDir, { recursive: true, force: true })
mkdirSync(userDataDir, { recursive: true })

const chrome = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--user-data-dir=${userDataDir}`, `--remote-debugging-port=${cdpPort}`, '--hide-scrollbars', 'about:blank',
], { stdio: 'ignore' })

let page
for (let i = 0; i < 30; i++) {
  try {
    const list = await fetch(`http://127.0.0.1:${cdpPort}/json/list`).then((r) => r.json())
    page = list.find((t) => t.type === 'page')
    if (page?.webSocketDebuggerUrl) break
  } catch {}
  await new Promise((r) => setTimeout(r, 200))
}
if (!page) { console.error('CDP timeout'); chrome.kill(); proxy.close(); process.exit(1) }

const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((r, rej) => { ws.onopen = r; ws.onerror = rej })
let nextId = 1
const pending = new Map()
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data)
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
}
const send = (method, params = {}) => {
  const id = nextId++
  ws.send(JSON.stringify({ id, method, params }))
  return new Promise((r) => pending.set(id, r))
}
const evalExpr = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.text)
  return r.result?.result?.value
}

await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
const navigated = new Promise((r) => {
  const onMsg = (ev) => { const m = JSON.parse(ev.data); if (m.method === 'Page.loadEventFired') { ws.removeEventListener('message', onMsg); r() } }
  ws.addEventListener('message', onMsg)
})
await send('Page.navigate', { url: `http://localhost:${proxyPort}/catalogue` })
await navigated
await new Promise((r) => setTimeout(r, 1200))

console.log('1. ouvre la modale Nouveau matériel')
await evalExpr(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Nouveau matériel')).click()`)
await new Promise((r) => setTimeout(r, 400))

console.log('2. remplit le nom + soumet')
await evalExpr(`(() => {
  const setNativeValue = (el, value) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const nom = document.querySelector('#mat-nom');
  setNativeValue(nom, ${JSON.stringify(TEST_NAME)});
  return nom.value;
})()`)
await evalExpr(`document.querySelector('form button[type=submit]').click()`)

// attend l'invalidation + re-render
await new Promise((r) => setTimeout(r, 2500))

const present = await evalExpr(`document.body.textContent.includes(${JSON.stringify(TEST_NAME)})`)
const stillModal = await evalExpr(`
  [...document.querySelectorAll('[role=dialog]')]
    .some((el) => {
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none'
    })
`)
const errorTxt = await evalExpr(`document.querySelector('[role=alert]')?.textContent ?? null`)

console.log('3. résultat')
console.log('   matériel visible dans la table :', present)
console.log('   modale encore ouverte :', stillModal)
console.log('   message d’erreur :', errorTxt ?? '—')

// cleanup BDD : suppression du test row pour ne pas polluer
const { error: delErr } = await admin.from('materiels').delete().eq('nom', TEST_NAME)
console.log('   cleanup BDD :', delErr ? `ÉCHEC (${delErr.message})` : 'ok')

ws.close()
chrome.kill()
proxy.close()
try { rmSync(userDataDir, { recursive: true, force: true }) } catch {}

if (!present || stillModal || errorTxt) {
  console.error('\nE2E ÉCHEC')
  process.exit(2)
}
console.log('\nE2E OK')
