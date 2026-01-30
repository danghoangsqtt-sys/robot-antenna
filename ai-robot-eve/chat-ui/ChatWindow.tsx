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
  // Default to false (hidden) so user must click Robot to open
  const [isOpen, setIsOpen] = useState(false); 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const eve = EveController.getInstance();
    
    // Listen for history
    const unsubHist = eve.bus.on('chat:history_update', (e) => {
        if (e.payload?.messages) setMessages(e.payload.messages);
    });
    
    const unsubTypeStart = eve.bus.on('chat:typing_start', () => setIsTyping(true));
    const unsubTypeStop = eve.bus.on('chat:typing_stop', () => setIsTyping(false));

    // Listen for toggle visibility from robot click
    const unsubToggle = eve.bus.on('chat:toggle_visibility', () => {
        setIsOpen(prev => !prev);
    });

    return () => { 
        unsubHist(); 
        unsubTypeStart(); 
        unsubTypeStop();
        unsubToggle();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isOpen]);

  // Auto-focus when opened
  useEffect(() => {
      if (isOpen && inputRef.current) {
          setTimeout(() => inputRef.current?.focus(), 100);
      }
  }, [isOpen]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    EveController.getInstance().bus.emit('chat:user_input', { text: inputText });
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-4 left-4 w-80 flex flex-col z-50 font-mono shadow-2xl rounded-lg overflow-hidden border border-cyan-500/50 animate-in slide-in-from-left-4 fade-in duration-300">
        {/* Game Dialogue Style Header */}
        <div className="bg-slate-900/95 backdrop-blur-md border-b border-cyan-500/30 p-3 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800">
            <div className="flex items-center gap-2">
                <div className="p-1 bg-cyan-900/50 rounded border border-cyan-500/50">
                    <Bot size={16} className="text-cyan-400" />
                </div>
                <div>
                    <span className="text-xs font-bold text-cyan-100 tracking-wider block leading-none">EVE SYSTEM</span>
                    <span className="text-[9px] text-cyan-500/80 font-bold tracking-widest">ONLINE</span>
                </div>
            </div>
            <div className="flex gap-2">
                 <button onClick={() => setMessages([])} className="hover:text-red-400 text-slate-500 transition-colors"><Trash2 size={12} /></button>
                <button onClick={() => setIsOpen(false)} className="hover:text-cyan-400 text-slate-500 transition-colors"><ChevronDown size={14} /></button>
            </div>
        </div>

        {/* Messages */}
        <div className="bg-slate-900/90 backdrop-blur-sm h-64 overflow-y-auto p-3 space-y-3 scrollbar-hide">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-lg p-2.5 text-xs relative shadow-sm ${
                        msg.sender === 'user' 
                            ? 'bg-cyan-900/40 text-cyan-100 border border-cyan-800 rounded-tr-none' 
                            : 'bg-slate-800/90 text-slate-200 border border-slate-700 rounded-tl-none'
                    }`}>
                         {msg.sender === 'eve' && <Sparkles size={10} className="absolute -top-2.5 -left-1 text-cyan-400 drop-shadow-md" />}
                         {msg.content}
                    </div>
                </div>
            ))}
            {isTyping && (
                <div className="flex justify-start">
                     <div className="bg-slate-800/50 rounded-lg p-2 flex gap-1 items-center border border-slate-700 rounded-tl-none">
                         <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"></div>
                         <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                         <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                     </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-slate-900/95 backdrop-blur-md border-t border-cyan-500/30 p-2 flex gap-2">
            <input 
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập lệnh..."
                className="flex-1 bg-slate-800/80 border border-slate-700 rounded px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:bg-slate-800 transition-all"
            />
            <button onClick={handleSend} disabled={!inputText.trim()} className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white p-2 rounded transition-colors shadow-lg shadow-cyan-900/20">
                <Send size={14} />
            </button>
        </div>
    </div>
  );
};