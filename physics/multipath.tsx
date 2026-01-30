import React, { useMemo } from 'react';
import { Box, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Obstacle, AntennaType, MaterialType } from '../types';
import { DIELECTRIC_MATERIALS } from './materials';
import { ANTENNA_PRESETS } from '../antenna/presets';

interface RaySegment {
    start: THREE.Vector3;
    end: THREE.Vector3;
    color: string;
}

export const MultipathRenderer: React.FC<{
    obstacles: Obstacle[],
    maxReflections: number,
    antennaType: AntennaType,
    customFormula: string
}> = ({ obstacles, maxReflections, antennaType, customFormula }) => {
    
    const rays: RaySegment[] = useMemo(() => {
        const generatedRays: RaySegment[] = [];
        const rayCount = 40; 
        
        const formulaStr = antennaType === AntennaType.CUSTOM 
            ? customFormula 
            : ANTENNA_PRESETS[antennaType].formula;
        let formulaFunc: Function;
        try { formulaFunc = new Function('theta', 'phi', `return ${formulaStr};`); } catch { formulaFunc = () => 0.1; }

        for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2;
            const theta = Math.PI / 2;
            const phi = angle;
            
            let gain = 0;
            try { gain = Math.abs(formulaFunc(theta, phi)); } catch {}
            
            if (gain < 0.3) continue;

            let origin = new THREE.Vector3(0, 0, 0);
            let direction = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle)).normalize();
            let currentPower = 1.0;

            for (let bounce = 0; bounce <= maxReflections; bounce++) {
                let closestDist = Infinity;
                let closestHit: THREE.Vector3 | null = null;
                let closestNormal: THREE.Vector3 | null = null;
                let hitMaterial: MaterialType = MaterialType.CONCRETE;

                obstacles.forEach(obs => {
                    const boxPos = new THREE.Vector3(...obs.position);
                    const boxRot = new THREE.Euler(...obs.rotation);
                    const boxScale = new THREE.Vector3(...obs.scale);
                    
                    const matrix = new THREE.Matrix4().compose(boxPos, new THREE.Quaternion().setFromEuler(boxRot), new THREE.Vector3(1,1,1));
                    const invMatrix = matrix.clone().invert();
                    
                    const localOrigin = origin.clone().applyMatrix4(invMatrix);
                    const localDir = direction.clone().transformDirection(invMatrix).normalize();
                    
                    const min = boxScale.clone().multiplyScalar(-0.5);
                    const max = boxScale.clone().multiplyScalar(0.5);

                    const invDir = new THREE.Vector3(1/localDir.x, 1/localDir.y, 1/localDir.z);
                    
                    const t1 = (min.x - localOrigin.x) * invDir.x;
                    const t2 = (max.x - localOrigin.x) * invDir.x;
                    const t3 = (min.y - localOrigin.y) * invDir.y;
                    const t4 = (max.y - localOrigin.y) * invDir.y;
                    const t5 = (min.z - localOrigin.z) * invDir.z;
                    const t6 = (max.z - localOrigin.z) * invDir.z;

                    const tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
                    const tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));

                    if (tmax >= tmin && tmin > 0.1 && tmin < closestDist) {
                        closestDist = tmin;
                        
                        const localHit = localOrigin.clone().add(localDir.clone().multiplyScalar(tmin));
                        closestHit = localHit.clone().applyMatrix4(matrix);
                        hitMaterial = obs.material;

                        const epsilon = 0.001;
                        const normal = new THREE.Vector3(0,0,0);
                        if (Math.abs(localHit.x - min.x) < epsilon) normal.set(-1,0,0);
                        else if (Math.abs(localHit.x - max.x) < epsilon) normal.set(1,0,0);
                        else if (Math.abs(localHit.y - min.y) < epsilon) normal.set(0,-1,0);
                        else if (Math.abs(localHit.y - max.y) < epsilon) normal.set(0,1,0);
                        else if (Math.abs(localHit.z - min.z) < epsilon) normal.set(0,0,-1);
                        else if (Math.abs(localHit.z - max.z) < epsilon) normal.set(0,0,1);
                        
                        closestNormal = normal.transformDirection(matrix).normalize();
                    }
                });

                const endPoint = closestHit ? closestHit : origin.clone().add(direction.clone().multiplyScalar(50));
                
                const color = new THREE.Color().setHSL(0.6 * currentPower, 1, 0.5).getStyle();
                
                generatedRays.push({ start: origin, end: endPoint, color });

                if (closestHit && closestNormal && bounce < maxReflections) {
                    const props = DIELECTRIC_MATERIALS[hitMaterial];
                    let reflectionCoeff = 1.0; 
                    
                    if (props.name !== MaterialType.METAL) {
                        const eps = props.epsilon_r;
                        const g = Math.abs((1 - Math.sqrt(eps)) / (1 + Math.sqrt(eps)));
                        reflectionCoeff = g;
                    }

                    currentPower *= (reflectionCoeff * reflectionCoeff);
                    currentPower *= (1.0 - props.lossTangent * 5.0);

                    const reflectDir = direction.clone().reflect(closestNormal).normalize();
                    origin = closestHit.clone().add(closestNormal.clone().multiplyScalar(0.01));
                    direction = reflectDir;
                    
                    if (currentPower < 0.01) break;
                } else {
                    break;
                }
            }
        }
        return generatedRays;
    }, [obstacles, maxReflections, antennaType, customFormula]);

    return (
        <group>
            {obstacles.map(obs => {
                const props = DIELECTRIC_MATERIALS[obs.material];
                return (
                    <Box 
                        key={obs.id} 
                        args={[1, 1, 1]} 
                        position={obs.position} 
                        rotation={obs.rotation} 
                        scale={obs.scale}
                    >
                        <meshStandardMaterial 
                            color={props.color} 
                            roughness={props.roughness} 
                            metalness={props.metalness}
                            transparent={props.opacity < 1.0}
                            opacity={props.opacity}
                        />
                        <Text 
                            position={[0, 0.6, 0]} 
                            fontSize={0.2} 
                            color="white"
                            anchorX="center" anchorY="middle"
                        >
                             {`${obs.material}\nεr: ${props.epsilon_r}`}
                        </Text>
                    </Box>
                );
            })}

            {rays.map((ray, i) => (
                <Line 
                    key={i} 
                    points={[ray.start, ray.end]} 
                    color={ray.color} 
                    lineWidth={2} 
                    transparent 
                    opacity={0.6} 
                />
            ))}
        </group>
    )
};
