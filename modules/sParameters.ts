import { SParameterPoint, AntennaType } from '../types';
import { calculateImpedance } from './impedanceMatching';

export const generateSParameters = (
    startF: number,
    endF: number,
    centerF: number,
    steps: number,
    antennaType: AntennaType
): SParameterPoint[] => {
    
    // Determine Q Factor based on antenna type physics
    let Q = 10;
    switch(antennaType) {
        case AntennaType.YAGI: Q = 30; break; // Narrow band high Q
        case AntennaType.DIPOLE: Q = 10; break;
        case AntennaType.MICROSTRIP: Q = 25; break;
        case AntennaType.HORN: Q = 2; break; // Wide band low Q
        case AntennaType.PARABOLIC: Q = 5; break;
        default: Q = 10;
    }

    const points: SParameterPoint[] = [];
    const stepSize = (endF - startF) / steps;

    for (let i = 0; i <= steps; i++) {
        const f = startF + i * stepSize;
        if (f <= 0) continue;

        const impedance = calculateImpedance(f, centerF, Q);
        
        // Phase approximation: atan of imaginary part
        // delta in impedance calc is roughly imaginary component normalized
        const delta = Q * (f/centerF - centerF/f);
        const phase = Math.atan(-delta) * (180 / Math.PI);

        points.push({
            freq: parseFloat(f.toFixed(3)),
            s11_mag_dB: impedance.returnLoss_dB,
            s11_phase_deg: phase,
            vswr: impedance.vswr
        });
    }

    return points;
};