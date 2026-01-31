export interface ChatMessage {
  id: string;
  sender: 'user' | 'eve' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    hasFormula?: boolean;
    hasCode?: boolean;
    sourcesUsed?: string[];
  };
}

export interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  isOpen: boolean;
}

export interface ChatConfig {
  maxHistory: number;
  typingDelayMs: number;
}
