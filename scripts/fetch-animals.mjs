#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'

const MAP = {
  cow: process.env.COW_URL,
  pig: process.env.PIG_URL,
  manatee: process.env.MANATEE_URL,
  platypus: process.env.PLATYPUS_URL,
}

const DEST = path.join(process.cwd(), 'public', 'models', 'animals')
fs.mkdirSync(DEST, { recursive: true })

function fetchTo(url, out) {
  return new Promise((resolve, reject) => {
    if (!url) return resolve(false)
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchTo(res.headers.location, out).then(resolve, reject)
      }
      const ct = (res.headers['content-type'] || '').toLowerCase()
      if (ct.includes('text/html')) return reject(new Error('HTML page, not GLB: '+url))
      const s = fs.createWriteStream(out)
      res.pipe(s)
      s.on('finish', () => { s.close(); resolve(true) })
      s.on('error', reject)
    }).on('error', reject)
  })
}

const tasks = Object.entries(MAP).map(async ([name, url]) => {
  const out = path.join(DEST, name + '.glb')
  if (!url) { console.log(`Skip ${name}: no URL (set ${name.toUpperCase()}_URL)`); return }
  console.log('Downloading', name, 'from', url)
  try {
    await fetchTo(url, out)
    console.log('Saved', out)
  } catch (e) {
    console.error('Failed', name, e.message)
  }
})

Promise.all(tasks).then(() => console.log('Done'))

