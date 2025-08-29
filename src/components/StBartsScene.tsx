import { Suspense, useEffect, useRef, useState } from 'react'
import { Html, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

function tryPaths(): string[] {
  const bases = [
    '/models/Scenes/st-bartholomews/',
    '/models/Scenes/St-Bartholomews/',
    '/models/Scenes/st-bartholomew-the-less-interior/',
  ]
  const names = [
    'scene.glb', 'scene.gltf', 'StBarts.glb', 'StBarts.gltf', 'StBartsLess.glb', 'StBartsLess.gltf',
  ]
  const out: string[] = []
  for (const b of bases) for (const n of names) out.push(b + n)
  return out
}

async function probe(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'GET', cache: 'no-store' })
    if (!res.ok) return false
    const ct = (res.headers.get('content-type') || '').toLowerCase()
    if (ct.includes('text/html')) return false
    return true
  } catch { return false }
}

export default function StBartsScene() {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let done = false
    ;(async () => {
      const candidates = tryPaths()
      for (const u of candidates) {
        if (await probe(u)) { if (!done) setUrl(u); return }
      }
      if (!done) setUrl(null)
    })()
    return () => { done = true }
  }, [])

  if (url === null) {
    return (
      <Html center className="loading">Loading St Bartholomew’s…</Html>
    )
  }
  if (!url) {
    // fallback (asset not found) – render nothing and allow parent to show placeholder
    return null
  }
  return (
    <Suspense fallback={<Html center className="loading">Loading St Bartholomew’s…</Html>}>
      <StBartsInner url={url} />
    </Suspense>
  )
}

function StBartsInner({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const root = useRef<THREE.Group>(null)
  // Normalize scale so the scene fits roughly in a 40m span
  useEffect(() => {
    if (!root.current) return
    const box = new THREE.Box3().setFromObject(root.current)
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z, 0.001)
    const target = 40
    const s = target / maxDim
    root.current.scale.setScalar(s)
    // place base on y=0
    const minY = box.min.y
    root.current.position.y = -minY * s
  }, [scene])
  return (
    <group ref={root}>
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload('/models/Scenes/st-bartholomew-the-less-interior/StBartsLess.glb')
