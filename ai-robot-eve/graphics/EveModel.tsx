
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
  // Refs
  const laserRef = useRef<THREE.Group>(null); 
  const textRef = useRef<any>(null); // Ref for blinking text
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  // Gesture State for Animation
  const gestureState = useRef({
      type: 'IDLE', // 'IDLE', 'HEAD', 'BUTT'
      timeLeft: 0,
      nextActionDelay: 2 + Math.random() * 3
  });

  useFrame((state, delta) => {
    // Note: Head tracking logic is delegated to EveAnimation.tsx

    // 1. Laser Animation
    if (laserRef.current) {
        const targetScale = isChatOpen ? 1 : 0;
        laserRef.current.scale.z = THREE.MathUtils.lerp(laserRef.current.scale.z, targetScale, 0.15);
        laserRef.current.visible = laserRef.current.scale.z > 0.01;
    }

    // 2. Text Blinking Effect (Neon Pulse)
    if (textRef.current) {
        const t = state.clock.getElapsedTime();
        const opacity = 0.6 + 0.4 * Math.sin(t * 8); 
        textRef.current.fillOpacity = opacity;
        const scalePulse = 1 + 0.05 * Math.sin(t * 8);
        textRef.current.scale.set(scalePulse, scalePulse, 1);
    }

    // 3. Arm Animation (Flexible Movement + Random Gestures)
    if (leftArmRef.current && rightArmRef.current) {
        const t = state.clock.getElapsedTime();
        const gs = gestureState.current;

        // --- State Machine ---
        if (gs.type === 'IDLE') {
            gs.nextActionDelay -= delta;
            if (gs.nextActionDelay <= 0) {
                // Pick random action
                const rand = Math.random();
                if (rand < 0.4) {
                    gs.type = 'HEAD'; // Scratch head (Right arm)
                    gs.timeLeft = 3.0;
                } else if (rand < 0.7) {
                    gs.type = 'BUTT'; // Scratch butt (Left arm)
                    gs.timeLeft = 3.5;
                } else {
                    gs.type = 'WAVE'; // Small wave (optional, mapped to HEAD logic roughly or IDLE variance)
                    gs.timeLeft = 2.0; 
                }
                // If fell through, just reset timer short
                if (gs.timeLeft <= 0) gs.nextActionDelay = 2; 
            }
        } else {
            gs.timeLeft -= delta;
            if (gs.timeLeft <= 0) {
                gs.type = 'IDLE';
                gs.nextActionDelay = 4 + Math.random() * 6; // 4-10s delay
            }
        }

        // --- Calculate Target Rotations ---
        
        // Default Idle (Swinging arms freely)
        // Arms sway opposite to each other slightly like walking/hovering
        let leftTargetZ = 0.15 + Math.sin(t * 0.5) * 0.05; 
        let leftTargetX = Math.sin(t * 1.5) * 0.2; 
        
        let rightTargetZ = -0.15 - Math.sin(t * 0.5) * 0.05;
        let rightTargetX = -Math.sin(t * 1.5) * 0.2; 

        // Apply Gesture Overrides
        if (gs.type === 'HEAD') {
            // Right arm scratches head
            // Lift arm up (Rotate Z negative towards -PI)
            // Wiggle X for scratching motion
            rightTargetZ = -2.5 + Math.sin(t * 2) * 0.1; 
            rightTargetX = 0.3 + Math.sin(t * 15) * 0.1; // Fast scratch
        } 
        else if (gs.type === 'BUTT') {
            // Left arm scratches butt/side
            // Move arm back (X negative)
            leftTargetX = -0.6 + Math.sin(t * 15) * 0.05; 
            leftTargetZ = 0.1; // Tuck in
        }
        else if (gs.type === 'WAVE') {
             // Just swing wider
             leftTargetX = Math.sin(t * 3) * 0.4;
             rightTargetX = -Math.sin(t * 3) * 0.4;
        }

        // --- Apply Physics (Lerp) ---
        const lerpSpeed = 4.0 * delta; // Frame-rate independent lerp
        
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, leftTargetZ, lerpSpeed);
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, leftTargetX, lerpSpeed);

        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, rightTargetZ, lerpSpeed);
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, rightTargetX, lerpSpeed);
    }
  });
  
  // --- MATERIALS ---
  const bodyMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#f8fafb', // Bright white (NOT off-white)
    roughness: 0.15,  // Shinier, more glossy
    metalness: 0.08,  // Subtle metallic
    clearcoat: 0.9,   // Strong clearcoat for that plastic shine
    clearcoatRoughness: 0.08,
    side: THREE.FrontSide
  }), []);

  // Visor: Deep black (NO cyan color - pure black for contrast with blue eyes)
  const visorMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#000000', // Pure black
    emissive: '#1a1a1a', // Very subtle dark gray glow
    emissiveIntensity: 0.1, // Minimal glow
    roughness: 0.4, 
    metalness: 0.2,
    clearcoat: 0.85, 
    clearcoatRoughness: 0.15
  }), []);

  const eyeMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(eyeColor), toneMapped: false }), [eyeColor]);
  
  const neckMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#6b7280',
    roughness: 0.25,
    metalness: 0.1,
    clearcoat: 0.5
  }), []);
  
  const laserMaterial = useMemo(() => new THREE.MeshBasicMaterial({ 
      color: '#06b6d4', 
      transparent: true, 
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
  }), []);

  return (
    <group 
      scale={[0.6, 0.6, 0.6]}
      onClick={onClick} 
      onPointerOver={onPointerOver} 
      onPointerOut={onPointerOut}
    >
      {/* --- MAIN BODY: Smooth Egg/Oval Shape (NO POINTED TAIL) --- */}
      <group position={[0, -0.5, 0]}>
          {/* Large Rounded Torso (Lathe-like egg shape with tapering) */}
          {/* Upper bulging section */}
          <mesh position={[0, 0.3, 0]}>
             <sphereGeometry args={[0.85, 48, 48, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
             <primitive object={bodyMaterial} attach="material" />
          </mesh>
          
          {/* Main torso - Smooth cylinder taper (NOT pointy) */}
          <mesh position={[0, -0.25, 0]}>
             <cylinderGeometry args={[0.85, 0.65, 1.1, 48]} />
             <primitive object={bodyMaterial} attach="material" />
          </mesh>

          {/* Bottom rounded section (smooth hemisphere, NOT sharp point) */}
          <mesh position={[0, -0.85, 0]} scale={[1, 0.7, 1]}>
             <sphereGeometry args={[0.65, 48, 48, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5]} />
             <primitive object={bodyMaterial} attach="material" />
          </mesh>
      </group>

      {/* --- ARMS: Proportional with Upper Section (Biceps/Shoulders) --- */}
      {/* Left Arm - Upper thick section + Lower thin section */}
      <group ref={leftArmRef} position={[-0.92, -0.1, 0]} rotation={[0, 0, 0.2]}>
          {/* Upper arm (bicep/shoulder) - Wider */}
          <mesh position={[0, 0.1, 0]}>
              <capsuleGeometry args={[0.22, 0.4, 8, 32]} />
              <primitive object={bodyMaterial} attach="material" />
          </mesh>
          {/* Lower arm - Thinner */}
          <mesh position={[0, -0.45, 0]}>
              <capsuleGeometry args={[0.14, 0.8, 6, 24]} />
              <primitive object={bodyMaterial} attach="material" />
          </mesh>
      </group>

      {/* Right Arm - Upper thick section + Lower thin section */}
      <group ref={rightArmRef} position={[0.92, -0.1, 0]} rotation={[0, 0, -0.2]}>
          {/* Upper arm (bicep/shoulder) - Wider */}
          <mesh position={[0, 0.1, 0]}>
              <capsuleGeometry args={[0.22, 0.4, 8, 32]} />
              <primitive object={bodyMaterial} attach="material" />
          </mesh>
          {/* Lower arm - Thinner */}
          <mesh position={[0, -0.45, 0]}>
              <capsuleGeometry args={[0.14, 0.8, 6, 24]} />
              <primitive object={bodyMaterial} attach="material" />
          </mesh>
      </group>

      {/* SYSTEM LOGO - DHsystem (Positioned on body side) */}
      <Text
        ref={textRef}
        position={[0, -0.5, 0.88]} 
        rotation={[0, 0, 0]}
        fontSize={0.16}
        anchorX="center"
        anchorY="middle"
      >
        DHsystem
        <meshBasicMaterial color="#00ff41" toneMapped={false} transparent opacity={0.9} />
      </Text>

      {/* --- LASER PROJECTOR --- */}
      <group position={[0, -0.2, 0.88]} rotation={[0, 0, 0]}> 
          <mesh rotation={[1.57, 0, 0]}>
              <ringGeometry args={[0.06, 0.14, 48]} />
              <meshBasicMaterial color={isChatOpen ? "#06b6d4" : "#2a3441"} toneMapped={false} />
          </mesh>
          <group ref={laserRef} visible={false}>
               <mesh position={[0, 0, 10]} rotation={[1.57, 0, 0]}> 
                   <cylinderGeometry args={[0.025, 0.085, 20, 24, 1, true]} /> 
                   <primitive object={laserMaterial} attach="material" />
               </mesh>
               <mesh position={[0, 0, 10]} rotation={[1.57, 0, 0]}>
                   <cylinderGeometry args={[0.008, 0.012, 20, 12]} />
                   <meshBasicMaterial color="#ffffff" transparent opacity={0.85} blending={THREE.AdditiveBlending} />
               </mesh>
          </group>
      </group>

      {/* --- HEAD & FACE: Rounded, Proportioned --- */}
      <group ref={headRef} position={[0, 0.85, 0]}>
         {/* Head - Gently rounded (NOT pointed/elongated) */}
         <mesh scale={[1.05, 1.18, 1.0]}> 
             <sphereGeometry args={[0.72, 64, 64]} />
             <primitive object={bodyMaterial} attach="material" />
         </mesh>

         {/* VISOR: Large but proportional */}
         <group rotation={[Math.PI / 2, 0, 0]}>
             <mesh>
                <sphereGeometry args={[0.75, 64, 64, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
                <primitive object={visorMaterial} attach="material" />
             </mesh>
         </group>

         {/* EYES: Balanced size, far apart but not oversized */}
         <group position={[0, 0.18, 0.77]} rotation={[-0.1, 0, 0]}>
             <group scale={[1, isBlinking ? 0.05 : 1, 1]}>
                 {/* Left eye - balanced, slanted */}
                 <mesh position={[-0.34, 0.02, 0]} rotation={[0, -0.4, 1.57]} scale={[1.05, 0.95, 0.1]}>
                     <capsuleGeometry args={[0.13, 0.3, 4, 24]} />
                     <primitive object={eyeMaterial} attach="material" />
                 </mesh>
                 {/* Right eye - balanced, slanted */}
                 <mesh position={[0.34, 0.02, 0]} rotation={[0, 0.4, 1.57]} scale={[1.05, 0.95, 0.1]}>
                     <capsuleGeometry args={[0.13, 0.3, 4, 24]} />
                     <primitive object={eyeMaterial} attach="material" />
                 </mesh>
             </group>
             {/* Eye glow */}
             <pointLight color={eyeColor} intensity={eyeIntensity * 0.6} distance={2.4} decay={2} position={[0, 0, 0.48]} />
         </group>
      </group>

      {/* NECK/COLLAR BAND - Gray accent between head and body */}
      <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.82, 0.78, 0.22, 48]} />
          <primitive object={neckMaterial} attach="material" />
      </mesh>
      
      {/* Engine Glow - Bottom accent */}
      <mesh position={[0, -1.35, 0]} rotation={[1.57, 0, 0]}>
          <ringGeometry args={[0.08, 0.5, 64]} />
          <meshBasicMaterial color={eyeColor} transparent opacity={0.15} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};
