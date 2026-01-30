
import { EveModule, EveEvent } from '../core/types';
import { KNOWLEDGE_BASE } from './knowledge';

/**
 * EveBrain
 * Processes 'ai:process_request' events and generates appropriate responses
 * based on the local knowledge base.
 */
export class EveBrain implements EveModule {
  public readonly id = 'eve_brain_logic';
  public readonly name = 'EVE AI Core';
  public readonly version = '1.0.0';
  public readonly priority = 60; // Initialize after UI/Chat

  private bus: any = null;

  public async init(controller: any): Promise<boolean> {
    this.bus = controller.bus;
    // Listen for requests from Chat UI or other modules
    this.bus.on('ai:process_request', this.handleRequest.bind(this));
    return true;
  }

  private handleRequest(event: EveEvent<{ text: string }>): void {
    const query = event.payload?.text?.toLowerCase() || '';
    if (!query) return;

    // 1. Simulate Reasoning Delay
    // In a real system, this would call an LLM API
    const delay = 800 + Math.random() * 800;

    setTimeout(() => {
       // 2. Pattern Matching Logic
       let response = this.findResponse(query);
       
       // 3. Fallback for greetings/unknown
       if (!response) {
           if (query.match(/(hi|hello|chào|alo)/)) {
               response = "Xin chào! Tôi là EVE. Tôi có thể giải thích về các loại anten (Dipole, Yagi, Horn...) hoặc hướng dẫn sử dụng phần mềm.";
           } else if (query.includes('cảm ơn')) {
               response = "Không có chi! Rất vui được hỗ trợ bạn.";
           } else {
               response = "Xin lỗi, tôi chưa có dữ liệu về vấn đề này. Hãy thử hỏi về 'Dipole', 'Gain', hoặc 'Điều khiển VR'.";
           }
       }

       // 4. Emit Response back to System
       // Using 'chat:system_notify' allows the response to appear in the Chat Window
       // as a system message without modifying the Chat Module directly.
       this.bus.emit('chat:system_notify', { 
           text: `[EVE-AI]: ${response}` 
       });

    }, delay);
  }

  private findResponse(query: string): string | null {
      // Simple keyword scoring
      let bestMatch = null;
      let maxScore = 0;

      for (const entry of KNOWLEDGE_BASE) {
          let score = 0;
          for (const keyword of entry.keywords) {
              if (query.includes(keyword)) score++;
          }
          
          if (score > maxScore) {
              maxScore = score;
              bestMatch = entry;
          }
      }

      return bestMatch ? bestMatch.response : null;
  }

  public destroy(): void {
      // Cleanup if needed
  }
}
