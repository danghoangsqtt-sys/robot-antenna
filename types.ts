import React from 'react';
import { SolverState, MaxwellMethod } from './modules/maxwell/types';

// --- Document & RAG Types ---
export interface DocumentFile {
  id: string;
  name: string;
  type: 'pdf' | 'txt' | 'md';
  size: number;
  uploadedAt: number;
  content?: string; // Text extracted from PDF
  embedding?: number[]; // Vector embedding for RAG
}

export interface RAGContext {
  documents: DocumentFile[];
  embeddings: Map<string, number[]>; // docId -> embedding
  enabled: boolean;
}

export interface ChatMessageContent {
  text: string;
  formulas?: Array<{ latex: string; position: number }>; // Embedded LaTeX
  codeBlocks?: Array<{ language: string; code: string }>;
  imageUrls?: string[]; // Inline images
  sourceDoc?: string; // Reference to source document
}

export interface AdvancedChatMessage {
  id: string;
  sender: 'user' | 'eve' | 'system';
  content: ChatMessageContent;
  timestamp: number;
  metadata?: {
    tokensUsed?: number;
    processingTime?: number;
    documentsSourced?: string[]; // Which docs were used in RAG
  };
}

// --- Academic Source Types (Internet Research) ---
export interface AcademicSource {
  id: string;
  title: string;
  authors: string[];
  year: number;
  journal?: string; // Journal name
  doi?: string; // Digital Object Identifier
  url?: string; // Direct link to paper
  abstract?: string; // Paper summary
  sourceType: 'arxiv' | 'pubmed' | 'crossref' | 'wiki' | 'general';
  relevanceScore?: number; // 0-1 how relevant to query
  citations?: number; // Citation count
  tags?: string[]; // Research topics
}

export interface InternetResearchResult {
  query: string;
  sources: AcademicSource[];
  timestamp: number;
  searchEngine: string; // 'arxiv' | 'pubmed' | 'crossref' | 'wikipedia'
}

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

// --- New Geometry Types based on AI Output (Strict Schema) ---
export interface GeometryPrimitive {
  shape: 'cylinder' | 'box' | 'paraboloid' | 'cone' | 'plane';
  count?: number;
  dimensions?: {
    length_lambda?: number;
    radius_lambda?: number;
    width_lambda?: number;
    height_lambda?: number;
    diameter_lambda?: number;
    spacing_lambda?: number;
  };
  orientation?: string; // 'parallel' | 'vertical' | 'horizontal'
  material?: MaterialType;
  feedPoint?: [number, number, number];
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

export interface VisionHints {
  scaleRef: string;
  materialHint: string;
}

export enum MaterialType {
  AIR = 'Air',
  FR4 = 'FR4',
  ROGERS = 'Rogers 4003C',
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

export enum TerrainType {
    NONE = 'Void',
    FLAT = 'Flat Ground',
    CITY = 'Urban Canyon'
}

export interface MultipathMetrics {
    delaySpread_ns: number;
    coherenceBandwidth_MHz: number;
    receivedPower_dBm: number; // At a reference Rx point
    numPaths: number;
}

export interface PolarPlotConfig {
  visible: boolean;
  plane: 'E' | 'H'; // E-plane (Elevation), H-plane (Azimuth)
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
  startHz: number; // Stored in GHz for UI simplicity
  endHz: number;   // Stored in GHz
  stepHz: number;  // Stored in GHz
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
  gridSize: number; // e.g., 64 or 100
  timeStepSpeed: number; // multiplier
  slicePlane: 'XY' | 'XZ' | 'YZ';
  simulationTime: number;
}

export interface NearFieldConfig {
    visualizationMode: 'particles' | 'slice' | 'both';
    slicePlane: 'XY' | 'XZ' | 'YZ';
    sliceOffset: number;
    fieldType: 'E' | 'H' | 'Poynting';
    intensityScale: number;
}

export interface VersionSnapshot {
  id: string;
  timestamp: number;
  label: string;
  data: Partial<SimulationState>;
}

export interface SettingsState {
  geminiApiKey: string;
  eveScale: number; // 0.5 to 2.0 (50% to 200%)
}

export interface SystemGuideEntry {
  id: string;
  title: string;
  description: string;
  category: 'antenna' | 'ai' | 'ui' | 'physics' | 'export';
}

export interface AdvancedPhysicsState {
  arrayEnabled: boolean;
  arrayElements: number;     // N
  elementSpacing: number;    // d (lambda)
  steeringAngle: number;     // theta0 (degrees)
  
  transmitPowerdBm: number;  // Pt
  receiverSensitivitydBm: number; // Pr_min
  frequencyGHz: number;       // f
  
  showCoverage: boolean;

  // Near Field Props
  nearFieldEnabled: boolean;
  nearFieldConfig: NearFieldConfig;

  // Multipath Props
  multipathEnabled: boolean;
  maxReflections: number;
  obstacles: Obstacle[];
  terrainType: TerrainType;

  // Polar Plot
  polarPlotConfig: PolarPlotConfig;

  // MIMO
  mimo: MimoState;

  // Frequency Sweep
  freqSweep: FrequencySweepConfig;

  // S-Parameters
  sParams: SParameterState;

  // FDTD
  fdtd: FDTDState;
  
  // Maxwell Solver
  maxwellSolver: SolverState;

  // UI State
  activeRightPanel: 'polar' | 'sparam' | 'linkBudget' | 'smith' | 'mimo' | 'environment' | 'timeDomain' | 'materials' | 'geometryEditor' | 'metrics' | 'formulaLab' | 'nearField' | 'visionBuilder' | 'maxwellSolver' | 'versionHistory';
}

export interface SimulationState extends AdvancedPhysicsState {
  antennaType: AntennaType;
  gain: number;
  efficiency: number; // 0.0 to 1.0
  resolution: number;
  customFormula: string;
  
  // Technical Inputs
  techFreq: string;
  techLength: string;
  techElements: string;
  techSpacing: string;

  // Physical Model State
  physicalGeometry: GeometryPrimitive[] | null;
  showPhysicalAntenna: boolean;

  isRecording: boolean;
  handControlActive: boolean;
  gesture: string | null;
  showWebcam: boolean;

  // History
  history: VersionSnapshot[];

  // Settings
  settings: SettingsState;
  
  // Actions
  setAntennaType: (type: AntennaType) => void;
  setGain: (gain: number) => void;
  setEfficiency: (eff: number) => void;
  setResolution: (res: number) => void;
  setCustomFormula: (formula: string) => void;
  
  setTechParams: (params: Partial<{techFreq: string, techLength: string, techElements: string, techSpacing: string}>) => void;
  setPhysicalGeometry: (geometry: GeometryPrimitive[] | null) => void;
  togglePhysicalAntenna: () => void;
  
  applyOptimization: (data: AntennaOptimizationResponse) => void;

  setRecording: (isRecording: boolean) => void;
  setGesture: (gesture: string | null) => void;
  toggleWebcam: () => void;
  setZoomDelta: (delta: number) => void;

  setAdvancedParams: (params: Partial<AdvancedPhysicsState>) => void;
  setNearFieldConfig: (config: Partial<NearFieldConfig>) => void;
  
  // Obstacle Actions
  addObstacle: () => void;
  removeObstacle: (id: string) => void;
  updateObstacle: (id: string, updates: Partial<Obstacle>) => void;

  // Polar Plot Actions
  setPolarPlotConfig: (config: Partial<PolarPlotConfig>) => void;

  // MIMO Actions
  setMimoParams: (params: Partial<MimoState>) => void;

  // Frequency Sweep Actions
  setFreqSweepParams: (params: Partial<FrequencySweepConfig>) => void;
  
  // S-Param Actions
  setSParamState: (state: Partial<SParameterState>) => void;
  setActiveRightPanel: (panel: 'polar' | 'sparam' | 'linkBudget' | 'smith' | 'mimo' | 'environment' | 'timeDomain' | 'materials' | 'geometryEditor' | 'metrics' | 'formulaLab' | 'nearField' | 'visionBuilder' | 'maxwellSolver' | 'versionHistory') => void;

  // FDTD Actions
  setFDTDParams: (params: Partial<FDTDState>) => void;
  
  // Maxwell Actions
  setMaxwellState: (state: Partial<SolverState>) => void;

  // History Actions
  takeSnapshot: (label: string) => void;
  restoreSnapshot: (id: string) => void;

  // Settings Actions
  setGeminiApiKey: (key: string) => void;
  setEveScale: (scale: number) => void;

  // Global Load
  loadSimulation: (state: Partial<SimulationState>) => void;
}

export enum HandGesture {
  FIST = 'FIST',
  OPEN_PALM = 'OPEN_PALM',
  VICTORY = 'VICTORY', 
  UNKNOWN = 'UNKNOWN'
}

// Global Augmentation for React Three Fiber intrinsic elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Core
      mesh: any;
      group: any;
      scene: any;
      
      // Cameras
      perspectiveCamera: any;
      orthographicCamera: any;

      // Lights
      ambientLight: any;
      pointLight: any;
      directionalLight: any;
      spotLight: any;
      hemisphereLight: any;
      
      // Helpers
      fog: any;
      gridHelper: any;
      axesHelper: any;
      arrowHelper: any;
      
      // Geometries
      boxGeometry: any;
      sphereGeometry: any;
      cylinderGeometry: any;
      coneGeometry: any;
      planeGeometry: any;
      bufferGeometry: any;
      circleGeometry: any;
      capsuleGeometry: any;
      ringGeometry: any;

      // Materials
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      meshPhongMaterial: any;
      meshPhysicalMaterial: any;
      shaderMaterial: any;

      // Primitive/Instancing
      primitive: any;
      instances: any;
      instance: any;

      // Objects/Misc
      points: any;
      // line: any; // Removed to avoid conflict with SVG line
      lineLoop: any;
      lineSegments: any;
      bufferAttribute: any;
      
      // Catch-all for anything else
      [elemName: string]: any;
    }
  }
}