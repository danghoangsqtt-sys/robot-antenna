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

  constructor(customConfig?: Partial<FloatingConfig>) {
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }
  }

  public async init(controller: any): Promise<boolean> {
    this.bus = controller.bus;
    // console.log(`[${this.name}] Initialized with config:`, this.config);
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

    // Emit pose update for Graphics/Renderer modules to consume
    this.bus.emit('movement:pose_update', payload);
  }

  public destroy(): void {
    this.bus = null;
    this.timeAccumulator = 0;
  }
}
