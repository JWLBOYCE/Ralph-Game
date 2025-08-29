import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { InteractionType } from '../utils/audio'

type Vec3 = [number, number, number]

interface DachshundRiggedProps {
  position: Vec3
  onInteraction: (type: InteractionType) => void
  onPosition?: (p: Vec3) => void
  showInteractionButtons?: boolean
  mobileDirection?: 'up'|'down'|'left'|'right'|'stop'
  action?: InteractionType
  ballPosition?: Vec3
}

// Try to use a local dachshund model if present (served from public/models),
// otherwise fall back to the Fox demo model. Do a GET and verify content-type
// to avoid SPA HTML fallbacks that return 200 with text/html.
async function detectLocal(url: string) {
  try {
    const res = await fetch(url, { method: 'GET', cache: 'no-store' })
    if (!res.ok) return false
    const ct = (res.headers.get('content-type') || '').toLowerCase()
    if (ct.includes('text/html')) return false
    // Accept common binary content types
    if (ct.includes('model/gltf-binary') || ct.includes('application/octet-stream') || ct.includes('model/gltf+json')) {
      return true
    }
    // Some servers don't set a specific type, still allow if not HTML
    return true
  } catch {
    return false
  }
}

function useDogModelUrl() {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    const localUrl = '/models/dachshund.glb'
    detectLocal(localUrl).then((ok) => {
      if (ok) setUrl(localUrl)
      else setUrl('https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb')
    })
  }, [])
  return url
}

function FootstepDust({ position }: { position: THREE.Vector3 }) {
  const ref = useRef<THREE.Mesh>(null)
  const start = useMemo(() => performance.now(), [])
  useFrame(() => {
    const t = (performance.now() - start) / 500
    if (ref.current) {
      ref.current.position.copy(position)
      ref.current.scale.setScalar(1 + t * 1.5)
      const m = ref.current.material as THREE.MeshBasicMaterial
      m.opacity = Math.max(0, 0.4 - t * 0.4)
    }
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.12, 16]} />
      <meshBasicMaterial color="#777" transparent opacity={0.4} />
    </mesh>
  )
}

export function DachshundRigged({ position, onInteraction, onPosition, showInteractionButtons, mobileDirection = 'stop' }: DachshundRiggedProps) {
  const url = useDogModelUrl()
  const ref = useRef<THREE.Group>(null)

  const keys = useRef({ up: false, down: false, left: false, right: false })
  const dustPos = useMemo(() => new THREE.Vector3(), [])
  const [dustTick, setDustTick] = useState(0)
  const lastPos = useRef(new THREE.Vector3())

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === 'arrowup' || k === 'arrowdown' || k === 'arrowleft' || k === 'arrowright' || k === 'w' || k === 'a' || k === 's' || k === 'd' || k === ' ') {
        e.preventDefault()
        e.stopPropagation()
      }
      if (k === 'w' || k === 'arrowup') keys.current.up = true
      if (k === 's' || k === 'arrowdown') keys.current.down = true
      if (k === 'a' || k === 'arrowleft') keys.current.left = true
      if (k === 'd' || k === 'arrowright') keys.current.right = true
      if (k === ' ') onInteraction('bark')
    }
    const onUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === 'arrowup' || k === 'arrowdown' || k === 'arrowleft' || k === 'arrowright' || k === 'w' || k === 'a' || k === 's' || k === 'd' || k === ' ') {
        e.preventDefault()
        e.stopPropagation()
      }
      if (k === 'w' || k === 'arrowup') keys.current.up = false
      if (k === 's' || k === 'arrowdown') keys.current.down = false
      if (k === 'a' || k === 'arrowleft') keys.current.left = false
      if (k === 'd' || k === 'arrowright') keys.current.right = false
      // no-op on key release
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [onInteraction])

  // Report position each frame

  // Spawn dust and footstep tone while moving
  const [isMoving, setIsMoving] = useState(false)
  useFrame((state, delta) => {
    const body = ref.current as THREE.Group | null
    if (!body) return
    // Movement
    const speed = 7.0
    let mx = 0, mz = 0
    if (keys.current.up) mz -= 1
    if (keys.current.down) mz += 1
    if (keys.current.left) mx -= 1
    if (keys.current.right) mx += 1
    if (mobileDirection && mobileDirection !== 'stop') {
      mx += mobileDirection === 'left' ? -1 : mobileDirection === 'right' ? 1 : 0
      mz += mobileDirection === 'up' ? -1 : mobileDirection === 'down' ? 1 : 0
    }
    const moving = mx !== 0 || mz !== 0
    setIsMoving(moving)
    if (moving) {
      const len = Math.hypot(mx, mz) || 1
      const vx = (mx / len) * speed
      const vz = (mz / len) * speed
      // Directly move the group (no physics)
      const p = body.position
      let nx = p.x + vx * delta
      let nz = p.z + vz * delta
      // Keep within a reasonable play area
      const LIMIT = 25
      nx = Math.max(-LIMIT, Math.min(LIMIT, nx))
      nz = Math.max(-LIMIT, Math.min(LIMIT, nz))
      p.set(nx, p.y, nz)
      const desiredYaw = Math.atan2(vx, vz)
      body.rotation.y += (desiredYaw - body.rotation.y) * 0.2
      // Footstep tick
      const t = state.clock.getElapsedTime()
      // Only emit if we actually moved since last frame
      const wp = body.getWorldPosition(new THREE.Vector3())
      const moved = wp.distanceToSquared(lastPos.current) > 0.0005
      if (moved && Math.floor(t * 3) !== dustTick) {
        setDustTick(Math.floor(t * 3))
        dustPos.copy(wp)
        dustPos.y = 0.02
      }
      lastPos.current.copy(wp)
    }
    const rp = body.position
    onPosition?.([rp.x, rp.y, rp.z])
  })

  if (!url) return null
  return (
    <group ref={ref} position={new THREE.Vector3(...position)}>
      <Suspense fallback={<Html center className="loading">Loading Ralph…</Html>}>
        <RiggedDog url={url} playing={isMoving} />
      </Suspense>
      {/* group above is the physics body anchor */}
      {/* Dust puff spawner (renders when tick changes) */}
      {dustTick >= 0 && <FootstepDust position={dustPos} />}

      {/* In-world interaction buttons */}
      {showInteractionButtons && (
        <Html position={[0, 1.2, 0]} center>
          <div className="interaction-buttons photorealistic" role="toolbar" aria-label="Ralph actions">
            <button className="interaction-btn pet-btn" onClick={() => onInteraction('pet')} aria-label="Pet Ralph">🖐️ Pet</button>
            <button className="interaction-btn treat-btn" onClick={() => onInteraction('treat')} aria-label="Give treat">🦴 Treat</button>
            <button className="interaction-btn play-btn" onClick={() => onInteraction('play')} aria-label="Play with Ralph">🎾 Play</button>
            <button className="interaction-btn belly-btn" onClick={() => onInteraction('belly_rub')} aria-label="Give belly rub">🤗 Belly</button>
          </div>
        </Html>
      )}
    </group>
  )
}

function RiggedDog({ url, playing }: { url: string; playing: boolean }) {
  const { scene, animations } = useGLTF(url)
  const group = useRef<THREE.Group>(null)
  const { actions, names } = useAnimations(animations, group)

  useEffect(() => {
    // Try to find suitable animation names
    const idleName = names.find((n) => /idle/i.test(n)) || names[0]
    const walkName = names.find((n) => /walk/i.test(n)) || names.find((n) => /run/i.test(n)) || names[0]
    const idle = actions[idleName]
    const move = actions[walkName]
    idle?.reset().fadeIn(0.2).play()
    move?.reset().fadeIn(0.2).play()
    if (move) move.paused = !playing
    return () => {
      idle?.fadeOut(0.2)
      move?.fadeOut(0.2)
    }
  }, [])

  useEffect(() => {
    // Toggle movement animation
    const move = Object.values(actions).find((a) => a && /walk|run/i.test(a.getClip().name))
    if (move) (move as any).paused = !playing
  }, [playing, actions])

  // Scale/offset for fox fallback vs dachshund
  const scale = url.includes('Fox.glb') ? 0.03 : 1
  const yOffset = url.includes('Fox.glb') ? -0.3 : 0

  return (
    <group ref={group} rotation={[0, 0, 0]} position={[0, yOffset, 0]} scale={scale}>
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload('https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb')
