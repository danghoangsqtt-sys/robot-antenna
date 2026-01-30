
import React, { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { EveController } from '../../ai-robot-eve/core/EveController';
import { HologramPanel } from '../ui/HologramPanel';

export const HologramProjector: React.FC = () => {
  // Mặc định hiển thị ngay khi khởi động
  const [isVisible, setIsVisible] = useState(true);
  const beamRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useEffect(() => {
    const eve = EveController.getInstance();
    
    // Lắng nghe sự kiện toggle (khi click vào robot)
    const unsub = eve.bus.on('chat:toggle_visibility', () => {
        setIsVisible(prev => !prev);
    });

    return () => { unsub(); };
  }, []);

  // Shader tia sáng (Hiệu ứng chùm nón ngược, mờ dần phía trên)
  const beamShader = {
      vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
            // Gradient độ trong suốt từ đáy (1.0) lên đỉnh (0.0)
            float alpha = smoothstep(1.0, 0.0, vUv.y);
            
            // Hiệu ứng scanline di chuyển
            float scan = sin(vUv.y * 80.0 - uTime * 8.0) * 0.2 + 0.8;
            
            // Mờ dần 2 bên cạnh để tạo khối tròn
            float side = 1.0 - pow(abs(vUv.x - 0.5) * 2.0, 2.0);
            
            // Màu xanh Lazer Hologram đặc trưng
            vec3 color = vec3(0.0, 1.0, 0.6); 
            gl_FragColor = vec4(color * scan * 1.5, alpha * side * 0.6);
        }
      `
  };

  useFrame((state) => {
      if (materialRef.current) {
          materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      }
      
      // Hiệu ứng đèn Glow nhấp nháy nhẹ
      if (glowRef.current) {
          const t = state.clock.getElapsedTime();
          const baseIntensity = isVisible ? 2.0 : 0.0;
          glowRef.current.intensity = THREE.MathUtils.lerp(
              glowRef.current.intensity, 
              baseIntensity + Math.sin(t * 5) * 0.5, 
              0.1
          );
      }
  });

  return (
    // Vị trí tương đối so với ngực Robot
    <group position={[0, -0.3, 0.5]} rotation={[0, 0, 0]}> 
      
      {/* Đèn nguồn phát sáng (Flare) */}
      <mesh visible={isVisible}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="#00ffaa" transparent opacity={0.8} />
      </mesh>
      <pointLight ref={glowRef} color="#00ffaa" distance={2} decay={2} intensity={0} />

      {isVisible && (
          <>
            {/* Chùm tia chiếu (Hình nón cụt ngược) */}
            <mesh ref={beamRef} position={[0, 0.8, 0]} rotation={[0,0,0]}>
                {/* radiusTop, radiusBottom, height */}
                <cylinderGeometry args={[0.6, 0.02, 1.6, 32, 1, true]} />
                <shaderMaterial 
                    ref={materialRef}
                    vertexShader={beamShader.vertexShader}
                    fragmentShader={beamShader.fragmentShader}
                    uniforms={{ uTime: { value: 0 } }}
                    transparent
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            {/* Giao diện HTML bay lơ lửng */}
            <Html 
                position={[0, 2.0, 0]} // Vị trí cao hơn chùm tia
                transform 
                occlude={false} // Tắt occlude để luôn hiển thị, tránh bị vật thể khác che
                scale={0.25} // Scale nhỏ lại để vừa khung hình 3D
                style={{
                    pointerEvents: 'auto', // Đảm bảo chuột tương tác được với input/button
                    userSelect: 'none',
                    transform: 'translate3d(-50%, -50%, 0)' // Căn giữa
                }}
            >
                <HologramPanel />
            </Html>
          </>
      )}
    </group>
  );
};
