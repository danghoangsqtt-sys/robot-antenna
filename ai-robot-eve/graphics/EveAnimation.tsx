
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const useEveAnimation = (
  groupRef: React.RefObject<THREE.Group>,
  headRef: React.RefObject<THREE.Group>,
  status: string
) => {
  const timeRef = useRef(0);
  const blinkTimerRef = useRef(Math.random() * 5);
  const [isBlinking, setIsBlinking] = useState(false);
  
  // Smooth mouse tracking vectors
  const mouse = useRef(new THREE.Vector2(0, 0));
  const targetRotation = useRef(new THREE.Vector2(0, 0));
  
  // Update mouse pos with pre-smoothing
  useFrame((state) => {
      // Lerp the raw pointer input to filter out high-frequency noise/jitter
      mouse.current.lerp(state.pointer, 0.1);
  });

  useFrame((state, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    // --- BLINK LOGIC ---
    blinkTimerRef.current -= delta;
    if (blinkTimerRef.current <= 0) {
        setIsBlinking(true);
        blinkTimerRef.current = 2 + Math.random() * 4;
        setTimeout(() => setIsBlinking(false), 120); 
    }

    // --- BODY IDLE (Floating) ---
    if (groupRef.current) {
        // Sine wave hover - reduced speed and amplitude for stability
        groupRef.current.position.y = Math.sin(t * 1.0) * 0.05;
        // Subtle breathing rotation
        groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.01;
    }

    // --- HEAD TRACKING ---
    if (headRef.current) {
        // Reduced sensitivity (0.4) to keep head within natural range
        // Positive X pointer -> Positive Yaw -> Looks Right (Screen)
        // Positive Y pointer -> Negative Pitch -> Looks Up (Screen)
        
        const sensitivity = 0.4;
        targetRotation.current.x = -mouse.current.y * sensitivity;
        targetRotation.current.y = mouse.current.x * sensitivity;
        
        // Clamp angles to prevent "Exorcist" spinning
        const clampedPitch = THREE.MathUtils.clamp(targetRotation.current.x, -0.5, 0.5);
        const clampedYaw = THREE.MathUtils.clamp(targetRotation.current.y, -0.8, 0.8);
        
        // Apply smooth rotation with heavier damping (0.05)
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, clampedPitch, 0.05);
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, clampedYaw, 0.05);
    }
  });

  // Color States
  let finalEyeColor = '#38bdf8'; // Sky Blue (Idle)
  let finalIntensity = 1.2;

  if (status === 'PROCESSING') {
      finalEyeColor = '#fbbf24'; // Amber (Thinking)
      finalIntensity = 1.5;
  } else if (status === 'RECORDING') {
      finalEyeColor = '#f43f5e'; // Rose (Active/Recording)
      finalIntensity = 1.5;
  }

  return {
    eyeColor: finalEyeColor,
    eyeIntensity: finalIntensity,
    isBlinking
  };
};
