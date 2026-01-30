
export interface ImpedanceResult {
    gamma: number; // Reflection Coefficient Magnitude
    vswr: number;
    returnLoss_dB: number;
}

/**
 * Calculates impedance mismatch parameters based on frequency detuning.
 * @param f - Current frequency
 * @param f0 - Resonant frequency
 * @param Q - Quality factor (Bandwidth inverse)
 */
export const calculateImpedance = (f: number, f0: number, Q: number): ImpedanceResult => {
    // Normalized detuning parameter for RLC series equivalent
    const delta = Q * (f / f0 - f0 / f);
    
    // Approximate magnitude of reflection coefficient (Gamma)
    // At resonance (delta=0), Gamma should be near 0 (perfect match assumed)
    // We assume a Lorentz shape for the dip
    
    // Real antenna S11 model: S11_mag = delta / sqrt(1 + delta^2) 
    // (This gives 0 at resonance, 1 far away)
    const gamma = Math.abs(delta) / Math.sqrt(1 + delta * delta);
    
    // Clamp gamma for numerical stability (never perfectly 1.0 or 0.0 in float math usually)
    const g = Math.max(0.001, Math.min(0.999, gamma));
    
    const vswr = (1 + g) / (1 - g);
    const returnLoss = 20 * Math.log10(g); // Will be negative

    return {
        gamma: g,
        vswr: vswr,
        returnLoss_dB: returnLoss
    };
};
