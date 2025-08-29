import { Html, useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useRef } from 'react'

type Trick = 'sit'|'lie'|'roll'

interface Props {
  name: string
  position: [number, number, number]
  desired: Trick
  happy?: boolean
}

export default function PeopleActor({ name, position, desired, happy }: Props) {
  const { scene } = useGLTF('https://threejs.org/examples/models/gltf/Soldier.glb')
  const group = useRef<THREE.Group>(null)
  const { camera } = useThree()

  useFrame(() => {
    if (group.current) group.current.lookAt(camera.position.x, camera.position.y, camera.position.z)
  })

  const label = happy ? '😊' : desired === 'sit' ? 'Sit' : desired === 'lie' ? 'Lie' : 'Roll'

  return (
    <group ref={group} position={position}>
      <primitive object={scene} scale={1.0} />
      <Html position={[0, 2.2, 0]} center>
        <div className="mood-indicator photorealistic" style={{ padding: 6 }}>{name} • {label}</div>
      </Html>
    </group>
  )
}

useGLTF.preload('https://threejs.org/examples/models/gltf/Soldier.glb')

