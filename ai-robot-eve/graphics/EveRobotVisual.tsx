import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EveController } from '../core/EveController';
import { EveModel } from './EveModel';
import { useEveAnimation } from './EveAnimation';
import { useStore } from '../../store';

export const EveRobotVisual: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const movementRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const [status, setStatus] = useState('IDLE');
  const latestPoseRef = useRef({ x: 0, y: 0, z: 0 });
  const eveScale = useStore(s => s.settings.eveScale);

  // Event Bus Connection
  useEffect(() => {
    const bus = EveController.getInstance().bus;

    // System Status Updates
    const unsubTyping = bus.on('chat:typing_start', () => setStatus('PROCESSING'));
    const unsubIdle = bus.on('chat:typing_stop', () => setStatus('IDLE'));
    const unsubSim = bus.on('simulation:parameter_change', () => {
         // Flash status briefly when parameters change
         setStatus('PROCESSING');
         setTimeout(() => setStatus('IDLE'), 500);
    });

    return () => {
      unsubTyping();
      unsubIdle();
      unsubSim();
    };
  }, []);

  // Animation Hook
  const { eyeColor, eyeIntensity, isBlinking } = useEveAnimation(groupRef, headRef, status);

  // Subscribe to movement pose updates (write to ref, apply in useFrame)
  useEffect(() => {
    const bus = EveController.getInstance().bus;
    const unsub = bus.on('movement:pose_update', (e: any) => {
      const p = e.payload?.positionOffset;
      if (p) {
        // store latest offset (no allocation)
        latestPoseRef.current.x = p.x || 0;
        latestPoseRef.current.y = p.y || 0;
        latestPoseRef.current.z = p.z || 0;
      }
    });
    return () => unsub();
  }, []);

  // Apply latest movement pose to a child group each frame (avoids React state)
  useFrame(() => {
    if (movementRef.current) {
      const p = latestPoseRef.current;
      movementRef.current.position.set(p.x, p.y, p.z);
    }
  });

  // Interaction Handlers
  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    EveController.getInstance().bus.emit('chat:toggle_visibility');
  };

  return (
    <group ref={groupRef} position={[0, -0.5, 0]} scale={[0.45 * eveScale, 0.45 * eveScale, 0.45 * eveScale]}>
       <group ref={movementRef}>
         <EveModel 
            headRef={headRef}
            eyeColor={eyeColor}
            eyeIntensity={eyeIntensity}
            isBlinking={isBlinking}
            isChatOpen={false}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
         />
       </group>
    </group>
  );
};