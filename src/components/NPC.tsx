import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useMemo } from 'react'
import { InteractionType } from '../utils/audio'

interface NPCProps {
  name: string
  position: [number, number, number]
  ralphPosition: [number, number, number]
  onInteract: (type: InteractionType) => void
  onThrowBall?: () => void
}

export function NPC({ name, position, ralphPosition, onInteract, onThrowBall }: NPCProps) {
  const distance = useMemo(() => {
    const dx = position[0] - ralphPosition[0]
    const dz = position[2] - ralphPosition[2]
    return Math.hypot(dx, dz)
  }, [position, ralphPosition])

  const body = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d1d5db', roughness: 0.8 }), [])
  const shirt = useMemo(() => new THREE.MeshStandardMaterial({ color: '#60a5fa', roughness: 0.7 }), [])
  const skin = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f5d0a1', roughness: 0.9 }), [])

  return (
    <group position={position}>
      {/* Simple humanoid */}
      <mesh position={[0, 1.1, 0]} material={shirt} castShadow>
        <capsuleGeometry args={[0.25, 0.6, 8, 16]} />
      </mesh>
      <mesh position={[0, 1.8, 0]} material={skin} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.1, 0.5, 0]} material={body} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 12]} />
      </mesh>
      <mesh position={[0.1, 0.5, 0]} material={body} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 12]} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.35, 1.1, 0]} rotation={[0, 0, 0.2]} material={skin} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.5, 12]} />
      </mesh>
      <mesh position={[0.35, 1.1, 0]} rotation={[0, 0, -0.2]} material={skin} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.5, 12]} />
      </mesh>

      {/* Interaction UI */}
      {distance < 1.8 && (
        <Html position={[0, 2.2, 0]} center>
          <div className="interaction-buttons photorealistic" role="toolbar" aria-label={`${name} actions`}>
            <button className="interaction-btn pet-btn" onClick={() => onInteract('pet')}>Pet Ralph</button>
            <button className="interaction-btn treat-btn" onClick={() => onInteract('treat')}>Give Treat</button>
            {onThrowBall && (
              <button className="interaction-btn play-btn" onClick={onThrowBall}>Throw Ball</button>
            )}
          </div>
        </Html>
      )}

      {/* Nameplate */}
      <Html position={[0, 2.6, 0]} center>
        <div className="mood-indicator photorealistic" style={{ padding: 6 }}>{name}</div>
      </Html>
    </group>
  )
}

