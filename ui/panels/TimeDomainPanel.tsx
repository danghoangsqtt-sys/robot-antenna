import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useStore } from '../../store';
import { analyzeSignal } from '../../modules/signalProcessing';
import { Activity, X, Play, Pause, RefreshCw } from 'lucide-react';

export const TimeDomainPanel: React.FC = () => {
    const { fdtd, setFDTDParams, setActiveRightPanel } = useStore();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [history, setHistory] = useState<number[]>(new Array(100).fill(0));
    const animationRef = useRef<number>(0);

    // Simulation Loop for Probe Data
    useEffect(() => {
        const update = () => {
            if (fdtd.running) {
                const time = Date.now() / 1000;
                const signal = Math.sin(time * 5) * Math.exp(-0.1 * (time % 5)) 
                             + (Math.random() - 0.5) * 0.05; // Noise
                
                setHistory(prev => {
                    const next = [...prev, signal];
                    if (next.length > 200) next.shift();
                    return next;
                });
            }
            animationRef.current = requestAnimationFrame(update);
        };
        animationRef.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(animationRef.current);
    }, [fdtd.running]);

    // Statistics
    const stats = useMemo(() => analyzeSignal(new Float32Array(history)), [history]);

    // Render Oscilloscope
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        
        // Dark scope background remains for contrast
        ctx.fillStyle = '#020617'; // Almost black
        ctx.fillRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(let x=0; x<w; x+=20) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
        for(let y=0; y<h; y+=20) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
        ctx.stroke();

        // Baseline
        ctx.strokeStyle = '#475569';
        ctx.beginPath();
        ctx.moveTo(0, h/2);
        ctx.lineTo(w, h/2);
        ctx.stroke();

        // Signal
        ctx.strokeStyle = '#10b981'; // Emerald
        ctx.lineWidth = 2;
        ctx.beginPath();
        history.forEach((val, i) => {
            const x = (i / (history.length - 1)) * w;
            const y = (h/2) - (val * (h/4)); // Scale
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#10b981';
        ctx.stroke();
        ctx.shadowBlur = 0;

    }, [history]);

    return (
        <div className="w-80 h-full flex flex-col tech-panel border-l border-emerald-900/50 bg-[#101c2e]/95 z-20 shadow-xl">
            <div className="p-3 border-b border-emerald-900/30 flex justify-between items-center bg-[#0b1220]">
                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Activity size={14} className="text-emerald-500"/> MIỀN THỜI GIAN (OSCILLOSCOPE)
                </h2>
                <button onClick={() => setActiveRightPanel('polar')} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
            </div>

            <div className="p-4 space-y-4">
                <canvas 
                    ref={canvasRef} 
                    width={280} 
                    height={200} 
                    className="w-full h-auto border border-emerald-900/50 rounded bg-slate-950 shadow-inner"
                />

                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#0b1220] p-2 rounded border border-slate-700">
                        <span className="text-[9px] text-slate-500 block font-bold">BIÊN ĐỘ ĐỈNH (V/m)</span>
                        <span className="text-sm font-mono text-emerald-400 font-bold">{stats.peak.toFixed(4)}</span>
                    </div>
                    <div className="bg-[#0b1220] p-2 rounded border border-slate-700">
                        <span className="text-[9px] text-slate-500 block font-bold">RMS POWER</span>
                        <span className="text-sm font-mono text-amber-500 font-bold">{stats.rms.toFixed(4)}</span>
                    </div>
                    <div className="bg-[#0b1220] p-2 rounded border border-slate-700">
                        <span className="text-[9px] text-slate-500 block font-bold">PAPR (dB)</span>
                        <span className="text-sm font-mono text-blue-400 font-bold">{stats.papr_dB.toFixed(2)} dB</span>
                    </div>
                    <div className="bg-[#0b1220] p-2 rounded border border-slate-700">
                        <span className="text-[9px] text-slate-500 block font-bold">SỐ MẪU</span>
                        <span className="text-sm font-mono text-slate-300 font-bold">{history.length}</span>
                    </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-700">
                    <button 
                        onClick={() => setFDTDParams({ running: !fdtd.running })}
                        className={`flex-1 py-2 rounded text-xs font-bold flex items-center justify-center gap-2 border ${fdtd.running ? 'bg-emerald-900/30 border-emerald-600 text-emerald-400' : 'bg-[#0b1220] text-slate-400 border-slate-700'}`}
                    >
                        {fdtd.running ? <Pause size={12}/> : <Play size={12}/>}
                        {fdtd.running ? 'DỪNG' : 'CHẠY'}
                    </button>
                    <button 
                        onClick={() => setHistory([])}
                        className="w-10 flex items-center justify-center bg-[#0b1220] border border-slate-700 rounded text-slate-400 hover:text-slate-200"
                    >
                        <RefreshCw size={12}/>
                    </button>
                </div>
                
                <div className="text-[9px] text-slate-500 font-mono mt-2 italic">
                    VỊ TRÍ ĐẦU DÒ: [0, 0, 0] (TÂM)<br/>
                    THUẬT TOÁN: YEE CELL (FDTD)
                </div>
            </div>
        </div>
    );
};