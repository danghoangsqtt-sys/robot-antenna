
import React, { useState, useEffect, useRef } from 'react';
import { EveController } from '../core/EveController';
import { 
    Send, Bot, Trash2, X, Plus, MessageSquare, 
    User, Sparkles, Terminal, Activity, FileUp, Code, Zap, BookOpen, ExternalLink
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { DocumentUploader } from './DocumentUploader';
import { DocumentFile } from '../../types';

interface ChatMessage {
    id: string;
    sender: 'user' | 'eve' | 'system';
    content: string;
    timestamp: number;
    metadata?: {
        hasFormula?: boolean;
        hasCode?: boolean;
        sourcesUsed?: string[]; // Academic sources
    };
}

export const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeSession, setActiveSession] = useState('new');
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [showDocUploader, setShowDocUploader] = useState(false);

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
        setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [messages, isTyping, isOpen]);

  // --- HANDLERS ---
  const handleSend = () => {
    if (!inputText.trim()) return;
    EveController.getInstance().bus.emit('chat:user_input', { text: inputText, documents });
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
        e.preventDefault(); handleSend(); 
    }
  };

  const handleDocumentAdd = (doc: DocumentFile) => {
    setDocuments(prev => [...prev, doc]);
  };

  const handleRemoveDoc = (docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
  };

  // --- RENDER ---
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none`}>
        
        {/* BACKDROP */}
        <div 
            className={`absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-500 ease-in-out
            ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={() => EveController.getInstance().bus.emit('chat:toggle_visibility')}
        />

        {/* MAIN CONTAINER: NEON XANH LÁ CÂY GAME STYLE */}
        <div className={`
            relative flex overflow-hidden pointer-events-auto
            w-[80vw] h-[85vh] max-w-[1600px] min-h-[650px]
            bg-gradient-to-br from-slate-950 via-emerald-950/20 to-slate-950
            border border-emerald-400/40 rounded-xl
            shadow-[0_0_100px_rgba(52,211,153,0.25),inset_0_0_60px_rgba(16,185,129,0.1)]
            transition-all duration-500 cubic-bezier(0.19, 1, 0.22, 1)
            ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-20'}
        `}>
            
            {/* --- LEFT SIDEBAR (Documents) --- */}
            <div className="w-80 bg-slate-950/60 border-r border-emerald-500/20 flex flex-col hidden lg:flex">
                {/* New Chat Button */}
                <div className="p-4 border-b border-emerald-500/20">
                    <button 
                        onClick={() => { EveController.getInstance().bus.emit('chat:new_session'); setActiveSession('new'); }}
                        className="w-full flex items-center gap-2 justify-center py-3 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 rounded-lg transition-all group shadow-lg hover:shadow-emerald-500/20"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                        <span className="font-bold text-sm tracking-wider">NEW SESSION</span>
                    </button>
                </div>

                {/* Document Uploader */}
                <div className="p-4 border-b border-emerald-500/20">
                    <DocumentUploader
                        documents={documents}
                        onDocumentAdd={handleDocumentAdd}
                        onRemove={handleRemoveDoc}
                    />
                </div>

                {/* Info */}
                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Connected</p>
                        <div className="flex items-center gap-2 p-2 bg-slate-800/50 rounded">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="text-xs text-emerald-300">EVE SYSTEM ONLINE</span>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Features</p>
                        <div className="space-y-1 text-xs text-slate-400">
                            <div className="flex items-center gap-2">
                                <Code size={12} className="text-emerald-500" />
                                <span>LaTeX/KaTex support</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap size={12} className="text-cyan-400" />
                                <span>RAG Document Analysis</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FileUp size={12} className="text-amber-400" />
                                <span>Multi-format Upload</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <BookOpen size={12} className="text-blue-400" />
                                <span>Academic Research</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Footer */}
                <div className="p-3 bg-slate-950 border-t border-emerald-500/20 flex items-center gap-2 text-xs">
                    <div className="w-6 h-6 rounded bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                        E
                    </div>
                    <div>
                        <div className="font-bold text-emerald-300">EVE AI</div>
                        <div className="text-emerald-500 text-[10px]">v2.5-RAG</div>
                    </div>
                </div>
            </div>

            {/* --- MAIN CHAT AREA --- */}
            <div className="flex-1 flex flex-col bg-slate-950/40 relative">
                
                {/* HEADER */}
                <div className="h-16 border-b border-emerald-500/30 flex items-center justify-between px-6 bg-gradient-to-r from-slate-950/50 to-emerald-950/20 backdrop-blur sticky top-0 z-10 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-950/50 rounded-lg border border-emerald-500/30">
                            <Terminal size={20} className="text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-slate-100 font-black tracking-wider text-lg">EVE INTERFACE</h2>
                            <p className="text-emerald-400 text-xs font-mono">Scientific AI Chatbot v2.5</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => EveController.getInstance().bus.emit('chat:toggle_visibility')} 
                        className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/30 rounded-lg transition-all"
                        title="Đóng"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* MESSAGES AREA */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-emerald-700/50">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-50 select-none">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 flex items-center justify-center mb-6 animate-pulse border border-emerald-500/20">
                                <Activity size={64} className="text-emerald-400" />
                            </div>
                            <div className="text-2xl font-black tracking-wider text-emerald-400">SYSTEM INITIALIZED</div>
                            <p className="text-slate-500 mt-3 text-center max-w-sm">
                                Welcome to EVE Scientific AI Assistant. Upload documents or type your question to begin analysis.
                            </p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-4 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'eve' && (
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600/40 to-teal-700/40 border border-emerald-500/60 flex items-center justify-center text-emerald-300 shrink-0 mt-1 shadow-lg shadow-emerald-500/20">
                                        <Bot size={18} />
                                    </div>
                                )}
                                
                                <div className={`flex flex-col gap-2`}>
                                    <div className={`relative px-5 py-4 rounded-xl max-w-[75%] leading-relaxed shadow-lg transition-all ${
                                        msg.sender === 'user' 
                                            ? 'bg-gradient-to-br from-cyan-950/60 to-emerald-950/30 border border-cyan-500/40 text-cyan-50 rounded-tr-none hover:shadow-cyan-500/20' 
                                            : 'bg-gradient-to-br from-slate-800/60 to-emerald-900/20 border border-emerald-500/30 text-slate-200 rounded-tl-none hover:shadow-emerald-500/10'
                                    }`}>
                                        {msg.sender === 'eve' ? (
                                            <MarkdownRenderer content={msg.content} className="text-sm" />
                                        ) : (
                                            <p className="text-sm">{msg.content}</p>
                                        )}
                                        {msg.sender === 'eve' && <Sparkles size={14} className="absolute -top-2 -left-2 text-emerald-400 animate-pulse" />}
                                    </div>

                                    {/* Show sources if available */}
                                    {msg.sender === 'eve' && msg.metadata?.sourcesUsed && msg.metadata.sourcesUsed.length > 0 && (
                                        <div className="max-w-[75%] px-4 py-2 bg-slate-800/30 border border-blue-500/20 rounded-lg text-xs text-blue-300">
                                            <div className="flex items-center gap-1 mb-2">
                                                <BookOpen size={14} />
                                                <span className="font-bold">Nguồn tham khảo:</span>
                                            </div>
                                            <div className="space-y-1">
                                                {msg.metadata.sourcesUsed.slice(0, 3).map((source, idx) => (
                                                    <div key={idx} className="text-xs text-blue-200 truncate">
                                                        • {source.length > 80 ? source.slice(0, 77) + '...' : source}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {msg.sender === 'user' && (
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600/40 to-blue-700/40 border border-cyan-500/60 flex items-center justify-center text-cyan-300 shrink-0 mt-1 shadow-lg shadow-cyan-500/20">
                                        <User size={18} />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    
                    {isTyping && (
                        <div className="flex gap-4 max-w-4xl mx-auto">
                             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600/40 to-teal-700/40 border border-emerald-500/60 flex items-center justify-center text-emerald-300 shrink-0 shadow-lg shadow-emerald-500/20">
                                <Bot size={18} />
                            </div>
                            <div className="bg-slate-800/40 border border-emerald-500/30 rounded-xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-150"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* INPUT AREA */}
                <div className="p-6 bg-slate-950/60 border-t border-emerald-500/30 backdrop-blur">
                    <div className="max-w-4xl mx-auto space-y-3">
                        {/* Document Status */}
                        {documents.length > 0 && (
                            <div className="flex items-center gap-2 p-3 bg-emerald-950/30 rounded border border-emerald-500/20 text-emerald-300 text-xs">
                                <FileUp size={16} className="text-emerald-400" />
                                <span>{documents.length} document(s) loaded for RAG analysis</span>
                            </div>
                        )}

                        {/* Input Bar */}
                        <div className="relative flex items-center gap-3">
                            <button 
                                onClick={() => setShowDocUploader(!showDocUploader)}
                                className="p-3 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40 rounded-lg transition-all border border-transparent hover:border-emerald-500/30" 
                                title="Upload documents"
                            >
                                <FileUp size={20} />
                            </button>
                            <button 
                                className="p-3 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-all border border-transparent hover:border-red-500/30" 
                                onClick={() => setMessages([])}
                                title="Clear chat"
                            >
                                <Trash2 size={20} />
                            </button>
                            
                            <div className="flex-1 relative">
                                <input 
                                    ref={inputRef}
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask me anything (formulas, analysis, code, ...)..."
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-emerald-500/30 hover:border-emerald-500/50 focus:border-emerald-400 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                                />
                            </div>

                            <button 
                                onClick={handleSend}
                                disabled={!inputText.trim() || isTyping}
                                className="p-3 bg-gradient-to-r from-emerald-600/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-emerald-500/40 font-bold flex items-center gap-2"
                            >
                                <Send size={18} />
                                <span className="hidden sm:inline text-sm">Send</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
