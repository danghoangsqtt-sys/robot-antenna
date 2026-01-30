
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EveRobotVisual } from './EveRobotVisual';
import { HologramProjector } from '../../eve-hologram-system/graphics/HologramProjector';

export const EveOverlayContainer: React.FC = () => {
  return (
    // Tăng kích thước container lên 400x600 để Hologram không bị cắt
    // pointer-events-none để không chặn click chuột vào không gian 3D phía sau (nếu click vào vùng trống)
    <div className="absolute bottom-0 right-0 w-[400px] h-[600px] z-40 pointer-events-none">
       <Canvas 
         camera={{ position: [0, 1, 5], fov: 35 }} 
         gl={{ alpha: true, antialias: true, toneMappingExposure: 1.2 }}
         // Bật lại tương tác cho Canvas để bắt sự kiện click vào Robot/Hologram
         style={{ pointerEvents: 'auto' }}
       >
          {/* Ánh sáng studio riêng cho Robot */}
          <ambientLight intensity={0.6} color="#ffffff" />
          <spotLight position={[5, 5, 5]} intensity={2.0} angle={0.5} penumbra={1} castShadow color="#ffffff"/>
          <pointLight position={[-2, 1, 3]} intensity={1.5} color="#e0f2fe" />
          <pointLight position={[0, -2, 2]} intensity={0.8} color="#38bdf8" /> {/* Underglow */}
          
          <Suspense fallback={null}>
             {/* Hạ thấp vị trí Robot để có không gian cho Hologram phía trên */}
             <group position={[0, -1.0, 0]}>
                <EveRobotVisual />
                {/* Gắn máy chiếu Hologram vào hệ tọa độ của Robot */}
                <group position={[0, -0.5, 0]} scale={0.45}>
                   <HologramProjector />
                </group>
             </group>
          </Suspense>
       </Canvas>
    </div>
  );
};
