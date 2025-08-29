import * as THREE from "three"

export default function HospitalRoom() {
  return (
    <group>
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 14]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.9} metalness={0} />
      </mesh>
      <mesh>
        <boxGeometry args={[20, 8, 14]} />
        <meshStandardMaterial side={THREE.BackSide} color="#f3f4f6" roughness={1} metalness={0} />
      </mesh>
      <mesh position={[0, 1.5, -7]}>
        <planeGeometry args={[6, 3]} />
        <meshStandardMaterial color="#d1d5db" roughness={0.7} metalness={0.05} />
      </mesh>
      <group position={[-6, -0.2, -3]}>
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[3, 0.3, 1.2]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[3.2, 0.2, 1.3]} />
          <meshStandardMaterial color="#9ca3af" />
        </mesh>
        <mesh position={[1.6, 0.7, 0]}>
          <boxGeometry args={[0.1, 1.0, 1.2]} />
          <meshStandardMaterial color="#9ca3af" />
        </mesh>
      </group>
      <pointLight position={[0, 3.5, 0]} intensity={0.6} color="#ffffff" />
    </group>
  )
}
