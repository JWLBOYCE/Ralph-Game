import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { InteractionType, startAmbient } from '../utils/audio'

type Vec3 = [number, number, number]

type Trick = 'sit' | 'lie' | 'roll'

interface DachshundRiggedProps {
  position: Vec3
  onInteraction: (type: InteractionType) => void
  onPosition?: (p: Vec3) => void
  showInteractionButtons?: boolean
  mobileDirection?: 'up'|'down'|'left'|'right'|'stop'
  action?: InteractionType
  ballPosition?: Vec3
  onTrick?: (t: Trick, p: Vec3) => void
  moveTarget?: Vec3
  onEyeRoll?: (p: Vec3) => void
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

export function DachshundRigged({ position, onInteraction, onPosition, showInteractionButtons, mobileDirection = 'stop', onTrick, moveTarget, onEyeRoll }: DachshundRiggedProps) {
  const url = useDogModelUrl()
  const ref = useRef<THREE.Group>(null)

  const keys = useRef({ up: false, down: false, left: false, right: false })
  const dustPos = useMemo(() => new THREE.Vector3(), [])
  const [dustTick, setDustTick] = useState(0)
  const lastPos = useRef(new THREE.Vector3())
  const trickRef = useRef<Trick | null>(null)
  const trickUntil = useRef<number>(0)
  const moveTargetRef = useRef<Vec3 | null>(null)
  useEffect(() => { moveTargetRef.current = moveTarget ?? null }, [moveTarget])
  // Eye roll timing
  const eyeRollUntil = useRef<number>(0)
  const leftPupil = useRef<THREE.Mesh>(null)
  const rightPupil = useRef<THREE.Mesh>(null)
  const eyesGroup = useRef<THREE.Group>(null)

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      startAmbient()
      if (k === 'arrowup' || k === 'arrowdown' || k === 'arrowleft' || k === 'arrowright' || k === 'w' || k === 'a' || k === 's' || k === 'd' || k === ' ') {
        e.preventDefault()
        e.stopPropagation()
      }
      if (k === 'arrowup') keys.current.up = true
      if (k === 'arrowdown') keys.current.down = true
      if (k === 'arrowleft') keys.current.left = true
      if (k === 'arrowright') keys.current.right = true
      if (k === ' ') onInteraction('bark')
      if (k === 's') { trickRef.current = 'sit'; trickUntil.current = performance.now() + 1200; onTrick?.('sit', [ref.current?.position.x||0, ref.current?.position.y||0, ref.current?.position.z||0]) }
      if (k === 'l') { trickRef.current = 'lie'; trickUntil.current = performance.now() + 1500; onTrick?.('lie', [ref.current?.position.x||0, ref.current?.position.y||0, ref.current?.position.z||0]) }
      if (k === 'r') { trickRef.current = 'roll'; trickUntil.current = performance.now() + 1600; onTrick?.('roll', [ref.current?.position.x||0, ref.current?.position.y||0, ref.current?.position.z||0]) }
      if (k === 'e') {
        eyeRollUntil.current = performance.now() + 1200
        onEyeRoll?.([ref.current?.position.x||0, ref.current?.position.y||0, ref.current?.position.z||0])
      }
    }
    const onUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === 'arrowup' || k === 'arrowdown' || k === 'arrowleft' || k === 'arrowright' || k === 'w' || k === 'a' || k === 's' || k === 'd' || k === ' ') {
        e.preventDefault()
        e.stopPropagation()
      }
      if (k === 'arrowup') keys.current.up = false
      if (k === 'arrowdown') keys.current.down = false
      if (k === 'arrowleft') keys.current.left = false
      if (k === 'arrowright') keys.current.right = false
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
    // Apply trick posing first
    const now = performance.now()
    if (trickRef.current && now > trickUntil.current) trickRef.current = null

    const bodyRot = body.rotation
    const bodyPos = body.position
    const damp = 0.2
    if (trickRef.current === 'sit') {
      // slight crouch and tilt back
      bodyRot.x += ((0.5) - bodyRot.x) * damp
      bodyPos.y += ((0.2) - bodyPos.y) * damp
    } else if (trickRef.current === 'lie') {
      bodyRot.x += ((-Math.PI/2) - bodyRot.x) * damp
      bodyPos.y += ((0.1) - bodyPos.y) * damp
    } else if (trickRef.current === 'roll') {
      bodyRot.z += 4 * delta
      bodyPos.y += ((0.15) - bodyPos.y) * damp
    } else {
      // return to neutral pose
      bodyRot.x += (0 - bodyRot.x) * damp
      bodyRot.z += (0 - bodyRot.z) * damp
      bodyPos.y += ((position[1]) - bodyPos.y) * damp
    }

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
    // Click-to-move target overrides when present
    if (!trickRef.current && moveTargetRef.current) {
      const tgt = moveTargetRef.current
      const dx = tgt[0] - body.position.x
      const dz = tgt[2] - body.position.z
      const dist = Math.hypot(dx, dz)
      if (dist > 0.1) {
        mx += dx / dist
        mz += dz / dist
      } else {
        moveTargetRef.current = null
      }
    }
    const moving = mx !== 0 || mz !== 0
    setIsMoving(moving)
    if (moving && !trickRef.current) {
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

    // Eye roll animation: rotate pupils around small circles while active
    const active = performance.now() < eyeRollUntil.current
    if (eyesGroup.current) eyesGroup.current.visible = active
    if (active) {
      const t = 1 - Math.max(0, (eyeRollUntil.current - performance.now()) / 1200)
      const angle = t * Math.PI * 4 // two full circles
      const r = 0.06
      const ly = leftPupil.current as THREE.Mesh | null
      const ry = rightPupil.current as THREE.Mesh | null
      if (ly) { ly.position.x = -0.12 + Math.cos(angle) * r; ly.position.y = 0.55 + Math.sin(angle) * r }
      if (ry) { ry.position.x = +0.12 + Math.cos(angle) * r; ry.position.y = 0.55 + Math.sin(angle) * r }
    }
  })

  if (!url) return null
  const isFox = (url || '').includes('Fox.glb')
  const modelScale = isFox ? 0.03 : 1
  const modelYOffset = isFox ? -0.3 : 0
  return (
    <group ref={ref} position={new THREE.Vector3(...position)}>
      <Suspense fallback={<Html center className="loading">Loading Ralph…</Html>}>
        <RiggedDog url={url} playing={isMoving} />
      </Suspense>
      {/* group above is the physics body anchor */}
      {/* Dust puff spawner (renders when tick changes) */}
      {dustTick >= 0 && <FootstepDust position={dustPos} />}

      {/* Simple eyes overlay used only during eye-roll */}
      <group ref={eyesGroup} visible={false} position={[0, modelYOffset, 0]} scale={modelScale}>
        {/* Whites */}
        <mesh position={[-0.12, 0.55, 0.32]}>
          <circleGeometry args={[0.12, 32]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.12, 0.55, 0.32]}>
          <circleGeometry args={[0.12, 32]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Pupils (animated) */}
        <mesh ref={leftPupil} position={[-0.12, 0.55, 0.321]}>
          <circleGeometry args={[0.06, 16]} />
          <meshBasicMaterial color="#111111" />
        </mesh>
        <mesh ref={rightPupil} position={[0.12, 0.55, 0.321]}>
          <circleGeometry args={[0.06, 16]} />
          <meshBasicMaterial color="#111111" />
        </mesh>
      </group>

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
