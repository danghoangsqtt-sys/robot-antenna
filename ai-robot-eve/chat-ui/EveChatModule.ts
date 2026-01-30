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
  
  private config: ChatConfig = {
    maxHistory: 50,
    typingDelayMs: 600
  };

  public async init(controller: any): Promise<boolean> {
    this.bus = controller.bus;
    this.loadHistory();
    
    // Subscribe to internal events
    this.bus.on('chat:user_input', this.handleUserInput.bind(this));
    this.bus.on('chat:system_notify', this.handleSystemNotify.bind(this));
    
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

  private handleUserInput(event: EveEvent<{ text: string }>): void {
    if (!event.payload) return;
    
    const { text } = event.payload;
    this.addMessage('user', text);

    // Notify AI Brain (Mock for now, normally would emit 'ai:process_request')
    this.bus.emit('ai:process_request', { text });
    
    // Simulate AI typing and response (Temporary Loopback)
    this.bus.emit('chat:typing_start');
    setTimeout(() => {
        this.bus.emit('chat:typing_stop');
        // Simple echo/mock logic if no real AI module responds
        // Ideally, the AI module would emit 'chat:ai_response' which this module handles.
        // For this task, we'll self-generate a response for UI testing.
        this.addMessage('eve', `Tôi đã nhận được lệnh: "${text}". Đang xử lý...`);
    }, 1500);
  }

  private handleSystemNotify(event: EveEvent<{ text: string }>): void {
      if (event.payload) {
          this.addMessage('system', event.payload.text);
      }
  }

  private addMessage(sender: 'user' | 'eve' | 'system', content: string) {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      sender,
      content,
      timestamp: Date.now()
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
      // Cleanup if needed
  }
}
