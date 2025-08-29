import { useState, useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useBox } from '@react-three/cannon';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { InteractionType } from '../utils/audio';

interface PhotorealisticRalphProps {
  position: [number, number, number];
  onInteraction: (type: InteractionType) => void;
  onPosition?: (pos: [number, number, number]) => void;
  showInteractionButtons?: boolean;
  mobileDirection?: 'up' | 'down' | 'left' | 'right' | 'stop';
  action?: InteractionType;
  ballPosition?: [number, number, number];
}

export function PhotorealisticRalph({ position, onInteraction, onPosition, showInteractionButtons, mobileDirection = 'stop', action, ballPosition }: PhotorealisticRalphProps) {
  const [ref, api] = useBox<THREE.Mesh>(() => ({ 
    mass: 1, 
    position,
    material: { friction: 0.8, restitution: 0.2 },
    args: [0.6, 0.4, 1.8],
    allowSleep: true,
    linearDamping: 0.9,
    angularDamping: 1
  }));
  
  const [animationState, setAnimationState] = useState('idle');
  const [mood, setMood] = useState<'happy' | 'curious' | 'excited'>('happy');
  const meshRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const furRef = useRef<THREE.Group>(null);
  const legFL = useRef<THREE.Group>(null);
  const legFR = useRef<THREE.Group>(null);
  const legRL = useRef<THREE.Group>(null);
  const legRR = useRef<THREE.Group>(null);
  const currentPos = useRef<[number, number, number]>(position);
  // Removed idle wandering to ensure Ralph only moves when keys are pressed

  // Subscribe to position and notify parent
  useEffect(() => {
    const unsub = api.position.subscribe((v) => {
      currentPos.current = [v[0], v[1], v[2]];
      onPosition?.([v[0], v[1], v[2]]);
    });
    return () => { unsub(); };
  }, [api.position, onPosition]);

  // Advanced materials for photorealistic rendering
  const furMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#F5DEB3'),
    roughness: 0.8,
    metalness: 0.1,
    normalScale: new THREE.Vector2(0.5, 0.5),
    envMapIntensity: 0.3,
    transparent: true,
    opacity: 0.95,
  }), []);

  const skinMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#DEB887'),
    roughness: 0.9,
    metalness: 0.05,
    envMapIntensity: 0.2,
    normalScale: new THREE.Vector2(0.8, 0.8),
  }), []);

  const eyeMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#000000'),
    roughness: 0.1,
    metalness: 0.8,
    envMapIntensity: 1.0,
    normalScale: new THREE.Vector2(0.3, 0.3),
  }), []);

  const noseMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#2C1810'),
    roughness: 0.95,
    metalness: 0.0,
    envMapIntensity: 0.1,
    normalScale: new THREE.Vector2(1.2, 1.2),
  }), []);

  const tongueMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#FF6B8B'),
    roughness: 0.7,
    metalness: 0.1,
    envMapIntensity: 0.4,
    normalScale: new THREE.Vector2(0.6, 0.6),
  }), []);

  // Movement controls (hold-to-move, stop on release)
  const keys = useRef({ up: false, down: false, left: false, right: false });
  const yVel = useRef(0);
  useEffect(() => {
    const unsub = api.velocity.subscribe((v) => (yVel.current = v[1]));
    return () => { unsub(); };
  }, [api.velocity]);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') keys.current.up = true;
      if (k === 's' || k === 'arrowdown') keys.current.down = true;
      if (k === 'a' || k === 'arrowleft') keys.current.left = true;
      if (k === 'd' || k === 'arrowright') keys.current.right = true;
      if (k === ' ') {
        api.applyImpulse([0, 8, 0], [0, 0, 0]);
        setAnimationState('jumping');
        setMood('excited');
        onInteraction('bark');
      }
    };
    const onUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') keys.current.up = false;
      if (k === 's' || k === 'arrowdown') keys.current.down = false;
      if (k === 'a' || k === 'arrowleft') keys.current.left = false;
      if (k === 'd' || k === 'arrowright') keys.current.right = false;
      if (!keys.current.up && !keys.current.down && !keys.current.left && !keys.current.right) {
        setAnimationState('idle');
        setMood('happy');
        api.velocity.set(0, yVel.current, 0);
      }
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [api, onInteraction]);

  // Advanced animation loop with fur simulation (frame-synced)
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    // Keep feet on the ground (visual stability)
    meshRef.current.rotation.z = 0;

    // Jumping squash and stretch
    if (animationState === 'jumping') {
      meshRef.current.scale.y = 1.1;
      meshRef.current.scale.x = 0.95;
      meshRef.current.scale.z = 0.95;
    } else {
      meshRef.current.scale.y = 1;
      meshRef.current.scale.x = 1;
      meshRef.current.scale.z = 1;
    }

    // Tail wag
    if (tailRef.current) {
      if (mood === 'excited') {
        tailRef.current.rotation.z = Math.sin(t * 4) * 0.3;
        tailRef.current.rotation.y = Math.sin(t * 3) * 0.1;
      } else if (mood === 'happy') {
        tailRef.current.rotation.z = Math.sin(t * 2) * 0.15;
        tailRef.current.rotation.y = Math.sin(t * 1.6) * 0.05;
      } else {
        tailRef.current.rotation.z = 0;
        tailRef.current.rotation.y = 0;
      }
    }

    // Fur ripple
    if (furRef.current) {
      furRef.current.children.forEach((child, index) => {
        if (child instanceof THREE.Mesh) {
          const offset = index * 0.1;
          child.position.y = Math.sin(t + offset) * 0.02;
          child.rotation.z = Math.sin(t * 0.5 + offset) * 0.1;
        }
      });
    }

    // Movement: hold-to-move for keyboard or mobile
    const speed = 3.5;
    let moveX = 0, moveZ = 0;
    if (keys.current.up) moveZ -= 1;
    if (keys.current.down) moveZ += 1;
    if (keys.current.left) moveX -= 1;
    if (keys.current.right) moveX += 1;
    if (mobileDirection && mobileDirection !== 'stop') {
      moveX += mobileDirection === 'left' ? -1 : mobileDirection === 'right' ? 1 : 0;
      moveZ += mobileDirection === 'up' ? -1 : mobileDirection === 'down' ? 1 : 0;
    }
    if (moveX !== 0 || moveZ !== 0) {
      const len = Math.hypot(moveX, moveZ) || 1;
      const nx = (moveX / len) * speed;
      const nz = (moveZ / len) * speed;
      api.velocity.set(nx, yVel.current, nz);
      const desiredYaw = Math.atan2(nx, nz);
      meshRef.current.rotation.y += (desiredYaw - meshRef.current.rotation.y) * 0.2;
      setAnimationState('walking');
      setMood('excited');
    }

    // Four-leg gait animation when walking
    const moving = animationState === 'walking';
    const swing = (phase: number, amp = 0.6) => Math.sin(t * 6 + phase) * amp;
    const lerp = (a: number, b: number, s: number) => a + (b - a) * s;
    const damp = 0.25;
    const tgtFL = moving ? swing(0) : 0;
    const tgtRR = moving ? swing(0) : 0;
    const tgtFR = moving ? swing(Math.PI) : 0;
    const tgtRL = moving ? swing(Math.PI) : 0;
    if (legFL.current) legFL.current.rotation.x = lerp(legFL.current.rotation.x, tgtFL, damp);
    if (legFR.current) legFR.current.rotation.x = lerp(legFR.current.rotation.x, tgtFR, damp);
    if (legRL.current) legRL.current.rotation.x = lerp(legRL.current.rotation.x, tgtRL, damp);
    if (legRR.current) legRR.current.rotation.x = lerp(legRR.current.rotation.x, tgtRR, damp);
  });

  // React to play_ball
  useEffect(() => {
    if (action === 'play_ball' && ballPosition) {
      const [x, , z] = currentPos.current;
      const dir: [number, number, number] = [ballPosition[0] - x, 0, ballPosition[2] - z];
      const len = Math.hypot(dir[0], dir[2]) || 1;
      const norm: [number, number, number] = [dir[0] / len, 0, dir[2] / len];
      api.velocity.set(norm[0] * 3, yVel.current, norm[2] * 3);
      setAnimationState('walking');
      setMood('excited');
    }
  }, [action, ballPosition, api]);

  return (
    <group ref={meshRef}>
      <mesh ref={ref} castShadow receiveShadow>
        <group>
          {/* Main body with photorealistic materials */}
          <mesh position={[0, 0.3, 0]} material={skinMaterial}>
            <capsuleGeometry args={[0.25, 1.4, 8, 16]} />
          </mesh>
          
          {/* Fur overlay with realistic texture */}
          <group ref={furRef} position={[0, 0.35, 0]}>
            {/* Multiple fur layers for depth */}
            {Array.from({ length: 5 }, (_, i) => (
              <mesh key={i} material={furMaterial} position={[0, i * 0.02, 0]}>
                <capsuleGeometry args={[0.28 + i * 0.01, 1.5, 8, 16]} />
              </mesh>
            ))}
          </group>
          
          {/* Photorealistic head */}
          <mesh position={[0, 0.4, -0.9]} material={skinMaterial}>
            <sphereGeometry args={[0.22, 16, 16]} />
          </mesh>
          
          {/* Long floppy ears with realistic physics */}
          <mesh position={[0.12, 0.5, -0.9]} rotation={[0, 0, 0.3]} material={furMaterial}>
            <capsuleGeometry args={[0.04, 0.5, 8, 16]} />
          </mesh>
          <mesh position={[-0.12, 0.5, -0.9]} rotation={[0, 0, -0.3]} material={furMaterial}>
            <capsuleGeometry args={[0.04, 0.5, 8, 16]} />
          </mesh>
          
          {/* Realistic eyes with reflections */}
          <mesh position={[0.08, 0.45, -1.08]} material={eyeMaterial}>
            <sphereGeometry args={[0.025, 16, 16]} />
          </mesh>
          <mesh position={[-0.08, 0.45, -1.08]} material={eyeMaterial}>
            <sphereGeometry args={[0.025, 16, 16]} />
          </mesh>
          
          {/* Eye highlights with specular reflection */}
          <mesh position={[0.085, 0.46, -1.075]}>
            <sphereGeometry args={[0.008, 8, 8]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.1} metalness={0.9} />
          </mesh>
          <mesh position={[-0.075, 0.46, -1.075]}>
            <sphereGeometry args={[0.008, 8, 8]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.1} metalness={0.9} />
          </mesh>
          
          {/* Wet nose with realistic texture */}
          <mesh position={[0, 0.35, -1.12]} material={noseMaterial}>
            <sphereGeometry args={[0.018, 16, 16]} />
          </mesh>
          
          {/* Tongue (visible when excited) */}
          {mood === 'excited' && (
            <mesh position={[0, 0.3, -1.15]} material={tongueMaterial}>
              <sphereGeometry args={[0.015, 12, 12]} />
            </mesh>
          )}
          
          {/* Legs grouped for walk cycle (pivot at shoulder/hip) */}
          {/* Front Left */}
          <group ref={legFL} position={[0.18, -0.1, 0.4]}>
            <mesh material={skinMaterial} position={[0, -0.15, 0]}>
              <capsuleGeometry args={[0.06, 0.3, 8, 16]} />
            </mesh>
            <mesh material={skinMaterial} position={[0, -0.31, 0]}>
              <sphereGeometry args={[0.08, 16, 16]} />
            </mesh>
          </group>
          {/* Front Right */}
          <group ref={legFR} position={[-0.18, -0.1, 0.4]}>
            <mesh material={skinMaterial} position={[0, -0.15, 0]}>
              <capsuleGeometry args={[0.06, 0.3, 8, 16]} />
            </mesh>
            <mesh material={skinMaterial} position={[0, -0.31, 0]}>
              <sphereGeometry args={[0.08, 16, 16]} />
            </mesh>
          </group>
          {/* Rear Left */}
          <group ref={legRL} position={[0.18, -0.1, -0.4]}>
            <mesh material={skinMaterial} position={[0, -0.15, 0]}>
              <capsuleGeometry args={[0.06, 0.3, 8, 16]} />
            </mesh>
            <mesh material={skinMaterial} position={[0, -0.31, 0]}>
              <sphereGeometry args={[0.08, 16, 16]} />
            </mesh>
          </group>
          {/* Rear Right */}
          <group ref={legRR} position={[-0.18, -0.1, -0.4]}>
            <mesh material={skinMaterial} position={[0, -0.15, 0]}>
              <capsuleGeometry args={[0.06, 0.3, 8, 16]} />
            </mesh>
            <mesh material={skinMaterial} position={[0, -0.31, 0]}>
              <sphereGeometry args={[0.08, 16, 16]} />
            </mesh>
          </group>
          
          {/* Realistic tail with fur */}
          <group ref={tailRef} position={[0, 0.3, 0.9]}>
            <mesh material={skinMaterial}>
              <capsuleGeometry args={[0.08, 0.7, 8, 16]} />
            </mesh>
            {/* Tail tip with fur */}
            <mesh position={[0, 0, 0.4]} material={furMaterial}>
              <sphereGeometry args={[0.06, 16, 16]} />
            </mesh>
          </group>
          
          {/* Leather collar with realistic texture */}
          <mesh position={[0, 0.2, 0]}>
            <torusGeometry args={[0.3, 0.03, 8, 16]} />
            <meshStandardMaterial 
              color="#8B4513" 
              roughness={0.7} 
              metalness={0.1}
              envMapIntensity={0.5}
            />
          </mesh>
          
          {/* Metallic collar tag */}
          <mesh position={[0.25, 0.2, 0]}>
            <boxGeometry args={[0.08, 0.06, 0.02]} />
            <meshStandardMaterial 
              color="#FFD700" 
              roughness={0.2} 
              metalness={0.8}
              envMapIntensity={1.0}
            />
          </mesh>
        </group>
      </mesh>

      {/* Mood indicator with depth */}
      <Html position={[0, 1.5, 0]}>
        <div className="mood-indicator photorealistic">
          {mood === 'excited' && <span className="text-2xl">🤗</span>}
          {mood === 'happy' && <span className="text-2xl">😊</span>}
          {mood === 'curious' && <span className="text-2xl">🤔</span>}
        </div>
      </Html>

      {/* Contextual interaction buttons */}
      {showInteractionButtons && (
        <Html position={[0, 1.2, 0]} center>
          <div className="interaction-buttons photorealistic" role="toolbar" aria-label="Ralph actions">
            <button className="interaction-btn pet-btn" onClick={() => onInteraction('pet')} aria-label="Pet Ralph">🖐️ Pet</button>
            <button className="interaction-btn treat-btn" onClick={() => onInteraction('treat')} aria-label="Give treat">🦴 Treat</button>
            <button className="interaction-btn play-btn" onClick={() => onInteraction('play')} aria-label="Play with Ralph">🎾 Play</button>
            <button className="interaction-btn belly-btn" onClick={() => onInteraction('belly_rub')} aria-label="Give belly rub">🤗 Belly</button>
          </div>
        </Html>
      )}
    </group>
  );
}
