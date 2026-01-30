
import React from 'react';
import { Cylinder, Sphere, Box, Cone, Plane } from '@react-three/drei';
import * as THREE from 'three';
import { GeometryPrimitive, MaterialType } from '../types';
import { DIELECTRIC_MATERIALS } from '../modules/materials';

const LAMBDA_SCALE = 10;

const GeometryRenderer: React.FC<{ geo: GeometryPrimitive, index: number }> = ({ geo, index }) => {
  const count = geo.count || 1;
  const dims = geo.dimensions || {};
  const spacing = (dims.spacing_lambda || 0) * LAMBDA_SCALE;
  
  const primitives = [];
  
  // Resolve Material
  const matType = geo.material || MaterialType.METAL;
  const matDef = DIELECTRIC_MATERIALS[matType] || DIELECTRIC_MATERIALS[MaterialType.METAL];
  
  const materialProps = { 
    color: matDef.color, 
    metalness: matDef.metalness, 
    roughness: matDef.roughness,
    transparent: matDef.opacity < 1.0,
    opacity: matDef.opacity,
    side: THREE.DoubleSide
  };

  for (let i = 0; i < count; i++) {
    const z = (i - (count - 1) / 2) * spacing;
    const position: [number, number, number] = [0, 0, z];

    if (geo.shape === 'cylinder') {
      const radius = (dims.radius_lambda || 0.01) * LAMBDA_SCALE;
      const length = (dims.length_lambda || 0.5) * LAMBDA_SCALE;
      const isHorizontal = geo.orientation === 'parallel' || count > 1;
      const rotation: [number, number, number] = isHorizontal ? [0, 0, Math.PI/2] : [0, 0, 0];
      const isDriven = (count > 1 && i === 1) || (count === 1);
      
      const finalColor = isDriven && matType === MaterialType.METAL ? "#ef4444" : materialProps.color;

      primitives.push(
        <Cylinder key={i} args={[radius, radius, length, 16]} position={position} rotation={rotation}>
           <meshStandardMaterial {...materialProps} color={finalColor} />
        </Cylinder>
      );
    } 
    else if (geo.shape === 'box') {
      const w = (dims.width_lambda || 0.1) * LAMBDA_SCALE;
      const h = (dims.height_lambda || 0.05) * LAMBDA_SCALE;
      const l = (dims.length_lambda || 0.1) * LAMBDA_SCALE;
      primitives.push(
        <Box key={i} args={[w, h, l]} position={position}>
           <meshStandardMaterial {...materialProps} />
        </Box>
      );
    }
    else if (geo.shape === 'plane') {
      // Plane usually for patch/ground
      const w = (dims.width_lambda || 0.1) * LAMBDA_SCALE;
      const l = (dims.length_lambda || 0.1) * LAMBDA_SCALE;
      const isHorizontal = geo.orientation === 'horizontal';
      const rotation: [number, number, number] = isHorizontal ? [-Math.PI/2, 0, 0] : [0, 0, 0];
      
      // Feed point visualization if available
      const children = [];
      if (geo.feedPoint) {
          const fx = geo.feedPoint[0] * w/2;
          const fz = geo.feedPoint[2] * l/2;
          children.push(
              <Sphere key="feed" args={[0.2, 8, 8]} position={[fx, fz, 0.1]}>
                  <meshBasicMaterial color="red" />
              </Sphere>
          );
      }

      primitives.push(
        <Plane key={i} args={[w, l]} position={position} rotation={rotation}>
           <meshStandardMaterial {...materialProps} />
           {children}
        </Plane>
      );
    }
    else if (geo.shape === 'paraboloid') {
      const d = (dims.diameter_lambda || 1.0) * LAMBDA_SCALE;
      primitives.push(
        <group key={i} position={position} rotation={[Math.PI/2, 0, 0]}>
          <Sphere args={[d/2, 32, 32, 0, Math.PI*2, 0, Math.PI * 0.4]}>
             <meshStandardMaterial {...materialProps} side={THREE.DoubleSide} />
          </Sphere>
          <Cylinder args={[d/40, d/40, d/4, 8]} position={[0, d/8, 0]}>
             <meshStandardMaterial color="#334155" metalness={0.8} />
          </Cylinder>
          <Box args={[d/20, d/20, d/20]} position={[0, d/4, 0]}>
             <meshStandardMaterial color="#ef4444" />
          </Box>
        </group>
      );
    }
    else if (geo.shape === 'cone') {
      const r = (dims.radius_lambda || 0.2) * LAMBDA_SCALE;
      const l = (dims.length_lambda || 0.5) * LAMBDA_SCALE;
      primitives.push(
        <Cone key={i} args={[r, l, 32]} position={position} rotation={[Math.PI/2, 0, 0]}>
           <meshStandardMaterial {...materialProps} />
        </Cone>
      );
    }
  }

  // Draw boom for arrays
  if (count > 1 && geo.shape === 'cylinder') {
     const totalLen = (count - 1) * spacing + (dims.spacing_lambda || 0.2) * LAMBDA_SCALE;
     primitives.push(
       <Cylinder key="boom" args={[0.05, 0.05, totalLen, 8]} rotation={[Math.PI/2, 0, 0]}>
         <meshStandardMaterial color="#475569" metalness={0.5} />
       </Cylinder>
     );
  }

  return <group>{primitives}</group>;
};

export const PhysicalAntenna: React.FC<{ geometry: GeometryPrimitive[] | null }> = ({ geometry }) => {
  if (!geometry) return null;
  return (
    <group>
      {geometry.map((geo, idx) => (
        <GeometryRenderer key={idx} geo={geo} index={idx} />
      ))}
    </group>
  );
};
