import { EveModule } from '../core/types';
import { FloatingConfig, PoseUpdatePayload } from './types';

/**
 * EveFloatingSystem
 * Handles idle floating animation physics (Sine wave based).
 * Designed for low GPU usage by calculating transforms on CPU tick.
 */
export class EveFloatingSystem implements EveModule {
  public readonly id = 'eve_movement_float';
  public readonly name = 'EVE Floating Physics';
  public readonly version = '1.0.0';
  public readonly priority = 50;

  private bus: any = null; // Reference to EveEventBus
  private timeAccumulator: number = 0;
  
  private config: FloatingConfig = {
    speed: 0.5,     // Hz
    amplitude: 0.2  // Units
  };
  // Throttle emission to avoid flooding renderer (ms)
  private minEmitIntervalMs = 16; // ~60Hz
  private lastEmitTime = 0;

  // Worker support
  private useWorker = false;
  private workerIntervalMs = 16;
  private worker: Worker | null = null;

  constructor(customConfig?: Partial<FloatingConfig> & { minEmitIntervalMs?: number; useWorker?: boolean; workerIntervalMs?: number }) {
    if (customConfig) {
      const { minEmitIntervalMs, useWorker, workerIntervalMs, ...rest } = customConfig as any;
      this.config = { ...this.config, ...rest };
      if (typeof minEmitIntervalMs === 'number') this.minEmitIntervalMs = minEmitIntervalMs;
      if (typeof useWorker === 'boolean') this.useWorker = useWorker;
      if (typeof workerIntervalMs === 'number') this.workerIntervalMs = workerIntervalMs;
    }
  }

  public async init(controller: any): Promise<boolean> {
    this.bus = controller.bus;
    // console.log(`[${this.name}] Initialized with config:`, this.config);

    // If configured to use worker, spawn it and forward messages to the bus
    if (this.useWorker && typeof window !== 'undefined') {
      const workerCode = `
        let time = 0;
        let config = { speed: ${this.config.speed}, amplitude: ${this.config.amplitude} };
        let interval = ${this.workerIntervalMs};
        let running = true;
        function step() {
          time += interval / 1000;
          const y = Math.sin(time * config.speed * Math.PI * 2) * config.amplitude;
          postMessage({ positionOffset: { x: 0, y: y, z: 0 }, timestamp: Date.now() });
        }
        let timer = setInterval(() => { if (running) step(); }, interval);
        onmessage = (e) => {
          const d = e.data || {};
          if (d.type === 'stop') { running = false; clearInterval(timer); }
          if (d.type === 'start') { running = true; timer = setInterval(() => { if (running) step(); }, interval); }
          if (d.type === 'config') { config = { ...config, ...d.config }; if (d.interval) { interval = d.interval; if (timer) { clearInterval(timer); timer = setInterval(() => { if (running) step(); }, interval); } } }
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      this.worker = new Worker(url);
      this.worker.onmessage = (ev: MessageEvent) => {
        const data = ev.data;
        const payload: PoseUpdatePayload = {
          sourceId: this.id,
          positionOffset: data.positionOffset,
          timestamp: data.timestamp || Date.now()
        };
        if (this.bus) this.bus.emit('movement:pose_update', payload);
      };
      // ensure worker cleaned up URL
      URL.revokeObjectURL(url);
    }
    return true;
  }

  public update(deltaMs: number): void {
    if (!this.bus) return;

    // Convert delta to seconds for easier physics math
    const dt = deltaMs / 1000;
    this.timeAccumulator += dt;

    // Calculate Sine Wave Float
    // y = A * sin(2 * PI * f * t)
    const yOffset = Math.sin(this.timeAccumulator * this.config.speed * Math.PI * 2) * this.config.amplitude;

    const payload: PoseUpdatePayload = {
      sourceId: this.id,
      positionOffset: { x: 0, y: yOffset, z: 0 },
      timestamp: Date.now()
    };

    // If worker is enabled we rely on it to emit updates
    if (this.worker) return;

    // Throttle emission: only emit when enough time has elapsed since last emit
    const now = performance.now();
    if (now - this.lastEmitTime >= this.minEmitIntervalMs) {
      this.lastEmitTime = now;
      this.bus.emit('movement:pose_update', payload);
    }
  }

  public destroy(): void {
    this.bus = null;
    this.timeAccumulator = 0;
    if (this.worker) {
      try {
        this.worker.postMessage({ type: 'stop' });
      } catch (e) { /* ignore */ }
      try { this.worker.terminate(); } catch (e) { /* ignore */ }
      this.worker = null;
    }
  }
}
