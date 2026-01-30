
export interface LinkBudgetParams {
    freqGHz: number;
    txPowerdBm: number;
    txGaindBi: number;
    rxGaindBi: number;
    distanceKm: number;
    rxSensdBm: number;
    lossesdB: number;
}

export interface LinkBudgetResult {
    fspl: number;       // Free Space Path Loss (dB)
    rxPower: number;    // Received Power (dBm)
    margin: number;     // Link Margin (dB)
    snr: number;        // Signal to Noise Ratio (dB) assuming thermal noise floor
    isLinked: boolean;
}

/**
 * Calculates Free Space Path Loss (FSPL)
 * Formula: FSPL(dB) = 20log10(d_km) + 20log10(f_GHz) + 92.45
 */
export const calculateFSPL = (distKm: number, freqGHz: number): number => {
    if (distKm <= 0 || freqGHz <= 0) return 0;
    return 20 * Math.log10(distKm) + 20 * Math.log10(freqGHz) + 92.45;
};

export const calculateLinkBudget = (params: LinkBudgetParams): LinkBudgetResult => {
    const { freqGHz, txPowerdBm, txGaindBi, rxGaindBi, distanceKm, rxSensdBm, lossesdB } = params;

    const fspl = calculateFSPL(distanceKm, freqGHz);
    
    // Pr = Pt + Gt + Gr - FSPL - Losses
    const rxPower = txPowerdBm + txGaindBi + rxGaindBi - fspl - lossesdB;
    
    const margin = rxPower - rxSensdBm;
    
    // Thermal Noise Floor (approx for 20MHz bandwidth at room temp) -> -101 dBm
    // SNR = Pr - NoiseFloor
    const noiseFloor = -101; 
    const snr = rxPower - noiseFloor;

    return {
        fspl,
        rxPower,
        margin,
        snr,
        isLinked: margin > 0
    };
};

/**
 * Calculates max range for a given margin = 0
 * derived from FSPL formula
 */
export const calculateMaxRangeKm = (
    freqGHz: number, 
    txPowerdBm: number, 
    totalGaindBi: number, 
    rxSensdBm: number,
    lossesdB: number
): number => {
    // Budget = Pt + Gt + Gr - Sens - Losses
    const budget = txPowerdBm + totalGaindBi - rxSensdBm - lossesdB;
    // budget = 20log(d) + 20log(f) + 92.45
    // 20log(d) = budget - 20log(f) - 92.45
    
    const logDist = (budget - 20 * Math.log10(freqGHz) - 92.45) / 20;
    return Math.pow(10, logDist);
};
