
export interface AntennaMetrics {
    gain_dBi: number;
    efficiency: number; // 0.0 to 1.0
    directivity_dBi: number;
    hpbw_deg: number; // Half Power Beamwidth estimate
    frontToBackRatio_dB: number;
    effectiveArea_m2: number;
}

/**
 * Calculates theoretical antenna metrics based on Gain and Frequency.
 */
export const calculateAntennaMetrics = (
    gain_dBi: number, 
    efficiency: number, 
    freqGHz: number
): AntennaMetrics => {
    // D(dBi) = G(dBi) - 10*log10(efficiency)
    // If efficiency is 1.0 (100%), D = G.
    const effFactor = Math.max(0.001, Math.min(1.0, efficiency));
    const directivity_dBi = gain_dBi - 10 * Math.log10(effFactor);

    // HPBW Estimation (Kraus approximation for directional antennas)
    // Directivity ~= 41253 / (theta_hp * phi_hp)
    // Assuming circular symmetry (theta_hp = phi_hp) -> D_linear = 41253 / hpbw^2
    // hpbw = sqrt(41253 / 10^(D/10))
    let hpbw = 360;
    if (directivity_dBi > 2) {
        const dLinear = Math.pow(10, directivity_dBi / 10);
        hpbw = Math.sqrt(41253 / dLinear);
    } else {
        // Dipole-like
        hpbw = 78; 
    }

    // Effective Aperture Ae = (lambda^2 / 4pi) * G_linear
    const c = 3e8;
    const f = freqGHz * 1e9;
    const lambda = c / f;
    const gLinear = Math.pow(10, gain_dBi / 10);
    const ae = (Math.pow(lambda, 2) / (4 * Math.PI)) * gLinear;

    return {
        gain_dBi,
        efficiency: effFactor,
        directivity_dBi,
        hpbw_deg: hpbw,
        frontToBackRatio_dB: Math.max(0, gain_dBi + 15), // Approximation
        effectiveArea_m2: ae
    };
};
