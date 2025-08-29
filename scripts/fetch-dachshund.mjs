#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import http from 'node:http'

const DEST_DIR = path.join(process.cwd(), 'public', 'models')
const DEST_FILE = path.join(DEST_DIR, 'dachshund.glb')
const LICENSE_FILE = path.join(DEST_DIR, 'LICENSE-dachshund.txt')

// Provide a URL via env or CLI arg. Example (CC0 candidate you provide):
//   DACHSHUND_URL="https://example.com/cc0/dachshund.glb" npm run fetch:dachshund
const url = process.env.DACHSHUND_URL || process.argv[2]
if (!url) {
  console.error('\nUsage: DACHSHUND_URL=<cc0_glb_url> npm run fetch:dachshund\n       or: node scripts/fetch-dachshund.mjs <cc0_glb_url>\n')
  process.exit(1)
}

fs.mkdirSync(DEST_DIR, { recursive: true })

const client = url.startsWith('https:') ? https : http
console.log('Downloading dachshund model from', url)

const req = client.get(url, res => {
  if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
    // follow redirects
    const r = client.get(res.headers.location, r2 => pipe(r2))
    r.on('error', e => { console.error('Redirect error:', e.message); process.exit(1) })
    return
  }
  pipe(res)
})

req.on('error', e => { console.error('Request error:', e.message); process.exit(1) })

function pipe(res) {
  const ct = (res.headers['content-type'] || '').toLowerCase()
  if (ct.includes('text/html')) {
    console.error('Got HTML instead of GLB; check the URL (needs to be a direct .glb)')
    process.exit(1)
  }
  const out = fs.createWriteStream(DEST_FILE)
  res.pipe(out)
  out.on('finish', () => {
    out.close()
    console.log('Saved to', DEST_FILE)
    const license = process.env.DACHSHUND_LICENSE || ''
    if (license) {
      fs.writeFileSync(LICENSE_FILE, license)
      console.log('Saved license to', LICENSE_FILE)
    } else {
      if (!fs.existsSync(LICENSE_FILE)) {
        fs.writeFileSync(LICENSE_FILE, 'Please add license/attribution here for the included dachshund model.\n')
      }
      console.log('Add attribution in', LICENSE_FILE)
    }
  })
}

