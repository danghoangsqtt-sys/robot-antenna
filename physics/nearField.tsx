import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AntennaType } from '../types';
import { ANTENNA_PRESETS } from '../antenna/presets';

const LAMBDA_SCALE = 10;

const NF_VERTEX_SHADER = `
varying float vDistance;
varying float vIntensity;
varying vec3 vPos;

uniform float uTime;

void main() {
  vPos = position;
  float r = length(position);
  vDistance = r;
  
  vec3 offset = position + normal * sin(uTime * 2.0 + r) * 0.2;
  vec4 mvPosition = modelViewMatrix * vec4(offset, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  float size = 300.0 / (r * r + 0.1); 
  gl_PointSize = clamp(size, 2.0, 10.0);
}
`;

const NF_FRAGMENT_SHADER = `
precision mediump float;
varying float vDistance;
varying vec3 vPos;
uniform float uTime;

void main() {
  float r = vDistance / 10.0;
  
  float reactive = 1.0 / (pow(r, 3.0) + 0.01);
  float intermediate = 1.0 / (pow(r, 2.0) + 0.01);
  float radiating = 1.0 / (r + 0.01);
  
  vec3 cReactive = vec3(1.0, 0.2, 0.0);
  vec3 cInter = vec3(1.0, 1.0, 0.0);
  vec3 cRad = vec3(0.0, 0.8, 1.0);
  
  float total = reactive + intermediate + radiating;
  float wR = reactive / total;
  float wI = intermediate / total;
  float wRad = radiating / total;
  
  vec3 color = cReactive * wR + cInter * wI + cRad * wRad;
  
  float pulse = 0.8 + 0.2 * sin(uTime * 3.0 - vDistance);
  float alpha = clamp(1.0 / (r * r), 0.0, 1.0);
  
  vec2 coord = gl_PointCoord - vec2(0.5);
  if(length(coord) > 0.5) discard;
  
  gl_FragColor = vec4(color * pulse, alpha * 0.8);
}
`;

export const NearFieldParticles: React.FC<{
    antennaType: AntennaType;
    customFormula: string;
    resolution: number;
}> = ({ antennaType, customFormula, resolution }) => {
    const pointsRef = useRef<THREE.Points>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    
    const particleCount = resolution * resolution * 2; 

    const { positions } = useMemo(() => {
        const pos = new Float32Array(particleCount * 3);
        const formulaStr = antennaType === AntennaType.CUSTOM 
            ? customFormula 
            : ANTENNA_PRESETS[antennaType].formula;
        
        let formulaFunc: Function;
        try {
            formulaFunc = new Function('theta', 'phi', `return ${formulaStr};`);
        } catch { formulaFunc = () => 0.1; }

        let idx = 0;
        for(let i=0; i<particleCount; i++) {
            const rRaw = Math.pow(Math.random(), 2.0);
            const r = (0.2 + rRaw * 5.0) * LAMBDA_SCALE; 
            
            const theta = Math.acos(2 * Math.random() - 1);
            const phi = 2 * Math.PI * Math.random();
            
            let pat = 0;
            try { pat = Math.abs(formulaFunc(theta, phi)); } catch {}
            
            if (Math.random() > pat) {
                pos[idx++] = 0; pos[idx++] = 0; pos[idx++] = 0;
                continue;
            }

            const x = r * Math.sin(theta) * Math.cos(phi);
            const y = r * Math.cos(theta);
            const z = r * Math.sin(theta) * Math.sin(phi);
            
            pos[idx++] = x;
            pos[idx++] = y;
            pos[idx++] = z;
        }
        return { positions: pos };
    }, [resolution, antennaType, customFormula]);

    useFrame((state) => {
        if(materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
        }
    });

    const uniforms = useMemo(() => ({
        uTime: { value: 0 }
    }), []);

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute 
                    attach="attributes-position" 
                    count={positions.length / 3} 
                    array={positions} 
                    itemSize={3} 
                />
            </bufferGeometry>
            <shaderMaterial 
                ref={materialRef}
                vertexShader={NF_VERTEX_SHADER}
                fragmentShader={NF_FRAGMENT_SHADER}
                uniforms={uniforms}
                transparent={true}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    )
};
