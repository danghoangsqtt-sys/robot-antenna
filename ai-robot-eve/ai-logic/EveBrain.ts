import { EveModule, EveEvent } from '../core/types';
import { KNOWLEDGE_BASE } from './knowledge';
import { ragService } from '../../services/ragService';
import { academicSourceService } from '../../services/academicSourceService';
import { generateText } from '../../services/geminiService';
import { DocumentFile, AcademicSource } from '../../types';

/**
 * EveBrain v4.1 (Safe Mode)
 * - Fixed: Crash handlers for external services
 * - Fixed: Syntax errors and missing brackets
 * - Improved: Fallback logic when services fail
 */
export class EveBrain implements EveModule {
  public readonly id = 'eve_brain_logic';
  public readonly name = 'EVE AI Core';
  public readonly version = '4.1.0';
  public readonly priority = 60;

  // Personality traits for natural responses
  private personality = {
    tone: 'expert-friendly',
    politeness: 'high',
    enthusiasm: 'moderate',
    empathy: 'strong',
  };

  private bus: any = null;
  private unsubs: (() => void)[] = [];

  public async init(controller: any): Promise<boolean> {
    this.bus = controller.bus;
    const u = this.bus.on('ai:process_request', this.handleRequest.bind(this));
    this.unsubs.push(u);
    return true;
  }

  /**
   * Improved request handler with SAFE try-catch blocks
   */
  private async handleRequest(event: EveEvent<{ text: string; documents?: DocumentFile[] }>): Promise<void> {
    const query = event.payload?.text?.toLowerCase() || '';
    const documents = event.payload?.documents || [];

    if (!query) return;

    // Index documents for RAG (Safely)
    try {
      for (const doc of documents) {
        if (!ragService.getAllDocuments().find(d => d.id === doc.id)) {
          await ragService.addDocument(doc);
        }
      }
    } catch (e) {
      console.warn('RAG Indexing warning:', e);
    }

    // Dynamic delay for natural response timing
    const delay = 1000 + Math.random() * 1000;

    setTimeout(async () => {
      try {
        let response = '';
        let sources: string[] = [];

        // Detect intent
        const intent = this.detectIntent(query);

        // LEARNING INTENT: Prioritize academic search
        if (intent === 'learn') {
          const topic = this.extractTopicFromQuery(query);
          
          // Try Academic Sources (SAFE CALL)
          try {
            const academicSources = await academicSourceService.searchAcademicSources(query, topic);
            if (academicSources && academicSources.length > 0) {
              response = await this.generateResponseWithAcademicSources(query, academicSources);
              sources = academicSources.map(s => s.title);
            }
          } catch (err) {
            console.warn('Academic search failed, skipping:', err);
            // Continue to next method without crashing
          }
          
          // Try RAG if no academic sources found
          if (!response && documents.length > 0) {
            try {
              const { context, sources: docSources } = await ragService.buildContext(query, 1500);
              if (context) {
                response = await this.generateExpertResponse(query, context, docSources);
                sources = docSources;
              }
            } catch (err) {
               console.warn('RAG context build failed:', err);
            }
          }
        }

        // GENERAL QUERY OR FALLBACK
        if (!response) {
          // 1. Try RAG again (Standard flow)
          if (documents.length > 0) {
            try {
              const { context, sources: docSources } = await ragService.buildContext(query, 1500);
              if (context) {
                response = await this.generateExpertResponse(query, context, docSources);
                sources = docSources;
              }
            } catch (err) { console.warn('RAG failed:', err); }
          }

          // 2. Try Academic Search Fallback
          if (!response) {
             try {
                const topic = this.extractTopic(query);
                const academicSources = await academicSourceService.searchAcademicSources(query, topic);
                if (academicSources && academicSources.length > 0) {
                  response = await this.generateResponseWithAcademicSources(query, academicSources);
                  sources = academicSources.map(s => s.title);
                }
             } catch (err) { console.warn('Academic fallback failed:', err); }
          }

          // 3. Try Gemini LLM (Direct AI)
          if (!response) {
            try {
              const llmReply = await generateText(`Please provide a concise expert-friendly explanation for: ${query}`,
                { temperature: 0.2, maxTokens: 450 });
              if (llmReply && !llmReply.startsWith('(ERROR)')) {
                response = llmReply;
                sources.push('Gemini AI');
              } else {
                 console.warn('Gemini returned error:', llmReply);
              }
            } catch (e) {
              console.warn('Gemini call failed:', e);
            }
          }

          // 4. Final Fallback: Knowledge Base (Hardcoded)
          if (!response) {
            response = this.findContextualResponse(query);
          }
        }

        // CONVERSATIONAL FALLBACK
        if (!response) {
          response = this.handleConversation(query);
        }

        // Last Resort Message
        if (!response) {
            response = "Tôi đang gặp khó khăn khi kết nối với máy chủ dữ liệu. Vui lòng kiểm tra lại API Key hoặc kết nối mạng.";
        }

        // Format and Emit
        const formattedResponse = this.formatForLearners(response);

        this.bus.emit('chat:system_notify', {
          text: formattedResponse,
          metadata: {
            hasFormula: response.includes('$'),
            hasCode: response.includes('```'),
            sourcesUsed: sources,
          }
        });

      } catch (error) {
        console.error('EVE Brain CRITICAL error:', error);
        // Fallback message even if critical error happens
        this.bus.emit('chat:system_notify', {
          text: '⚠️ Hệ thống AI gặp lỗi nội bộ. Tuy nhiên, tôi vẫn ở đây. Bạn hãy thử kiểm tra lại API Key trong Settings nhé.'
        });
      }
    }, delay);
  }

  // --- Helper Methods ---

  private detectIntent(query: string): string {
    const q = query.toLowerCase();
    const learnPatterns = [
      /\b(muốn|muốn học|cần học|cần tìm hiểu|muốn tìm hiểu|muốn biết|cần biết|tôi muốn|tôi cần)\b/,
      /\b(học|tìm hiểu|hỏi về|giải thích|phân tích|nghiên cứu|research|study|learn|understand|explain)\b/
    ];
    if (learnPatterns.some(rx => rx.test(q))) return 'learn';
    if (q.match(/(học về|tìm hiểu về|giải thích về|hỏi về)\s+\S+/)) return 'learn';
    if (q.match(/^(hi|hello|chào|alo|xin chào|hey)\b/) || q.match(/\b(chào bạn|xin chào)\b/)) return 'greet';
    if (q.match(/(cảm ơn|thanks|thank you|tks)/)) return 'thank';
    return 'general';
  }

  private extractTopicFromQuery(query: string): string {
    const cleaned = query
      .replace(/(muốn|want|would like|tìm hiểu|học|learn|hỏi|ask|about|về|giải thích|explain)/gi, '')
      .trim();
    if (cleaned.match(/radiation|bức xạ|phát xạ/i)) return 'antenna';
    if (cleaned.match(/antenna|anten/i)) return 'antenna';
    if (cleaned.match(/electromagnetic|điện từ|field|trường/i)) return 'electromagnetic';
    if (cleaned.match(/gain|directivity|pattern|đặc|tính|đặc tính/i)) return 'antenna';
    if (cleaned.match(/impedance|trở kháng|matching/i)) return 'antenna';
    if (cleaned.match(/maxwell|phương trình|equation/i)) return 'electromagnetic';
    return 'physics';
  }

   private extractTopic(query: string): string {
      return this.extractTopicFromQuery(query);
  }

  private async generateResponseWithAcademicSources(query: string, sources: AcademicSource[]): Promise<string> {
    let response = ``;
    const topic = this.extractTopic(query);
    response += `🔬 **Kiến Thức Về ${this.translateTopic(topic)}**\n\n`;
    response += this.generateTopicExplanation(query, topic);
    response += `\n\n### 📚 Bài Báo Khoa Học Uy Tín\n\n`;
    
    const topSources = sources.slice(0, 3);
    for (let i = 0; i < topSources.length; i++) {
      const source = topSources[i];
      response += `**${i + 1}. ${source.title}**\n`;
      response += `   *Tác giả: ${source.authors.slice(0, 2).join(', ')}*\n`;
      response += `   *Năm: ${source.year}*\n\n`;
    }
    
    response += `---\n\n### 💡 Hiểu Sâu Hơn\n`;
    response += this.synthesizeSourcesInsight(query, topSources);
    return response;
  }

  private generateTopicExplanation(query: string, topic: string): string {
    let explanation = ``;
    if (query.match(/bức xạ|radiation/i)) {
      explanation += `**Bức Xạ Điện Từ**: Quá trình phát hành năng lượng dưới dạng sóng. Công thức cơ bản: $P_{rad} = \\frac{1}{2} |I_{in}|^2 R_{rad}$`;
    } else if (query.match(/antenna|anten/i)) {
      explanation += `**Anten**: Thiết bị chuyển đổi dòng điện thành sóng điện từ. Các loại: Dipole, Yagi, Horn.`;
    } else {
      explanation += `Chủ đề này liên quan đến các nguyên lý cơ bản của vật lý điện từ và kỹ thuật vô tuyến.`;
    }
    return explanation;
  }

  private translateTopic(topic: string): string {
    const translations: { [key: string]: string } = {
      'antenna': 'Anten & Bức Xạ',
      'electromagnetic': 'Trường Điện Từ',
      'physics': 'Vật Lý Ứng Dụng',
    };
    return translations[topic] || 'Khoa Học & Kỹ Thuật';
  }

  private synthesizeSourcesInsight(query: string, sources: AcademicSource[]): string {
    return `Các bài báo trên cung cấp cơ sở lý thuyết vững chắc cho vấn đề bạn quan tâm.`;
  }

  private async generateExpertResponse(query: string, context: string, sources: string[]): Promise<string> {
    let response = `📚 **Dựa trên tài liệu của bạn**, tôi tìm thấy:\n\n`;
    if (sources.length > 0) response += `*Nguồn: ${sources.join(', ')}*\n\n`;
    response += `---\n### 🔍 Phân Tích\n\n${context}\n\n---`;
    return response;
  }

  private findContextualResponse(query: string): string | null {
    let bestMatch = null;
    let maxScore = 0;
    for (const entry of KNOWLEDGE_BASE) {
      let score = 0;
      for (const keyword of entry.keywords) {
        if (query.includes(keyword)) score += 2;
      }
      if (score > maxScore) {
        maxScore = score;
        bestMatch = entry;
      }
    }
    return bestMatch ? bestMatch.response : null;
  }

  private handleConversation(query: string): string {
    if (query.match(/(hi|hello|chào|alo|xin chào)/i)) {
      return `👋 Xin chào! Tôi là **EVE**. Tôi có thể giúp gì cho bạn về mô phỏng anten và vật lý điện từ?`;
    }
    if (query.match(/(cảm ơn|thanks)/i)) return `😊 Không có chi!`;
    if (query.match(/(tên|name|ai|who)/i)) return `Tôi là EVE (Electromagnetic Visualization Engine).`;
    return null; // Return null to trigger final fallback
  }

  private formatForLearners(text: string): string {
    let formatted = text;
    formatted = formatted.replace(/###/g, '###');
    formatted = formatted.replace(/##/g, '##');
    // Wrap LaTeX if needed
    formatted = formatted.replace(/\$([^\$]+)\$/g, (match) => match); 
    return formatted;
  }

  public destroy(): void {
    for (const u of this.unsubs) {
      try { u(); } catch (e) { /* ignore */ }
    }
    this.unsubs = [];
    this.bus = null;
  }
}