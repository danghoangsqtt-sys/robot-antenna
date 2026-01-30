
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { AntennaType, BeamformingType } from '../types';
import { getPatternFunction } from './farFieldPhysics';
import { calculateArrayFactor } from './arrayFactor';

const FREQ_VERTEX_SHADER = `
varying float vIntensity;
void main() {
  vIntensity = clamp(position.y * 0.5 + 0.5, 0.0, 1.0);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = 3.0; 
}
`;

const FREQ_FRAGMENT_SHADER = `
precision mediump float;
varying float vIntensity;
uniform float uFreqNorm;

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    float glow = smoothstep(0.0, 1.0, vIntensity);
    float baseHue = uFreqNorm * 0.7; 
    float finalHue = baseHue + (1.0 - glow) * 0.1;
    vec3 color = hsv2rgb(vec3(finalHue, 1.0, 1.0));
    color *= (0.5 + 0.5 * glow);
    float alpha = glow * 0.9;
    vec2 coord = gl_PointCoord - vec2(0.5);
    if(length(coord) > 0.5) discard;
    gl_FragColor = vec4(color, alpha);
}
`;

interface ParticlesProps {
  antennaType: AntennaType;
  resolution: number;
  customFormula: string;
  gain: number;
  arrayEnabled: boolean;
  arrayElements: number;
  elementSpacing: number;
  steeringAngle: number;
  mimoEnabled: boolean;
  mimoTxCount: number;
  beamformingType: BeamformingType;
  frequencyGHz: number;
  freqSweepEnabled: boolean;
  freqSweepStart: number;
  freqSweepEnd: number;
}

export const RadiationParticles: React.FC<ParticlesProps> = (props) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const count = props.resolution * props.resolution;
  
  const { positions, uvs } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const uv = new Float32Array(count * 2);
    return { positions: pos, uvs: uv };
  }, [props.resolution]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    return geo;
  }, [positions, uvs]);

  const uniforms = useMemo(() => ({
      uFreqNorm: { value: 0.5 }
  }), []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    if (materialRef.current) {
        let norm = 0.5;
        if (props.freqSweepEnabled && props.freqSweepEnd > props.freqSweepStart) {
            norm = (props.frequencyGHz - props.freqSweepStart) / (props.freqSweepEnd - props.freqSweepStart);
            norm = Math.max(0, Math.min(1, norm));
        }
        materialRef.current.uniforms.uFreqNorm.value = norm;
    }

    const positionsAttr = pointsRef.current.geometry.attributes.position;
    const formulaFunc = getPatternFunction(props.antennaType, props.customFormula);

    const activeElements = props.mimoEnabled ? props.mimoTxCount : (props.arrayEnabled ? props.arrayElements : 1);
    const isActiveArray = props.mimoEnabled || props.arrayEnabled;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < props.resolution; i++) {
      for (let j = 0; j < props.resolution; j++) {
        const theta = (i / (props.resolution - 1)) * Math.PI;
        const phi = (j / (props.resolution - 1)) * 2 * Math.PI;
        
        const index = (i * props.resolution + j);
        
        let r_element = 0;
        try { r_element = Math.abs(formulaFunc(theta, phi)); } catch (e) { r_element = 0.1; }

        let totalGain = r_element;

        if (isActiveArray && activeElements > 1) {
            const af = calculateArrayFactor(
                theta, 
                activeElements, 
                props.elementSpacing, 
                props.steeringAngle,
                props.beamformingType // NEW: Pass BF type
            );
            totalGain *= af;
        }

        const displayRadius = totalGain * (props.gain / 5.0) * 5.0; 
        const pulse = 1.0 + 0.05 * Math.sin(time * 2 + theta * 4);
        const rFinal = displayRadius * pulse;

        const x = rFinal * Math.sin(theta) * Math.cos(phi);
        const y = rFinal * Math.cos(theta);
        const z = rFinal * Math.sin(theta) * Math.sin(phi);

        positionsAttr.setXYZ(index, x, y, z);
      }
    }
    positionsAttr.needsUpdate = true;
  });

  return (
    <group>
        <points ref={pointsRef} geometry={geometry}>
        <shaderMaterial 
            ref={materialRef}
            vertexShader={FREQ_VERTEX_SHADER}
            fragmentShader={FREQ_FRAGMENT_SHADER}
            uniforms={uniforms}
            transparent={true}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
        />
        </points>
        {props.mimoEnabled && (
            <group position={[0, 10, 0]}>
                <Text fontSize={1.5} color="#10b981" anchorX="center" anchorY="middle">
                    {`MIMO ACTIVE: ${props.beamformingType}`}
                </Text>
            </group>
        )}
    </group>
  );
};

export const CoverageVisualizer: React.FC<{ rangeKm: number, show: boolean }> = ({ rangeKm, show }) => {
    if (!show) return null;
    const radius = 25; 
    return (
        <group rotation={[0,0,0]}>
            <Sphere args={[radius, 32, 32]}>
                <meshBasicMaterial color="#1e90ff" wireframe transparent opacity={0.15} />
            </Sphere>
            <Text 
                position={[0, radius + 2, 0]} 
                color="#00ff88" 
                fontSize={1.5}
                anchorX="center" 
                anchorY="middle"
            >
                {`R_max: ${rangeKm.toFixed(3)} km`}
            </Text>
             <Text 
                position={[0, -radius - 2, 0]} 
                color="#1e90ff" 
                fontSize={1.0}
                anchorX="center" 
                anchorY="middle"
            >
                Free Space Limit (Friis)
            </Text>
        </group>
    )
};
