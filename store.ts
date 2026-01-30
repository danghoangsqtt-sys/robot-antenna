
import { create } from 'zustand';
import { AntennaType, SimulationState, HandGesture, MaterialType, BeamformingType, TerrainType, VersionSnapshot } from './types';
import { ANTENNA_PRESETS } from './constants';
import { MaxwellMethod } from './modules/maxwell/types';

export const useStore = create<SimulationState & { zoomDelta: number; setZoomDelta: (d: number) => void }>((set, get) => ({
  antennaType: AntennaType.DIPOLE,
  gain: ANTENNA_PRESETS[AntennaType.DIPOLE].defaultGain,
  efficiency: 0.9, // 90% default
  resolution: 100, // Particles sqrt
  customFormula: ANTENNA_PRESETS[AntennaType.CUSTOM].formula,
  
  // Tech Inputs Defaults
  techFreq: '',
  techLength: '',
  techElements: '',
  techSpacing: '',

  physicalGeometry: null,
  showPhysicalAntenna: true,

  isRecording: false,
  handControlActive: false,
  gesture: null,
  showWebcam: true,

  // Camera Zoom Control
  zoomDelta: 0,

  // Advanced Physics Defaults
  arrayEnabled: false,
  arrayElements: 4,
  elementSpacing: 0.5,
  steeringAngle: 0,
  transmitPowerdBm: 20, // 20dBm = 100mW
  receiverSensitivitydBm: -80, // -80dBm
  frequencyGHz: 2.4,
  showCoverage: false,
  
  nearFieldEnabled: false,
  nearFieldConfig: {
      visualizationMode: 'particles',
      slicePlane: 'XZ',
      sliceOffset: 0,
      fieldType: 'E',
      intensityScale: 1.0
  },

  // Multipath Defaults
  multipathEnabled: false,
  maxReflections: 3,
  obstacles: [],
  terrainType: TerrainType.NONE,

  // Polar Plot Defaults
  polarPlotConfig: {
    visible: true,
    plane: 'E',
    scale: 'linear'
  },

  // MIMO Defaults
  mimo: {
    enabled: false,
    txCount: 4,
    rxCount: 2,
    beamformingType: BeamformingType.MRT
  },

  // Frequency Sweep Defaults
  freqSweep: {
    enabled: false,
    running: false,
    startHz: 2.0,
    endHz: 5.0,
    stepHz: 0.1
  },

  // S-Parameters Defaults
  sParams: {
    enabled: true,
    points: [],
    currentVSWR: 1.0,
    currentS11: -30
  },
  
  // FDTD Defaults
  fdtd: {
    enabled: false,
    running: false,
    gridSize: 100,
    timeStepSpeed: 1.0,
    slicePlane: 'XZ',
    simulationTime: 0
  },

  // Maxwell Solver Defaults
  maxwellSolver: {
      config: {
          method: MaxwellMethod.FDTD,
          gridSize: 100,
          segments: 50,
          iterations: 1000,
          gpuAcceleration: true,
          adaptiveMesh: true
      },
      isRunning: false,
      progress: 0,
      lastResult: null
  },

  activeRightPanel: 'polar',
  history: [],

  setAntennaType: (type) => set((state) => ({ 
    antennaType: type,
    gain: ANTENNA_PRESETS[type].defaultGain 
  })),
  setGain: (gain) => set({ gain }),
  setEfficiency: (eff) => set({ efficiency: eff }),
  setResolution: (res) => set({ resolution: res }),
  setCustomFormula: (formula) => set({ customFormula: formula }),
  
  setTechParams: (params) => set((state) => ({ ...state, ...params })),
  setPhysicalGeometry: (geometry) => set({ physicalGeometry: geometry }),
  togglePhysicalAntenna: () => set((state) => ({ showPhysicalAntenna: !state.showPhysicalAntenna })),

  applyOptimization: (data) => {
      // Auto-snapshot before applying optimization
      get().takeSnapshot(`Pre-Optimization: ${get().antennaType}`);
      set({
        physicalGeometry: data.optimizedGeometry,
        customFormula: data.optimizedPattern.formula,
        gain: data.optimizedPattern.gain_dBi,
        antennaType: AntennaType.CUSTOM, 
      });
  },

  setRecording: (isRecording) => set({ isRecording }),
  setGesture: (gesture) => set({ gesture }),
  toggleWebcam: () => set((state) => ({ showWebcam: !state.showWebcam })),
  setZoomDelta: (delta) => set({ zoomDelta: delta }),

  setAdvancedParams: (params) => set((state) => ({ ...state, ...params })),
  setNearFieldConfig: (config) => set((state) => ({
      nearFieldConfig: { ...state.nearFieldConfig, ...config }
  })),

  addObstacle: () => set((state) => ({
    obstacles: [
      ...state.obstacles,
      {
        id: crypto.randomUUID(),
        type: 'box',
        position: [5, 0, 5],
        rotation: [0, 0, 0],
        scale: [2, 10, 5],
        material: MaterialType.CONCRETE
      }
    ]
  })),
  removeObstacle: (id) => set((state) => ({
    obstacles: state.obstacles.filter(o => o.id !== id)
  })),
  updateObstacle: (id, updates) => set((state) => ({
    obstacles: state.obstacles.map(o => o.id === id ? { ...o, ...updates } : o)
  })),

  setPolarPlotConfig: (config) => set((state) => ({
    polarPlotConfig: { ...state.polarPlotConfig, ...config }
  })),

  setMimoParams: (params) => set((state) => ({
    mimo: { ...state.mimo, ...params }
  })),

  setFreqSweepParams: (params) => set((state) => ({
    freqSweep: { ...state.freqSweep, ...params }
  })),

  setSParamState: (params) => set((state) => ({
    sParams: { ...state.sParams, ...params }
  })),

  setActiveRightPanel: (panel) => set({ activeRightPanel: panel }),

  setFDTDParams: (params) => set((state) => ({
    fdtd: { ...state.fdtd, ...params }
  })),

  setMaxwellState: (solverState) => set((state) => ({
    maxwellSolver: { ...state.maxwellSolver, ...solverState }
  })),

  loadSimulation: (loadedState) => {
      // Auto-snapshot before loading external file
      get().takeSnapshot("Backup before Load");
      set((state) => ({ ...state, ...loadedState }));
  },

  takeSnapshot: (label) => {
      const state = get();
      const snapshot: VersionSnapshot = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          label,
          data: {
              antennaType: state.antennaType,
              gain: state.gain,
              customFormula: state.customFormula,
              physicalGeometry: state.physicalGeometry,
              frequencyGHz: state.frequencyGHz,
              arrayEnabled: state.arrayEnabled,
              arrayElements: state.arrayElements,
              elementSpacing: state.elementSpacing,
              steeringAngle: state.steeringAngle,
              obstacles: state.obstacles,
              // Add other critical state if needed
          }
      };
      set((s) => ({ history: [snapshot, ...s.history].slice(0, 20) })); // Keep last 20
  },

  restoreSnapshot: (id) => {
      const state = get();
      const snap = state.history.find(s => s.id === id);
      if (snap) {
          // Take a snapshot of "current" before restoring "old"
          const currentSnap: VersionSnapshot = {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              label: `Auto-Backup before Restore`,
              data: {
                  antennaType: state.antennaType,
                  gain: state.gain,
                  customFormula: state.customFormula,
                  physicalGeometry: state.physicalGeometry,
                  frequencyGHz: state.frequencyGHz,
                  arrayEnabled: state.arrayEnabled,
                  arrayElements: state.arrayElements,
                  elementSpacing: state.elementSpacing,
                  steeringAngle: state.steeringAngle,
                  obstacles: state.obstacles,
              }
          };
          
          set((s) => ({
              ...snap.data,
              history: [currentSnap, ...s.history].slice(0, 20)
          }));
      }
  }
}));
