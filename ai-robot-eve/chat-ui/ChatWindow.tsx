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
    // Chỉ cuộn xuống khi đang mở để tránh lỗi layout ngầm
    if (isOpen) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
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

  // FIX: Không dùng "if (!isOpen) return null;" nữa để giữ lại state lịch sử chat
  // Thay vào đó dùng CSS class để ẩn hiện
  
  return (
    <div 
        className={`absolute bottom-4 left-4 flex flex-col z-50 font-mono shadow-2xl rounded-lg overflow-hidden border border-cyan-500/50 transition-all duration-300 transform origin-bottom-left
        ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4 pointer-events-none'}
        w-[480px]`} // FIX: Tăng chiều rộng lên 480px
    >
        {/* Game Dialogue Style Header */}
        <div className="bg-slate-900/95 backdrop-blur-md border-b border-cyan-500/30 p-4 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800">
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-cyan-900/50 rounded border border-cyan-500/50">
                    <Bot size={20} className="text-cyan-400" />
                </div>
                <div>
                    <span className="text-sm font-bold text-cyan-100 tracking-wider block leading-none">EVE SYSTEM</span>
                    <span className="text-[10px] text-cyan-500/80 font-bold tracking-widest mt-1">ONLINE INTERFACE</span>
                </div>
            </div>
            <div className="flex gap-3">
                 <button onClick={() => setMessages([])} className="hover:text-red-400 text-slate-500 transition-colors" title="Xóa lịch sử"><Trash2 size={16} /></button>
                <button onClick={() => setIsOpen(false)} className="hover:text-cyan-400 text-slate-500 transition-colors" title="Thu nhỏ"><ChevronDown size={18} /></button>
            </div>
        </div>

        {/* Messages */}
        {/* FIX: Tăng chiều cao lên h-96 (khoảng 384px) để đọc dễ hơn */}
        <div className="bg-slate-900/95 backdrop-blur-sm h-96 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {messages.length === 0 && (
                <div className="text-center text-slate-500 text-sm mt-10 italic opacity-50">
                    Hệ thống đã sẵn sàng. Hãy nhập lệnh...
                </div>
            )}
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {/* FIX: Tăng cỡ chữ lên text-sm (14px) */}
                    <div className={`max-w-[85%] rounded-lg p-3 text-sm relative shadow-md leading-relaxed ${
                        msg.sender === 'user' 
                            ? 'bg-cyan-900/60 text-cyan-50 border border-cyan-700/50 rounded-tr-none' 
                            : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                    }`}>
                         {msg.sender === 'eve' && <Sparkles size={12} className="absolute -top-2.5 -left-1 text-cyan-400 drop-shadow-md" />}
                         {msg.content}
                    </div>
                </div>
            ))}
            {isTyping && (
                <div className="flex justify-start">
                     <div className="bg-slate-800/80 rounded-lg p-3 flex gap-1.5 items-center border border-slate-700 rounded-tl-none">
                         <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
                         <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                         <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                     </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-slate-900/95 backdrop-blur-md border-t border-cyan-500/30 p-3 flex gap-3">
            <input 
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập yêu cầu hoặc lệnh..."
                className="flex-1 bg-slate-800 border border-slate-600 rounded px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-slate-700 transition-all shadow-inner"
            />
            <button onClick={handleSend} disabled={!inputText.trim()} className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white p-3 rounded transition-colors shadow-lg shadow-cyan-900/30 flex items-center justify-center min-w-[50px]">
                <Send size={18} />
            </button>
        </div>
    </div>
  );
};