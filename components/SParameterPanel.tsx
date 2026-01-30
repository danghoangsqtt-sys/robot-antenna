import React, { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { Network, Save, Download, X } from 'lucide-react';
import { generateSParameters } from '../modules/sParameters';

export const SParameterPanel: React.FC = () => {
  const { 
    sParams, setSParamState,
    antennaType, frequencyGHz,
    techFreq, freqSweep,
    setActiveRightPanel
  } = useStore();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!sParams.enabled) return;

    const f0 = techFreq ? parseFloat(techFreq) : (freqSweep.startHz + freqSweep.endHz) / 2;
    const startF = Math.min(freqSweep.startHz, frequencyGHz - 1.0);
    const endF = Math.max(freqSweep.endHz, frequencyGHz + 1.0);
    
    // Generate Data
    const points = generateSParameters(startF, endF, f0, 100, antennaType);

    setSParamState({ points });

    const currentMetric = points.reduce((prev, curr) => 
        Math.abs(curr.freq - frequencyGHz) < Math.abs(prev.freq - frequencyGHz) ? curr : prev
    );

    setSParamState({
        currentS11: currentMetric.s11_mag_dB,
        currentVSWR: currentMetric.vswr
    });

  }, [antennaType, techFreq, freqSweep.startHz, freqSweep.endHz, frequencyGHz]);

  // Render Plot
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const padding = 30;
    
    // Dark Mode Canvas
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#101c2e';
    ctx.fillRect(0, 0, w, h);

    if (sParams.points.length === 0) return;

    const xMin = sParams.points[0].freq;
    const xMax = sParams.points[sParams.points.length-1].freq;
    const yMin = -60; 
    const yMax = 0;   

    const xScale = (val: number) => padding + ((val - xMin) / (xMax - xMin)) * (w - 2 * padding);
    const yScale = (val: number) => (h - padding) - ((val - yMin) / (yMax - yMin)) * (h - 2 * padding);

    // Grid Lines
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let db = yMin; db <= yMax; db += 10) {
        const y = yScale(db);
        ctx.moveTo(padding, y);
        ctx.lineTo(w - padding, y);
        ctx.fillStyle = '#64748b';
        ctx.fillText(db.toString(), 2, y + 3);
    }
    for (let f = Math.ceil(xMin); f <= Math.floor(xMax); f++) {
        const x = xScale(f);
        ctx.moveTo(x, padding);
        ctx.lineTo(x, h - padding);
        ctx.fillText(f.toString() + 'G', x - 5, h - 5);
    }
    ctx.stroke();

    // Trace S11
    ctx.strokeStyle = '#f59e0b'; // Amber-500
    ctx.lineWidth = 2;
    ctx.beginPath();
    sParams.points.forEach((p, i) => {
        const x = xScale(p.freq);
        const y = yScale(Math.max(yMin, Math.min(yMax, p.s11_mag_dB)));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Marker
    const markerX = xScale(frequencyGHz);
    if (markerX >= padding && markerX <= w - padding) {
        ctx.strokeStyle = '#10b981'; // Emerald
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(markerX, padding);
        ctx.lineTo(markerX, h - padding);
        ctx.stroke();
        ctx.setLineDash([]);
        
        const currentY = yScale(Math.max(yMin, Math.min(yMax, sParams.currentS11)));
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(markerX, currentY, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.fillStyle = '#f59e0b';
    ctx.font = '10px monospace';
    ctx.fillText("S11 (dB)", w - 60, padding + 10);

  }, [sParams.points, frequencyGHz]);

  const handleExportTouchstone = () => {
    const header = "! AntennaViz-AI Generated Data\n# GHz S DB R 50\n";
    const rows = sParams.points.map(p => 
        `${p.freq.toFixed(6)} ${p.s11_mag_dB.toFixed(4)} ${p.s11_phase_deg.toFixed(4)}`
    ).join("\n");
    
    const blob = new Blob([header + rows], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `s_params_${antennaType}_${Date.now()}.s1p`;
    a.click();
  };

  return (
    <div className="w-80 h-full flex flex-col tech-panel border-l border-amber-900/50 bg-[#101c2e]/95 z-20 shadow-xl">
       <div className="p-3 border-b border-amber-900/30 flex justify-between items-center bg-[#0b1220]">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
             <Network size={14} className="text-amber-500"/> MẠNG (S11)
          </h2>
          <button onClick={() => setActiveRightPanel('polar')} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
       </div>

       <div className="p-4 flex-1 flex flex-col gap-4">
          <div className="bg-[#0b1220] border border-amber-900/50 p-2 rounded shadow-sm">
             <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-slate-400 font-bold">MARKER: {frequencyGHz.toFixed(2)} GHz</span>
             </div>
             <div className="grid grid-cols-2 gap-2">
                <div>
                   <span className="block text-[9px] text-amber-600 font-bold">RETURN LOSS (S11)</span>
                   <span className="text-lg font-mono text-slate-200 font-bold">{sParams.currentS11?.toFixed(2)} dB</span>
                </div>
                <div>
                   <span className="block text-[9px] text-amber-600 font-bold">VSWR</span>
                   <span className={`text-lg font-mono font-bold ${sParams.currentVSWR < 2 ? 'text-emerald-400' : 'text-red-400'}`}>
                     {sParams.currentVSWR?.toFixed(2)} : 1
                   </span>
                </div>
             </div>
          </div>

          <canvas 
            ref={canvasRef} 
            width={280} 
            height={200} 
            className="w-full h-auto border border-slate-700 rounded bg-[#101c2e] shadow-inner"
          />

          <div className="grid grid-cols-2 gap-2 mt-auto">
             <button onClick={handleExportTouchstone} className="bg-[#101c2e] hover:bg-slate-800 text-amber-500 text-[10px] py-2 rounded border border-slate-700 flex items-center justify-center gap-1 shadow-sm font-bold">
                <Save size={12}/> EXP .S1P
             </button>
             <button className="bg-[#101c2e] hover:bg-slate-800 text-amber-500 text-[10px] py-2 rounded border border-slate-700 flex items-center justify-center gap-1 shadow-sm font-bold">
                <Download size={12}/> EXP CSV
             </button>
          </div>
       </div>
    </div>
  );
};