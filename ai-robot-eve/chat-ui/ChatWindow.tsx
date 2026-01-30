
import React, { useState, useEffect, useRef } from 'react';
import { EveController } from '../core/EveController';
import { Send, Bot, Trash2, ChevronDown, Sparkles } from 'lucide-react';

interface ChatMessage {
    id: string;
    sender: 'user' | 'eve' | 'system';
    content: string;
    timestamp: number;
}

export const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const eve = EveController.getInstance();
    
    // Listen for history
    const unsubHist = eve.bus.on('chat:history_update', (e) => {
        if (e.payload?.messages) setMessages(e.payload.messages);
    });
    
    const unsubTypeStart = eve.bus.on('chat:typing_start', () => setIsTyping(true));
    const unsubTypeStop = eve.bus.on('chat:typing_stop', () => setIsTyping(false));

    return () => { unsubHist(); unsubTypeStart(); unsubTypeStop(); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isOpen]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    EveController.getInstance().bus.emit('chat:user_input', { text: inputText });
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!isOpen) {
      return (
          <button 
            onClick={() => setIsOpen(true)}
            className="absolute bottom-6 right-64 mr-4 bg-cyan-900/80 hover:bg-cyan-800 text-cyan-400 p-3 rounded-full border border-cyan-500/50 shadow-lg backdrop-blur-md transition-all z-50 group"
          >
              <Bot size={24} className="group-hover:scale-110 transition-transform" />
          </button>
      );
  }

  return (
    <div className="absolute bottom-4 right-64 mr-4 w-80 flex flex-col z-50 font-mono shadow-2xl rounded-lg overflow-hidden border border-cyan-900/50">
        {/* Header */}
        <div className="bg-slate-900/90 backdrop-blur-md border-b border-cyan-500/30 p-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Bot size={16} className="text-cyan-400" />
                <span className="text-xs font-bold text-cyan-100 tracking-wider">EVE ASSISTANT</span>
            </div>
            <div className="flex gap-2">
                 <button onClick={() => setMessages([])} className="hover:text-red-400 text-slate-500"><Trash2 size={12} /></button>
                <button onClick={() => setIsOpen(false)} className="hover:text-cyan-400 text-slate-500"><ChevronDown size={14} /></button>
            </div>
        </div>

        {/* Messages */}
        <div className="bg-slate-900/80 backdrop-blur-sm h-60 overflow-y-auto p-3 space-y-3 scrollbar-hide">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-lg p-2 text-xs relative ${msg.sender === 'user' ? 'bg-cyan-900/40 text-cyan-100 border border-cyan-800' : 'bg-slate-800/80 text-slate-200 border border-slate-700'}`}>
                         {msg.sender === 'eve' && <Sparkles size={8} className="absolute -top-2 -left-1 text-cyan-400" />}
                         {msg.content}
                    </div>
                </div>
            ))}
            {isTyping && (
                <div className="flex justify-start">
                     <div className="bg-slate-800/50 rounded-lg p-2 flex gap-1 items-center border border-slate-700">
                         <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce"></div>
                         <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                         <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                     </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-slate-900/90 backdrop-blur-md border-t border-cyan-500/30 p-2 flex gap-2">
            <input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Hỏi EVE về anten..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button onClick={handleSend} disabled={!inputText.trim()} className="bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-700 text-white p-1.5 rounded">
                <Send size={14} />
            </button>
        </div>
    </div>
  );
};
