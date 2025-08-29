import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
// No shadows; pure panorama
import { DachshundRigged } from './components/DachshundRigged'
import AnimalActor from './components/AnimalActor'
import ConfettiBurst from './components/ConfettiBurst'
import { playAnimalApproval } from './utils/audio'
import PanoramaBackground from './components/PanoramaBackground'
import HospitalRoom from './components/HospitalRoom'
import { getNode, PANORAMA_NODES } from './panorama/nodes'

export default function PanoramaApp() {
  const [currentId, setCurrentId] = useState(PANORAMA_NODES[0].id)
  const node = getNode(currentId)!
  const [ralphPos, setRalphPos] = useState<[number, number, number]>([0, 0.5, 0])
  const [happyMap, setHappyMap] = useState<Record<string, boolean>>({})
  const [bursts, setBursts] = useState<Array<{ id: string; pos: [number,number,number] }>>([])
  const [location, setLocation] = useState<'street'|'hospital'>('street')

  const people = [
    { id: 'a1', name: 'Cowie', species: 'cow' as const, pos: [-15, 0, -6] as [number,number,number], desired: 'sit' as const },
    { id: 'a2', name: 'Manny', species: 'manatee' as const, pos: [-9, 0, -6] as [number,number,number], desired: 'lie' as const },
    { id: 'a3', name: 'Barnabus', species: 'pig' as const, pos: [-3, 0, -6] as [number,number,number], desired: 'roll' as const },
    { id: 'a4', name: 'Hope', species: 'unicorn' as const, pos: [3, 0, -6] as [number,number,number], desired: 'sit' as const },
    { id: 'a5', name: 'Zibbie', species: 'zebra' as const, pos: [9, 0, -6] as [number,number,number], desired: 'lie' as const },
    { id: 'a6', name: 'Eeyore', species: 'donkey' as const, pos: [15, 0, -6] as [number,number,number], desired: 'roll' as const },
  ]

  function handleTrick(trick: 'sit'|'lie'|'roll', p: [number,number,number]) {
    // Check nearest person in radius
    let nearest: { id: string; desired: 'sit'|'lie'|'roll'; species: string } | null = null
    let best = Infinity
    for (const person of people) {
      const dx = person.pos[0] - p[0]
      const dz = person.pos[2] - p[2]
      const d = Math.hypot(dx, dz)
      if (d < best) { best = d; nearest = { id: person.id, desired: person.desired, species: person.species } }
    }
    if (nearest && best < 2 && nearest.desired === trick) {
      setHappyMap((m) => ({ ...m, [nearest!.id]: true }))
      setBursts((b) => [...b, { id: `${nearest!.id}-${Date.now()}`, pos: [p[0], p[1]+0.5, p[2]] }])
      playAnimalApproval(nearest.species)
      // Advance that animal's desired trick in a simple cycle
      const next = trick === 'sit' ? 'lie' : trick === 'lie' ? 'roll' : 'sit'
      const idx = people.findIndex(pr => pr.id === nearest!.id)
      if (idx >= 0) {
        people[idx].desired = next as any
      }
    }
  }

  // No auto-transitions; location changes only via header toggle

  return (
    <div className="game-container photorealistic">
      <div className="game-header photorealistic">
        <h1>Ralph’s Street View</h1>
        <div className="controls-info">
          <p>Move: Arrow Keys • Tricks: S (Sit), L (Lie), R (Roll)</p>
          <p>No wormholes; use the toggle to switch locations.</p>
        </div>
        <div className="controls-info">
          <button className="photorealistic-toggle" onClick={() => setLocation('street')}>Street</button>
          <button className="photorealistic-toggle" onClick={() => setLocation('hospital')}>Hospital Room</button>
        </div>
      </div>
      <div className="game-scene photorealistic">
        <Canvas camera={{ position: [12, 6.5, 12], fov: 55 }} dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}>
          {/* Background/environment per location */}
          {location === 'street' ? (
            <PanoramaBackground key={node.id} files={node.files} />
          ) : (
            <HospitalRoom />
          )}

          {/* Static camera + orbit (no follow) */}
          <OrbitControls
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
          />

          {bursts.map((b) => (
            <ConfettiBurst key={b.id} position={b.pos} onDone={() => setBursts((arr) => arr.filter(x => x.id !== b.id))} />
          ))}

          {/* People row in foreground, facing the user */}
          {people.map((p) => (
            <AnimalActor key={p.id} name={p.name} species={p.species} position={p.pos} desired={p.desired} happy={!!happyMap[p.id]} ralphPos={ralphPos} />
          ))}
          {/* No contact shadows or shadow maps */}
        </Canvas>
      </div>
    </div>
  )
}
