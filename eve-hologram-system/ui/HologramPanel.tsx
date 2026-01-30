
import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Sparkles } from 'lucide-react';
import { EveController } from '../../ai-robot-eve/core/EveController';
import { ChatMessage } from '../types';

export const HologramPanel: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const eve = EveController.getInstance();
    
    // Initial Load
    const unsubHist = eve.bus.on('chat:history_update', (e: any) => {
        if (e.payload?.messages) {
            setMessages(e.payload.messages.slice(-10));
        }
    });

    const unsubTypeStart = eve.bus.on('chat:typing_start', () => setIsTyping(true));
    const unsubTypeStop = eve.bus.on('chat:typing_stop', () => setIsTyping(false));

    return () => { unsubHist(); unsubTypeStart(); unsubTypeStop(); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
      setTimeout(() => inputRef.current?.focus(), 500);
  }, []);

  const handleSend = () => {
      if (!input.trim()) return;
      EveController.getInstance().bus.emit('chat:user_input', { text: input });
      setInput('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSend();
  };

  return (
    <>
    <style>{`
      .hologram-container {
          width: 280px;
          height: 350px;
          background: rgba(4, 20, 15, 0.6);
          border: 1px solid rgba(0, 255, 128, 0.3);
          border-radius: 8px;
          backdrop-filter: blur(8px);
          box-shadow: 0 0 20px rgba(0, 255, 128, 0.1), inset 0 0 20px rgba(0, 255, 128, 0.05);
          display: flex;
          flex-direction: column;
          font-family: 'JetBrains Mono', monospace;
          overflow: hidden;
          position: relative;
          transform-style: preserve-3d;
          animation: holo-float 6s ease-in-out infinite;
      }

      .hologram-container::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(to bottom, transparent 50%, rgba(0, 255, 128, 0.05) 50%);
          background-size: 100% 4px;
          pointer-events: none;
          z-index: 0;
      }

      .holo-header {
          padding: 8px 12px;
          border-bottom: 1px solid rgba(0, 255, 128, 0.2);
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 255, 128, 0.05);
      }
      
      .holo-content {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 1;
      }

      .holo-content::-webkit-scrollbar { width: 4px; }
      .holo-content::-webkit-scrollbar-thumb { background: rgba(0, 255, 128, 0.3); border-radius: 2px; }

      .holo-msg {
          font-size: 10px;
          padding: 6px 10px;
          border-radius: 6px;
          max-width: 85%;
          position: relative;
          line-height: 1.4;
      }

      .holo-msg.eve {
          align-self: flex-start;
          background: rgba(0, 255, 128, 0.1);
          border-left: 2px solid #00ff80;
          color: #ccffe6;
      }

      .holo-msg.user {
          align-self: flex-end;
          background: rgba(0, 150, 255, 0.1);
          border-right: 2px solid #0096ff;
          color: #cceeff;
          text-align: right;
      }

      .holo-input-area {
          padding: 8px;
          border-top: 1px solid rgba(0, 255, 128, 0.2);
          display: flex;
          gap: 6px;
          background: rgba(0, 20, 10, 0.8);
          z-index: 1;
      }

      .holo-input {
          flex: 1;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(0, 255, 128, 0.2);
          color: #00ff80;
          font-family: inherit;
          font-size: 11px;
          padding: 6px;
          border-radius: 4px;
          outline: none;
      }
      .holo-input:focus {
          border-color: #00ff80;
          box-shadow: 0 0 10px rgba(0, 255, 128, 0.2);
      }

      .holo-btn {
          background: rgba(0, 255, 128, 0.1);
          border: 1px solid rgba(0, 255, 128, 0.3);
          color: #00ff80;
          border-radius: 4px;
          width: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
      }
      .holo-btn:hover {
          background: rgba(0, 255, 128, 0.3);
          box-shadow: 0 0 10px #00ff80;
      }

      @keyframes holo-float {
          0%, 100% { transform: translateY(0px) rotateX(0deg); }
          50% { transform: translateY(-5px) rotateX(1deg); }
      }
      
      .typing-dot {
          display: inline-block;
          width: 4px; height: 4px;
          background: #00ff80;
          border-radius: 50%;
          margin-right: 2px;
          animation: dot-blink 1.4s infinite;
      }
      @keyframes dot-blink { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
    `}</style>
    
    <div className="hologram-container" onPointerDown={(e) => e.stopPropagation()}>
        <div className="holo-header">
            <Bot size={14} className="text-[#00ff80]" />
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#00ff80] tracking-widest">EVE_HOLOGRAM_V2</span>
                <span className="text-[8px] text-[#00cc66] uppercase tracking-wider">Secure Connection</span>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-[#00ff80] animate-pulse shadow-[0_0_8px_#00ff80]"></div>
        </div>

        <div className="holo-content" ref={scrollRef}>
            {messages.length === 0 && (
                <div className="text-center text-[10px] text-emerald-500/50 mt-10 italic">
                    Hệ thống đã sẵn sàng.<br/>Hãy nói gì đó...
                </div>
            )}
            {messages.map((msg) => (
                <div key={msg.id} className={`holo-msg ${msg.sender === 'user' ? 'user' : 'eve'}`}>
                    {msg.sender === 'eve' && <Sparkles size={8} className="absolute -top-1 -left-1 text-emerald-200" />}
                    {msg.content}
                </div>
            ))}
            {isTyping && (
                 <div className="holo-msg eve">
                     <span className="typing-dot" style={{animationDelay: '0s'}}></span>
                     <span className="typing-dot" style={{animationDelay: '0.2s'}}></span>
                     <span className="typing-dot" style={{animationDelay: '0.4s'}}></span>
                 </div>
            )}
        </div>

        <div className="holo-input-area">
            <input 
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                className="holo-input" 
                placeholder="Nhập lệnh..."
            />
            <button onClick={handleSend} className="holo-btn">
                <Send size={12} />
            </button>
        </div>
    </div>
    </>
  );
};
