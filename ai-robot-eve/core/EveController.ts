
import { EveEventBus } from './EveEventBus';
import { EveModule, EveSystemStatus, EveConfig } from './types';

/**
 * EveController
 * The central brain stem of the robot. Manages module lifecycle and system state.
 */
export class EveController {
  private static instance: EveController;
  
  public readonly bus: EveEventBus;
  private status: EveSystemStatus;
  private modules: Map<string, EveModule>;
  private config: EveConfig;
  private tickInterval: number | null = null;

  private constructor() {
    this.bus = new EveEventBus();
    this.status = EveSystemStatus.IDLE;
    this.modules = new Map();
    this.config = {
      debugMode: true,
      tickRate: 100, // 10 ticks per second default
      modules: []
    };
  }

  public static getInstance(): EveController {
    if (!EveController.instance) {
      EveController.instance = new EveController();
    }
    return EveController.instance;
  }

  public registerModule(module: EveModule): void {
    if (this.modules.has(module.id)) return;
    this.modules.set(module.id, module);
  }

  public async initialize(): Promise<void> {
    if (this.status !== EveSystemStatus.IDLE) return;

    this.setStatus(EveSystemStatus.BOOTING);
    this.bus.emit('system:boot_start');

    const sortedModules = Array.from(this.modules.values()).sort((a, b) => 
      (b.priority || 0) - (a.priority || 0)
    );

    for (const module of sortedModules) {
      try {
        await module.init(this);
      } catch (e) {
        console.error(`[EveController] Error initializing ${module.name}:`, e);
        this.setStatus(EveSystemStatus.ERROR);
        return; 
      }
    }

    this.setStatus(EveSystemStatus.READY);
    // [FIX] Ensure 'ai:process_request' events reach the AI brain even if timing/race conditions occur
    this.bus.on('ai:process_request', (evt) => {
      const brain = this.modules.get('eve_brain_logic') as any;
      if (brain && typeof brain.handleRequest === 'function') {
        try { brain.handleRequest(evt); } catch (e) { console.error('[FIX] forwarding ai:process_request to EveBrain failed', e); }
      }
    });

    this.startLoop();
  }

  private startLoop(): void {
    if (this.tickInterval) return;
    let last = performance.now();
    this.tickInterval = window.setInterval(() => {
      const now = performance.now();
      const delta = now - last;
      last = now;
      this.modules.forEach(module => {
        if (module.update) module.update(delta);
      });
    }, this.config.tickRate);
  }

  public shutdown(): void {
    this.setStatus(EveSystemStatus.SHUTDOWN);
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.modules.forEach(m => m.destroy());
    this.modules.clear();
    this.bus.clear();
  }

  private setStatus(status: EveSystemStatus) {
    this.status = status;
    this.bus.emit('system:status_change', { status });
  }
}
