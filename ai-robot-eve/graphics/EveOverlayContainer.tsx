
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EveRobotVisual } from './EveRobotVisual';

export const EveOverlayContainer: React.FC = () => {
  return (
    // Fixed container at bottom right, pointer-events-none by default
    <div className="absolute bottom-0 right-0 w-[400px] h-[600px] z-40 pointer-events-none">
       <Canvas 
         camera={{ position: [0, 1, 5], fov: 35 }} 
         gl={{ alpha: true, antialias: true, toneMappingExposure: 1.2 }}
         // Enable pointer events for the Canvas so click events reach the mesh
         // Set eventSource to body so head tracking works across the whole screen even if mouse is outside this div
         style={{ pointerEvents: 'auto' }}
         eventSource={document.body}
       >
          <ambientLight intensity={0.6} color="#ffffff" />
          <spotLight position={[5, 5, 5]} intensity={2.0} angle={0.5} penumbra={1} castShadow color="#ffffff"/>
          <pointLight position={[-2, 1, 3]} intensity={1.5} color="#e0f2fe" />
          <pointLight position={[0, -2, 2]} intensity={0.8} color="#38bdf8" /> 
          
          <Suspense fallback={null}>
             <group position={[0, -1.0, 0]}>
                <EveRobotVisual />
             </group>
          </Suspense>
       </Canvas>
    </div>
  );
};
