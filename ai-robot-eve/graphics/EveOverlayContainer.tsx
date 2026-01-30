
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EveRobotVisual } from './EveRobotVisual';

export const EveOverlayContainer: React.FC = () => {
  return (
    <div className="absolute bottom-0 right-0 w-64 h-80 z-40 pointer-events-none select-none">
       <Canvas 
         camera={{ position: [0, 0, 4.5], fov: 35 }} 
         gl={{ alpha: true, antialias: true, toneMappingExposure: 1.2 }}
       >
          {/* Dedicated Studio Lighting for the Robot (Does not affect main scene) */}
          <ambientLight intensity={0.6} color="#ffffff" />
          <spotLight position={[5, 5, 5]} intensity={2.0} angle={0.5} penumbra={1} castShadow color="#ffffff"/>
          <pointLight position={[-2, 1, 3]} intensity={1.5} color="#e0f2fe" />
          <pointLight position={[0, -2, 2]} intensity={0.8} color="#38bdf8" /> {/* Underglow */}
          
          <Suspense fallback={null}>
             <EveRobotVisual />
          </Suspense>
       </Canvas>
    </div>
  );
};
