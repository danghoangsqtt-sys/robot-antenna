import { DocumentFile } from '../types';

/**
 * ragService.ts
 * Implements Retrieval-Augmented Generation (RAG)
 * - Vector embedding generation (using simple TF-IDF or API)
 * - Semantic search in document database
 * - Context retrieval for AI responses
 */

interface EmbeddingConfig {
  dimension: number;
  strategy: 'tfidf' | 'openai' | 'huggingface';
}

interface SearchResult {
  docId: string;
  docName: string;
  relevanceScore: number;
  extractedText: string;
  chunks: TextChunk[];
}

interface TextChunk {
  id: string;
  text: string;
  startPos: number;
  endPos: number;
  embedding?: number[];
}

class RAGService {
  private documents: Map<string, DocumentFile> = new Map();
  private embeddings: Map<string, number[]> = new Map(); // docId -> embedding
  private chunks: Map<string, TextChunk[]> = new Map(); // docId -> chunks
  private config: EmbeddingConfig = {
    dimension: 384, // Small embedding for demo
    strategy: 'tfidf'
  };

  /**
   * Add document to RAG store
   */
  async addDocument(doc: DocumentFile): Promise<void> {
    this.documents.set(doc.id, doc);

    // Extract text content
    const text = doc.content || '';

    // Split into chunks (sentences)
    const chunks = this.chunkText(text, 300); // 300 char chunks

    // Generate embeddings
    const chunkEmbeddings = chunks.map(chunk => 
      this.generateEmbedding(chunk.text)
    );

    // Store
    this.chunks.set(doc.id, chunks.map((c, i) => ({
      ...c,
      embedding: chunkEmbeddings[i]
    })));

    // Store document-level embedding (average of chunks)
    const docEmbedding = this.averageEmbeddings(chunkEmbeddings);
    this.embeddings.set(doc.id, docEmbedding);

    console.log(`✅ Indexed document: ${doc.name} (${chunks.length} chunks)`);
  }

  /**
   * Remove document from store
   */
  removeDocument(docId: string): void {
    this.documents.delete(docId);
    this.embeddings.delete(docId);
    this.chunks.delete(docId);
    console.log(`✅ Removed document: ${docId}`);
  }

  /**
   * Search documents with query
   */
  async search(query: string, topK: number = 5): Promise<SearchResult[]> {
    if (this.documents.size === 0) return [];

    // Generate query embedding
    const queryEmbedding = this.generateEmbedding(query);

    // Calculate similarity scores
    const scores: Array<{ docId: string; score: number; chunks: TextChunk[] }> = [];

    for (const [docId, docEmbedding] of this.embeddings) {
      const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);
      const docChunks = this.chunks.get(docId) || [];
      
      scores.push({
        docId,
        score: similarity,
        chunks: docChunks
      });
    }

    // Sort by relevance
    scores.sort((a, b) => b.score - a.score);

    // Return top K results
    return scores.slice(0, topK).map(item => {
      const doc = this.documents.get(item.docId)!;
      
      // Find most relevant chunks
      const relevantChunks = item.chunks
        .map(chunk => ({
          ...chunk,
          relevance: this.cosineSimilarity(queryEmbedding, chunk.embedding || [])
        }))
        .sort((a, b) => (b.relevance || 0) - (a.relevance || 0))
        .slice(0, 3); // Top 3 chunks

      return {
        docId: doc.id,
        docName: doc.name,
        relevanceScore: item.score,
        extractedText: doc.content || '',
        chunks: relevantChunks as TextChunk[]
      };
    });
  }

  /**
   * Build context string for AI prompt
   */
  async buildContext(query: string, maxTokens: number = 2000): Promise<{ context: string; sources: string[] }> {
    const results = await this.search(query, 3);

    let context = '';
    const sources: string[] = [];

    for (const result of results) {
      if (context.length > maxTokens) break;

      sources.push(result.docName);

      context += `\n\n--- From: ${result.docName} ---\n`;

      // Add most relevant chunks
      for (const chunk of result.chunks) {
        if (context.length > maxTokens) break;
        context += chunk.text + ' ';
      }
    }

    return { context: context.trim(), sources };
  }

  /**
   * Get all documents
   */
  getAllDocuments(): DocumentFile[] {
    return Array.from(this.documents.values());
  }

  /**
   * Split text into chunks
   */
  private chunkText(text: string, chunkSize: number): TextChunk[] {
    const chunks: TextChunk[] = [];
    let startPos = 0;

    // Split by sentences (simple heuristic)
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    let currentChunk = '';
    let chunkStart = 0;

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
        chunks.push({
          id: `chunk_${chunks.length}`,
          text: currentChunk.trim(),
          startPos: chunkStart,
          endPos: chunkStart + currentChunk.length
        });

        chunkStart = startPos;
        currentChunk = '';
      }

      currentChunk += sentence;
      startPos += sentence.length;
    }

    if (currentChunk.trim()) {
      chunks.push({
        id: `chunk_${chunks.length}`,
        text: currentChunk.trim(),
        startPos: chunkStart,
        endPos: startPos
      });
    }

    return chunks;
  }

  /**
   * Simple TF-IDF embedding (demo)
   */
  private generateEmbedding(text: string): number[] {
    // Simple hash-based embedding for demo
    // In production, use OpenAI API or Hugging Face
    const words = text.toLowerCase().split(/\s+/);
    const embedding: number[] = Array(this.config.dimension).fill(0);

    for (const word of words) {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = ((hash << 5) - hash) + word.charCodeAt(i);
      }
      const index = Math.abs(hash) % this.config.dimension;
      embedding[index] += 1 / words.length;
    }

    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, x) => sum + x * x, 0));
    return norm > 0 ? embedding.map(x => x / norm) : embedding;
  }

  /**
   * Cosine similarity
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length === 0 || b.length === 0) return 0;

    let dotProduct = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      dotProduct += a[i] * b[i];
    }

    const normA = Math.sqrt(a.reduce((sum, x) => sum + x * x, 0));
    const normB = Math.sqrt(b.reduce((sum, x) => sum + x * x, 0));

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (normA * normB);
  }

  /**
   * Average embeddings
   */
  private averageEmbeddings(embeddings: number[][]): number[] {
    if (embeddings.length === 0) return Array(this.config.dimension).fill(0);

    const avg: number[] = Array(this.config.dimension).fill(0);

    for (const emb of embeddings) {
      for (let i = 0; i < emb.length; i++) {
        avg[i] += emb[i];
      }
    }

    return avg.map(x => x / embeddings.length);
  }
}

// Singleton instance
export const ragService = new RAGService();

export type { SearchResult, TextChunk };
