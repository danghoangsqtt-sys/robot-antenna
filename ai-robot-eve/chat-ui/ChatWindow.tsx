
import React, { useState, useEffect, useRef } from 'react';
import { EveController } from '../core/EveController';
import { 
    Send, Bot, Trash2, X, Plus, MessageSquare, 
    User, Sparkles, Terminal, Activity 
} from 'lucide-react';

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
  const [activeSession, setActiveSession] = useState('new');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- EVENT LISTENER ---
  useEffect(() => {
    const eve = EveController.getInstance();
    
    const unsubHist = eve.bus.on('chat:history_update', (e) => {
        if (e.payload?.messages) setMessages(e.payload.messages);
    });
    const unsubTypeStart = eve.bus.on('chat:typing_start', () => setIsTyping(true));
    const unsubTypeStop = eve.bus.on('chat:typing_stop', () => setIsTyping(false));
    const unsubToggle = eve.bus.on('chat:toggle_visibility', () => setIsOpen(prev => !prev));

    return () => { 
        unsubHist(); unsubTypeStart(); unsubTypeStop(); unsubToggle();
    };
  }, []);

  // --- AUTO SCROLL & FOCUS ---
  useEffect(() => {
    if (isOpen) {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
        setTimeout(() => inputRef.current?.focus(), 400); // Wait for animation
    }
  }, [messages, isTyping, isOpen]);

  // --- HANDLERS ---
  const handleSend = () => {
    if (!inputText.trim()) return;
    EveController.getInstance().bus.emit('chat:user_input', { text: inputText });
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
        e.preventDefault(); handleSend(); 
    }
  };

  // --- RENDER ---
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none`}>
        
        {/* BACKDROP: Click to close */}
        {/* FIX: Moved pointer-events-auto to conditional class to prevent blocking clicks when hidden */}
        <div 
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ease-in-out
            ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={() => EveController.getInstance().bus.emit('chat:toggle_visibility')}
        />

        {/* MAIN UI CONTAINER: Scale effect to simulate projection */}
        <div className={`
            relative flex overflow-hidden pointer-events-auto
            w-[75vw] h-[80vh] max-w-[1400px] min-h-[600px]
            bg-slate-900/95 border border-cyan-500/40 rounded-xl shadow-[0_0_80px_rgba(6,182,212,0.2)]
            transition-all duration-500 cubic-bezier(0.19, 1, 0.22, 1)
            ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-20'}
        `}>
            
            {/* --- LEFT SIDEBAR (History) --- */}
            <div className="w-72 bg-slate-950/50 border-r border-slate-800 flex flex-col hidden md:flex">
                {/* New Chat Button */}
                <div className="p-4 border-b border-slate-800">
                    <button 
                        onClick={() => { setMessages([]); setActiveSession('new'); }}
                        className="w-full flex items-center gap-2 justify-center py-3 bg-cyan-900/30 hover:bg-cyan-800/50 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 rounded-lg transition-all group"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                        <span className="font-semibold text-sm">New Session</span>
                    </button>
                </div>

                {/* Session List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">History</div>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-3 rounded hover:bg-slate-800/50 cursor-pointer transition-colors group">
                            <div className="text-slate-300 text-sm font-medium truncate group-hover:text-cyan-300">Analysis Sequence #{100+i}</div>
                            <div className="text-slate-600 text-xs mt-1">Jan {20+i}, 2026</div>
                        </div>
                    ))}
                </div>

                {/* User Status */}
                <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white shadow-lg">
                        <User size={16} />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-300">Commander</div>
                        <div className="text-[10px] text-emerald-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online
                        </div>
                    </div>
                </div>
            </div>

            {/* --- RIGHT MAIN CHAT --- */}
            <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-900 to-slate-900/90 relative">
                
                {/* HEADER */}
                <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <Terminal size={20} className="text-cyan-500" />
                        <h2 className="text-slate-200 font-bold tracking-wide">EVE INTERFACE <span className="text-cyan-600">v2.4</span></h2>
                    </div>
                    <button onClick={() => EveController.getInstance().bus.emit('chat:toggle_visibility')} className="text-slate-500 hover:text-cyan-400 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* MESSAGES AREA */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-40 select-none">
                            <div className="w-24 h-24 rounded-full bg-cyan-500/10 flex items-center justify-center mb-6 animate-pulse">
                                <Activity size={48} className="text-cyan-400" />
                            </div>
                            <div className="text-xl font-mono text-cyan-300">SYSTEM READY</div>
                            <p className="text-slate-500 mt-2">Awaiting input command...</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-4 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'eve' && (
                                    <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0 mt-1">
                                        <Bot size={18} />
                                    </div>
                                )}
                                
                                <div className={`relative px-6 py-4 rounded-2xl max-w-[80%] text-base leading-relaxed shadow-lg ${
                                    msg.sender === 'user' 
                                        ? 'bg-cyan-700/20 border border-cyan-500/30 text-cyan-50 rounded-tr-none' 
                                        : 'bg-slate-800/80 border border-slate-700 text-slate-200 rounded-tl-none'
                                }`}>
                                    {msg.content}
                                    {msg.sender === 'eve' && <Sparkles size={14} className="absolute -top-2 -left-2 text-cyan-400" />}
                                </div>

                                {msg.sender === 'user' && (
                                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0 mt-1">
                                        <User size={18} />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    
                    {isTyping && (
                        <div className="flex gap-4 max-w-4xl mx-auto">
                             <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0">
                                <Bot size={18} />
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-150"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* INPUT AREA */}
                <div className="p-6 bg-slate-950/50 border-t border-slate-800">
                    <div className="max-w-4xl mx-auto relative flex items-center gap-3">
                        <button className="p-3 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors">
                            <Trash2 size={20} onClick={() => setMessages([])} />
                        </button>
                        <div className="flex-1 relative">
                            <input 
                                ref={inputRef}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Nhập lệnh hoặc câu hỏi..."
                                className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-5 py-4 rounded-xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-all pr-12 text-lg shadow-inner"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <button 
                                    onClick={handleSend}
                                    disabled={!inputText.trim()}
                                    className="p-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-colors shadow-lg shadow-cyan-900/50"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};
