import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
// No shadows; pure panorama
import { DachshundRigged } from './components/DachshundRigged'
import AnimalActor from './components/AnimalActor'
import ConfettiBurst from './components/ConfettiBurst'
import { playAnimalApproval, setSfxVolume } from './utils/audio'
import PanoramaBackground from './components/PanoramaBackground'
// Single location (Street) only
import { getNode, PANORAMA_NODES } from './panorama/nodes'
import * as THREE from 'three'

export default function PanoramaApp() {
  const [currentId] = useState(PANORAMA_NODES[0].id)
  const node = getNode(currentId)!
  const [ralphPos, setRalphPos] = useState<[number, number, number]>([0, 0.5, 0])
  const [happyMap, setHappyMap] = useState<Record<string, boolean>>({})
  const [bursts, setBursts] = useState<Array<{ id: string; pos: [number,number,number]; count?: number }>>([])
  // Single location; no toggle
  const [moodMap, setMoodMap] = useState<Record<string, number>>({})
  const [calledId, setCalledId] = useState<string | null>(null)
  const controlsRef = useRef<any>(null)
  const [cam, setCam] = useState<THREE.PerspectiveCamera | null>(null)
  // Click-to-move disabled; keyboard only
  const [sfxVol, setSfxVol] = useState(1.0)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [showCameraMenu, setShowCameraMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showMinimap, setShowMinimap] = useState(false)
  const [toasts, setToasts] = useState<Array<{ id: string; pos: [number,number,number]; text: string }>>([])

  // Camera tween helper
  function tweenCamera(toTarget: THREE.Vector3, toDistance?: number, ms = 500) {
    if (!cam || !controlsRef.current) return
    const controls = controlsRef.current as any
    const fromTarget = controls.target.clone()
    const fromPos = cam.position.clone()
    const dir = new THREE.Vector3().subVectors(fromPos, fromTarget)
    const startLen = dir.length()
    const toLen = toDistance ?? startLen
    const toPos = new THREE.Vector3().copy(toTarget).add(dir.setLength(toLen))
    const t0 = performance.now()
    const ease = (t: number) => t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t
    let raf = 0
    controls.enabled = false
    const step = () => {
      const t = Math.min(1, (performance.now() - t0) / ms)
      const k = ease(t)
      const curTarget = fromTarget.clone().lerp(toTarget, k)
      const curPos = fromPos.clone().lerp(toPos, k)
      controls.target.copy(curTarget)
      cam.position.copy(curPos)
      cam.lookAt(curTarget)
      controls.update()
      if (t < 1) raf = requestAnimationFrame(step)
      else controls.enabled = true
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }

  function presetWide() {
    tweenCamera(new THREE.Vector3(0, 0.8, -6), 24, 500)
  }
  function presetClose() {
    tweenCamera(new THREE.Vector3(0, 0.8, -6), 10, 500)
  }
  // Left/Right presets removed for simplicity; orbit drag covers these.

  const people = [
    { id: 'a1', name: 'Cowie', species: 'cow' as const, pos: [-15, 0, -6] as [number,number,number], desired: 'sit' as const },
    { id: 'a2', name: 'Manny', species: 'manatee' as const, pos: [-9, 0, -6] as [number,number,number], desired: 'lie' as const },
    { id: 'a3', name: 'Barnabus', species: 'pig' as const, pos: [-3, 0, -6] as [number,number,number], desired: 'roll' as const },
    { id: 'a4', name: 'Hope', species: 'unicorn' as const, pos: [3, 0, -6] as [number,number,number], desired: 'sit' as const },
    { id: 'a5', name: 'Zibbie', species: 'zebra' as const, pos: [9, 0, -6] as [number,number,number], desired: 'lie' as const },
    { id: 'a6', name: 'Eeyore', species: 'donkey' as const, pos: [15, 0, -6] as [number,number,number], desired: 'roll' as const },
  ]

  const [streak, setStreak] = useState(0)
  const [lastSuccessAt, setLastSuccessAt] = useState<number>(0)
  type Trick = 'sit'|'lie'|'roll'
  const [challenge, setChallenge] = useState<{ id: string; trick: Trick; expiresAt: number } | null>(null)

  function newChallenge() {
    const choices = people
    const target = choices[(Math.random()*choices.length)|0]
    const tricks: Trick[] = ['sit','lie','roll']
    const trick = tricks[(Math.random()*tricks.length)|0]
    setChallenge({ id: target.id, trick, expiresAt: performance.now() + 12000 })
  }
  useEffect(() => {
    if (!challenge) { newChallenge(); return }
    const i = setInterval(() => {
      if (!challenge) return
      if (performance.now() > challenge.expiresAt) newChallenge()
    }, 500)
    return () => clearInterval(i)
  }, [challenge])
  function dollyCinematic() {
    if (reducedMotion) return
    if (!controlsRef.current) return
    const controls = controlsRef.current as any
    const target = controls.target.clone()
    // quick in then out
    tweenCamera(target, 9, 220)
    setTimeout(() => tweenCamera(target, 14, 260), 220)
  }

  function eyeRollZoom() {
    if (!controlsRef.current || !cam) return
    const faceTarget = new THREE.Vector3(ralphPos[0], ralphPos[1] + 0.7, ralphPos[2])
    tweenCamera(faceTarget, 8, 260)
    // zoom back out after the eye roll
    setTimeout(() => {
      tweenCamera(new THREE.Vector3(0, 0.8, -6), 14, 320)
    }, 900)
  }

  function handleTrick(trick: 'sit'|'lie'|'roll', p: [number,number,number]) {
    // Check nearest person in radius
    let nearest: { id: string; desired: 'sit'|'lie'|'roll'; species: string; pos: [number,number,number] } | null = null
    let best = Infinity
    for (const person of people) {
      const dx = person.pos[0] - p[0]
      const dz = person.pos[2] - p[2]
      const d = Math.hypot(dx, dz)
      if (d < best) { best = d; nearest = { id: person.id, desired: person.desired, species: person.species, pos: person.pos } }
    }
    if (nearest && best < 2 && nearest.desired === trick) {
      setHappyMap((m) => ({ ...m, [nearest!.id]: true }))
      setMoodMap((mm) => ({ ...mm, [nearest!.id]: Math.min(100, (mm[nearest!.id] || 0) + 25) }))
      const intensify = Math.min(3, Math.floor((streak + 1)/3))
      const count = 32 * (1 + intensify)
      setBursts((b) => [...b, { id: `${nearest!.id}-${Date.now()}`, pos: [p[0], p[1]+0.5, p[2]], count }])
      // brief toast near Ralph
      const tid = `toast-${Date.now()}`
      setToasts((ts) => [...ts, { id: tid, pos: [p[0], p[1]+1.2, p[2]], text: 'Great!' }])
      setTimeout(() => setToasts((arr) => arr.filter(t => t.id !== tid)), 1200)
      playAnimalApproval(nearest.species, nearest.pos)
      // update streak (reset if > 3s since last success)
      const now = performance.now()
      setStreak((s) => (now - lastSuccessAt > 3000 ? 1 : s + 1))
      setLastSuccessAt(now)
      dollyCinematic()
      // Challenge check
      if (challenge && challenge.id === nearest.id && challenge.trick === trick) {
        setBursts((b) => [...b, { id: `${nearest!.id}-bonus-${Date.now()}`, pos: [p[0], p[1]+0.5, p[2]], count: 96 }])
        newChallenge()
      }
      // Advance that animal's desired trick in a simple cycle
      const next = trick === 'sit' ? 'lie' : trick === 'lie' ? 'roll' : 'sit'
      const idx = people.findIndex(pr => pr.id === nearest!.id)
      if (idx >= 0) {
        people[idx].desired = next as any
      }
    }
  }

  // Single location (street); no ambient crossfade needed

  // Load persisted settings
  useEffect(() => {
    try {
      const v = localStorage.getItem('ralph_sfx_vol');
      if (v) { const f = parseFloat(v); if (!Number.isNaN(f)) { setSfxVol(f); setSfxVolume(f); } }
      const rm = localStorage.getItem('ralph_reduced_motion');
      if (rm) setReducedMotion(rm === '1')
      const mm = localStorage.getItem('ralph_show_minimap');
      if (mm) setShowMinimap(mm === '1')
      const seen = localStorage.getItem('ralph_help_seen');
      if (!seen) setShowHelp(true)
    } catch {}
  }, [])
  useEffect(() => { try { localStorage.setItem('ralph_show_minimap', showMinimap ? '1' : '0') } catch {} }, [showMinimap])

  // Mood decay
  useEffect(() => {
    const id = setInterval(() => {
      setMoodMap((mm) => {
        const next: Record<string, number> = {}
        for (const person of people) {
          const v = Math.max(0, (mm[person.id] || 0) - 2)
          next[person.id] = v
        }
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // "Come here" call: hold 'c'
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'c') return
      // find nearest animal
      let nearestId: string | null = null
      let best = Infinity
      for (const person of people) {
        const dx = person.pos[0] - ralphPos[0]
        const dz = person.pos[2] - ralphPos[2]
        const d = Math.hypot(dx, dz)
        if (d < best) { best = d; nearestId = person.id }
      }
      setCalledId(nearestId)
    }
    const up = (e: KeyboardEvent) => { if (e.key.toLowerCase() === 'c') setCalledId(null) }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [people, ralphPos])

  return (
    <div className="game-container photorealistic">
      <div className="game-header photorealistic" style={{ position: 'relative' }}>
        <h1>Ralph’s Street View</h1>
        <div className="controls-info">
          <p>Get close, then press S/L/R to do tricks.</p>
        </div>
        {/* Single location; tabs removed */}
        <div style={{ position: 'absolute', right: 12, top: 12, display: 'flex', gap: 8 }}>
          <button className="photorealistic-toggle" aria-label="Camera" title="Camera" onClick={() => { setShowCameraMenu((v)=>!v); setShowSettings(false); }}>
            🎥
          </button>
          <button className="photorealistic-toggle" aria-label="Settings" title="Settings" onClick={() => { setShowSettings((v)=>!v); setShowCameraMenu(false); }}>
            ⚙︎
          </button>
          <button className="photorealistic-toggle" aria-label="Help" title="Help" onClick={() => { setShowHelp(true); try { localStorage.setItem('ralph_help_seen', '1') } catch {} }}>
            ?
          </button>
        </div>
        {showCameraMenu && (
          <div style={{ position: 'absolute', right: 12, top: 52, zIndex: 10, background: 'rgba(0,0,0,0.55)', padding: '8px 10px', borderRadius: 8 }}>
            <button className="photorealistic-toggle" onClick={() => { presetWide(); setShowCameraMenu(false) }}>Wide</button>
            <button className="photorealistic-toggle" onClick={() => { presetClose(); setShowCameraMenu(false) }} style={{ marginLeft: 8 }}>Close</button>
          </div>
        )}
        {showSettings && (
          <div style={{ position: 'absolute', right: 12, top: 52, zIndex: 10, background: 'rgba(0,0,0,0.55)', padding: 12, borderRadius: 8, minWidth: 220 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🔊 SFX</span>
              <input type="range" min={0} max={1} step={0.05} value={sfxVol} onChange={(e) => { const v = parseFloat(e.target.value); setSfxVol(v); setSfxVolume(v); try { localStorage.setItem('ralph_sfx_vol', String(v)) } catch {} }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <input type="checkbox" checked={reducedMotion} onChange={(e) => { setReducedMotion(e.target.checked); try { localStorage.setItem('ralph_reduced_motion', e.target.checked ? '1' : '0') } catch {} }} /> Reduce Motion
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <input type="checkbox" checked={showMinimap} onChange={(e) => setShowMinimap(e.target.checked)} /> Show Minimap
            </label>
          </div>
        )}
      </div>
      {/* Help overlay */}
      {showHelp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowHelp(false)}>
          <div style={{ background: 'rgba(20,20,20,0.9)', color: '#fff', padding: 20, borderRadius: 12, width: 420 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>How to Play</h3>
            <ul style={{ lineHeight: 1.6 }}>
              <li>Drag to look around</li>
              <li>Use Arrow Keys to move Ralph</li>
              <li>Press S / L / R to Sit / Lie / Roll</li>
              <li>Get close to animals for name bubbles</li>
              <li>Hold C to call the nearest animal</li>
            </ul>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="photorealistic-toggle" onClick={() => { setShowHelp(false); try { localStorage.setItem('ralph_help_seen', '1') } catch {} }}>Got it</button>
            </div>
          </div>
        </div>
      )}
      <div className="game-scene photorealistic">
        {/* Minimap (toggle in settings) */}
        {showMinimap && (
          <div style={{ position: 'absolute', zIndex: 5, right: 8, bottom: 12, width: 120, height: 120, background: 'rgba(0,0,0,0.35)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              {(() => {
                const W = 120, H = 120, LIM = 25
                const toX = (x: number) => ((x + LIM) / (2*LIM)) * W
                const toY = (z: number) => ((z + LIM) / (2*LIM)) * H
                const dots = [] as any[]
                // Ralph
                dots.push(<div key="r" style={{ position: 'absolute', left: toX(ralphPos[0]) - 3, top: toY(ralphPos[2]) - 3, width: 6, height: 6, background: '#ffd93d', borderRadius: '50%' }} />)
                for (const p of people) {
                  dots.push(<div key={p.id} title={p.name} style={{ position: 'absolute', left: toX(p.pos[0]) - 2, top: toY(p.pos[2]) - 2, width: 4, height: 4, background: '#4dd599', borderRadius: '50%' }} />)
                }
                return dots
              })()}
            </div>
          </div>
        )}
        {/* Challenge pill bottom center (higher contrast) */}
        {challenge && (
          <div className="controls-info" style={{ position: 'absolute', zIndex: 5, left: '50%', transform: 'translateX(-50%)', bottom: 16, background: 'rgba(0,0,0,0.7)', padding: '8px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.25)', boxShadow: '0 2px 8px rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)', color: '#fff', fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
            {(() => {
              const t = challenge.trick
              const key = t === 'sit' ? 'S' : t === 'lie' ? 'L' : 'R'
              const word = t === 'sit' ? 'Sit' : t === 'lie' ? 'Lie' : 'Roll'
              const name = (() => { const p = people.find(p => p.id === challenge.id); return p ? p.name : challenge.id.toUpperCase() })()
              return <span>Press {key} to {word} near {name}</span>
            })()}
            <span style={{ marginLeft: 10 }}>⏳ {Math.max(0, Math.ceil((challenge.expiresAt - performance.now())/1000))}s</span>
            {streak > 1 && <span style={{ marginLeft: 10 }}>🔥 {streak}</span>}
          </div>
        )}
        <Canvas camera={{ position: [12, 6.5, 12], fov: 55 }} dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          onCreated={({ camera }) => { setCam(camera as THREE.PerspectiveCamera) }}
        >
          {/* Background/environment per location */}
          <PanoramaBackground key={node.id} files={node.files} />

          {/* Static camera + orbit (no follow) */}
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.1}
            minDistance={6}
            maxDistance={28}
            target={[0, 0.8, -6]}
            minPolarAngle={0.35}
            maxPolarAngle={1.2}
          />

          {/* Lighting for the character */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1} />

          {/* Ralph */}
          <DachshundRigged position={ralphPos}
            onInteraction={() => {}}
            onPosition={setRalphPos}
            showInteractionButtons={false}
            onTrick={handleTrick}
            onEyeRoll={() => eyeRollZoom()}
          />

          {bursts.map((b) => (
            <ConfettiBurst key={b.id} position={b.pos} count={b.count} onDone={() => setBursts((arr) => arr.filter(x => x.id !== b.id))} />
          ))}
          {/* Success toasts near Ralph */}
          {toasts.map((t) => (
            <Html key={t.id} position={t.pos} center>
              <div style={{ background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '6px 10px', borderRadius: 10, fontWeight: 700, border: '1px solid rgba(255,255,255,0.25)', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{t.text}</div>
            </Html>
          ))}

          {/* People row in foreground, facing the user */}
          {people.map((p) => (
            <AnimalActor
              key={p.id}
              name={p.name}
              species={p.species}
              position={p.pos}
              desired={p.desired}
              happy={!!happyMap[p.id]}
              ralphPos={ralphPos}
              mood={moodMap[p.id] || 0}
              targetPos={calledId === p.id ? [ralphPos[0]-1.2, 0, ralphPos[2]-0.6] as [number,number,number] : undefined}
            />
          ))}
          {/* No contact shadows or shadow maps */}
        </Canvas>
      </div>
    </div>
  )
}
