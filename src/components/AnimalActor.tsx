import { Html, useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useRef, useEffect, useState } from 'react'

export type Species = 'cow' | 'pig' | 'manatee' | 'platypus' | 'unicorn' | 'zebra' | 'donkey'

interface Props {
  name: string
  species: Species
  position: [number, number, number]
  desired: 'sit' | 'lie' | 'roll'
  happy?: boolean
  ralphPos?: [number, number, number]
}

function GLTFAnimal({ url, species }: { url: string; species: Species }) {
  const { scene } = useGLTF(url)
  const container = useRef<THREE.Group>(null)
  useEffect(() => {
    if (!scene || !container.current) return
    // Compute bounding box and normalize to a target height per species
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    box.getSize(size)
    const height = Math.max(0.001, size.y)
    const target: Record<Species, number> = {
      cow: 3.2,
      pig: 2.0,
      manatee: 2.4,
      platypus: 1.2,
      unicorn: 3.2,
      zebra: 3.2,
      donkey: 2.8,
    }
    const s = target[species] / height
    // place feet on ground
    const minY = box.min.y
    const yOffset = -minY * s
    container.current.scale.setScalar(s)
    container.current.position.y = yOffset
  }, [scene, species])
  return (
    <group ref={container}>
      <primitive object={scene} />
    </group>
  )
}

export default function AnimalActor({ name, species, position, desired, happy, ralphPos }: Props) {
  const group = useRef<THREE.Group>(null)
  const { camera } = useThree()
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null)

  useEffect(() => {
    let canceled = false
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
    // Try most likely casings first
    const candidates = [
      `/models/animals/${cap(species)}.glb`,
      `/models/animals/${species}.glb`,
      `/models/animals/${name}.glb`,
      `/models/animals/${name.toLowerCase()}.glb`,
      `/models/animals/${name.replace(/\s+/g, '')}.glb`,
    ]
    ;(async () => {
      for (const url of candidates) {
        try {
          const res = await fetch(url, {
            method: 'GET',
            cache: 'no-store',
            headers: { Accept: 'model/gltf-binary,application/octet-stream,*/*' },
          })
          if (!res.ok) continue
          const ct = (res.headers.get('content-type') || '').toLowerCase()
          // Reject SPA HTML fallbacks
          if (ct.includes('text/html')) continue
          // Accept common GLB content types
          if (ct.includes('model/gltf-binary') || ct.includes('application/octet-stream')) {
            if (!canceled) setSelectedUrl(url)
            return
          }
          // Some servers omit CT; try to assume success if body size > 0
          if (res.body) { if (!canceled) { setSelectedUrl(url); } return }
        } catch {
          // try next candidate
        }
      }
      if (!canceled) setSelectedUrl(null)
    })()
    return () => { canceled = true }
  }, [species, name])

  useFrame(() => {
    if (group.current) group.current.lookAt(camera.position.x, camera.position.y, camera.position.z)
  })

  return (
    <group ref={group} position={position}>
      {selectedUrl ? (
        <group scale={1.0}><GLTFAnimal url={selectedUrl} species={species} /></group>
      ) : (
        <>
          {species === 'cow' && <group scale={2}><Cow /></group>}
          {species === 'pig' && <group scale={2}><Pig /></group>}
          {species === 'manatee' && <group scale={2}><Manatee /></group>}
          {species === 'platypus' && <group scale={2}><Platypus /></group>}
          {species === 'unicorn' && <group scale={2}><Unicorn /></group>}
          {species === 'zebra' && <group scale={2}><Zebra /></group>}
          {species === 'donkey' && <group scale={2}><Donkey /></group>}
        </>
      )}
      {(() => {
        if (!ralphPos || !group.current) return null
        const gp = group.current.position
        const d = Math.hypot(gp.x - ralphPos[0], gp.z - ralphPos[2])
        if (d > 3) return null
        return (
          <Html position={[0, 6, 0]} center>
            <div className="sky-label" role="note" aria-label={`${name} wants a trick`}>
              <div className="sky-label-name">{(() => {
                const title = (s: Species) => s.charAt(0).toUpperCase() + s.slice(1)
                return species === 'donkey' ? 'Eeyore' : `${name} the ${title(species)}`
              })()}</div>
              <div className="sky-label-command">{happy ? '😊 Happy!' : (desired === 'sit' ? 'Press S to Sit' : desired === 'lie' ? 'Press L to Lie' : 'Press R to Roll')}</div>
            </div>
          </Html>
        )
      })()}
    </group>
  )
}

function Cow() {
  return (
    <group scale={0.9}>
      {/* Body */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[1.6, 1.0, 0.8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Spots */}
      {[[-0.4, 0.9, 0.25], [0.3, 0.7, -0.2], [0.1, 1.1, 0.1]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <sphereGeometry args={[0.15, 12, 12]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
      ))}
      {/* Head */}
      <mesh position={[0, 0.9, 0.65]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Legs */}
      {[-0.5, 0.5].map((x) =>
        [-0.25, 0.25].map((z, i) => (
          <mesh key={`${x}-${z}-${i}`} position={[x, 0.25, z]}>
            <boxGeometry args={[0.2, 0.5, 0.2]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        )),
      )}
      {/* Ears */}
      {[-0.25, 0.25].map((x, i) => (
        <mesh key={i} position={[x, 1.15, 0.85]}>
          <boxGeometry args={[0.15, 0.15, 0.05]} />
          <meshStandardMaterial color="#decccc" />
        </mesh>
      ))}
    </group>
  )
}

function Pig() {
  return (
    <group>
      {/* Body */}
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial color="#ffb6c1" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.9, 0.6]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#ffb6c1" />
      </mesh>
      {/* Snout */}
      <mesh position={[0, 0.9, 0.95]}>
        <cylinderGeometry args={[0.15, 0.15, 0.2, 12]} />
        <meshStandardMaterial color="#ff9db0" />
      </mesh>
      {/* Legs */}
      {[-0.35, 0.35].map((x) =>
        [-0.2, 0.2].map((z, i) => (
          <mesh key={`${x}-${z}-${i}`} position={[x, 0.3, z]}>
            <cylinderGeometry args={[0.08, 0.08, 0.5, 8]} />
            <meshStandardMaterial color="#ffb6c1" />
          </mesh>
        )),
      )}
    </group>
  )
}

function Manatee() {
  return (
    <group>
      {/* Body */}
      <mesh position={[0, 0.7, 0]} rotation={[0, 0, 0]}>
        <capsuleGeometry args={[0.35, 1.2, 8, 16]} />
        <meshStandardMaterial color="#9ea7ad" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.75, 0.8]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#9ea7ad" />
      </mesh>
      {/* Flippers */}
      {[-0.45, 0.45].map((x, i) => (
        <mesh key={i} position={[x, 0.6, 0.2]} rotation={[0, 0, x > 0 ? -0.6 : 0.6]}>
          <boxGeometry args={[0.35, 0.1, 0.25]} />
          <meshStandardMaterial color="#9ea7ad" />
        </mesh>
      ))}
      {/* Tail */}
      <mesh position={[0, 0.6, -0.8]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.4, 0.1, 0.3]} />
        <meshStandardMaterial color="#9ea7ad" />
      </mesh>
    </group>
  )
}

function Platypus() {
  return (
    <group>
      {/* Body */}
      <mesh position={[0, 0.6, 0]}>
        <capsuleGeometry args={[0.3, 0.9, 8, 16]} />
        <meshStandardMaterial color="#8b5a2b" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.7, 0.6]}>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial color="#8b5a2b" />
      </mesh>
      {/* Bill */}
      <mesh position={[0, 0.65, 0.9]}>
        <boxGeometry args={[0.4, 0.15, 0.25]} />
        <meshStandardMaterial color="#d2b48c" />
      </mesh>
      {/* Tail */}
      <mesh position={[0, 0.6, -0.7]}>
        <boxGeometry args={[0.25, 0.05, 0.5]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      {/* Feet */}
      {[-0.25, 0.25].map((x, i) => (
        <mesh key={i} position={[x, 0.4, 0.2]}>
          <boxGeometry args={[0.2, 0.05, 0.2]} />
          <meshStandardMaterial color="#d2b48c" />
        </mesh>
      ))}
    </group>
  )
}
function Unicorn() {
  return (
    <group>
      <mesh position={[0, 0.9, 0]}>
        <capsuleGeometry args={[0.4, 1.2, 8, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 1.1, 0.7]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 1.25, 1.0]} rotation={[Math.PI/2, 0, 0]}>
        <coneGeometry args={[0.07, 0.35, 16]} />
        <meshStandardMaterial color="#ffd700" />
      </mesh>
    </group>
  )
}
function Zebra() {
  return (
    <group>
      <mesh position={[0, 0.9, 0]}>
        <capsuleGeometry args={[0.4, 1.2, 8, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {Array.from({length:6}).map((_,i)=> (
        <mesh key={i} position={[0, 0.6 + i*0.15, 0]} rotation={[0,0, (i%2?0.1:-0.1)]}>
          <boxGeometry args={[0.9, 0.05, 0.9]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
      ))}
    </group>
  )
}
function Donkey() {
  return (
    <group>
      <mesh position={[0, 0.9, 0]}>
        <capsuleGeometry args={[0.4, 1.2, 8, 16]} />
        <meshStandardMaterial color="#8a7f70" />
      </mesh>
      {[-0.15,0.15].map((x,i)=> (
        <mesh key={i} position={[x, 1.2, 0.75]} rotation={[0,0,x>0?-0.2:0.2]}>
          <boxGeometry args={[0.1, 0.35, 0.05]} />
          <meshStandardMaterial color="#8a7f70" />
        </mesh>
      ))}
    </group>
  )
}
