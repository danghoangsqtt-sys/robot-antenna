
import React, { useRef, useState, useEffect } from 'react';
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
  
  // Vectors for tracking
  const targetMouse = useRef(new THREE.Vector2(0, 0)); // Raw input
  
  // Setup global mouse tracking independently of R3F raycasting context
  useEffect(() => {
      const handleMouseMove = (event: MouseEvent) => {
          // Normalize to -1...1 (Standard NDC)
          const x = (event.clientX / window.innerWidth) * 2 - 1;
          const y = -(event.clientY / window.innerHeight) * 2 + 1;
          targetMouse.current.set(x, y);
      };

      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Frame Loop
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
        groupRef.current.position.y = Math.sin(t * 1.5) * 0.08;
        // Subtle breathing rotation
        groupRef.current.rotation.z = Math.sin(t * 0.8) * 0.02;
    }

    // --- HEAD TRACKING ---
    if (headRef.current) {
        // High sensitivity for "snappy" feeling
        const sensitivity = 1.0;
        
        // Calculate target angles directly from mouse input (no intermediate lerp)
        const targetPitch = -targetMouse.current.y * sensitivity;
        const targetYaw = targetMouse.current.x * sensitivity;
        
        // Clamp angles
        const clampedPitch = THREE.MathUtils.clamp(targetPitch, -0.6, 0.6);
        const clampedYaw = THREE.MathUtils.clamp(targetYaw, -1.0, 1.0);
        
        // Fast Lerp (0.2) for responsive movement
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, clampedPitch, 0.2);
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, clampedYaw, 0.2);
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
