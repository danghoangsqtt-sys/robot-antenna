
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EveRobotVisual } from './EveRobotVisual';

export const EveOverlayContainer: React.FC = () => {
  return (
    <div className="absolute bottom-0 right-0 w-[280px] h-[350px] z-10 pointer-events-none">
       <Canvas 
         camera={{ position: [0, 1, 4.8], fov: 40 }} 
         gl={{ alpha: true, antialias: true, toneMappingExposure: 1.3 }}
         style={{ pointerEvents: 'auto' }}
       >
          {/* Key Light - Front right */}
          <spotLight position={[4, 3, 3]} intensity={2.5} angle={0.6} penumbra={0.8} color="#ffffff" castShadow />
          
          {/* Ambient fill light - Bright white base */}
          <ambientLight intensity={0.75} color="#ffffff" />
          
          {/* Cyan accent light - Right side for visor pop */}
          <pointLight position={[3, 0, 2]} intensity={1.2} color="#0099dd" distance={8} decay={1.5} />
          
          {/* Soft backlight for definition */}
          <pointLight position={[-2, 1, -1]} intensity={0.6} color="#e0f2fe" distance={6} decay={2} />
          
          <Suspense fallback={null}>
             <group position={[0, -0.8, 0]}>
                <EveRobotVisual />
             </group>
          </Suspense>
       </Canvas>
    </div>
  );
};
