import { EveModule, EveEvent } from '../core/types';
import { KNOWLEDGE_BASE } from './knowledge';
import { ragService } from '../../services/ragService';
import { academicSourceService } from '../../services/academicSourceService';
import { generateText } from '../../services/geminiService';
import { DocumentFile } from '../../types';

/**
 * EveBrain v5.2 (Stable & Smart)
 * - Fixed: Ngăn chặn tìm kiếm bài báo cho các câu chào xã giao.
 * - Improved: Xử lý lỗi API mượt mà hơn, không hiển thị nguồn rác.
 * - Standard: Chuẩn hóa hiển thị LaTeX.
 */
export class EveBrain implements EveModule {
  public readonly id = 'eve_brain_logic';
  public readonly name = 'EVE AI Core';
  public readonly version = '5.2.0';
  public readonly priority = 60;

  private bus: any = null;
  private unsubs: (() => void)[] = [];

  // SYSTEM PROMPT
  private readonly SYSTEM_INSTRUCTION = `
    ROLE: Bạn là EVE, trợ lý AI chuyên về Kỹ thuật Anten và Vật Lý Điện Từ.
    USER: Thượng úy, Kỹ sư Lê Bá Đăng Hoàng.
    TONE: Chuyên nghiệp, thân thiện, dùng từ ngữ học thuật chính xác.
    FORMAT: 
    - BẮT BUỘC dùng LaTeX cho toán học: $ E = mc^2 $ hoặc $$ \\nabla \\times E = 0 $$.
    - Trình bày mạch lạc, dùng Markdown (bold, list).
  `;

  public async init(controller: any): Promise<boolean> {
    this.bus = controller.bus;
    const u = this.bus.on('ai:process_request', this.handleRequest.bind(this));
    this.unsubs.push(u);
    return true;
  }

  private async handleRequest(event: EveEvent<{ text: string; documents?: DocumentFile[] }>): Promise<void> {
    const query = event.payload?.text || '';
    const documents = event.payload?.documents || [];

    if (!query) return;

    // Index tài liệu nền
    this.processDocumentsInBackground(documents);

    // Hiệu ứng "đang suy nghĩ"
    const delay = 800 + Math.random() * 500;

    setTimeout(async () => {
      let usedSources: string[] = [];
      let finalResponse = '';

      try {
        const topic = this.extractTopic(query);
        let contextData = "";
        let academicContext = "";

        // BƯỚC 1: QUYẾT ĐỊNH CÓ CẦN NGHIÊN CỨU KHÔNG?
        // Chỉ tìm bài báo nếu câu hỏi thực sự mang tính học thuật
        if (this.isAcademicQuery(query)) {
            try {
                const sources = await academicSourceService.searchAcademicSources(query, topic);
                if (sources && sources.length > 0) {
                    // Chỉ lấy nguồn nếu nó thực sự liên quan
                    usedSources = sources.map(s => s.title);
                    academicContext = sources.slice(0, 3).map(s => 
                        `[Paper] ${s.title} (${s.year}): ${s.abstract}`
                    ).join('\n\n');
                }
            } catch (e) { /* Bỏ qua lỗi tìm kiếm */ }
        }

        // Tìm trong tài liệu upload (RAG)
        try {
            if (documents.length > 0) {
                const ragResult = await ragService.buildContext(query, 2000);
                if (ragResult.context) {
                    contextData = ragResult.context;
                    usedSources.push(...ragResult.sources);
                }
            }
        } catch (e) { /* Bỏ qua lỗi RAG */ }

        // BƯỚC 2: GỌI GEMINI
        let fullPrompt = `${this.SYSTEM_INSTRUCTION}\n\n`;
        if (academicContext) fullPrompt += `THAM KHẢO:\n${academicContext}\n\n`;
        if (contextData) fullPrompt += `TÀI LIỆU CỦA USER:\n${contextData}\n\n`;
        fullPrompt += `CÂU HỎI: "${query}"\n`;
        fullPrompt += `YÊU CẦU: Trả lời ngắn gọn, súc tích, chuyên sâu.`;

        const aiReply = await generateText(fullPrompt, { temperature: 0.4, maxTokens: 1000 });
            
        if (aiReply && !aiReply.startsWith('(ERROR)') && !aiReply.includes('Error')) {
            finalResponse = aiReply;
        } else {
            // Nếu API lỗi, ném lỗi để xuống catch
            throw new Error("Gemini API Error");
        }

        // Gửi phản hồi thành công
        this.bus.emit('chat:system_notify', {
          text: finalResponse,
          metadata: {
            hasFormula: finalResponse.includes('$'),
            sourcesUsed: usedSources, // Chỉ hiện nguồn khi thành công
            isResearchMode: !!academicContext
          }
        });

      } catch (error) {
        console.error('EVE Brain Error:', error);
        
        // Xử lý lỗi thông minh: Xóa nguồn rác, đưa ra lời khuyên cụ thể
        this.bus.emit('chat:system_notify', {
          text: this.getErrorResponse(query),
          metadata: {
            sourcesUsed: [], // XÓA SẠCH NGUỒN RÁC KHI LỖI
            isError: true
          }
        });
      }
    }, delay);
  }

  // --- Helpers ---

  private async processDocumentsInBackground(documents: DocumentFile[]) {
      try {
        for (const doc of documents) {
            if (!ragService.getAllDocuments().find(d => d.id === doc.id)) {
                await ragService.addDocument(doc);
            }
        }
      } catch (e) { }
  }

  private extractTopic(query: string): string {
    const q = query.toLowerCase();
    if (q.includes('anten')) return 'antenna';
    if (q.includes('sóng') || q.includes('từ trường')) return 'electromagnetic';
    return 'physics';
  }

  // SỬA LỖI: Tăng độ khó để kích hoạt chế độ "Nghiên cứu"
  private isAcademicQuery(query: string): boolean {
      const q = query.toLowerCase();
      // Phải chứa từ khóa chuyên ngành mới tìm báo
      const technicalKeywords = ['phương trình', 'đặc tính', 'bức xạ', 'tham số', 'tần số', 'mô phỏng', 'nguyên lý', 'cấu trúc', 'phân tích', 'thiết kế', 'datasheet', 'paper'];
      // Hoặc câu hỏi rất dài (> 50 ký tự) VÀ không phải câu chào hỏi
      const isLongQuery = q.length > 50; 
      const isGreeting = q.match(/(xin chào|chào bạn|hello|hi eve)/);
      
      return technicalKeywords.some(k => q.includes(k)) || (isLongQuery && !isGreeting);
  }

  private getErrorResponse(query: string): string {
      return `⚠️ **Không thể kết nối đến trí tuệ nhân tạo.**
      
      Tôi đã nhận được câu hỏi: "${query}" nhưng không thể xử lý do lỗi kết nối API.
      
      **Cách khắc phục:**
      1. Nhấn **F12** để mở Console và xem mã lỗi (400, 401, 500?).
      2. Kiểm tra lại **API Key** trong Settings (đảm bảo không có khoảng trắng thừa).
      3. Đảm bảo bạn đang kết nối Internet ổn định.`;
  }

  public destroy(): void {
    for (const u of this.unsubs) try { u(); } catch (e) {}
    this.unsubs = [];
    this.bus = null;
  }
}