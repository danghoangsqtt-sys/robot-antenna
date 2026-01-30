
import { BeamformingType } from '../types';

/**
 * Calculates the Array Factor for a linear array.
 * @param theta - Observation angle in radians (from broadside)
 * @param N - Number of elements
 * @param d - Spacing in wavelengths
 * @param steeringAngleDeg - Desired main beam angle in degrees
 * @param type - Beamforming Algorithm Type
 */
export const calculateArrayFactor = (
    theta: number, 
    N: number, 
    d: number, 
    steeringAngleDeg: number,
    type: BeamformingType = BeamformingType.MRT
): number => {
    if (N <= 1) return 1.0;

    const k = 2 * Math.PI; 
    // Steering angle conversion: 0 deg in UI = 90 deg theta (Broadside)
    const steerRad = (90 - steeringAngleDeg) * (Math.PI / 180);
    const beta = -k * d * Math.cos(steerRad); // Basic phase shift
    
    const psi = k * d * Math.cos(theta) + beta;
    
    // Base Array Factor (Sinc-like)
    const sinPsi2 = Math.sin(psi / 2);
    let af = 0;
    
    if (Math.abs(sinPsi2) < 1e-6) {
        af = 1.0; 
    } else {
        const num = Math.sin(N * psi / 2);
        af = Math.abs(num / (N * sinPsi2));
    }

    // Apply Beamforming Algorithm Nuances (Simulated)
    switch (type) {
        case BeamformingType.ZF: // Zero Forcing
            // Sharpens the beam, suppresses side lobes aggressively
            // Simulating null placement by powering up main lobe sharpness
            return Math.pow(af, 2); 

        case BeamformingType.MMSE: // MMSE
            // Balance between gain and noise suppression. 
            // Often smoother than MRT but wider than ZF in presence of noise.
            // We simulate this by a slight sharpening without full suppression
            return Math.pow(af, 1.5);

        case BeamformingType.MRT: // Maximum Ratio Transmission
        default:
            // Standard constructive interference
            return af;
    }
};

/**
 * Calculates MIMO Gain offset based on Tx/Rx configuration.
 */
export const calculateMIMOGain = (tx: number, rx: number): number => {
    // 10*log10(Tx) for beamforming gain assumption
    return 10 * Math.log10(Math.max(1, tx));
};
