
export enum EveSystemStatus {
  IDLE = 'IDLE',
  BOOTING = 'BOOTING',
  READY = 'READY',
  PROCESSING = 'PROCESSING',
  ERROR = 'ERROR',
  SHUTDOWN = 'SHUTDOWN'
}

export interface EveModule {
  id: string;
  name: string;
  version: string;
  priority?: number; // 0-100, higher inits first
  init: (controller: any) => Promise<boolean>;
  update?: (delta: number) => void;
  destroy: () => void;
}

export interface EveEvent<T = any> {
  type: string;
  source: string;
  timestamp: number;
  payload?: T;
}

export type EveEventHandler<T = any> = (event: EveEvent<T>) => void;

export interface EveConfig {
  debugMode: boolean;
  tickRate: number; // ms
  modules: string[];
}
