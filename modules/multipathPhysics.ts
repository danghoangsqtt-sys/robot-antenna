
import * as THREE from 'three';
import { Obstacle, MaterialType, TerrainType, MultipathMetrics } from '../types';
import { DIELECTRIC_MATERIALS } from './materials';

export interface RaySegment {
    start: THREE.Vector3;
    end: THREE.Vector3;
    color: string;
}

export interface SimulationResult {
    rays: RaySegment[];
    metrics: MultipathMetrics;
}

export const computeMultipath = (
    obstacles: Obstacle[],
    terrainType: TerrainType,
    maxReflections: number,
    antennaFunc: Function
): SimulationResult => {
    const rays: RaySegment[] = [];
    const rayCount = 60; // Increase resolution
    
    // Receiver assumption: A grid of points or average over space?
    // For scalar metrics like Delay Spread, we simulate a single "Reference Receiver" at a fixed location
    const rxPos = new THREE.Vector3(10, 0, 10); 
    const rxThresholdDist = 3.0; // "Bucket" size for Rx
    
    let pathDelays: number[] = [];
    let pathPowers: number[] = []; // Linear

    for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2;
        // 2D slice for ray tracing demo
        const theta = Math.PI / 2;
        const phi = angle;
        
        let gain = 0;
        try { gain = Math.abs(antennaFunc(theta, phi)); } catch {}
        if (gain < 0.1) continue;

        let origin = new THREE.Vector3(0, 0, 0);
        let direction = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle)).normalize();
        let currentPower = 1.0;
        let totalPathLen = 0;

        for (let bounce = 0; bounce <= maxReflections; bounce++) {
            let closestDist = Infinity;
            let closestHit: THREE.Vector3 | null = null;
            let closestNormal: THREE.Vector3 | null = null;
            let hitMaterial: MaterialType = MaterialType.CONCRETE;

            // 1. Check Obstacles
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

                // Slab method for AABB
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
                    
                    // Normal
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

            // 2. Check Terrain (Simplified Plane for efficiency)
            if (terrainType !== TerrainType.NONE) {
                const groundY = -2.0; // Floor level
                if (direction.y < 0) { // Only check if looking down
                    const tGround = (groundY - origin.y) / direction.y;
                    if (tGround > 0.1 && tGround < closestDist) {
                        closestDist = tGround;
                        closestHit = origin.clone().add(direction.clone().multiplyScalar(tGround));
                        closestNormal = new THREE.Vector3(0, 1, 0);
                        hitMaterial = MaterialType.CONCRETE; 
                    }
                }
            }

            const endPoint = closestHit ? closestHit : origin.clone().add(direction.clone().multiplyScalar(50));
            
            // Check if ray passes near Rx
            const rayLine = new THREE.Line3(origin, endPoint);
            const closestPointToRx = new THREE.Vector3();
            rayLine.closestPointToPoint(rxPos, true, closestPointToRx);
            const distToRx = closestPointToRx.distanceTo(rxPos);
            
            if (distToRx < rxThresholdDist) {
                // Ray contributes to Rx
                const distFromOrigin = origin.distanceTo(closestPointToRx);
                const pathLen = totalPathLen + distFromOrigin;
                const c = 0.3; // meters / ns
                const delay = pathLen / c;
                pathDelays.push(delay);
                pathPowers.push(currentPower * gain / (pathLen * pathLen)); // Friis approx
            }

            totalPathLen += origin.distanceTo(endPoint);
            
            const hue = 0.6 * (1.0 - (bounce / maxReflections)); // Blue to Red
            const color = new THREE.Color().setHSL(hue, 1, 0.5).getStyle();
            
            rays.push({ start: origin, end: endPoint, color });

            if (closestHit && closestNormal && bounce < maxReflections) {
                const props = DIELECTRIC_MATERIALS[hitMaterial];
                let reflectCoeff = 0.5; // default
                if (props) {
                    const eps = props.epsilon_r;
                    reflectCoeff = Math.abs((1 - Math.sqrt(eps)) / (1 + Math.sqrt(eps)));
                }
                
                // Scattering logic (simple jitter)
                if (props.roughness > 0.5 && Math.random() < 0.3) {
                    closestNormal.add(new THREE.Vector3(
                        (Math.random()-0.5)*props.roughness,
                        (Math.random()-0.5)*props.roughness,
                        (Math.random()-0.5)*props.roughness
                    )).normalize();
                }

                currentPower *= reflectCoeff;
                const reflectDir = direction.clone().reflect(closestNormal).normalize();
                
                origin = closestHit.clone().add(closestNormal.clone().multiplyScalar(0.01));
                direction = reflectDir;
                
                if (currentPower < 0.01) break;
            } else {
                break;
            }
        }
    }

    // Calculate Delay Spread
    let avgDelay = 0;
    let rmsDelay = 0;
    let totalPower = 0;
    let coherenceBW = 0;

    if (pathPowers.length > 0) {
        totalPower = pathPowers.reduce((a, b) => a + b, 0);
        // Mean Excess Delay
        let sumPowerDelay = 0;
        for(let i=0; i<pathPowers.length; i++) sumPowerDelay += pathPowers[i] * pathDelays[i];
        avgDelay = sumPowerDelay / totalPower;

        // RMS Delay Spread
        let sumPowerDelaySq = 0;
        for(let i=0; i<pathPowers.length; i++) sumPowerDelaySq += pathPowers[i] * Math.pow(pathDelays[i] - avgDelay, 2);
        rmsDelay = Math.sqrt(sumPowerDelaySq / totalPower);

        // Coherence Bandwidth (approx 1 / 5*sigma_tau)
        if (rmsDelay > 0.001) coherenceBW = 1 / (5 * rmsDelay * 1e-9) / 1e6; // MHz
    }

    return {
        rays,
        metrics: {
            delaySpread_ns: rmsDelay,
            coherenceBandwidth_MHz: coherenceBW,
            receivedPower_dBm: 10 * Math.log10(totalPower || 1e-9),
            numPaths: pathPowers.length
        }
    };
};
