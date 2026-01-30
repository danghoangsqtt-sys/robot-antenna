import React, { useMemo } from 'react';
import * as THREE from 'three';

interface EveModelProps {
  headRef: React.RefObject<THREE.Group>;
  eyeColor: string;
  eyeIntensity: number;
  isBlinking: boolean;
  onClick?: (e: any) => void;
  onPointerOver?: (e: any) => void;
  onPointerOut?: (e: any) => void;
}

export const EveModel: React.FC<EveModelProps> = ({ 
  headRef, eyeColor, eyeIntensity, isBlinking,
  onClick, onPointerOver, onPointerOut
}) => {
  
  // Advanced PBR Material - Clean White Plastic/Ceramic
  const bodyMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#f2f4f7',
    roughness: 0.25,
    metalness: 0.05,
    clearcoat: 0.5,
    clearcoatRoughness: 0.1,
    reflectivity: 0.5,
    side: THREE.FrontSide
  }), []);

  // Visor Material - Black Glossy Glass
  const visorMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#000000',
    roughness: 0.1,
    metalness: 0.9,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    reflectivity: 0.2, 
  }), []);

  // Eye Material - Digital Glow
  const eyeMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(eyeColor),
    toneMapped: false,
  }), [eyeColor]);

  return (
    <group 
      onClick={onClick} 
      onPointerOver={onPointerOver} 
      onPointerOut={onPointerOut}
    >
      {/* BODY: Floating Capsule - Clean & Armless */}
      <mesh position={[0, -0.8, 0]} material={bodyMaterial}>
        <capsuleGeometry args={[0.65, 1.0, 4, 32]} />
      </mesh>

      {/* HEAD Group - Scaled Up */}
      <group ref={headRef} position={[0, 0.6, 0]}>
         {/* Head Shell - Soft Oval Shape */}
         <mesh scale={[1.35, 1.0, 1.1]}>
             <sphereGeometry args={[0.85, 64, 64]} />
             <primitive object={bodyMaterial} attach="material" />
         </mesh>

         {/* VISOR: Inset Black Glass Panel */}
         <group position={[0, 0, 0.62]} rotation={[-0.05, 0, 0]}>
             {/* The Black Glass Screen */}
             <mesh scale={[1.1, 0.75, 0.3]} position={[0, 0, 0.15]}>
                <sphereGeometry args={[0.82, 64, 64, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
                <primitive object={visorMaterial} attach="material" />
             </mesh>

             {/* EYES: Digital displays embedded on the surface */}
             <group position={[0, 0.05, 0.53]} rotation={[-0.1, 0, 0]}>
                 <group scale={[1, isBlinking ? 0.02 : 1, 1]}>
                     {/* Left Eye - Flattened Capsule */}
                     <mesh position={[-0.35, 0, 0]} rotation={[0, -0.2, 1.57]} scale={[1, 1, 0.1]}>
                         <capsuleGeometry args={[0.15, 0.35, 4, 16]} />
                         <primitive object={eyeMaterial} attach="material" />
                     </mesh>
                     
                     {/* Right Eye - Flattened Capsule */}
                     <mesh position={[0.35, 0, 0]} rotation={[0, 0.2, 1.57]} scale={[1, 1, 0.1]}>
                         <capsuleGeometry args={[0.15, 0.35, 4, 16]} />
                         <primitive object={eyeMaterial} attach="material" />
                     </mesh>
                 </group>
                 
                 {/* Eye Glow Light */}
                 <pointLight color={eyeColor} intensity={eyeIntensity * 0.5} distance={2} decay={2} position={[0, 0, 0.5]} />
             </group>
         </group>
      </group>
      
      {/* GLOW: Engine / Floating Field */}
      <mesh position={[0, -1.6, 0]} rotation={[1.57, 0, 0]}>
          <ringGeometry args={[0.1, 0.5, 64]} />
          <meshBasicMaterial color={eyeColor} transparent opacity={0.3} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};