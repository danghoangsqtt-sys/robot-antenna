
/**
 * Calculates signal statistics for Time Domain visualization.
 */
export interface SignalStats {
    peak: number;
    rms: number;
    papr_dB: number;
    average: number;
}

export const analyzeSignal = (data: Float32Array): SignalStats => {
    let sum = 0;
    let sumSq = 0;
    let peak = 0;

    for (let i = 0; i < data.length; i++) {
        const val = data[i];
        const absVal = Math.abs(val);
        sum += val;
        sumSq += val * val;
        if (absVal > peak) peak = absVal;
    }

    const len = data.length || 1;
    const avg = sum / len;
    const rms = Math.sqrt(sumSq / len);
    
    // Peak-to-Average Power Ratio
    const papr = rms > 0 ? (peak * peak) / (rms * rms) : 0;
    const papr_dB = papr > 0 ? 10 * Math.log10(papr) : 0;

    return {
        peak,
        rms,
        papr_dB,
        average: avg
    };
};

/**
 * Generates a mock Gaussian pulse for testing FDTD probes if simulation isn't running.
 */
export const generateGaussianPulse = (t: number, center: number, width: number): number => {
    const dt = t - center;
    return Math.exp(-(dt * dt) / (2 * width * width));
};
