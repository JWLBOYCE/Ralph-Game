import { usePlane, useBox } from '@react-three/cannon';
import { useMemo, useEffect } from 'react';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

// Photorealistic Ground with grass texture and displacement
export function PhotorealisticGround() {
  const [ref] = usePlane(() => ({ 
    rotation: [-Math.PI / 2, 0, 0], 
    position: [0, -0.5, 0],
    material: { friction: 0.8, restitution: 0.2 }
  }));

  // Create realistic grass material with PBR properties
  const grassMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#2d5016'),
    roughness: 0.9,
    metalness: 0.0,
    envMapIntensity: 0.3,
    normalScale: new THREE.Vector2(0.5, 0.5),
  }), []);

  // Keep the physics plane but hide the mesh so HDRI is visible
  return (
    <mesh ref={ref as any} receiveShadow visible={false}>
      <planeGeometry args={[200, 200, 1, 1]} />
      <primitive object={grassMaterial} attach="material" />
    </mesh>
  );
}

// Photorealistic House with detailed textures and materials
export function PhotorealisticHouse() {
  const woodMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#8B4513'),
    roughness: 0.8,
    metalness: 0.1,
    envMapIntensity: 0.4,
    normalScale: new THREE.Vector2(1, 1),
  }), []);

  const roofMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#654321'),
    roughness: 0.9,
    metalness: 0.0,
    envMapIntensity: 0.2,
    normalScale: new THREE.Vector2(0.8, 0.8),
  }), []);

  const windowMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#87CEEB'),
    roughness: 0.1,
    metalness: 0.9,
    envMapIntensity: 1.0,
    transparent: true,
    opacity: 0.8,
  }), []);

  const brickMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#B22222'),
    roughness: 0.7,
    metalness: 0.0,
    envMapIntensity: 0.3,
    normalScale: new THREE.Vector2(1.2, 1.2),
  }), []);

  return (
    <group position={[8, 0, 8]}>
      {/* House base with wood texture */}
      <mesh castShadow position={[0, 1, 0]} material={woodMaterial}>
        <boxGeometry args={[4, 2, 4]} />
      </mesh>
      
      {/* Roof with shingle texture */}
      <mesh castShadow position={[0, 2.5, 0]} material={roofMaterial}>
        <coneGeometry args={[3, 2, 12]} />
      </mesh>
      
      {/* Door with wood grain */}
      <mesh castShadow position={[0, 0.5, 2.01]} material={woodMaterial}>
        <boxGeometry args={[1, 1, 0.1]} />
      </mesh>
      
      {/* Windows with glass reflection */}
      <mesh castShadow position={[-1.5, 1, 2.01]} material={windowMaterial}>
        <boxGeometry args={[0.8, 0.8, 0.1]} />
      </mesh>
      <mesh castShadow position={[1.5, 1, 2.01]} material={windowMaterial}>
        <boxGeometry args={[0.8, 0.8, 0.1]} />
      </mesh>
      
      {/* Chimney with brick texture */}
      <mesh castShadow position={[1, 3, 0]} material={brickMaterial}>
        <cylinderGeometry args={[0.3, 0.3, 1, 12]} />
      </mesh>
    </group>
  );
}

// Photorealistic Trees with detailed foliage and bark
export function PhotorealisticTree({ position }: { position: [number, number, number] }) {
  const barkMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#8B4513'),
    roughness: 0.9,
    metalness: 0.0,
    envMapIntensity: 0.2,
    normalScale: new THREE.Vector2(1.5, 1.5),
  }), []);

  const leafMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#228B22'),
    roughness: 0.8,
    metalness: 0.1,
    envMapIntensity: 0.4,
    normalScale: new THREE.Vector2(0.8, 0.8),
    transparent: false,
    opacity: 1.0,
  }), []);

  return (
    <group position={position}>
      {/* Tree trunk with bark texture */}
      <mesh castShadow position={[0, 1, 0]} material={barkMaterial}>
        <cylinderGeometry args={[0.3, 0.4, 2, 16]} />
      </mesh>
      {/* Tree foliage with leaf texture */}
      <mesh castShadow position={[0, 3, 0]} material={leafMaterial}>
        <sphereGeometry args={[1.5, 16, 16]} />
      </mesh>
      {/* Additional foliage layers for depth */}
      <mesh castShadow position={[0, 3.2, 0]} material={leafMaterial}>
        <sphereGeometry args={[1.2, 16, 16]} />
      </mesh>
      <mesh castShadow position={[0, 2.8, 0]} material={leafMaterial}>
        <sphereGeometry args={[1.3, 16, 16]} />
      </mesh>
    </group>
  );
}

// Photorealistic Fence with wood grain
export function PhotorealisticFence() {
  const woodMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#8B4513'),
    roughness: 0.8,
    metalness: 0.1,
    envMapIntensity: 0.3,
    normalScale: new THREE.Vector2(1.2, 1.2),
  }), []);

  return (
    <group>
      {/* Fence posts with wood grain */}
      {[-10, -5, 0, 5, 10].map((x) => (
        <mesh key={x} castShadow position={[x, 0.5, -10]} material={woodMaterial}>
          <cylinderGeometry args={[0.2, 0.2, 1, 16]} />
        </mesh>
      ))}
      
      {/* Horizontal rails with wood grain */}
      <mesh castShadow position={[0, 0.3, -10]} material={woodMaterial}>
        <boxGeometry args={[20, 0.1, 0.2]} />
      </mesh>
      <mesh castShadow position={[0, 0.7, -10]} material={woodMaterial}>
        <boxGeometry args={[20, 0.1, 0.2]} />
      </mesh>
    </group>
  );
}

// Photorealistic Flowers with detailed petals
export function PhotorealisticFlower({ position }: { position: [number, number, number] }) {
  const stemMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#228B22'),
    roughness: 0.9,
    metalness: 0.0,
    envMapIntensity: 0.2,
    normalScale: new THREE.Vector2(0.5, 0.5),
  }), []);

  const petalMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#FF69B4'),
    roughness: 0.6,
    metalness: 0.1,
    envMapIntensity: 0.5,
    normalScale: new THREE.Vector2(0.8, 0.8),
    transparent: true,
    opacity: 0.9,
  }), []);

  return (
    <group position={position}>
      {/* Stem with realistic texture */}
      <mesh castShadow position={[0, 0.3, 0]} material={stemMaterial}>
        <cylinderGeometry args={[0.02, 0.02, 0.6, 12]} />
      </mesh>
      
      {/* Flower petals */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh 
          key={i} 
          castShadow 
          position={[0, 0.7, 0]} 
          rotation={[0, (i * Math.PI * 2) / 8, 0]}
          material={petalMaterial}
        >
          <sphereGeometry args={[0.15, 12, 12]} />
        </mesh>
      ))}
      
      {/* Flower center */}
      <mesh castShadow position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#FFD700" roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  );
}

// Photorealistic Ball with realistic materials
export function PhotorealisticBall({ onPosition, kickTrigger }: { onPosition?: (pos: [number, number, number]) => void, kickTrigger?: number }) {
  const [ref, api] = useBox<THREE.Mesh>(() => ({ 
    mass: 0.5, 
    position: [2, 1, 2],
    material: { friction: 0.8, restitution: 0.9 },
    allowSleep: true
  }));

  useEffect(() => {
    if (!onPosition) return;
    const unsub = api.position.subscribe((v) => onPosition?.([v[0], v[1], v[2]]));
    return () => { unsub(); };
  }, [api.position, onPosition]);

  const ballMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#FF6B6B'),
    roughness: 0.3,
    metalness: 0.1,
    envMapIntensity: 0.8,
    normalScale: new THREE.Vector2(0.5, 0.5),
  }), []);

  function kick() {
    const angle = Math.random() * Math.PI * 2;
    const strength = 2.5;
    const impulse: [number, number, number] = [Math.cos(angle) * strength, 1.2, Math.sin(angle) * strength];
    api.applyImpulse(impulse, [0, 0, 0]);
  }

  // React to external kick triggers (from NPCs or UI)
  const prev = useMemo(() => ({ v: undefined as number | undefined }), []);
  useEffect(() => {
    if (kickTrigger !== undefined && kickTrigger !== prev.v) {
      prev.v = kickTrigger;
      kick();
    }
  }, [kickTrigger]);

  return (
    <mesh ref={ref} castShadow material={ballMaterial} onClick={kick} onPointerDown={kick}>
      <sphereGeometry args={[0.3, 32, 32]} />
    </mesh>
  );
}

// Atmospheric clouds for photorealistic sky
export function AtmosphericClouds() {
  const cloudMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#FFFFFF'),
    roughness: 0.9,
    metalness: 0.0,
    transparent: true,
    opacity: 0.8,
    envMapIntensity: 0.3,
  }), []);

  return (
    <group>
      {/* Multiple cloud layers for depth */}
      <mesh position={[5, 8, -5]} material={cloudMaterial}>
        <sphereGeometry args={[2, 8, 8]} />
      </mesh>
      <mesh position={[-3, 10, 3]} material={cloudMaterial}>
        <sphereGeometry args={[1.5, 8, 8]} />
      </mesh>
      <mesh position={[8, 12, 8]} material={cloudMaterial}>
        <sphereGeometry args={[2.5, 8, 8]} />
      </mesh>
    </group>
  );
}

// Enhanced lighting for photorealistic rendering
export function PhotorealisticLighting({ quality = 'high' }: { quality?: 'high'|'medium'|'low' }) {
  const mapSize = quality === 'high' ? 4096 : quality === 'medium' ? 2048 : 1024;
  const sunIntensity = quality === 'low' ? 0.9 : 1.2;
  return (
    <>
      {/* Ambient light for overall illumination */}
      <ambientLight intensity={0.4} color="#ffffff" />
      
      {/* Main directional light (sun) */}
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={sunIntensity} 
        castShadow 
        shadow-mapSize-width={mapSize}
        shadow-mapSize-height={mapSize}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        color="#ffffff"
      />
      
      {/* Fill light for softer shadows */}
      <directionalLight 
        position={[-5, 5, -5]} 
        intensity={0.3} 
        color="#87CEEB"
      />
      
      {/* Rim light for depth */}
      <directionalLight 
        position={[0, 5, -10]} 
        intensity={0.2} 
        color="#FFE4B5"
      />
    </>
  );
}

// Photorealistic sky with atmospheric scattering
export function PhotorealisticSky() {
  // Use a full HDRI background only (disable ground projection to avoid green wash on Safari)
  return <Environment preset="sunset" background />;
}
