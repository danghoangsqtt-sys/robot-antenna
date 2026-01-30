
import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EveController } from '../core/EveController';
import { EveModel } from './EveModel';
import { useEveAnimation } from './EveAnimation';

export const EveRobotVisual: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const [status, setStatus] = useState('IDLE');

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

  return (
    <group ref={groupRef} position={[0, -0.5, 0]} scale={0.45}>
       <EveModel 
          headRef={headRef}
          eyeColor={eyeColor}
          eyeIntensity={eyeIntensity}
          isBlinking={isBlinking}
       />
    </group>
  );
};
