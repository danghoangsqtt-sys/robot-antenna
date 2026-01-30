export interface ChatMessage {
  id: string;
  sender: 'user' | 'eve' | 'system';
  content: string;
  timestamp: number;
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
