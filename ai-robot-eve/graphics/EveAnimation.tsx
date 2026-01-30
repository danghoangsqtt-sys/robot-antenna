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
  
  // Smooth mouse tracking
  const mouse = useRef(new THREE.Vector2());
  
  // Update mouse pos
  useFrame((state) => {
      mouse.current.copy(state.pointer);
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
        // Sine wave hover
        groupRef.current.position.y = Math.sin(t * 1.5) * 0.1;
        
        // Subtle breathing rotation
        groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.02;
    }

    // --- HEAD TRACKING ---
    if (headRef.current) {
        // Target rotation based on mouse
        const targetX = -mouse.current.y * 0.3;
        const targetY = mouse.current.x * 0.3;
        
        // Smooth dampening (Lerp)
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, targetX, 0.1);
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetY, 0.1);
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