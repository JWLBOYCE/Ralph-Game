import { useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, useBox } from '@react-three/cannon';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, DepthOfField, Vignette, SSAO } from '@react-three/postprocessing';
import { playInteractionTone, vibratePulse, type InteractionType } from './utils/audio';
import { DachshundRigged } from './components/DachshundRigged';
import { HumanNPC } from './components/HumanNPC';
import {
  PhotorealisticGround,
  PhotorealisticHouse,
  PhotorealisticTree,
  PhotorealisticFence,
  PhotorealisticFlower,
  PhotorealisticBall,
  PhotorealisticLighting,
  PhotorealisticSky
} from './components/PhotorealisticEnvironment';

// Static camera (no follow mode, no orbit controls)

// Player Character with enhanced materials
function PhotorealisticPlayer({ onPosition }: { onPosition?: (pos: [number, number, number]) => void }) {
  const [ref, api] = useBox<THREE.Mesh>(() => ({ 
    mass: 1, 
    position: [0, 1, 5],
    material: { friction: 0.8, restitution: 0.2 },
    allowSleep: true
  }));

  useEffect(() => {
    if (!onPosition) return;
    const unsub = api.position.subscribe((v) => onPosition?.([v[0], v[1], v[2]]));
    return () => { unsub(); };
  }, [api.position, onPosition]);

  const playerMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#FFB6C1'),
    roughness: 0.7,
    metalness: 0.1,
    envMapIntensity: 0.5,
    normalScale: new THREE.Vector2(0.8, 0.8),
  }), []);

  return (
    <mesh ref={ref} castShadow material={playerMaterial}>
      <capsuleGeometry args={[0.3, 1.5, 8, 16]} />
    </mesh>
  );
}

// Mobile Controls Component
function MobileControls({ onMove, onAction }: { 
  onMove: (direction: string) => void, 
  onAction: (action: InteractionType) => void 
}) {
  return (
    <div className="mobile-controls photorealistic">
      <div className="movement-controls">
        <button 
          className="control-btn up-btn photorealistic"
          aria-label="Move up"
          onTouchStart={() => onMove('up')}
          onTouchEnd={() => onMove('stop')}
        >
          ↑
        </button>
        <div className="horizontal-controls">
          <button 
            className="control-btn left-btn photorealistic"
            aria-label="Move left"
            onTouchStart={() => onMove('left')}
            onTouchEnd={() => onMove('stop')}
          >
            ←
          </button>
          <button 
            className="control-btn right-btn photorealistic"
            aria-label="Move right"
            onTouchStart={() => onMove('right')}
            onTouchEnd={() => onMove('stop')}
          >
            →
          </button>
        </div>
        <button 
          className="control-btn down-btn photorealistic"
          aria-label="Move down"
          onTouchStart={() => onMove('down')}
          onTouchEnd={() => onMove('stop')}
        >
          ↓
        </button>
      </div>
      
      <div className="action-controls">
        <button 
          className="control-btn action-btn photorealistic"
          aria-label="Bark"
          onClick={() => onAction('bark')}
        >
          🐕 Bark
        </button>
        <button 
          className="control-btn action-btn photorealistic"
          aria-label="Jump"
          onClick={() => onAction('jump')}
        >
          ⬆️ Jump
        </button>
        <button 
          className="control-btn action-btn photorealistic"
          aria-label="Play ball"
          onClick={() => onAction('play_ball')}
        >
          🎾 Ball
        </button>
      </div>
    </div>
  );
}

// Main Photorealistic App Component
export default function PhotorealisticApp() {
  const [ralphPosition] = useState<[number, number, number]>([0, 0.5, 0]);
  const [interactionHistory, setInteractionHistory] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [gameStats, setGameStats] = useState({
    pets: 0,
    treats: 0,
    playSessions: 0,
    barks: 0
  });
  const [graphicsQuality, setGraphicsQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [postOk, setPostOk] = useState(true);
  const [humansOk, setHumansOk] = useState(true);
  const [mobileDirection, setMobileDirection] = useState<'up'|'down'|'left'|'right'|'stop'>('stop');
  const [playerPos, setPlayerPos] = useState<[number, number, number]>([0,0,0]);
  const [ralphWorldPos, setRalphWorldPos] = useState<[number, number, number]>([0,0,0]);
  const [ballPos, setBallPos] = useState<[number, number, number]>([2,1,2]);
  const [lastAction, setLastAction] = useState<InteractionType | undefined>(undefined);
  // No follow camera; use a static camera framing the play area
  const [kickTrigger, setKickTrigger] = useState(0);
  const [fetches, setFetches] = useState(0);
  const [inGoal, setInGoal] = useState(false);
  const fetchTarget = 3;

  useEffect(() => {
    setIsMobile('ontouchstart' in window);
    
    // Auto-detect graphics capability
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | WebGL2RenderingContext | null;
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        if (renderer.includes('Intel') || renderer.includes('Integrated')) {
          setGraphicsQuality('medium');
        }
      }
      const isWebGL2 = !!(canvas.getContext('webgl2'));
      setPostOk(isWebGL2);
    }
    const ua = navigator.userAgent;
    const isSafari = /Safari\//.test(ua) && !/Chrome\//.test(ua) && !/Chromium\//.test(ua);
    if (isSafari) {
      // Be conservative on Safari to avoid driver-related white screens
      setPostOk(false);
      setHumansOk(false);
    }
  }, []);

  const isSafeMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('safe');
  const enablePost = postOk && !isSafeMode;
  const enableHumans = humansOk && !isSafeMode;

  const handleInteraction = (type: InteractionType) => {
    const timestamp = new Date().toLocaleTimeString();
    setInteractionHistory(prev => [...prev, `${type} at ${timestamp}`]);
    setLastAction(type);
    
    // Update stats
    const statKey = (t: InteractionType) =>
      t === 'pet' ? 'pets' :
      t === 'treat' ? 'treats' :
      (t === 'play' || t === 'play_ball' || t === 'jump') ? 'playSessions' :
      t === 'bark' ? 'barks' :
      'pets';
    setGameStats(prev => ({
      ...prev,
      [statKey(type)]: prev[statKey(type)] + 1
    }));

    // Haptics + audio feedback
    vibratePulse(20);
    playInteractionTone(type);
  };

  const handleMove = (direction: string) => {
    if (direction === 'up' || direction === 'down' || direction === 'left' || direction === 'right' || direction === 'stop') {
      setMobileDirection(direction);
    }
  };

  // Detect ball in goal ring near house door at [8,0,10]
  useEffect(() => {
    const goal: [number, number, number] = [8, 0, 10];
    const dist = Math.hypot(ballPos[0] - goal[0], ballPos[2] - goal[2]);
    const inside = dist < 1.0;
    if (inside && !inGoal) {
      setInGoal(true);
      setFetches((c) => Math.min(fetchTarget, c + 1));
      playInteractionTone('play_ball');
    } else if (!inside && inGoal) {
      setInGoal(false);
    }
  }, [ballPos, inGoal]);

  // GoalZone removed in photorealistic-only mode

  return (
    <div className="game-container photorealistic">
      <div className="game-header photorealistic">
        <h1>Ralph's Photorealistic Adventure</h1>
        <div className="controls-info">
          <p>Desktop: WASD/Arrow keys to move Ralph • SPACE to bark</p>
          <p>Mobile: Use touch controls below • Graphics Quality: {graphicsQuality}</p>
        </div>
        <div className="game-stats photorealistic">
          <span>🐕 Pets: {gameStats.pets}</span>
          <span>🦴 Treats: {gameStats.treats}</span>
          <span>🎾 Play: {gameStats.playSessions}</span>
          <span>🐕 Barks: {gameStats.barks}</span>
        </div>
        {/* Photorealistic only; no follow camera toggle */}
      </div>

      <div className="game-scene photorealistic">
        <Canvas 
          shadows 
          camera={{ position: [12, 6, 12], fov: 60 }}
          dpr={[1, 1.5]}
          gl={{ 
            antialias: true, 
            alpha: false, 
            powerPreference: "high-performance",
            stencil: false,
            depth: true
          }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            // Slightly brighter exposure for a vivid look
            // @ts-ignore three types allow number
            gl.toneMappingExposure = graphicsQuality === 'high' ? 1.1 : graphicsQuality === 'medium' ? 1.0 : 0.95;
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
            // Ensure modern color space for lifelike rendering
            // @ts-ignore: three r179 exposes SRGBColorSpace
            gl.outputColorSpace = THREE.SRGBColorSpace;
          }}
          style={{ background: 'transparent' }}
        >
          {/* Light atmospheric fog for depth */}
          <fog attach="fog" args={["#dce9f6", 20, 80]} />
          <PhotorealisticLighting quality={graphicsQuality} />
          
          <Physics gravity={[0, -9.81, 0]}>
            <PhotorealisticGround />
            {/* Subtle floor for parallax; helps perceive movement */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
              <circleGeometry args={[30, 64]} />
              <meshStandardMaterial color="#b8b8b8" roughness={1} metalness={0} />
            </mesh>
            {/* Goal marker disabled to avoid Safari overlay artifacts */}
            <DachshundRigged 
              position={ralphPosition} 
              onInteraction={handleInteraction}
              onPosition={setRalphWorldPos}
              showInteractionButtons={Math.hypot(playerPos[0]-ralphWorldPos[0], playerPos[2]-ralphWorldPos[2]) < 1.8}
              mobileDirection={mobileDirection}
              action={lastAction}
              ballPosition={ballPos}
            />
            <PhotorealisticPlayer onPosition={setPlayerPos} />
            <PhotorealisticBall onPosition={setBallPos} kickTrigger={kickTrigger} />
            
            {/* Environment objects */}
            <PhotorealisticHouse />
            <PhotorealisticFence />
            <PhotorealisticTree position={[12, 0, -6]} />
            <PhotorealisticTree position={[-12, 0, 8]} />
            <PhotorealisticTree position={[18, 0, 0]} />
            <PhotorealisticFlower position={[2, 0, 2]} />
            <PhotorealisticFlower position={[-2, 0, -2]} />
            <PhotorealisticFlower position={[1, 0, -1]} />
          <PhotorealisticFlower position={[4, 0, 1]} />
          <PhotorealisticFlower position={[-4, 0, -1]} />
          
            {/* NPCs */}
            {enableHumans && (
              <>
                <HumanNPC name="Alex" position={[2, 0, 6]} ralphPosition={ralphWorldPos} onInteract={handleInteraction} onThrowBall={() => setKickTrigger(k => k + 1)} />
                <HumanNPC name="Sam" position={[-3, 0, -2]} ralphPosition={ralphWorldPos} onInteract={handleInteraction} onThrowBall={() => setKickTrigger(k => k + 1)} />
                <HumanNPC name="Riley" position={[6, 0, -4]} ralphPosition={ralphWorldPos} onInteract={handleInteraction} onThrowBall={() => setKickTrigger(k => k + 1)} />
              </>
            )}
          </Physics>
          
          <PhotorealisticSky />
          <ContactShadows position={[0, -0.49, 0]} opacity={0.4} scale={30} blur={2} far={40} />
          {enablePost && (
            <EffectComposer multisampling={graphicsQuality === 'high' ? 4 : 0}>
              <SSAO 
                radius={graphicsQuality === 'high' ? 0.3 : 0.2}
                intensity={graphicsQuality === 'high' ? 1.2 : 0.9}
                bias={0.025}
                samples={graphicsQuality === 'high' ? 16 : 8}
                rings={graphicsQuality === 'high' ? 8 : 6}
                worldDistanceThreshold={0.001}
                worldDistanceFalloff={0.02}
                worldProximityThreshold={0.0005}
                worldProximityFalloff={0.01}
              />
              <Bloom intensity={graphicsQuality === 'high' ? 0.5 : graphicsQuality === 'medium' ? 0.35 : 0.2} luminanceThreshold={0.7} mipmapBlur />
              <DepthOfField focusDistance={0.02} focalLength={0.02} bokehScale={graphicsQuality === 'high' ? 3 : 1.5} />
              <Vignette eskil={false} offset={0.1} darkness={0.4} />
            </EffectComposer>
          )}
        </Canvas>
      </div>

      {isMobile && (
        <MobileControls onMove={handleMove} onAction={handleInteraction} />
      )}

      <div className="interaction-log photorealistic">
        <h3>Interaction History:</h3>
        <div className="log-entries">
          {interactionHistory.slice(-5).map((entry, index) => (
            <div key={index} className="log-entry photorealistic">{entry}</div>
          ))}
        </div>
        {fetches >= fetchTarget && (
          <div className="objective-banner">Mission complete! Ralph fetched the ball {fetchTarget} times. 🎉</div>
        )}
      </div>
    </div>
  );
}
