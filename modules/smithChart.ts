
import { SParameterPoint } from '../types';

export interface Complex {
    r: number;
    i: number;
}

export const dbToMagnitude = (db: number): number => Math.pow(10, db / 20);

export const polarToRectangular = (mag: number, phaseDeg: number): Complex => {
    const phaseRad = phaseDeg * (Math.PI / 180);
    return {
        r: mag * Math.cos(phaseRad),
        i: mag * Math.sin(phaseRad)
    };
};

/**
 * Converts S11 data points to Smith Chart coordinates (Gamma plane).
 * Smith Chart is essentially a plot of the reflection coefficient Gamma.
 */
export const convertSParamsToSmithCoords = (points: SParameterPoint[]): Complex[] => {
    return points.map(p => {
        const mag = dbToMagnitude(p.s11_mag_dB);
        return polarToRectangular(mag, p.s11_phase_deg);
    });
};

/**
 * Calculates the Z (Normalized Impedance) from Gamma.
 * Z = (1 + Gamma) / (1 - Gamma)
 */
export const gammaToImpedance = (gamma: Complex): Complex => {
    // (1 + Gr + jGi) / (1 - Gr - jGi)
    const den = (1 - gamma.r) * (1 - gamma.r) + (gamma.i * gamma.i);
    if (den === 0) return { r: 9999, i: 9999 }; // Infinity
    
    return {
        r: (1 - gamma.r * gamma.r - gamma.i * gamma.i) / den,
        i: (2 * gamma.i) / den
    };
};
