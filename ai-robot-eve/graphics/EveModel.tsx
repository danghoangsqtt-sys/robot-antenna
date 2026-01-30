
import React, { useMemo } from 'react';
import * as THREE from 'three';

interface EveModelProps {
  headRef: React.RefObject<THREE.Group>;
  eyeColor: string;
  eyeIntensity: number;
  isBlinking: boolean;
}

export const EveModel: React.FC<EveModelProps> = ({ 
  headRef, eyeColor, eyeIntensity, isBlinking 
}) => {
  
  // Body: Ceramic White (High quality matte plastic look)
  const bodyMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#f2f4f7',
    roughness: 0.25,
    metalness: 0.05,
    clearcoat: 0.5,
    clearcoatRoughness: 0.1,
    side: THREE.FrontSide
  }), []);

  // Visor: Glossy Black Glass (High reflectivity, slight transparency)
  const faceMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#050505',
    roughness: 0.05,
    metalness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    opacity: 0.95,
    transparent: true
  }), []);

  // Eyes: Glowing LED Display (Flat, emitting light)
  const eyeMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(eyeColor),
    toneMapped: false,
  }), [eyeColor]);

  return (
    <group>
      {/* BODY: Clean Monolithic Droplet Shape (No Arms) */}
      <mesh position={[0, -1.0, 0]} material={bodyMaterial}>
        <capsuleGeometry args={[0.9, 1.5, 4, 32]} />
      </mesh>
      
      {/* HEAD: Floating Sphere - Scaled up slightly for cuteness */}
      <group ref={headRef} position={[0, 0.65, 0]}>
         {/* Main Head Shell */}
         <mesh scale={[1.2, 1.0, 1.1]}>
             <sphereGeometry args={[1.0, 64, 64]} />
             <primitive object={bodyMaterial} attach="material" />
         </mesh>

         {/* VISOR: Seamless Black Glass Insert */}
         {/* Positioned to intersect the head sphere smoothly */}
         <group position={[0, -0.2, 0.98]} rotation={[-0.1, 0, 0]}>
             <mesh scale={[0.9, 0.65, 0.3]}>
                <sphereGeometry args={[1.0, 64, 64, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
                <primitive object={faceMaterial} attach="material" />
             </mesh>

             {/* EYES: Embedded inside the visor surface */}
             <group position={[0, 0.05, 0.9]} scale={[0.65, 0.65, 0.65]}>
                 <group scale={[1, isBlinking ? 0.05 : 1, 1]} transition-all duration-100>
                     {/* Left Eye */}
                     <mesh position={[-0.65, 0, 0]} rotation={[0, -0.15, 1.57]}>
                         <capsuleGeometry args={[0.35, 0.8, 4, 16]} />
                         <primitive object={eyeMaterial} attach="material" />
                     </mesh>
                     {/* Right Eye */}
                     <mesh position={[0.65, 0, 0]} rotation={[0, 0.15, 1.57]}>
                         <capsuleGeometry args={[0.35, 0.8, 4, 16]} />
                         <primitive object={eyeMaterial} attach="material" />
                     </mesh>
                 </group>
                 {/* Internal Glow Reflection */}
                 <pointLight color={eyeColor} intensity={eyeIntensity * 0.8} distance={1.2} decay={2} position={[0, 0, 0.2]} />
             </group>
         </group>
      </group>
      
      {/* ENGINE GLOW: Subtle clean energy ring */}
      <mesh position={[0, -2.0, 0]} rotation={[1.57, 0, 0]}>
          <ringGeometry args={[0.1, 0.6, 64]} />
          <meshBasicMaterial color={eyeColor} transparent opacity={0.1} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};
