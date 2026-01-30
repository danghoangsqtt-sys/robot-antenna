
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { EveController } from '../core/EveController';

interface EveModelProps {
  headRef: React.RefObject<THREE.Group>;
  eyeColor: string;
  eyeIntensity: number;
  isBlinking: boolean;
  isChatOpen?: boolean; // Prop to control laser
  onClick?: (e: any) => void;
  onPointerOver?: (e: any) => void;
  onPointerOut?: (e: any) => void;
}

export const EveModel: React.FC<EveModelProps> = ({ 
  headRef, eyeColor, eyeIntensity, isBlinking, isChatOpen = false,
  onClick, onPointerOver, onPointerOut
}) => {
  // Laser Ref
  const laserRef = useRef<THREE.Group>(null); 

  useFrame((state) => {
    // Note: Head tracking logic is delegated to EveAnimation.tsx
    // This ensures cleaner separation of concerns.

    // Laser Animation Logic
    if (laserRef.current) {
        const targetScale = isChatOpen ? 1 : 0;
        laserRef.current.scale.z = THREE.MathUtils.lerp(laserRef.current.scale.z, targetScale, 0.15);
        laserRef.current.visible = laserRef.current.scale.z > 0.01;
    }
  });
  
  // --- MATERIALS ---
  const bodyMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#f2f4f7', roughness: 0.2, metalness: 0.1, clearcoat: 0.8, side: THREE.FrontSide
  }), []);

  const visorMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#050505', roughness: 0.05, metalness: 0.95, clearcoat: 1.0, 
  }), []);

  const eyeMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(eyeColor), toneMapped: false }), [eyeColor]);
  
  const laserMaterial = useMemo(() => new THREE.MeshBasicMaterial({ 
      color: '#06b6d4', 
      transparent: true, 
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
  }), []);

  return (
    <group 
      scale={[0.55, 0.55, 0.55]}
      onClick={onClick} 
      onPointerOver={onPointerOver} 
      onPointerOut={onPointerOut}
    >
      {/* BODY CAPSULE */}
      <mesh position={[0, -0.8, 0]} material={bodyMaterial}>
        <capsuleGeometry args={[0.65, 1.0, 4, 32]} />
      </mesh>

      {/* SYSTEM LOGO - DHsystem (Glowing Green) */}
      <Text
        position={[0, -0.85, 0.66]} 
        rotation={[0, 0, 0]}
        fontSize={0.15}
        color="#00ff41" 
        anchorX="center"
        anchorY="middle"
      >
        DHsystem
        <meshBasicMaterial color="#00ff41" toneMapped={false} />
      </Text>

      {/* --- LASER PROJECTOR --- */}
      <group position={[0, -0.5, 0.6]} rotation={[0, 0, 0]}> 
          {/* Projector Node */}
          <mesh rotation={[1.57, 0, 0]}>
              <ringGeometry args={[0.05, 0.12, 32]} />
              <meshBasicMaterial color={isChatOpen ? "#06b6d4" : "#334155"} toneMapped={false} />
          </mesh>

          {/* Laser Beam Group */}
          <group ref={laserRef} visible={false}>
               <mesh position={[0, 0, 10]} rotation={[1.57, 0, 0]}> 
                   <cylinderGeometry args={[0.02, 0.08, 20, 16, 1, true]} /> 
                   <primitive object={laserMaterial} attach="material" />
               </mesh>
               <mesh position={[0, 0, 10]} rotation={[1.57, 0, 0]}>
                   <cylinderGeometry args={[0.005, 0.01, 20, 8]} />
                   <meshBasicMaterial color="#ffffff" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
               </mesh>
          </group>
      </group>

      {/* HEAD */}
      <group ref={headRef} position={[0, 0.6, 0]}>
         <mesh scale={[1.35, 1.0, 1.1]}> 
             <sphereGeometry args={[0.85, 64, 64]} />
             <primitive object={bodyMaterial} attach="material" />
         </mesh>
         {/* Visor & Eyes */}
         <group position={[0, 0, 0.62]} rotation={[-0.05, 0, 0]}>
             <mesh scale={[1.1, 0.75, 0.3]} position={[0, 0, 0.15]}>
                <sphereGeometry args={[0.82, 64, 64, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
                <primitive object={visorMaterial} attach="material" />
             </mesh>
             <group position={[0, 0.05, 0.53]} rotation={[-0.1, 0, 0]}>
                 <group scale={[1, isBlinking ? 0.02 : 1, 1]}>
                     <mesh position={[-0.35, 0, 0]} rotation={[0, -0.2, 1.57]} scale={[1, 1, 0.1]}>
                         <capsuleGeometry args={[0.15, 0.35, 4, 16]} />
                         <primitive object={eyeMaterial} attach="material" />
                     </mesh>
                     <mesh position={[0.35, 0, 0]} rotation={[0, 0.2, 1.57]} scale={[1, 1, 0.1]}>
                         <capsuleGeometry args={[0.15, 0.35, 4, 16]} />
                         <primitive object={eyeMaterial} attach="material" />
                     </mesh>
                 </group>
                 <pointLight color={eyeColor} intensity={eyeIntensity * 0.8} distance={3} decay={2} position={[0, 0, 0.5]} />
             </group>
         </group>
      </group>
      
      {/* Engine Glow */}
      <mesh position={[0, -1.6, 0]} rotation={[1.57, 0, 0]}>
          <ringGeometry args={[0.1, 0.5, 64]} />
          <meshBasicMaterial color={eyeColor} transparent opacity={0.4} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};
