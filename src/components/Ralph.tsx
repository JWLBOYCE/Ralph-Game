import { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useBox } from '@react-three/cannon';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { InteractionType } from '../utils/audio';

interface RalphProps {
  position: [number, number, number];
  onInteraction: (type: InteractionType) => void;
  onPosition?: (pos: [number, number, number]) => void;
  showInteractionButtons?: boolean;
  mobileDirection?: 'up' | 'down' | 'left' | 'right' | 'stop';
  action?: InteractionType;
  ballPosition?: [number, number, number];
}

export function Ralph({ position, onInteraction, onPosition, showInteractionButtons, mobileDirection = 'stop', action, ballPosition }: RalphProps) {
  const [ref, api] = useBox<THREE.Mesh>(() => ({ 
    mass: 1, 
    position,
    material: { friction: 0.8, restitution: 0.2 },
    args: [0.6, 0.4, 1.8], // More realistic dachshund proportions
    allowSleep: true,
    linearDamping: 0.9,
    angularDamping: 1
  }));
  
  const [animationState, setAnimationState] = useState('idle');
  const [mood, setMood] = useState<'happy' | 'curious' | 'excited'>('happy');
  const meshRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const currentPos = useRef<[number, number, number]>(position);
  // Removed idle wandering to ensure Ralph only moves when keys are pressed

  // Subscribe to position updates and notify parent
  useEffect(() => {
    const unsub = api.position.subscribe((v) => {
      currentPos.current = [v[0], v[1], v[2]];
      onPosition?.([v[0], v[1], v[2]]);
    });
    return () => { unsub(); };
  }, [api.position, onPosition]);

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

  // Animation loop (frame-synced)
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    // Dog stays on ground; no vertical bobbing
    meshRef.current.position.y = 0;

    // Jumping animation
    if (animationState === 'jumping') {
      meshRef.current.scale.y = 1.1;
      meshRef.current.scale.x = 0.95;
    } else {
      meshRef.current.scale.y = 1;
      meshRef.current.scale.x = 1;
    }

    // Tail wagging animation
    if (tailRef.current) {
      if (mood === 'excited') {
        tailRef.current.rotation.z = Math.sin(t * 4) * 0.3;
      } else if (mood === 'happy') {
        tailRef.current.rotation.z = Math.sin(t * 2) * 0.15;
      } else {
        tailRef.current.rotation.z = 0;
      }
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
      // Face movement direction
      const desiredYaw = Math.atan2(nx, nz);
      meshRef.current.rotation.y += (desiredYaw - meshRef.current.rotation.y) * 0.2;
      setAnimationState('walking');
      setMood('excited');
    }
  });

  // React to actions (simple fetch impulse toward ball)
  useEffect(() => {
    if (action === 'play_ball' && ballPosition) {
      const [x, , z] = currentPos.current;
      const dir: [number, number, number] = [
        ballPosition[0] - x,
        0,
        ballPosition[2] - z,
      ];
      const len = Math.hypot(dir[0], dir[2]) || 1;
      const norm: [number, number, number] = [dir[0] / len, 0, dir[2] / len];
      // Nudge towards the ball but do not keep sliding
      api.velocity.set(norm[0] * 3, yVel.current, norm[2] * 3);
      setAnimationState('walking');
      setMood('excited');
    }
  }, [action, ballPosition, api]);

  return (
    <group ref={meshRef}>
      <mesh ref={ref} castShadow>
        <group>
          {/* Main body - long dachshund shape */}
          <mesh position={[0, 0.3, 0]}>
            <capsuleGeometry args={[0.25, 1.4, 4, 8]} />
            <meshStandardMaterial color="#F5DEB3" />
          </mesh>
          
          {/* Long hair overlay */}
          <mesh position={[0, 0.35, 0]}>
            <capsuleGeometry args={[0.28, 1.5, 4, 8]} />
            <meshStandardMaterial color="#DEB887" transparent opacity={0.7} />
          </mesh>
          
          {/* Head */}
          <mesh position={[0, 0.4, -0.9]}>
            <sphereGeometry args={[0.22, 8, 8]} />
            <meshStandardMaterial color="#F5DEB3" />
          </mesh>
          
          {/* Long floppy ears */}
          <mesh position={[0.12, 0.5, -0.9]} rotation={[0, 0, 0.3]}>
            <capsuleGeometry args={[0.04, 0.5, 4, 8]} />
            <meshStandardMaterial color="#DEB887" />
          </mesh>
          <mesh position={[-0.12, 0.5, -0.9]} rotation={[0, 0, -0.3]}>
            <capsuleGeometry args={[0.04, 0.5, 4, 8]} />
            <meshStandardMaterial color="#DEB887" />
          </mesh>
          
          {/* Eyes */}
          <mesh position={[0.08, 0.45, -1.08]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
          <mesh position={[-0.08, 0.45, -1.08]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
          
          {/* Eye highlights */}
          <mesh position={[0.085, 0.46, -1.075]}>
            <sphereGeometry args={[0.008, 8, 8]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[-0.075, 0.46, -1.075]}>
            <sphereGeometry args={[0.008, 8, 8]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          
          {/* Nose */}
          <mesh position={[0, 0.35, -1.12]}>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
          
          {/* Short legs */}
          <mesh position={[0.18, -0.1, 0.4]}>
            <capsuleGeometry args={[0.06, 0.3, 4, 8]} />
            <meshStandardMaterial color="#DEB887" />
          </mesh>
          <mesh position={[-0.18, -0.1, 0.4]}>
            <capsuleGeometry args={[0.06, 0.3, 4, 8]} />
            <meshStandardMaterial color="#DEB887" />
          </mesh>
          <mesh position={[0.18, -0.1, -0.4]}>
            <capsuleGeometry args={[0.06, 0.3, 4, 8]} />
            <meshStandardMaterial color="#DEB887" />
          </mesh>
          <mesh position={[-0.18, -0.1, -0.4]}>
            <capsuleGeometry args={[0.06, 0.3, 4, 8]} />
            <meshStandardMaterial color="#DEB887" />
          </mesh>
          
          {/* Paws */}
          <mesh position={[0.18, -0.25, 0.4]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#DEB887" />
          </mesh>
          <mesh position={[-0.18, -0.25, 0.4]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#DEB887" />
          </mesh>
          <mesh position={[0.18, -0.25, -0.4]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#DEB887" />
          </mesh>
          <mesh position={[-0.18, -0.25, -0.4]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#DEB887" />
          </mesh>
          
          {/* Tail */}
          <group ref={tailRef} position={[0, 0.3, 0.9]}>
            <mesh>
              <capsuleGeometry args={[0.08, 0.7, 4, 8]} />
              <meshStandardMaterial color="#DEB887" />
            </mesh>
            {/* Tail tip */}
            <mesh position={[0, 0, 0.4]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#DEB887" />
            </mesh>
          </group>
          
          {/* Collar */}
          <mesh position={[0, 0.2, 0]}>
            <torusGeometry args={[0.3, 0.03, 8, 16]} />
            <meshStandardMaterial color="#FF6B6B" />
          </mesh>
          
          {/* Collar tag */}
          <mesh position={[0.25, 0.2, 0]}>
            <boxGeometry args={[0.08, 0.06, 0.02]} />
            <meshStandardMaterial color="#FFD700" />
          </mesh>
        </group>
      </mesh>

      {/* Mood indicator */}
      <Html position={[0, 1.5, 0]}>
        <div className="mood-indicator">
          {mood === 'excited' && <span className="text-2xl">🤗</span>}
          {mood === 'happy' && <span className="text-2xl">😊</span>}
          {mood === 'curious' && <span className="text-2xl">🤔</span>}
        </div>
      </Html>

      {/* Contextual interaction buttons */}
      {showInteractionButtons && (
        <Html position={[0, 1.2, 0]} center>
          <div className="interaction-buttons" role="toolbar" aria-label="Ralph actions">
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
