import { Html, useGLTF, useAnimations } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { InteractionType } from '../utils/audio'

interface HumanNPCProps {
  name: string
  position: [number, number, number]
  ralphPosition: [number, number, number]
  onInteract: (type: InteractionType) => void
  onThrowBall?: () => void
}

export function HumanNPC({ name, position, ralphPosition, onInteract, onThrowBall }: HumanNPCProps) {
  const group = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF('https://threejs.org/examples/models/gltf/Soldier.glb')
  const { actions, names } = useAnimations(animations, group)

  useEffect(() => {
    const idleName = names.find((n) => /idle/i.test(n)) || names[0]
    actions[idleName]?.reset().fadeIn(0.2).play()
    return () => { actions[idleName]?.fadeOut(0.2) }
  }, [actions, names])

  const distance = useMemo(() => {
    const dx = position[0] - ralphPosition[0]
    const dz = position[2] - ralphPosition[2]
    return Math.hypot(dx, dz)
  }, [position, ralphPosition])

  return (
    <group position={position} ref={group} scale={1.0}>
      <primitive object={scene} castShadow receiveShadow />
      {distance < 1.8 && (
        <Html position={[0, 2, 0]} center>
          <div className="interaction-buttons photorealistic" role="toolbar" aria-label={`${name} actions`}>
            <button className="interaction-btn pet-btn" onClick={() => onInteract('pet')}>Pet Ralph</button>
            <button className="interaction-btn treat-btn" onClick={() => onInteract('treat')}>Give Treat</button>
            {onThrowBall && (
              <button className="interaction-btn play-btn" onClick={onThrowBall}>Throw Ball</button>
            )}
          </div>
        </Html>
      )}
      <Html position={[0, 2.6, 0]} center>
        <div className="mood-indicator photorealistic" style={{ padding: 6 }}>{name}</div>
      </Html>
    </group>
  )
}

useGLTF.preload('https://threejs.org/examples/models/gltf/Soldier.glb')

