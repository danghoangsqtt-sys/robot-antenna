type Listener = (...args: any[]) => void;

class EventBus {
  private listeners: Record<string, Listener[]> = {};

  on(event: string, fn: Listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(fn);
    return () => this.off(event, fn);
  }

  off(event: string, fn: Listener) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== fn);
  }

  emit(event: string, ...args: any[]) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(fn => fn(...args));
  }
}

export const eventBus = new EventBus();

// Standard Events
export const EVENTS = {
  SIMULATION_RESET: 'simulation:reset',
  PARAMETER_CHANGED: 'parameter:changed',
  EXPORT_REQUEST: 'io:export'
};
