import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
// No shadows; pure panorama
import { DachshundRigged } from './components/DachshundRigged'
import PanoramaBackground from './components/PanoramaBackground'
import { getNode, PANORAMA_NODES } from './panorama/nodes'

export default function PanoramaApp() {
  const [currentId, setCurrentId] = useState(PANORAMA_NODES[0].id)
  const node = getNode(currentId)!
  const [ralphPos, setRalphPos] = useState<[number, number, number]>([0, 0.5, 0])

  // Transition when Ralph hits a hotspot
  useEffect(() => {
    const x = ralphPos[0], z = ralphPos[2]
    const hit = node.neighbors.find((n) => {
      const dx = x - n.position[0]
      const dz = z - n.position[1]
      return Math.hypot(dx, dz) < 1.0
    })
    if (hit) {
      const next = getNode(hit.id)
      if (next) {
        setCurrentId(next.id)
        setRalphPos([0, 0.5, 0])
      }
    }
  }, [ralphPos, node])

  return (
    <div className="game-container photorealistic">
      <div className="game-header photorealistic">
        <h1>Ralph’s Street View</h1>
        <div className="controls-info">
          <p>Arrow/WASD to walk. Step on glowing rings to move to the next node.</p>
        </div>
      </div>
      <div className="game-scene photorealistic">
        <Canvas camera={{ position: [8, 4, 8], fov: 60 }} dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}>
          {/* Background panorama */}
          <PanoramaBackground key={node.id} files={node.files} />
          {/* Transparent play area: no ground disc */}
          {/* Hotspots */}
          {node.neighbors.map((n) => (
            <group key={n.id} position={[n.position[0], -0.49, n.position[1]]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.5, 0.7, 32]} />
                <meshBasicMaterial color="#00ffcc" transparent opacity={0.8} />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
                <ringGeometry args={[0.7, 0.85, 32]} />
                <meshBasicMaterial color="#00ffcc" transparent opacity={0.4} />
              </mesh>
            </group>
          ))}

          {/* Lighting for the character */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1} />

          {/* Ralph */}
          <DachshundRigged position={ralphPos}
            onInteraction={() => {}}
            onPosition={setRalphPos}
            showInteractionButtons={false}
          />
          {/* No contact shadows or shadow maps */}
        </Canvas>
      </div>
    </div>
  )
}
