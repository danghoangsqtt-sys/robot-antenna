import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

/**
 * EveModelUpgraded
 * Cinema-grade EVE robot design inspired by Wall-E film
 * Features:
 * - Large expressive cyan eyes with glow
 * - Glossy white spherical head with visor
 * - Smooth rounded body with metallic finish
 * - Articulated arms with gesture system
 * - Advanced lighting and materials
 */

interface EveModelProps {
  headRef: React.RefObject<THREE.Group>;
  eyeColor: string;
  eyeIntensity: number;
  isBlinking: boolean;
  isChatOpen?: boolean;
  onClick?: (e: any) => void;
  onPointerOver?: (e: any) => void;
  onPointerOut?: (e: any) => void;
}

export const EveModelUpgraded: React.FC<EveModelProps> = ({
  headRef,
  eyeColor,
  eyeIntensity,
  isBlinking,
  isChatOpen = false,
  onClick,
  onPointerOver,
  onPointerOut,
}) => {
  const laserRef = useRef<THREE.Group>(null);
  const textRef = useRef<any>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);

  const gestureState = useRef({
    type: 'IDLE',
    timeLeft: 0,
    nextActionDelay: 2 + Math.random() * 3,
  });

  useFrame((state, delta) => {
    // Laser animation
    if (laserRef.current) {
      const targetScale = isChatOpen ? 1 : 0;
      laserRef.current.scale.z = THREE.MathUtils.lerp(laserRef.current.scale.z, targetScale, 0.15);
      laserRef.current.visible = laserRef.current.scale.z > 0.01;
    }

    // Text pulsing effect
    if (textRef.current) {
      const t = state.clock.getElapsedTime();
      const opacity = 0.7 + 0.3 * Math.sin(t * 6);
      textRef.current.fillOpacity = opacity;
      const scalePulse = 1 + 0.03 * Math.sin(t * 6);
      textRef.current.scale.set(scalePulse, scalePulse, 1);
    }

    // Body idle floating (subtle sine wave)
    if (bodyRef.current) {
      const t = state.clock.getElapsedTime();
      bodyRef.current.position.y = Math.sin(t * 1.2) * 0.04;
      bodyRef.current.rotation.z = Math.sin(t * 0.6) * 0.01;
    }

    // Arm gesture system
    if (leftArmRef.current && rightArmRef.current) {
      const t = state.clock.getElapsedTime();
      const gs = gestureState.current;

      if (gs.type === 'IDLE') {
        gs.nextActionDelay -= delta;
        if (gs.nextActionDelay <= 0) {
          const rand = Math.random();
          if (rand < 0.35) {
            gs.type = 'HEAD';
            gs.timeLeft = 2.5;
          } else if (rand < 0.65) {
            gs.type = 'BUTT';
            gs.timeLeft = 3.0;
          } else {
            gs.type = 'WAVE';
            gs.timeLeft = 2.0;
          }
        }
      } else {
        gs.timeLeft -= delta;
        if (gs.timeLeft <= 0) {
          gs.type = 'IDLE';
          gs.nextActionDelay = 3 + Math.random() * 5;
        }
      }

      // Idle arm swaying
      let leftTargetZ = 0.12 + Math.sin(t * 0.4) * 0.04;
      let leftTargetX = Math.sin(t * 1.2) * 0.15;

      let rightTargetZ = -0.12 - Math.sin(t * 0.4) * 0.04;
      let rightTargetX = -Math.sin(t * 1.2) * 0.15;

      // Gesture overrides
      if (gs.type === 'HEAD') {
        rightTargetZ = -2.3 + Math.sin(t * 2.5) * 0.15;
        rightTargetX = 0.4 + Math.sin(t * 18) * 0.12;
      } else if (gs.type === 'BUTT') {
        leftTargetX = -0.5 + Math.sin(t * 16) * 0.08;
        leftTargetZ = 0.15;
      } else if (gs.type === 'WAVE') {
        leftTargetX = Math.sin(t * 2.5) * 0.35;
        rightTargetX = -Math.sin(t * 2.5) * 0.35;
      }

      const lerpSpeed = 3.5 * delta;

      if (leftArmRef.current) {
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(
          leftArmRef.current.rotation.z,
          leftTargetZ,
          lerpSpeed
        );
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(
          leftArmRef.current.rotation.x,
          leftTargetX,
          lerpSpeed
        );
      }

      if (rightArmRef.current) {
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.z,
          rightTargetZ,
          lerpSpeed
        );
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.x,
          rightTargetX,
          lerpSpeed
        );
      }
    }
  });

  // === PREMIUM MATERIALS ===

  // Glossy white body (metallic ceramic)
  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        roughness: 0.15,
        metalness: 0.4,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        envMapIntensity: 1.2,
      }),
    []
  );

  // Screen visor: dark with cyan glow
  const screenMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#0a1628',
        emissive: '#00d4ff',
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.6,
        clearcoat: 0.9,
        clearcoatRoughness: 0.2,
      }),
    []
  );

  // Eyes: bright cyan with glow
  const eyeMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(eyeColor),
        toneMapped: false,
      }),
    [eyeColor]
  );

  // Eye backlight for depth
  const eyeGlowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: eyeColor,
        transparent: true,
        opacity: 0.3,
        toneMapped: false,
      }),
    [eyeColor]
  );

  const laserMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#06b6d4',
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    []
  );

  return (
    <group scale={[0.55, 0.55, 0.55]} onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      {/* === BODY === */}
      <group ref={bodyRef} position={[0, -0.9, 0]}>
        {/* Upper body: smooth rounded shoulders */}
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.8, 48, 48, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <primitive object={bodyMaterial} attach="material" />
        </mesh>

        {/* Main torso: smooth cylinder */}
        <mesh position={[0, -0.25, 0]}>
          <cylinderGeometry args={[0.78, 0.12, 1.3, 48]} />
          <primitive object={bodyMaterial} attach="material" />
        </mesh>

        {/* Bottom tip: polished sphere */}
        <mesh position={[0, -0.95, 0]}>
          <sphereGeometry args={[0.14, 32, 32]} />
          <primitive object={bodyMaterial} attach="material" />
        </mesh>

        {/* Subtle engine glow ring */}
        <mesh position={[0, -1.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.08, 0.45, 64]} />
          <meshBasicMaterial
            color={eyeColor}
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* === ARMS === */}
      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.92, -0.65, 0]} rotation={[0, 0, 0.15]}>
        <mesh>
          <capsuleGeometry args={[0.13, 0.85, 6, 24]} />
          <primitive object={bodyMaterial} attach="material" />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.92, -0.65, 0]} rotation={[0, 0, -0.15]}>
        <mesh>
          <capsuleGeometry args={[0.13, 0.85, 6, 24]} />
          <primitive object={bodyMaterial} attach="material" />
        </mesh>
      </group>

      {/* === LOGO TEXT === */}
      <Text
        ref={textRef}
        position={[0, -0.85, 0.78]}
        rotation={[0, 0, 0]}
        fontSize={0.16}
        anchorX="center"
        anchorY="middle"
      >
        EVE
        <meshBasicMaterial color="#00ff41" toneMapped={false} transparent opacity={0.9} />
      </Text>

      {/* === LASER PROJECTOR === */}
      <group position={[0, -0.5, 0.75]} rotation={[0, 0, 0]}>
        {/* Projector base (ring) */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.045, 0.125, 48]} />
          <meshBasicMaterial color={isChatOpen ? '#06b6d4' : '#465a75'} toneMapped={false} />
        </mesh>

        {/* Laser beam */}
        <group ref={laserRef} visible={false}>
          <mesh position={[0, 0, 10]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.022, 0.09, 20, 24, 1, true]} />
            <primitive object={laserMaterial} attach="material" />
          </mesh>
          <mesh position={[0, 0, 10]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.006, 0.012, 20, 12]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      </group>

      {/* === HEAD & VISOR === */}
      <group ref={headRef} position={[0, 0.7, 0]}>
        {/* Head: large glossy sphere */}
        <mesh scale={[1.1, 1.0, 1.05]}>
          <sphereGeometry args={[0.88, 64, 64]} />
          <primitive object={bodyMaterial} attach="material" />
        </mesh>

        {/* Visor: curved screen surface (larger coverage) */}
        <group rotation={[Math.PI / 2, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.89, 64, 64, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
            <primitive object={screenMaterial} attach="material" />
          </mesh>
        </group>

        {/* === EYES (Large & Expressive) === */}
        <group position={[0, 0.15, 0.92]} rotation={[-0.08, 0, 0]}>
          {/* Eye whites/background (subtle) */}
          <mesh position={[0, 0, 0.02]}>
            <circleGeometry args={[0.32, 32]} />
            <meshBasicMaterial color="#1a2a3a" toneMapped={false} />
          </mesh>

          {/* Blink container */}
          <group scale={[1, isBlinking ? 0.01 : 1, 1]}>
            {/* Left eye */}
            <mesh position={[-0.38, 0, 0]} rotation={[0, -0.15, 1.57]} scale={[1, 1, 0.08]}>
              <capsuleGeometry args={[0.2, 0.42, 8, 32]} />
              <primitive object={eyeMaterial} attach="material" />
            </mesh>

            {/* Eye glow backlight (left) */}
            <mesh position={[-0.38, 0, 0.15]}>
              <sphereGeometry args={[0.19, 24, 24]} />
              <primitive object={eyeGlowMaterial} attach="material" />
            </mesh>

            {/* Right eye */}
            <mesh position={[0.38, 0, 0]} rotation={[0, 0.15, 1.57]} scale={[1, 1, 0.08]}>
              <capsuleGeometry args={[0.2, 0.42, 8, 32]} />
              <primitive object={eyeMaterial} attach="material" />
            </mesh>

            {/* Eye glow backlight (right) */}
            <mesh position={[0.38, 0, 0.15]}>
              <sphereGeometry args={[0.19, 24, 24]} />
              <primitive object={eyeGlowMaterial} attach="material" />
            </mesh>
          </group>

          {/* Point light for eye illumination */}
          <pointLight
            color={eyeColor}
            intensity={eyeIntensity * 1.2}
            distance={4}
            decay={2.2}
            position={[0, 0, 0.8]}
          />
        </group>
      </group>

      {/* === AMBIENT GLOW === */}
      <pointLight color="#ffffff" intensity={0.3} distance={3} decay={2} position={[0, 0, 0]} />
    </group>
  );
};
