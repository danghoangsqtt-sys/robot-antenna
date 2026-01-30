
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Plane } from '@react-three/drei';
import * as THREE from 'three';
import { AntennaType, NearFieldConfig } from '../types';
import { getPatternFunction } from './farFieldPhysics';

const LAMBDA_SCALE = 10;

const NF_VERTEX_SHADER = `
varying float vDistance;
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

// --- New Slice Shader for E/H Fields ---
const SLICE_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vWorldPos;
void main() {
    vUv = uv;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SLICE_FRAGMENT_SHADER = `
precision mediump float;
varying vec2 vUv;
varying vec3 vWorldPos;
uniform float uTime;
uniform float uFieldType; // 0=E, 1=H, 2=Poynting
uniform float uIntensityScale;

#define PI 3.14159265

// Heatmap gradient
vec3 heatmap(float v) {
    float val = clamp(v, 0.0, 1.0);
    vec3 c1 = vec3(0.0, 0.0, 0.2); // dark blue
    vec3 c2 = vec3(0.0, 1.0, 1.0); // cyan
    vec3 c3 = vec3(0.0, 1.0, 0.0); // green
    vec3 c4 = vec3(1.0, 1.0, 0.0); // yellow
    vec3 c5 = vec3(1.0, 0.0, 0.0); // red
    
    if(val < 0.25) return mix(c1, c2, val * 4.0);
    if(val < 0.50) return mix(c2, c3, (val - 0.25) * 4.0);
    if(val < 0.75) return mix(c3, c4, (val - 0.50) * 4.0);
    return mix(c4, c5, (val - 0.75) * 4.0);
}

void main() {
    float x = vWorldPos.x;
    float y = vWorldPos.y;
    float z = vWorldPos.z;
    float r = length(vWorldPos) / 10.0; // Scale down for lambda
    
    if (r < 0.05) discard; // Clip center singularity

    // Angle theta (elevation from Z)
    float theta = acos(clamp(y / (r * 10.0), -1.0, 1.0)); // Assume Y is vertical for calculation physics, adjust if Z is up
    
    // Dipole Near Field Approximation
    float mag = 0.0;
    
    // Reactive terms
    float kr = r * 2.0 * PI; // k*r
    
    // Hertzian Dipole Terms
    // E ~ (1/r3)cos + (1/r)sin
    // H ~ (1/r2)sin
    
    float t1 = 1.0 / (pow(kr, 3.0) + 0.001); // Near
    float t2 = 1.0 / (pow(kr, 2.0) + 0.001); // Inter
    float t3 = 1.0 / (kr + 0.001);           // Far
    
    if (uFieldType < 0.5) { 
        // E-Field
        float Er = 2.0 * cos(theta) * (t1 + t2);
        float Etheta = sin(theta) * (t1 + t2 + t3);
        mag = sqrt(Er*Er + Etheta*Etheta);
    } else if (uFieldType < 1.5) {
        // H-Field
        mag = sin(theta) * (t2 + t3);
    } else {
        // Poynting (E x H)
        float E = sqrt(pow(2.0*cos(theta)*(t1+t2), 2.0) + pow(sin(theta)*(t1+t2+t3), 2.0));
        float H = sin(theta) * (t2 + t3);
        mag = E * H;
    }
    
    mag *= uIntensityScale;
    
    // Wave animation
    float wave = 0.5 + 0.5 * sin(kr - uTime * 5.0);
    
    vec3 col = heatmap(mag * wave);
    
    // Grid overlay
    float grid = 0.0;
    if (mod(vUv.x * 20.0, 1.0) < 0.05 || mod(vUv.y * 20.0, 1.0) < 0.05) grid = 0.1;
    
    gl_FragColor = vec4(col + grid, clamp(mag, 0.1, 0.8));
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
        const formulaFunc = getPatternFunction(antennaType, customFormula);

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

export const NearFieldSlice: React.FC<{ config: NearFieldConfig }> = ({ config }) => {
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
        }
    });

    const rotation = useMemo(() => {
        if (config.slicePlane === 'XY') return [-Math.PI/2, 0, 0] as [number, number, number]; // Z-up normal
        if (config.slicePlane === 'XZ') return [0, 0, 0] as [number, number, number];        // Y-up normal
        if (config.slicePlane === 'YZ') return [0, Math.PI/2, 0] as [number, number, number]; // X-up normal
        return [0, 0, 0] as [number, number, number];
    }, [config.slicePlane]);

    const position = useMemo(() => {
        if (config.slicePlane === 'XY') return [0, 0, config.sliceOffset] as [number, number, number];
        if (config.slicePlane === 'XZ') return [0, config.sliceOffset, 0] as [number, number, number];
        if (config.slicePlane === 'YZ') return [config.sliceOffset, 0, 0] as [number, number, number];
        return [0,0,0] as [number, number, number];
    }, [config.slicePlane, config.sliceOffset]);

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uFieldType: { value: config.fieldType === 'E' ? 0.0 : (config.fieldType === 'H' ? 1.0 : 2.0) },
        uIntensityScale: { value: config.intensityScale }
    }), [config.fieldType, config.intensityScale]);

    return (
        <Plane args={[40, 40]} rotation={rotation} position={position}>
            <shaderMaterial 
                ref={materialRef}
                vertexShader={SLICE_VERTEX_SHADER}
                fragmentShader={SLICE_FRAGMENT_SHADER}
                uniforms={uniforms}
                transparent={true}
                side={THREE.DoubleSide}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
            <Plane args={[40, 40]} rotation={[0,0,0]} position={[0,0, -0.01]}>
               <meshBasicMaterial color="#000" wireframe transparent opacity={0.1}/>
            </Plane>
        </Plane>
    );
};
