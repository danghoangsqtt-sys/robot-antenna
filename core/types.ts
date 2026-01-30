
export enum AntennaType {
  DIPOLE = 'Dipole',
  YAGI = 'Yagi-Uda',
  HORN = 'Horn',
  PARABOLIC = 'Parabolic',
  MICROSTRIP = 'Microstrip',
  CUSTOM = 'Custom Formula'
}

export interface AntennaPreset {
  name: AntennaType;
  formula: string; // JavaScript expression string using 'theta' and 'phi'
  description: string;
  defaultGain: number;
}

export interface GeometryPrimitive {
  shape: 'cylinder' | 'box' | 'paraboloid' | 'cone';
  count?: number;
  dimensions?: {
    length_lambda?: number;
    radius_lambda?: number;
    width_lambda?: number;
    height_lambda?: number;
    diameter_lambda?: number;
    spacing_lambda?: number;
  };
  orientation?: string; 
}

export interface AIAnalysisResponse {
  antennaType: string;
  geometry3D: GeometryPrimitive[];
  estimatedParameters: {
    frequency_GHz?: number;
    elements?: number;
    overall_length_lambda?: number;
    gain_dBi?: number;
  };
  radiationPattern: {
    formula: string;
    gain_dBi: number;
    mainLobeDirection?: string;
  };
  confidence?: number;
}

export interface AntennaOptimizationResponse {
  optimizedGeometry: GeometryPrimitive[];
  optimizedPattern: {
    formula: string;
    gain_dBi: number;
  };
  designNotes: string;
}

export enum MaterialType {
  AIR = 'Air',
  FR4 = 'FR4',
  GLASS = 'Glass',
  CONCRETE = 'Concrete',
  METAL = 'Metal (Perfect)'
}

export interface DielectricDefinition {
  name: MaterialType;
  epsilon_r: number;
  lossTangent: number;
  color: string;
  roughness: number;
  metalness: number;
  opacity: number;
}

export interface Obstacle {
  id: string;
  type: 'box';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  material: MaterialType;
}

export interface PolarPlotConfig {
  visible: boolean;
  plane: 'E' | 'H'; 
  scale: 'linear' | 'dB';
}

export enum BeamformingType {
  MRT = 'MRT (Max Ratio)',
  ZF = 'ZF (Zero Forcing)',
  MMSE = 'MMSE'
}

export interface MimoState {
  enabled: boolean;
  txCount: number;
  rxCount: number;
  beamformingType: BeamformingType;
}

export interface FrequencySweepConfig {
  enabled: boolean;
  running: boolean;
  startHz: number; 
  endHz: number;   
  stepHz: number;  
}

export interface SParameterPoint {
  freq: number;
  s11_mag_dB: number;
  s11_phase_deg: number;
  vswr: number;
  s21_mag_dB?: number;
}

export interface SParameterState {
  enabled: boolean;
  points: SParameterPoint[];
  currentVSWR: number;
  currentS11: number;
}

export interface FDTDState {
  enabled: boolean;
  running: boolean;
  gridSize: number; 
  timeStepSpeed: number; 
  slicePlane: 'XY' | 'XZ' | 'YZ';
  simulationTime: number;
}

export interface AdvancedPhysicsState {
  arrayEnabled: boolean;
  arrayElements: number;     
  elementSpacing: number;    
  steeringAngle: number;     
  
  transmitPowerdBm: number;  
  receiverSensitivitydBm: number; 
  frequencyGHz: number;       
  
  showCoverage: boolean;

  nearFieldEnabled: boolean;

  multipathEnabled: boolean;
  maxReflections: number;
  obstacles: Obstacle[];

  polarPlotConfig: PolarPlotConfig;

  mimo: MimoState;

  freqSweep: FrequencySweepConfig;

  sParams: SParameterState;

  fdtd: FDTDState;
  
  activeRightPanel: 'polar' | 'sparam' | 'linkBudget'; // Added linkBudget
}

export interface SimulationState extends AdvancedPhysicsState {
  antennaType: AntennaType;
  gain: number;
  resolution: number;
  customFormula: string;
  
  techFreq: string;
  techLength: string;
  techElements: string;
  techSpacing: string;

  physicalGeometry: GeometryPrimitive[] | null;
  showPhysicalAntenna: boolean;

  isRecording: boolean;
  handControlActive: boolean;
  gesture: string | null;
  showWebcam: boolean;
  
  setAntennaType: (type: AntennaType) => void;
  setGain: (gain: number) => void;
  setResolution: (res: number) => void;
  setCustomFormula: (formula: string) => void;
  
  setTechParams: (params: Partial<{techFreq: string, techLength: string, techElements: string, techSpacing: string}>) => void;
  setPhysicalGeometry: (geometry: GeometryPrimitive[] | null) => void;
  togglePhysicalAntenna: () => void;
  
  applyOptimization: (data: AntennaOptimizationResponse) => void;

  setRecording: (isRecording: boolean) => void;
  setGesture: (gesture: string | null) => void;
  toggleWebcam: () => void;

  setAdvancedParams: (params: Partial<AdvancedPhysicsState>) => void;
  
  addObstacle: () => void;
  removeObstacle: (id: string) => void;
  updateObstacle: (id: string, updates: Partial<Obstacle>) => void;

  setPolarPlotConfig: (config: Partial<PolarPlotConfig>) => void;

  setMimoParams: (params: Partial<MimoState>) => void;

  setFreqSweepParams: (params: Partial<FrequencySweepConfig>) => void;
  
  setSParamState: (state: Partial<SParameterState>) => void;
  setActiveRightPanel: (panel: 'polar' | 'sparam' | 'linkBudget') => void;

  setFDTDParams: (params: Partial<FDTDState>) => void;
}

export enum HandGesture {
  FIST = 'FIST',
  OPEN_PALM = 'OPEN_PALM',
  VICTORY = 'VICTORY', 
  UNKNOWN = 'UNKNOWN'
}
