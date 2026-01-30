import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { EveController } from '../core/EveController'; // Import controller để gọi lệnh click trực tiếp

interface EveModelProps {
  headRef: React.RefObject<THREE.Group>;
  eyeColor: string;
  eyeIntensity: number;
  isBlinking: boolean;
  onClick?: (e: any) => void;
  onPointerOver?: (e: any) => void;
  onPointerOut?: (e: any) => void;
}

export const EveModel: React.FC<EveModelProps> = ({ 
  headRef, eyeColor, eyeIntensity, isBlinking,
  onClick, onPointerOver, onPointerOut
}) => {
  const { viewport } = useThree(); // Lấy thông tin màn hình để tính toán vị trí chuột
  
  // Xử lý click an toàn: Nếu cha không truyền onClick, tự gọi lệnh toggle chat
  const handleBodyClick = (e: any) => {
    e.stopPropagation(); // Ngăn click xuyên qua robot
    if (onClick) {
        onClick(e);
    } else {
        // Fallback: Tự gọi lệnh mở chat nếu không có prop onClick
        EveController.getInstance().bus.emit('chat:toggle_visibility');
    }
  };

  // Logic mắt/đầu di chuyển theo chuột
  useFrame((state) => {
    if (!headRef.current) return;

    // Tính toán vị trí chuột (đưa về toạ độ -1 đến 1)
    const x = (state.pointer.x * viewport.width) / 2;
    const y = (state.pointer.y * viewport.height) / 2;

    // Tạo vector đích để đầu robot nhìn vào
    const lookAtTarget = new THREE.Vector3(x, y, 5); // Z=5 để nhìn về phía camera
    
    // Lerp (nội suy) để chuyển động mượt mà thay vì giật cục
    // Giới hạn góc quay để robot không "gãy cổ"
    const currentRotation = headRef.current.rotation;
    const targetRotationX = -state.pointer.y * 0.5; // Ngước lên xuống biên độ nhỏ
    const targetRotationY = state.pointer.x * 0.8;  // Quay trái phải biên độ lớn hơn

    headRef.current.rotation.x = THREE.MathUtils.lerp(currentRotation.x, targetRotationX, 0.1);
    headRef.current.rotation.y = THREE.MathUtils.lerp(currentRotation.y, targetRotationY, 0.1);
  });
  
  // --- MATERIALS ---
  const bodyMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#f2f4f7',
    roughness: 0.2, // Giảm độ nhám để bóng bẩy hơn
    metalness: 0.1,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
    side: THREE.FrontSide
  }), []);

  const visorMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#050505', // Đen tuyền
    roughness: 0.05,
    metalness: 0.95,
    clearcoat: 1.0,
    reflectivity: 0.5, 
  }), []);

  const eyeMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(eyeColor),
    toneMapped: false,
  }), [eyeColor]);

  return (
    <group 
      scale={[0.55, 0.55, 0.55]} // Giữ tỷ lệ nhỏ vừa vặn như lần trước
      onClick={handleBodyClick} 
      onPointerOver={onPointerOver} 
      onPointerOut={onPointerOut}
    >
      {/* BODY: Floating Capsule */}
      <mesh position={[0, -0.8, 0]} material={bodyMaterial}>
        <capsuleGeometry args={[0.65, 1.0, 4, 32]} />
      </mesh>

      {/* HEAD Group */}
      <group ref={headRef} position={[0, 0.6, 0]}>
         {/* Head Shell */}
         <mesh scale={[1.35, 1.0, 1.1]}>
             <sphereGeometry args={[0.85, 64, 64]} />
             <primitive object={bodyMaterial} attach="material" />
         </mesh>

         {/* VISOR */}
         <group position={[0, 0, 0.62]} rotation={[-0.05, 0, 0]}>
             {/* Black Screen */}
             <mesh scale={[1.1, 0.75, 0.3]} position={[0, 0, 0.15]}>
                <sphereGeometry args={[0.82, 64, 64, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
                <primitive object={visorMaterial} attach="material" />
             </mesh>

             {/* EYES */}
             <group position={[0, 0.05, 0.53]} rotation={[-0.1, 0, 0]}>
                 <group scale={[1, isBlinking ? 0.02 : 1, 1]}>
                     {/* Left Eye */}
                     <mesh position={[-0.35, 0, 0]} rotation={[0, -0.2, 1.57]} scale={[1, 1, 0.1]}>
                         <capsuleGeometry args={[0.15, 0.35, 4, 16]} />
                         <primitive object={eyeMaterial} attach="material" />
                     </mesh>
                     
                     {/* Right Eye */}
                     <mesh position={[0.35, 0, 0]} rotation={[0, 0.2, 1.57]} scale={[1, 1, 0.1]}>
                         <capsuleGeometry args={[0.15, 0.35, 4, 16]} />
                         <primitive object={eyeMaterial} attach="material" />
                     </mesh>
                 </group>
                 
                 {/* Eye Glow */}
                 <pointLight color={eyeColor} intensity={eyeIntensity * 0.8} distance={3} decay={2} position={[0, 0, 0.5]} />
             </group>
         </group>
      </group>
      
      {/* GLOW: Engine field */}
      <mesh position={[0, -1.6, 0]} rotation={[1.57, 0, 0]}>
          <ringGeometry args={[0.1, 0.5, 64]} />
          <meshBasicMaterial color={eyeColor} transparent opacity={0.4} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};