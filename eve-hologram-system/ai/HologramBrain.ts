
import { EveModule, EveEvent } from '../../ai-robot-eve/core/types';

/**
 * HologramBrain
 * Enhanced AI logic with short-term conversation context memory.
 */
export class HologramBrain implements EveModule {
  public readonly id = 'eve_hologram_brain';
  public readonly name = 'EVE Hologram Matrix';
  public readonly version = '2.0.0';
  public readonly priority = 60;

  private bus: any = null;
  private context: string[] = []; // Stores last 5 user queries
  private isProcessing = false;

  public async init(controller: any): Promise<boolean> {
    this.bus = controller.bus;
    this.bus.on('ai:process_request', this.handleRequest.bind(this));
    return true;
  }

  private handleRequest(event: EveEvent<{ text: string }>): void {
    const query = event.payload?.text?.toLowerCase() || '';
    if (!query || this.isProcessing) return;

    this.isProcessing = true;
    
    // Update Context
    this.context.push(query);
    if (this.context.length > 5) this.context.shift();

    // Simulate AI "Thinking" time
    const delay = 1000 + Math.random() * 1000;

    setTimeout(() => {
       let response = this.generateResponse(query);
       
       // Emit Response
       this.bus.emit('chat:system_notify', { 
           text: response
       });
       this.isProcessing = false;

    }, delay);
  }

  private generateResponse(query: string): string {
      // 1. Check for context-aware queries
      const hasContext = this.context.length > 1;
      
      if (query.includes('tiếp tục') && hasContext) {
          return "Dựa trên những gì chúng ta vừa thảo luận, tôi khuyên bạn nên thử điều chỉnh độ lợi (Gain) để xem sự thay đổi.";
      }

      // 2. Standard Pattern Matching (Enhanced)
      if (query.match(/(hi|hello|chào|alo)/)) {
          return "Chào chỉ huy! Hệ thống EVE trực tuyến. Tôi có thể giúp gì cho mô phỏng anten của bạn hôm nay?";
      } 
      if (query.includes('dipole')) {
          return "Anten Dipole là mẫu tham chiếu cơ bản. Bạn có muốn tôi hiển thị biểu đồ bức xạ 3D của nó không?";
      }
      if (query.includes('yagi')) {
          return "Anten Yagi rất tuyệt vời cho định hướng. Lưu ý các thùy phụ (side-lobes) khi thiết kế.";
      }
      if (query.includes('mimo')) {
          return "MIMO tăng dung lượng kênh bằng cách sử dụng đa đường. Hãy kiểm tra tab 'MIMO' để cấu hình số lượng anten phát/thu.";
      }
      if (query.includes('hologram') || query.includes('giao diện')) {
          return "Đây là giao diện Hologram mới nhất của tôi, được chiếu trực tiếp từ lõi xử lý. Bạn thích nó chứ?";
      }

      // 3. Fallback
      return "Tôi đang phân tích dữ liệu sóng điện từ... Câu hỏi của bạn nằm ngoài cơ sở dữ liệu vật lý hiện tại. Hãy thử hỏi về thông số anten.";
  }

  public destroy(): void {
      this.context = [];
  }
}
