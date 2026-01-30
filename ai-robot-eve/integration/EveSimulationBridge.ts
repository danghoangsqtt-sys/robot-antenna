
import { EveModule } from '../core/types';
import { useStore } from '../../store';

export class EveSimulationBridge implements EveModule {
  public readonly id = 'eve_sim_bridge';
  public readonly name = 'Simulation Bridge';
  public readonly version = '1.0.0';
  public readonly priority = 90;

  private unsub: (() => void) | null = null;
  private bus: any = null;

  public async init(controller: any): Promise<boolean> {
    this.bus = controller.bus;
    
    // Subscribe to Zustand
    this.unsub = useStore.subscribe((state, prevState) => {
        if (state.antennaType !== prevState.antennaType) {
            this.bus.emit('simulation:parameter_change', { param: 'type', value: state.antennaType });
            this.bus.emit('chat:system_notify', { text: `Đã chuyển sang mô hình anten: ${state.antennaType}` });
        }
        if (Math.abs(state.frequencyGHz - prevState.frequencyGHz) > 0.1) {
            this.bus.emit('simulation:parameter_change', { param: 'freq', value: state.frequencyGHz });
        }
        if (state.isRecording !== prevState.isRecording) {
            this.bus.emit('chat:system_notify', { text: state.isRecording ? "Đang ghi hình..." : "Đã dừng ghi hình." });
        }
    });
    
    return true;
  }

  public destroy(): void {
      if (this.unsub) this.unsub();
  }
}
