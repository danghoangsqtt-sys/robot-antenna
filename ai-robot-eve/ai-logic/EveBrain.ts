
import { EveModule, EveEvent } from '../core/types';
import { KNOWLEDGE_BASE } from './knowledge';
import { ragService } from '../../services/ragService';
import { academicSourceService } from '../../services/academicSourceService';
import { generateText } from '../../services/geminiService';
import { DocumentFile, AcademicSource } from '../../types';

/**
 * EveBrain v4.0
 * Advanced AI reasoning engine with:
 * - Natural, expert, friendly response generation
 * - RAG (Retrieval-Augmented Generation) support
 * - Internet research (arXiv, CrossRef, Wikipedia)
 * - Scientific literature citations
 * - Context-aware learning explanations
 * - Multi-language support with personality
 * - Empathetic interaction patterns
 */
export class EveBrain implements EveModule {
  public readonly id = 'eve_brain_logic';
  public readonly name = 'EVE AI Core';
  public readonly version = '4.0.0';
  public readonly priority = 60;

  // Personality traits for natural responses
  private personality = {
    tone: 'expert-friendly', // expert but approachable
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
   * Improved request handler with smart intent detection
   */
  private async handleRequest(event: EveEvent<{ text: string; documents?: DocumentFile[] }>): Promise<void> {
    const query = event.payload?.text?.toLowerCase() || '';
    const documents = event.payload?.documents || [];

    if (!query) return;

    // Index documents for RAG
    for (const doc of documents) {
      if (!ragService.getAllDocuments().find(d => d.id === doc.id)) {
        await ragService.addDocument(doc);
      }
    }

    // Dynamic delay for natural response timing
    const delay = 1000 + Math.random() * 1000; // Feels like researching

    setTimeout(async () => {
      try {
        let response = '';
        let sources: string[] = [];

        // Detect intent: Is user asking to learn something specific?
        const intent = this.detectIntent(query);

        // LEARNING INTENT: Prioritize academic search + RAG
        if (intent === 'learn') {
          // Extract topic from query
          const topic = this.extractTopicFromQuery(query);
          
          // First try academic sources
          const academicSources = await academicSourceService.searchAcademicSources(query, topic);
          if (academicSources.length > 0) {
            response = await this.generateResponseWithAcademicSources(query, academicSources);
            sources = academicSources.map(s => s.title);
          }
          
          // If no academic sources, try RAG + Knowledge Base
          if (!response && documents.length > 0) {
            const { context, sources: docSources } = await ragService.buildContext(query, 1500);
            if (context) {
              response = await this.generateExpertResponse(query, context, docSources);
              sources = docSources;
            }
          }
        }

        // GENERAL QUERY: Standard flow (RAG → Academic → KB)
        if (!response) {
          if (documents.length > 0) {
            const { context, sources: docSources } = await ragService.buildContext(query, 1500);
            if (context) {
              response = await this.generateExpertResponse(query, context, docSources);
              sources = docSources;
            }
          }

          if (!response) {
            const academicSources = await academicSourceService.searchAcademicSources(query, this.extractTopic(query));
            if (academicSources.length > 0) {
              response = await this.generateResponseWithAcademicSources(query, academicSources);
              sources = academicSources.map(s => s.title);
            }
          }

          if (!response) {
            // Try Gemini LLM as an additional fallback (will use API key if configured)
            try {
              const llmReply = await generateText(`Please provide a concise expert-friendly explanation for: ${query}`,
                { temperature: 0.2, maxTokens: 450 });
              if (llmReply && !llmReply.startsWith('(ERROR)')) {
                response = llmReply;
                sources.push('Gemini LLM');
              }
            } catch (e) {
              // ignore and fallback to KB
            }

            if (!response) {
              response = this.findContextualResponse(query);
            }
          }
        }

        // FALLBACK: Conversational (greetings, small talk)
        if (!response) {
          response = this.handleConversation(query);
        }

        // Format response with accessibility in mind
        const formattedResponse = this.formatForLearners(response);

        // Emit response with sources
        this.bus.emit('chat:system_notify', {
          text: formattedResponse,
          metadata: {
            hasFormula: response.includes('$'),
            hasCode: response.includes('```'),
            sourcesUsed: sources,
          }
        });

      } catch (error) {
        console.error('EVE Brain error:', error);
        this.bus.emit('chat:system_notify', {
          text: '❌ Xin lỗi, tôi gặp sự cố trong quá trình xử lý. Vui lòng thử lại hoặc hãy rephrase câu hỏi của bạn.'
        });
      }
    }, delay);
  }

  /**
   * Detect user intent: learn, ask, greet, etc.
   */
  private detectIntent(query: string): string {
    const q = query.toLowerCase();

    // Common learning verbs/phrases in Vietnamese and English
    const learnPatterns = [
      /\b(muốn|muốn học|cần học|cần tìm hiểu|muốn tìm hiểu|muốn biết|cần biết|tôi muốn|tôi cần)\b/,
      /\b(học|tìm hiểu|hỏi về|giải thích|phân tích|nghiên cứu|research|study|learn|understand|explain)\b/
    ];

    // If any learning pattern appears, classify as 'learn' (higher priority than greet)
    if (learnPatterns.some(rx => rx.test(q))) return 'learn';

    // More specific pattern: verbs followed by a topic (e.g., "học về bức xạ")
    if (q.match(/(học về|tìm hiểu về|giải thích về|hỏi về)\s+\S+/)) return 'learn';

    // Greeting intent (short/standalone greetings)
    if (q.match(/^(hi|hello|chào|alo|xin chào|hey)\b/) || q.match(/\b(chào bạn|xin chào)\b/)) return 'greet';

    // Thank intent
    if (q.match(/(cảm ơn|thanks|thank you|tks)/)) return 'thank';

    // If none matched, default to general
    return 'general';
  }

  /**
   * Extract topic from learning query (improved)
   */
  private extractTopicFromQuery(query: string): string {
    // Remove learning verbs to get actual topic
    const cleaned = query
      .replace(/(muốn|want|would like|tìm hiểu|học|learn|hỏi|ask|about|về|giải thích|explain)/gi, '')
      .trim();

    // Detect specific topics
    if (cleaned.match(/radiation|bức xạ|phát xạ/i)) return 'antenna';
    if (cleaned.match(/antenna|anten/i)) return 'antenna';
    if (cleaned.match(/electromagnetic|điện từ|field|trường/i)) return 'electromagnetic';
    if (cleaned.match(/gain|directivity|pattern|đặc|tính|đặc tính/i)) return 'antenna';
    if (cleaned.match(/impedance|trở kháng|matching/i)) return 'antenna';
    if (cleaned.match(/maxwell|phương trình|equation/i)) return 'electromagnetic';

    return 'physics'; // Default topic
  }

  /**
   * Generate response using academic sources from internet
   */
  private async generateResponseWithAcademicSources(
    query: string,
    sources: AcademicSource[]
  ): Promise<string> {
    let response = ``;

    // Determine topic for contextual knowledge
    const topic = this.extractTopic(query);

    // Friendly opening with topic context
    response += `🔬 **Kiến Thức Về ${this.translateTopic(topic)}**\n\n`;
    
    // Add contextual explanation first
    response += this.generateTopicExplanation(query, topic);
    response += `\n\n`;

    // Add academic sources
    response += `### 📚 Bài Báo Khoa Học Uy Tín\n\n`;
    
    const topSources = sources.slice(0, 3);
    for (let i = 0; i < topSources.length; i++) {
      const source = topSources[i];
      response += `**${i + 1}. ${source.title}**\n`;
      response += `   *Tác giả: ${source.authors.slice(0, 2).join(', ')}${source.authors.length > 2 ? ', et al.' : ''}*\n`;
      response += `   *Năm: ${source.year}*`;
      
      if (source.journal) {
        response += ` | *Journal: ${source.journal}*`;
      }
      
      response += `\n`;
      
      if (source.abstract) {
        response += `   > ${source.abstract.slice(0, 300)}...\n`;
      }

      if (source.doi) {
        response += `   📎 DOI: https://doi.org/${source.doi}\n`;
      } else if (source.url) {
        response += `   📎 [Đọc bài báo](${source.url})\n`;
      }

      response += `\n`;
    }

    // Add advanced learning section
    response += `---\n\n`;
    response += `### 💡 Hiểu Sâu Hơn\n`;
    response += this.synthesizeSourcesInsight(query, topSources);

    response += `\n**🔍 Bạn muốn tôi giải thích sâu hơn điều gì không?**`;

    return response;
  }

  /**
   * Generate topic-specific explanation with real knowledge
   */
  private generateTopicExplanation(query: string, topic: string): string {
    let explanation = ``;

    if (query.match(/bức xạ|radiation/i)) {
      explanation += `**Bức Xạ Điện Từ (Electromagnetic Radiation)**\n\n`;
      explanation += `Bức xạ là quá trình phát hành năng lượng dưới dạng sóng điện từ. Đây là nền tảng của:\n\n`;
      explanation += `- **Truyền thông vô tuyến**: Sóng radio, WiFi, 5G\n`;
      explanation += `- **Anten**: Chuyển đổi tín hiệu điện ↔ sóng điện từ\n`;
      explanation += `- **Độ lợi (Gain)**: Đo lường hiệu suất anten trong phát/nhận bức xạ\n`;
      explanation += `- **Mô hình bức xạ (Radiation Pattern)**: Hình dạng phân bố bức xạ trong không gian 3D\n\n`;
      explanation += `**Công thức cơ bản:** $P_{rad} = \\frac{1}{2} |I_{in}|^2 R_{rad}$\n\n`;
      explanation += `Trong đó: $I_{in}$ là dòng điện vào, $R_{rad}$ là điện trở bức xạ.`;
    } else if (query.match(/antenna|anten/i)) {
      explanation += `**Anten (Antenna)**\n\n`;
      explanation += `Anten là thiết bị chuyển đổi năng lượng giữa dòng điện dẫn và sóng điện từ tự do trong không gian.\n\n`;
      explanation += `**Các loại anten phổ biến:**\n`;
      explanation += `- **Dipole**: Hai thanh dẫn đối xứng, giản dị, dễ chế tạo\n`;
      explanation += `- **Yagi-Uda**: Có hướng cao, dùng trong TV, WiFi\n`;
      explanation += `- **Horn**: Hiệu suất cao, dùng trong vệ tinh, radar\n`;
      explanation += `- **Microstrip**: Nhỏ gọn, tích hợp được\n\n`;
      explanation += `**Thông số quan trọng:** Gain, Directivity, Bandwidth, Input Impedance`;
    } else if (query.match(/electromagnetic|điện từ|field|trường/i)) {
      explanation += `**Trường Điện Từ (Electromagnetic Field)**\n\n`;
      explanation += `Trường điện từ là sự kết hợp của trường điện và trường từ, là cơ sở của mọi hiện tượng điện tử và vô tuyến.\n\n`;
      explanation += `**Phương trình Maxwell (4 phương trình cơ bản):**\n`;
      explanation += `1. $\\nabla \\cdot \\vec{E} = \\frac{\\rho}{\\epsilon_0}$ (Gauss)\n`;
      explanation += `2. $\\nabla \\cdot \\vec{B} = 0$ (Không có độc lập từ)\n`;
      explanation += `3. $\\nabla \\times \\vec{E} = -\\frac{\\partial \\vec{B}}{\\partial t}$ (Faraday)\n`;
      explanation += `4. $\\nabla \\times \\vec{H} = \\frac{\\partial \\vec{D}}{\\partial t} + \\vec{J}$ (Ampere-Maxwell)\n\n`;
      explanation += `Những phương trình này mô tả hoàn toàn tương tác giữa điện tích, dòng điện, và sóng.`;
    }

    if (!explanation) {
      explanation += `**Chủ Đề: ${this.translateTopic(topic)}**\n\n`;
      explanation += `Đây là một lĩnh vực quan trọng trong vật lý ứng dụng và kỹ thuật vô tuyến. Các nghiên cứu gần đây cho thấy tiến bộ đáng kể trong:\n`;
      explanation += `- Mô phỏng số (FDTD, MoM)\n`;
      explanation += `- Tối ưu hóa thiết kế (AI-based design)\n`;
      explanation += `- Ứng dụng thực tế (5G, IoT, Satellite)\n`;
    }

    return explanation;
  }

  /**
   * Translate topic to Vietnamese
   */
  private translateTopic(topic: string): string {
    const translations: { [key: string]: string } = {
      'antenna': 'Anten & Bức Xạ',
      'electromagnetic': 'Trường Điện Từ',
      'physics': 'Vật Lý Ứng Dụng',
      'signal processing': 'Xử Lý Tín Hiệu',
      'communications': 'Truyền Thông Vô Tuyến',
      'engineering': 'Kỹ Thuật Điện Tử',
    };
    return translations[topic] || 'Khoa Học & Kỹ Thuật';
  }
  

  /**
   * Synthesize insights from academic sources
   */
  private synthesizeSourcesInsight(query: string, sources: AcademicSource[]): string {
    let insight = ``;

    if (sources.length === 0) return insight;

    // Topic analysis
    if (query.match(/antenna|anten/i)) {
      insight += `**Về thiết kế anten:**\n`;
      insight += `Các bài báo khoa học cho thấy hiệu suất anten phụ thuộc vào:\n`;
      insight += `- Hình dạng và kích thước (tương ứng với bước sóng)\n`;
      insight += `- Vật liệu và sự kết hợp trở kháng\n`;
      insight += `- Yếu tố môi trường xung quanh\n\n`;
    }

    if (query.match(/electromagnetic|trường|field/i)) {
      insight += `**Về trường điện từ:**\n`;
      insight += `Các phương trình Maxwell là nền tảng của mọi hiện tượng điện từ.\n`;
      insight += `Những bài báo hiện đại sử dụng:\n`;
      insight += `- Phương pháp FDTD (Finite-Difference Time-Domain) để mô phỏng\n`;
      insight += `- Phương pháp MoM (Method of Moments) cho phân tích chính xác\n`;
      insight += `- Kỹ thuật tính toán tiên tiến để giải các bài toán phức tạp\n\n`;
    }

    // Citation count insight
    const avgCitations = sources.reduce((sum, s) => sum + (s.citations || 0), 0) / sources.length;
    if (avgCitations > 10) {
      insight += `**Độ tin cậy:** Các bài báo này được trích dẫn ${Math.round(avgCitations)} lần trung bình, cho thấy chúng được cộng đồng khoa học thừa nhận.\n\n`;
    }

    // Recent research
    const recentYear = Math.max(...sources.map(s => s.year));
    insight += `**Nghiên cứu gần đây:** Năm ${recentYear} là năm xuất bản mới nhất, điều này cho biết những xu hướng hiện tại trong lĩnh vực này.\n`;

    return insight;
  }

  /**
   * Generate expert yet accessible response with document context
   */
  private async generateExpertResponse(
    query: string,
    context: string,
    sources: string[]
  ): Promise<string> {
    // Build response with professional structure
    let response = ``;
    
    // Friendly opening with context relevance
    response += `📚 **Dựa trên tài liệu của bạn**, tôi tìm thấy những điều sau:\n\n`;

    if (sources.length > 0) {
      response += `*Nguồn: ${sources.join(', ')}*\n\n`;
    }

    // Main content with clear structure
    response += `---\n\n`;
    response += `### 🔍 Phân Tích Chi Tiết\n\n`;
    response += context;
    response += `\n\n---\n\n`;

    // Add learning aids
    response += `### 💡 Hiểu Rõ Hơn\n`;
    response += this.generateLearningAids(query, context);

    // Ask follow-up for engagement
    response += `\n\n**Bạn muốn tôi giải thích sâu hơn về vấn đề nào không?**`;

    return response;
  }

  /**
   * Generate learning aids and explanations for accessibility
   */
  private generateLearningAids(query: string, context: string): string {
    let aids = '';

    // Detect topic and provide relevant aids
    if (query.match(/công thức|tính toán|phương trình|formula/i)) {
      aids += `- **Ý nghĩa:** Các công thức giúp chúng ta dự đoán và tính toán các hiệu ứng\n`;
      aids += `- **Cách dùng:** Thay thế các giá trị cụ thể của bạn vào công thức\n`;
      aids += `- **Lưu ý:** Các đơn vị phải nhất quán trong cùng một hệ\n`;
    }

    if (query.match(/dipole|yagi|horn|anten|antenna/i)) {
      aids += `- **Ý tưởng cơ bản:** Mỗi loại anten được thiết kế cho mục đích khác nhau\n`;
      aids += `- **Điểm mạnh:** Ăng ten được chọn phù hợp sẽ tối ưu hóa hiệu suất\n`;
      aids += `- **Áp dụng thực tế:** Hãy xem xét tần số hoạt động khi lựa chọn\n`;
    }

    if (query.match(/maxwell|trường|field|sóng|wave/i)) {
      aids += `- **Khái niệm:** Trường điện từ là nền tảng của mọi truyền thông vô tuyến\n`;
      aids += `- **Liên hệ:** Những phương trình Maxwell kết nối điện và từ\n`;
      aids += `- **Thực tế:** Hiểu trường giúp dự báo anten sẽ hoạt động như thế nào\n`;
    }

    return aids || `- **Hãy nhớ:** Khoa học được xây dựng trên các khái niệm chặt chẽ\n- **Thực hành:** Càng áp dụng nhiều, bạn sẽ hiểu sâu hơn\n`;
  }

  /**
   * Find response with better keyword matching and context awareness
   */
  private findContextualResponse(query: string): string | null {
    let bestMatch = null;
    let maxScore = 0;

    for (const entry of KNOWLEDGE_BASE) {
      let score = 0;
      
      // Weight matching keywords
      for (const keyword of entry.keywords) {
        if (query.includes(keyword)) {
          score += 2; // Keyword match
        }
      }

      if (score > maxScore) {
        maxScore = score;
        bestMatch = entry;
      }
    }

    return bestMatch ? bestMatch.response : null;
  }

  /**
   * Handle conversational elements with warmth and personality
   */
  private handleConversation(query: string): string {
    // Greetings
    if (query.match(/(hi|hello|chào|alo|xin chào)/i)) {
      const greetings = [
        `👋 Xin chào bạn! Tôi là **EVE**, trợ lý AI chuyên về khoa học và kỹ thuật.\n\n**Tôi có thể giúp bạn:**\n- 📡 Phân tích các loại anten (Dipole, Yagi, Horn, v.v.)\n- ⚡ Giải thích công thức điện từ và vật lý\n- 📊 Phân tích dữ liệu từ tài liệu của bạn\n- 🌐 Tìm kiếm bài báo khoa học uy tín từ internet\n- 💻 Hướng dẫn sử dụng phần mềm và công cụ\n\nBạn cần hỗ trợ gì hôm nay?`,
        `👋 Chào bạn! Mình là **EVE** - một trợ lý AI yêu thích giải thích những khái niệm phức tạp thành những ý tưởng đơn giản.\n\n**Mình có thể:**\n- Giải đáp các câu hỏi về vật lý, anten, điện từ và bức xạ\n- Tìm kiếm và trích dẫn bài báo từ arXiv, CrossRef, Wikipedia\n- Phân tích các bài báo hoặc tài liệu bạn cung cấp\n- Giúp bạn hiểu rõ hơn về các công thức và khái niệm\n\nBạn muốn hỏi gì?`,
        `👋 Xin chào! **EVE** tại đây 🤖\n\nHôm nay bạn muốn tìm hiểu về:\n- Thiết kế anten?\n- Trường điện từ?\n- Bức xạ sóng?\n- Hay một chủ đề khác trong khoa học kỹ thuật?\n\nCứ hỏi tôi, tôi sẽ tìm kiếm từ các nguồn uy tín và giải thích rõ ràng cho bạn!`
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // Thanks/politeness
    if (query.match(/(cảm ơn|thanks|thank you|tks)/i)) {
      const responses = [
        `😊 Không có chi! Mình rất vui được giúp đỡ bạn. Nếu có câu hỏi khác, cứ hỏi nhé!`,
        `❤️ Rất vui được phục vụ bạn! Hãy tiếp tục khám phá và học hỏi. Câu hỏi tiếp theo đó nào?`,
        `🙏 Vinh dự được hỗ trợ. Khoa học là một cuộc hành trình, và tôi tuyệt vời khi được là người bạn đồng hành của bạn.`,
        `😄 Luôn sẵn lòng! Nếu có bất kỳ câu hỏi mới nào, tôi sẽ tìm kiếm bài báo uy tín và giải thích cho bạn.`
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    // Name/Identity
    if (query.match(/(tên|name|ai|who are you|bạn là ai|you are who)/i)) {
      return `Hi! Tôi là **EVE** - viết tắt từ "**E**lectromagnetic **V**isualization **E**ngine".\n\nTôi được thiết kế để:\n- 🔬 Giải thích các khái niệm khoa học một cách dễ hiểu\n- 📚 Tìm kiếm và trích dẫn bài báo từ arXiv, CrossRef, Wikipedia\n- 📋 Phân tích tài liệu chuyên môn của bạn (PDF, TXT, Markdown)\n- 🛰️ Hỗ trợ nghiên cứu về anten, điện từ, vật lý, và truyền thông\n- 👥 Là một người bạn học tập và cố vấn khoa học của bạn 🤝\n\n**Đặc biệt:** Tôi không chỉ trả lời bằng kiến thức cơ bản, mà còn tìm kiếm từ những bài báo khoa học uy tín trên internet!`;
    }

    // Helpful questions
    if (query.match(/(làm gì|help|giúp|hỏi gì|ask what|có thể nào)/i)) {
      return `**Đây là những câu hỏi tôi có thể trả lời:**\n\n- "Tôi muốn tìm hiểu về bức xạ điện từ"\n- "Giải thích về anten Yagi"\n- "Phương trình Maxwell là gì?"\n- "Hãy phân tích tài liệu này về antenna design"\n- "Tôi muốn hiểu về trường điện từ"\n- "Impedance matching là gì?"\n\n💡 **Mẹo:** Hãy cụ thể hóa câu hỏi của bạn. Chẳng hạn:\n- "tôi muốn tìm hiểu về..." (tôi sẽ tìm bài báo)\n- "giải thích..." (tôi sẽ giải thích rõ ràng)\n- "phân tích..." (tôi sẽ phân tích chi tiết)\n\nBạn có câu hỏi cụ thể nào không?`;
    }

    // Default helpful response
    return `Tôi không hoàn toàn chắc câu hỏi của bạn là gì. Bạn có thể:\n\n1. **Hỏi về một chủ đề:** "Giải thích về bức xạ" hoặc "Anten hoạt động như thế nào?"\n2. **Yêu cầu tìm kiếm:** "Tôi muốn tìm hiểu về trường điện từ"\n3. **Tải lên tài liệu:** Hãy upload PDF hoặc tệp, tôi sẽ phân tích cho bạn\n\n🔍 **Hoặc bạn có thể:**\n- Nói "chào" để bắt đầu\n- Hỏi "bạn là ai?" để biết thêm về tôi\n- Hỏi "có thể giúp gì?" để xem các ví dụ\n\nRất vui được hỗ trợ bạn! 😊`;
  }
  

  /**
   * Format response for learners with accessibility features
   */
  private formatForLearners(text: string): string {
    let formatted = text;

    // Add visual hierarchy
    formatted = formatted.replace(/###/g, '###');
    formatted = formatted.replace(/##/g, '##');
    formatted = formatted.replace(/#/g, '#');

    // Ensure proper markdown formatting
    if (formatted.includes('```') && !formatted.match(/```\w+/)) {
      formatted = formatted.replace(/```\n/g, '```javascript\n');
    }

    // Ensure LaTeX is properly wrapped for readability
    formatted = formatted.replace(/\$([^\$]+)\$/g, (match) => {
      if (match.includes('\\')) return match;
      return match;
    });

    // Add spacing for readability
    formatted = formatted.replace(/\n\n\n+/g, '\n\n');

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