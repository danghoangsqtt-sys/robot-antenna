import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { AntennaType, BeamformingType } from '../types';
import { ANTENNA_PRESETS } from '../antenna/presets';

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

export const FarFieldParticles: React.FC<ParticlesProps> = ({ 
  antennaType, resolution, customFormula, gain,
  arrayEnabled, arrayElements, elementSpacing, steeringAngle,
  mimoEnabled, mimoTxCount, beamformingType,
  frequencyGHz, freqSweepEnabled, freqSweepStart, freqSweepEnd
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const count = resolution * resolution;
  
  const { positions, uvs } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const uv = new Float32Array(count * 2);
    return { positions: pos, uvs: uv };
  }, [resolution]);

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
        if (freqSweepEnabled && freqSweepEnd > freqSweepStart) {
            norm = (frequencyGHz - freqSweepStart) / (freqSweepEnd - freqSweepStart);
            norm = Math.max(0, Math.min(1, norm));
        }
        materialRef.current.uniforms.uFreqNorm.value = norm;
    }

    const positionsAttr = pointsRef.current.geometry.attributes.position;
    
    const formulaStr = antennaType === AntennaType.CUSTOM 
      ? customFormula 
      : ANTENNA_PRESETS[antennaType].formula;

    let formulaFunc: Function;
    try {
      formulaFunc = new Function('theta', 'phi', `return ${formulaStr};`);
    } catch (e) {
      formulaFunc = () => 0.1;
    }

    const activeElements = mimoEnabled ? mimoTxCount : (arrayEnabled ? arrayElements : 1);
    const isActiveArray = mimoEnabled || arrayEnabled;

    const k = 2 * Math.PI;
    const steerRad = (90 - steeringAngle) * (Math.PI / 180);
    const beta = -k * elementSpacing * Math.cos(steerRad);

    const time = state.clock.getElapsedTime();

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const theta = (i / (resolution - 1)) * Math.PI;
        const phi = (j / (resolution - 1)) * 2 * Math.PI;
        
        const index = (i * resolution + j);
        
        let r_element = 0;
        try {
          r_element = Math.abs(formulaFunc(theta, phi));
        } catch (e) { r_element = 0.1; }

        let totalGain = r_element;

        if (isActiveArray && activeElements > 1) {
            const psi = k * elementSpacing * Math.cos(theta) + beta;
            let af = 0;
            const sinPsi2 = Math.sin(psi / 2);
            if (Math.abs(sinPsi2) < 1e-6) {
                af = 1.0; 
            } else {
                const num = Math.sin(activeElements * psi / 2);
                af = Math.abs(num / (activeElements * sinPsi2));
            }
            totalGain *= af;
        }

        const displayRadius = totalGain * (gain / 5.0) * 5.0; 
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
        {mimoEnabled && (
            <group position={[0, 10, 0]}>
                <Text fontSize={1.5} color="#10b981" anchorX="center" anchorY="middle">
                    {`MIMO ACTIVE: ${beamformingType}`}
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
