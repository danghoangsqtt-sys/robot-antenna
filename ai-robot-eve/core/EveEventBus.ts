
import { EveEvent, EveEventHandler } from './types';

/**
 * EveEventBus
 * A typesafe, isolated event bus for the robot system modules to communicate
 * without direct dependencies.
 */
export class EveEventBus {
  private handlers: Map<string, EveEventHandler[]>;
  private history: EveEvent[];
  private maxHistory: number = 50;

  constructor() {
    this.handlers = new Map();
    this.history = [];
  }

  public on(eventType: string, handler: EveEventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)?.push(handler);
    return () => this.off(eventType, handler);
  }

  public off(eventType: string, handler: EveEventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      this.handlers.set(eventType, handlers.filter(h => h !== handler));
    }
  }

  public emit(type: string, payload?: any, source: string = 'system'): void {
    const event: EveEvent = {
      type,
      source,
      timestamp: Date.now(),
      payload
    };

    // Store debug history
    this.history.unshift(event);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }

    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (err) {
          console.error(`[EveEventBus] Error handling event '${type}' from '${source}':`, err);
        }
      });
    }
  }

  public clear(): void {
    this.handlers.clear();
    this.history = [];
  }
}
