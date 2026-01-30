

export enum MaxwellMethod {
  FDTD = 'FDTD (Finite Difference Time Domain)',
  MoM = 'MoM (Method of Moments)',
  FEM = 'FEM (Finite Element Method)'
}

export interface MaxwellConfig {
  method: MaxwellMethod;
  gridSize: number; // For FDTD/FEM
  segments: number; // For MoM
  iterations: number;
  gpuAcceleration: boolean;
  adaptiveMesh: boolean;
}

export interface MaxwellResult {
  converged: boolean;
  iterationsTaken: number;
  inputImpedance?: { real: number; imag: number };
  currentDistribution?: Float32Array; // For MoM
  fieldMap?: Float32Array; // For FDTD/FEM (2D slice flattened)
  maxFieldStrength?: number;
}

export interface SolverState {
    config: MaxwellConfig;
    isRunning: boolean;
    progress: number;
    lastResult: MaxwellResult | null;
}
