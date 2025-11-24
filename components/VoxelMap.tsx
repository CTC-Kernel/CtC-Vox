import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html, QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';
import { ThreatIntel, ThreatLevel, NetworkBlip } from '../types';

// Constants for Voxel Sphere
const SPHERE_RADIUS = 12;
const VOXEL_SIZE = 0.35;
const VOXEL_COUNT = 3000;

interface ThreatMarkerProps {
  position: [number, number, number];
  threat: ThreatIntel;
  isSelected: boolean;
  onSelect: () => void;
}

const ThreatMarker: React.FC<ThreatMarkerProps> = ({ position, threat, isSelected, onSelect }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHover] = useState(false);
  
  const level = threat.severity;
  const color = level === ThreatLevel.CRITICAL ? '#ff2a6d' : 
                level === ThreatLevel.HIGH ? '#ff9e2a' : '#00f3ff';
  
  useEffect(() => {
    if (groupRef.current) {
        groupRef.current.lookAt(0, 0, 0);
    }
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      const baseScale = isSelected || hovered ? 1.5 : 1.0;
      const pulseSpeed = isSelected ? 8 : 2;
      const pulse = Math.sin(t * pulseSpeed) * 0.2 + baseScale;
      groupRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group 
      ref={groupRef} 
      position={position}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.6, 0.6, 1.5]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={isSelected || hovered ? 3 : 1} 
          toneMapped={false} 
        />
      </mesh>

      {(isSelected || hovered) && (
        <mesh position={[0, 0, -SPHERE_RADIUS/2]} rotation={[Math.PI/2, 0, 0]}>
             <cylinderGeometry args={[0.02, 0.05, SPHERE_RADIUS, 6]} />
             <meshBasicMaterial color={color} transparent opacity={0.4} blending={THREE.AdditiveBlending} />
        </mesh>
      )}

      {/* Holographic Label */}
      {isSelected && (
        <Html distanceFactor={15} position={[0, 0, 2]} style={{ pointerEvents: 'none' }}>
            <div className="bg-black/80 border border-cyber text-cyber p-2 rounded text-[10px] font-mono whitespace-nowrap backdrop-blur-md shadow-[0_0_15px_rgba(0,243,255,0.3)]">
                <div className="font-bold text-white mb-0.5">{threat.name}</div>
                <div className="text-[9px] text-cyber-dim">{threat.coordinates?.[0].toFixed(2)}, {threat.coordinates?.[1].toFixed(2)}</div>
                <div className="text-[8px] text-cyber-alert animate-pulse mt-1">VERROUILLAGE CIBLE</div>
            </div>
        </Html>
      )}

      {(isSelected || hovered) && (
        <pointLight distance={8} intensity={10} color={color} />
      )}
    </group>
  );
};

interface BlipProps {
    position: THREE.Vector3;
    color: string;
}

const Blip: React.FC<BlipProps> = ({ position, color }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [opacity, setOpacity] = useState(1);

    useEffect(() => {
        if (meshRef.current) meshRef.current.lookAt(0,0,0);
    }, []);

    useFrame((_, delta) => {
        if (opacity > 0) {
            setOpacity(prev => Math.max(0, prev - delta * 0.5)); // Fade out speed
        }
    });

    if (opacity <= 0) return null;

    return (
        <mesh ref={meshRef} position={position}>
            <cylinderGeometry args={[0.05, 0, 2, 4]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthTest={false} />
        </mesh>
    );
};

const TrafficBlips: React.FC<{ blips: NetworkBlip[] }> = ({ blips }) => {
    return (
        <group>
            {blips.map((blip) => {
                const [lat, lon] = blip.coordinates;
                const phi = (90 - lat) * (Math.PI / 180);
                const theta = (lon + 180) * (Math.PI / 180);
                // Position slightly above surface
                const r = SPHERE_RADIUS + 0.2; 
                const position = new THREE.Vector3(
                    -r * Math.sin(phi) * Math.cos(theta),
                    r * Math.cos(phi),
                    r * Math.sin(phi) * Math.sin(theta)
                );
                
                return <Blip key={blip.id} position={position} color={blip.color} />;
            })}
        </group>
    );
};

const DataArcs = ({ threats }: { threats: ThreatIntel[] }) => {
    const connections = useMemo(() => {
        return threats.map(t => {
             if (!t.coordinates) return null;
             const [lat, lon] = t.coordinates;
             const phi = (90 - lat) * (Math.PI / 180);
             const theta = (lon + 180) * (Math.PI / 180);
             const start = new THREE.Vector3(
                -(SPHERE_RADIUS) * Math.sin(phi) * Math.cos(theta),
                (SPHERE_RADIUS) * Math.cos(phi),
                (SPHERE_RADIUS) * Math.sin(phi) * Math.sin(theta)
             );
             const end = new THREE.Vector3(0, (Math.random() - 0.5) * 10, 0); 
             const mid = start.clone().add(end).multiplyScalar(1.5).normalize().multiplyScalar(SPHERE_RADIUS * 1.5);
             
             return { start, end, mid, color: t.severity === ThreatLevel.CRITICAL ? '#ff2a6d' : '#00f3ff' };
        }).filter(Boolean);
    }, [threats]);

    return (
        <group>
            {connections.map((c: any, i) => (
                <QuadraticBezierLine
                    key={i}
                    start={c.start}
                    end={c.end}
                    mid={c.mid}
                    color={c.color}
                    lineWidth={1}
                    transparent
                    opacity={0.3}
                />
            ))}
        </group>
    );
};

const ParticleField = () => {
    const count = 500;
    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const particles = useMemo(() => {
        const temp = [];
        for(let i=0; i<count; i++) {
            const r = SPHERE_RADIUS + 5 + Math.random() * 20;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);
            temp.push({ pos: new THREE.Vector3(x, y, z), speed: Math.random() * 0.02 });
        }
        return temp;
    }, []);

    useFrame(() => {
        if(!mesh.current) return;
        particles.forEach((p, i) => {
            dummy.position.copy(p.pos);
            const x = p.pos.x * Math.cos(p.speed) - p.pos.z * Math.sin(p.speed);
            const z = p.pos.x * Math.sin(p.speed) + p.pos.z * Math.cos(p.speed);
            p.pos.x = x;
            p.pos.z = z;
            
            dummy.rotation.set(Math.random(), Math.random(), Math.random());
            dummy.updateMatrix();
            mesh.current!.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            <dodecahedronGeometry args={[0.05, 0]} />
            <meshBasicMaterial color="#00f3ff" transparent opacity={0.4} />
        </instancedMesh>
    );
};

const ScannerRing = () => {
  const outerRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (outerRef.current) {
        // Stable clockwise rotation on Y
        outerRef.current.rotation.y = t * 0.15;
    }
    if (innerRef.current) {
        // Stable counter-clockwise rotation on Y
        innerRef.current.rotation.y = -t * 0.2;
    }
  });

  return (
    <group>
       {/* Outer Main Ring */}
      <group ref={outerRef}>
         <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[SPHERE_RADIUS + 1.2, 0.03, 16, 100]} />
            <meshBasicMaterial color="#00f3ff" transparent opacity={0.6} />
         </mesh>
         {/* Decorative Blips on Ring */}
         <mesh rotation={[Math.PI / 2, 0, 0]}>
             <torusGeometry args={[SPHERE_RADIUS + 1.2, 0.08, 4, 8]} />
             <meshBasicMaterial color="#00f3ff" transparent opacity={0.3} wireframe />
         </mesh>
      </group>

      {/* Inner Fast Ring */}
      <group ref={innerRef}>
         <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[SPHERE_RADIUS + 0.8, 0.02, 16, 100]} />
            <meshBasicMaterial color="#ff2a6d" transparent opacity={0.4} />
         </mesh>
      </group>
    </group>
  );
};

interface VoxelSphereProps {
  threats: ThreatIntel[];
  blips: NetworkBlip[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const VoxelSphere = ({ threats, blips, selectedId, onSelect }: VoxelSphereProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const points = useMemo(() => {
    const temp = [];
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < VOXEL_COUNT; i++) {
      const y = 1 - (i / (VOXEL_COUNT - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      temp.push(new THREE.Vector3(x * SPHERE_RADIUS, y * SPHERE_RADIUS, z * SPHERE_RADIUS));
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0005; // Very slow rotation of the core
    }
  });

  useEffect(() => {
    if (!meshRef.current) return;
    points.forEach((point, i) => {
      dummy.position.copy(point);
      dummy.lookAt(0, 0, 0);
      const noise = Math.random();
      const scale = noise > 0.9 ? 1.5 : noise > 0.6 ? 1.0 : 0.4;
      dummy.scale.set(scale, scale, scale * (Math.random() * 2 + 0.5));
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [points, dummy]);

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, VOXEL_COUNT]}>
        <boxGeometry args={[VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE]} />
        <meshStandardMaterial color="#0b2e33" roughness={0.2} metalness={0.9} />
      </instancedMesh>
      
      <mesh>
        <sphereGeometry args={[SPHERE_RADIUS * 0.98, 32, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      <mesh>
        <sphereGeometry args={[SPHERE_RADIUS + 0.2, 32, 32]} />
        <meshBasicMaterial color="#00f3ff" wireframe transparent opacity={0.03} />
      </mesh>

      <ScannerRing />
      <DataArcs threats={threats} />
      <TrafficBlips blips={blips || []} />
      <ParticleField />

      {threats.map((threat) => {
        if (!threat.coordinates) return null;
        const [lat, lon] = threat.coordinates;
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        const x = -(SPHERE_RADIUS + 0.5) * Math.sin(phi) * Math.cos(theta);
        const z = (SPHERE_RADIUS + 0.5) * Math.sin(phi) * Math.sin(theta);
        const y = (SPHERE_RADIUS + 0.5) * Math.cos(phi);

        return (
          <ThreatMarker 
            key={threat.id} 
            position={[x, y, z]} 
            threat={threat}
            isSelected={selectedId === threat.id}
            onSelect={() => onSelect(threat.id)}
          />
        );
      })}
    </group>
  );
};

interface VoxelMapProps {
  threats: ThreatIntel[];
  blips?: NetworkBlip[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const VoxelMap: React.FC<VoxelMapProps> = ({ threats, blips = [], selectedId, onSelect }) => {
  return (
    <div className="w-full h-full relative group bg-black">
      <Canvas camera={{ position: [0, 10, 28], fov: 35 }} dpr={[1, 2]}>
        <color attach="background" args={['#010508']} />
        <fog attach="fog" args={['#010508', 20, 80]} />
        
        <ambientLight intensity={0.2} />
        <pointLight position={[20, 20, 20]} intensity={2} color="#00f3ff" />
        <pointLight position={[-20, -10, -20]} intensity={1.5} color="#ff2a6d" />
        
        <Stars radius={150} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />
        
        <VoxelSphere threats={threats} blips={blips} selectedId={selectedId} onSelect={onSelect} />
        
        <OrbitControls 
          enableZoom={true} 
          minDistance={18} 
          maxDistance={60}
          autoRotate 
          autoRotateSpeed={0.5} 
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
      
      <div className="absolute top-4 left-4 pointer-events-none select-none">
         <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2">
                 <div className="h-[1px] w-8 bg-cyber/50"></div>
                 <span className="text-[10px] font-mono text-cyber tracking-widest">GRILLE_GLOBALE_V2</span>
             </div>
             <div className="text-[40px] leading-none font-bold text-cyber/10 font-mono">
                 {threats.length.toString().padStart(3, '0')}
             </div>
         </div>
      </div>
      
      <div className="absolute bottom-4 left-4 text-xs font-mono text-cyber-glow pointer-events-none bg-black/50 p-2 border-l-2 border-cyber backdrop-blur-sm select-none">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-cyber rounded-full animate-pulse"></div>
            <span>MOTEUR VOXEL: PERFORMANCE_MAX</span>
          </div>
          <div className="text-gray-400">ARCS_DONNÉES: ACTIF</div>
          <div className="text-gray-400">PARTICULES: 500</div>
          <div className="text-gray-400">TRAFIC: {blips.length} SIGNAUX</div>
        </div>
      </div>
    </div>
  );
};

export default VoxelMap;