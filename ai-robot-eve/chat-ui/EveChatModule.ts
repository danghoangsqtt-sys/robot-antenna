import { EveModule, EveEvent } from '../core/types';
import { ChatMessage, ChatConfig } from './types';

/**
 * EveChatModule
 * Manages chat history, persistence, and communication flow between UI and AI logic.
 */
export class EveChatModule implements EveModule {
  public readonly id = 'eve_chat_module';
  public readonly name = 'EVE Chat Core';
  public readonly version = '1.0.0';
  public readonly priority = 80;

  private bus: any = null;
  private history: ChatMessage[] = [];
  private readonly STORAGE_KEY = 'eve_chat_history_v1';
  private unsubs: (() => void)[] = [];
  
  private config: ChatConfig = {
    maxHistory: 50,
    typingDelayMs: 600
  };

  // [FIX] Constructor to allow optional bus injection
  constructor(bus?: any) {
    if (bus) {
      this.bus = bus;
    }
  }

  public async init(controller: any): Promise<boolean> {
    this.bus = controller.bus;
    this.loadHistory();
    
    // Subscribe to internal events
    const u1 = this.bus.on('chat:user_input', this.handleUserInput.bind(this));
    const u2 = this.bus.on('chat:system_notify', this.handleSystemNotify.bind(this));
    const u3 = this.bus.on('chat:new_session', this.handleNewSession.bind(this));
    this.unsubs.push(u1, u2);
    this.unsubs.push(u3);
    
    // Emit initial history after a short delay to ensure UI is mounted/listening
    setTimeout(() => {
        this.emitHistoryUpdate();
        // Welcome message if empty
        if (this.history.length === 0) {
            this.addMessage('eve', 'Chào bạn! Tôi là EVE, trợ lý AI hỗ trợ mô phỏng anten.');
        }
    }, 500);
    
    return true;
  }

  private handleUserInput(event: EveEvent<{ text: string; documents?: any[] }>): void {
    if (!event.payload) return;

    const { text, documents } = event.payload;
    this.addMessage('user', text);

    // Forward documents (if any) to AI Brain so RAG can use them
    this.bus.emit('ai:process_request', { text, documents: documents || [] });

    // Indicate typing in UI; AI is expected to emit final responses.
    this.bus.emit('chat:typing_start');
    setTimeout(() => {
        this.bus.emit('chat:typing_stop');
    }, this.config.typingDelayMs);
  }

    private handleSystemNotify(event: EveEvent<{ text: string; metadata?: any }>): void {
      if (event.payload) {
        const text = event.payload.text;
        const metadata = event.payload.metadata;
        // Store AI responses as 'eve' messages (not 'system') and preserve metadata
        this.addMessage('eve', text, metadata);
      }
    }

    private handleNewSession(): void {
    // Clear history and storage
    this.history = [];
    try { localStorage.removeItem(this.STORAGE_KEY); } catch (e) { /* ignore */ }
    this.emitHistoryUpdate();
    }

  private addMessage(sender: 'user' | 'eve' | 'system', content: string, metadata?: any) {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      sender,
      content,
      timestamp: Date.now(),
      metadata: metadata || undefined
    };

    this.history.push(msg);
    if (this.history.length > this.config.maxHistory) {
        this.history.shift();
    }
    
    this.saveHistory();
    this.emitHistoryUpdate();
  }

  private emitHistoryUpdate() {
      if (this.bus) {
          this.bus.emit('chat:history_update', { messages: [...this.history] });
      }
  }

  private loadHistory() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.history = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load chat history', e);
    }
  }

  private saveHistory() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.history));
    } catch (e) {
      console.warn('Failed to save chat history', e);
    }
  }

  public destroy(): void {
      for (const u of this.unsubs) {
        try { u(); } catch (e) { /* ignore */ }
      }
      this.unsubs = [];
      this.bus = null;
  }
}
