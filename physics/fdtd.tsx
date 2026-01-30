import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Plane } from '@react-three/drei';
import * as THREE from 'three';
import { FDTDState } from '../types';

const FDTD_FRAGMENT_SHADER = `
uniform sampler2D uTexture;
varying vec2 vUv;

void main() {
    float val = texture2D(uTexture, vUv).r;
    float mag = abs(val);
    vec3 color = vec3(0.0);
    if (val > 0.0) {
       color = mix(vec3(0.0, 0.0, 0.0), vec3(1.0, 0.2, 0.2), clamp(mag * 5.0, 0.0, 1.0)); 
    } else {
       color = mix(vec3(0.0, 0.0, 0.0), vec3(0.2, 0.2, 1.0), clamp(mag * 5.0, 0.0, 1.0)); 
    }
    float grid = 0.0;
    if (mod(vUv.x * 64.0, 1.0) < 0.1 || mod(vUv.y * 64.0, 1.0) < 0.1) grid = 0.1;

    gl_FragColor = vec4(color + grid, max(mag * 2.0, 0.1));
}
`;

const FDTD_VERTEX_SHADER = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const FDTDVisualizer: React.FC<{ fdtdState: FDTDState }> = ({ fdtdState }) => {
    const { enabled, running, gridSize, timeStepSpeed, slicePlane, simulationTime } = fdtdState;
    const meshRef = useRef<THREE.Mesh>(null);
    const textureRef = useRef<THREE.DataTexture | null>(null);
    
    const [fields] = useState(() => {
        const size = gridSize;
        return {
            Ez: new Float32Array(size * size),
            Hx: new Float32Array(size * size),
            Hy: new Float32Array(size * size),
            data: new Float32Array(size * size),
        };
    });

    useEffect(() => {
        if (simulationTime === 0 && !running) {
             fields.Ez.fill(0);
             fields.Hx.fill(0);
             fields.Hy.fill(0);
             fields.data.fill(0);
             if (textureRef.current) textureRef.current.needsUpdate = true;
        }
    }, [simulationTime, running]);

    useFrame((state, delta) => {
        if (!enabled || !running || !meshRef.current) return;
        
        const size = gridSize;
        const steps = Math.ceil(timeStepSpeed);
        const dt = 0.5; 
        
        for (let s = 0; s < steps; s++) {
            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size - 1; j++) {
                    const idx = i * size + j;
                    fields.Hx[idx] -= dt * (fields.Ez[idx + 1] - fields.Ez[idx]);
                }
            }
            
            for (let i = 0; i < size - 1; i++) {
                for (let j = 0; j < size; j++) {
                    const idx = i * size + j;
                    const idxRight = (i + 1) * size + j;
                    fields.Hy[idx] += dt * (fields.Ez[idxRight] - fields.Ez[idx]);
                }
            }

            for (let i = 1; i < size; i++) {
                for (let j = 1; j < size; j++) {
                    const idx = i * size + j;
                    const idxLeft = (i - 1) * size + j;
                    const idxDown = i * size + (j - 1);
                    
                    fields.Ez[idx] += dt * ((fields.Hy[idx] - fields.Hy[idxLeft]) - (fields.Hx[idx] - fields.Hx[idxDown]));
                }
            }

            const t = state.clock.getElapsedTime() * 20.0;
            const centerX = Math.floor(size / 2);
            const centerY = Math.floor(size / 2);
            const centerIdx = centerX * size + centerY;
            fields.Ez[centerIdx] = Math.sin(t * 2.0);
        }

        for (let k = 0; k < size * size; k++) {
            fields.data[k] = fields.Ez[k];
        }
        
        if (textureRef.current) {
            textureRef.current.needsUpdate = true;
        }
    });

    useMemo(() => {
        const texture = new THREE.DataTexture(
            fields.data,
            gridSize,
            gridSize,
            THREE.RedFormat,
            THREE.FloatType
        );
        texture.needsUpdate = true;
        textureRef.current = texture;
    }, [gridSize]);

    const rotation = useMemo(() => {
        if (slicePlane === 'XY') return [-Math.PI / 2, 0, 0] as [number, number, number];
        if (slicePlane === 'XZ') return [0, 0, 0] as [number, number, number];
        if (slicePlane === 'YZ') return [0, Math.PI / 2, 0] as [number, number, number];
        return [0, 0, 0] as [number, number, number];
    }, [slicePlane]);

    if (!enabled) return null;

    return (
        <Plane 
            ref={meshRef} 
            args={[40, 40]} 
            rotation={rotation}
            position={[0, 0, 0]}
        >
            <shaderMaterial 
                uniforms={{
                    uTexture: { value: textureRef.current }
                }}
                vertexShader={FDTD_VERTEX_SHADER}
                fragmentShader={FDTD_FRAGMENT_SHADER}
                transparent={true}
                side={THREE.DoubleSide}
                depthWrite={false}
            />
        </Plane>
    );
};
