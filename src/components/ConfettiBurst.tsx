import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { useMemo, useRef } from "react"

interface Props {
  position: [number, number, number]
  onDone?: () => void
  count?: number
}

export default function ConfettiBurst({ position, onDone, count = 32 }: Props) {
  const group = useRef<THREE.Group>(null)
  const start = useMemo(() => performance.now(), [])
  const parts = useMemo(() => {
    const arr: { vel: THREE.Vector3; rot: THREE.Vector3; color: string; shape: 'rect'|'tri'|'round' }[] = []
    const colors = ['#ff6b6b','#ffd93d','#6bcbef','#b28dff','#4dd599','#ffa1ff','#ffd6a5']
    for (let i=0;i<count;i++) {
      arr.push({
        vel: new THREE.Vector3((Math.random()-0.5)*2.2, Math.random()*2+1.2, (Math.random()-0.5)*2.2),
        rot: new THREE.Vector3(Math.random()*2, Math.random()*2, Math.random()*2),
        color: colors[(Math.random()*colors.length)|0],
        shape: (Math.random()<0.2?'tri':(Math.random()<0.5?'round':'rect')),
      })
    }
    return arr
  }, [count])

  useFrame(() => {
    const t = (performance.now() - start)/1000
    const g = group.current
    if (!g) return
    g.children.forEach((m, i) => {
      if (!(m instanceof THREE.Mesh)) return
      const p = parts[i]
      m.position.x = p.vel.x * t
      m.position.y = p.vel.y * t - 1.5 * t * t
      m.position.z = p.vel.z * t
      m.rotation.x = p.rot.x * t
      m.rotation.y = p.rot.y * t
      m.rotation.z = p.rot.z * t
      const mat = m.material as THREE.MeshBasicMaterial
      mat.opacity = Math.max(0, 1 - t)
      mat.transparent = true
    })
    if (t > 1.2) onDone?.()
  })

  return (
    <group ref={group} position={position}>
      {parts.map((p, i) => (
        <mesh key={i} position={[0,0,0]}>
          {p.shape === 'rect' && <planeGeometry args={[0.15, 0.08]} />}
          {p.shape === 'tri' && <coneGeometry args={[0.09, 0.12, 3]} />}
          {p.shape === 'round' && <circleGeometry args={[0.06, 12]} />}
          <meshBasicMaterial color={p.color} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}
