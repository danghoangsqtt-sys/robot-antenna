// RobotModel.jsx
import React, { useRef } from "react";
import { useGLTF } from "@react-three/drei";

export function RobotEveModel(props) {
  // Đường dẫn đến file model bạn đã tải về và đặt trong thư mục /public/models/
  const { scene } = useGLTF("/models/eve_robot_style.glb");
  const robotRef = useRef();

  return (
    <group ref={robotRef} {...props} dispose={null}>
      {/* primitive là cách R3F hiển thị toàn bộ scene của model */}
      <primitive object={scene} scale={1.5} />
    </group>
  );
}

// Preload để tải nhanh hơn
useGLTF.preload("/models/eve_robot_style.glb");