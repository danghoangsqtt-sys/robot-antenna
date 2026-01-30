
export interface AIRequest {
  text: string;
  context?: any;
}

export interface KnowledgeEntry {
  id: string;
  keywords: string[];
  response: string;
  category: 'physics' | 'usage' | 'general';
}
