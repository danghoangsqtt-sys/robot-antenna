
import React, { useMemo } from 'react';
import { Box, Text, Line, Plane } from '@react-three/drei';
import * as THREE from 'three';
import { Obstacle, AntennaType, TerrainType } from '../types';
import { DIELECTRIC_MATERIALS } from './materials';
import { getPatternFunction } from './farFieldPhysics';
import { computeMultipath } from './multipathPhysics';
import { useStore } from '../store';

export const MultipathRenderer: React.FC<{
    obstacles: Obstacle[],
    maxReflections: number,
    antennaType: AntennaType,
    customFormula: string,
    terrainType: TerrainType
}> = ({ obstacles, maxReflections, antennaType, customFormula, terrainType }) => {
    
    const { rays } = useMemo(() => {
        const formulaFunc = getPatternFunction(antennaType, customFormula);
        return computeMultipath(obstacles, terrainType, maxReflections, formulaFunc);
    }, [obstacles, maxReflections, antennaType, customFormula, terrainType]);

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
                    </Box>
                );
            })}

            {terrainType !== TerrainType.NONE && (
                <Plane args={[100, 100]} rotation={[-Math.PI/2, 0, 0]} position={[0, -2, 0]}>
                    <meshStandardMaterial 
                        color={terrainType === TerrainType.CITY ? "#334155" : "#3f6212"} 
                        roughness={0.9}
                    />
                    <gridHelper args={[100, 50, 0x000000, 0x555555]} rotation={[-Math.PI/2, 0, 0]} />
                </Plane>
            )}

            {rays.map((ray, i) => (
                <Line 
                    key={i} 
                    points={[ray.start, ray.end]} 
                    color={ray.color} 
                    lineWidth={1} 
                    transparent 
                    opacity={0.6} 
                />
            ))}
            
            {/* Visual Receiver for Metrics Context */}
            <group position={[10, 0, 10]}>
                <mesh>
                    <sphereGeometry args={[0.5]} />
                    <meshBasicMaterial color="cyan" wireframe />
                </mesh>
                <Text position={[0,1,0]} fontSize={0.5} color="cyan">Rx</Text>
            </group>
        </group>
    )
};
