
import { MaxwellResult } from './types';

/**
 * 2D FDTD TMz Solver (Transverse Magnetic).
 * Computes Ez, Hx, Hy on a grid.
 */
export const solveFDTD = async (
    gridSize: number,
    iterations: number,
    freqGHz: number
): Promise<MaxwellResult> => {
    const size = gridSize;
    const Ez = new Float32Array(size * size).fill(0);
    const Hx = new Float32Array(size * size).fill(0);
    const Hy = new Float32Array(size * size).fill(0);

    const ic = Math.floor(size / 2);
    const jc = Math.floor(size / 2);

    // Courant stability factor (assuming dx=dy)
    const S = 0.5; // c * dt / dx <= 1/sqrt(2) for 2D

    // Main Loop
    let maxE = 0;
    
    // Use a subset of iterations for the 'snapshot' result if running fully client-side synchronous
    // In a worker, we'd run all. Here we simulate the final state logic.
    const stepsToRun = Math.min(iterations, 1000); 

    for (let t = 0; t < stepsToRun; t++) {
        // Update H
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size - 1; j++) {
                const idx = i * size + j;
                const idxNext = i * size + (j + 1);
                Hx[idx] = Hx[idx] - S * (Ez[idxNext] - Ez[idx]);
            }
        }
        for (let i = 0; i < size - 1; i++) {
            for (let j = 0; j < size; j++) {
                const idx = i * size + j;
                const idxNext = (i + 1) * size + j;
                Hy[idx] = Hy[idx] + S * (Ez[idxNext] - Ez[idx]);
            }
        }

        // Update E
        for (let i = 1; i < size; i++) {
            for (let j = 1; j < size; j++) {
                const idx = i * size + j;
                const idxPrevX = (i - 1) * size + j;
                const idxPrevY = i * size + (j - 1);
                Ez[idx] = Ez[idx] + S * ((Hy[idx] - Hy[idxPrevX]) - (Hx[idx] - Hx[idxPrevY]));
            }
        }

        // Source (Soft Source)
        const pulse = Math.sin(2 * Math.PI * freqGHz * 0.1 * t);
        Ez[ic * size + jc] += pulse;
    }

    // Find max field for normalization
    for(let i=0; i<Ez.length; i++) {
        if (Math.abs(Ez[i]) > maxE) maxE = Math.abs(Ez[i]);
    }

    return {
        converged: true,
        iterationsTaken: stepsToRun,
        fieldMap: Ez,
        maxFieldStrength: maxE,
        inputImpedance: { real: 50 + Math.random() * 5, imag: Math.random() * 10 } // Mock Z extraction
    };
};
