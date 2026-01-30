import React, { useEffect, useRef, useMemo } from 'react';
import { useStore } from '../store';
import { ANTENNA_PRESETS } from '../antenna/presets';
import { AntennaType } from '../types';
import { Download, Activity, MousePointer2, X } from 'lucide-react';

export const PolarPlotPanel: React.FC = () => {
  const { 
    polarPlotConfig, setPolarPlotConfig, 
    antennaType, customFormula, 
    arrayEnabled, arrayElements, elementSpacing, steeringAngle,
    gain: maxGain 
  } = useStore();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const plotData = useMemo(() => {
    const data: { angle: number; r: number; r_db: number }[] = [];
    
    const formulaStr = antennaType === AntennaType.CUSTOM 
      ? customFormula 
      : ANTENNA_PRESETS[antennaType].formula;
    
    let formulaFunc: Function;
    try {
      formulaFunc = new Function('theta', 'phi', `return ${formulaStr};`);
    } catch {
      formulaFunc = () => 0;
    }

    const k = 2 * Math.PI;
    const steerRad = (90 - steeringAngle) * (Math.PI / 180);
    const beta = -k * elementSpacing * Math.cos(steerRad);

    const getAF = (theta: number) => {
        if (!arrayEnabled || arrayElements <= 1) return 1.0;
        const psi = k * elementSpacing * Math.cos(theta) + beta;
        const sinPsi2 = Math.sin(psi / 2);
        if (Math.abs(sinPsi2) < 1e-6) return 1.0;
        const num = Math.sin(arrayElements * psi / 2);
        return Math.abs(num / (arrayElements * sinPsi2));
    };

    for (let angle = 0; angle < 360; angle += 1) {
        const rad = angle * Math.PI / 180;
        let theta = 0;
        let phi = 0;
        let val = 0;

        if (polarPlotConfig.plane === 'H') {
            theta = Math.PI / 2;
            phi = rad;
            try { val = Math.abs(formulaFunc(theta, phi)); } catch {}
            val *= getAF(theta);
        } else {
            if (angle <= 180) {
                theta = rad;
                phi = 0;
            } else {
                theta = 2 * Math.PI - rad;
                phi = Math.PI;
            }
            try { val = Math.abs(formulaFunc(theta, phi)); } catch {}
            val *= getAF(theta);
        }

        const db = val > 0.001 ? 10 * Math.log10(val) : -40;
        
        data.push({ angle, r: val, r_db: db });
    }
    return data;
  }, [antennaType, customFormula, polarPlotConfig.plane, arrayEnabled, arrayElements, elementSpacing, steeringAngle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    // Dark Mode Background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#101c2e'; // Panel BG
    ctx.fillRect(0, 0, width, height);

    // Grid color
    ctx.strokeStyle = '#334155'; 
    ctx.lineWidth = 1;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#94a3b8'; // Muted Text

    const rings = polarPlotConfig.scale === 'linear' ? [0.25, 0.5, 0.75, 1.0] : [-30, -20, -10, 0];
    
    rings.forEach(rVal => {
        let rPx = 0;
        if (polarPlotConfig.scale === 'linear') {
            rPx = rVal * radius;
        } else {
            const minDb = -40;
            rPx = ((rVal - minDb) / (0 - minDb)) * radius;
        }
        
        if (rPx > 0) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, rPx, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fillText(rVal.toString(), centerX + 5, centerY - rPx);
        }
    });

    // Rays
    for (let i = 0; i < 360; i += 30) {
        const rad = (i - 90) * Math.PI / 180;
        const x = centerX + radius * Math.cos(rad);
        const y = centerY + radius * Math.sin(rad);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        const labelX = centerX + (radius + 15) * Math.cos(rad);
        const labelY = centerY + (radius + 15) * Math.sin(rad);
        ctx.fillText(i + '°', labelX, labelY);
    }

    // Plot Line
    ctx.strokeStyle = '#3b82f6'; // Blue 500
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const maxVal = Math.max(...plotData.map(d => d.r));
    
    plotData.forEach((pt, i) => {
        const angleRad = (pt.angle - 90) * Math.PI / 180;
        let rPx = 0;
        
        if (polarPlotConfig.scale === 'linear') {
            const normR = maxVal > 0 ? pt.r / maxVal : 0;
            rPx = normR * radius;
        } else {
            const maxDb = 10 * Math.log10(maxVal > 0 ? maxVal : 1e-9);
            const normDb = pt.r_db - maxDb;
            
            const minDb = -40;
            const clamped = Math.max(minDb, normDb);
            rPx = ((clamped - minDb) / (0 - minDb)) * radius;
        }

        const x = centerX + rPx * Math.cos(angleRad);
        const y = centerY + rPx * Math.sin(angleRad);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'; // Blue transparent
    ctx.fill();

  }, [plotData, polarPlotConfig.scale]);

  const handleExportCSV = () => {
    const header = "Angle(deg),Magnitude(linear),Magnitude(dB)\n";
    const rows = plotData.map(d => `${d.angle},${d.r.toFixed(4)},${d.r_db.toFixed(2)}`).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `polar_plot_${polarPlotConfig.plane}_${Date.now()}.csv`;
    a.click();
  };

  const handleExportImg = () => {
    if (canvasRef.current) {
        const link = document.createElement('a');
        link.download = `polar_plot_${Date.now()}.png`;
        link.href = canvasRef.current.toDataURL();
        link.click();
    }
  };

  if (!polarPlotConfig.visible) return null;

  return (
    <div className="w-80 h-full flex flex-col tech-panel border-l border-blue-900/50 bg-[#101c2e]/95 z-20 shadow-xl">
       <div className="p-3 border-b border-blue-900/30 flex justify-between items-center bg-[#0b1220]">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
             <Activity size={14} className="text-blue-500"/> BỨC XẠ (POLAR)
          </h2>
          <button onClick={() => setPolarPlotConfig({ visible: false })} className="text-slate-500 hover:text-slate-300">✕</button>
       </div>

       <div className="p-4 flex-1 flex flex-col gap-4">
          <canvas 
            ref={canvasRef} 
            width={280} 
            height={280} 
            className="w-full h-auto border border-slate-700 rounded bg-[#101c2e] shadow-inner"
          />

          <div className="space-y-3">
             <div className="flex bg-slate-800 rounded p-1 border border-slate-700">
                <button 
                  onClick={() => setPolarPlotConfig({ plane: 'E' })}
                  className={`flex-1 text-[10px] py-1 rounded font-bold ${polarPlotConfig.plane === 'E' ? 'bg-[#101c2e] text-blue-400 shadow-sm border border-slate-600' : 'text-slate-500'}`}
                >
                  MẶT PHẲNG E
                </button>
                <button 
                  onClick={() => setPolarPlotConfig({ plane: 'H' })}
                  className={`flex-1 text-[10px] py-1 rounded font-bold ${polarPlotConfig.plane === 'H' ? 'bg-[#101c2e] text-blue-400 shadow-sm border border-slate-600' : 'text-slate-500'}`}
                >
                  MẶT PHẲNG H
                </button>
             </div>

             <div className="flex bg-slate-800 rounded p-1 border border-slate-700">
                <button 
                  onClick={() => setPolarPlotConfig({ scale: 'linear' })}
                  className={`flex-1 text-[10px] py-1 rounded font-bold ${polarPlotConfig.scale === 'linear' ? 'bg-[#101c2e] text-blue-400 shadow-sm border border-slate-600' : 'text-slate-500'}`}
                >
                  TUYẾN TÍNH
                </button>
                <button 
                  onClick={() => setPolarPlotConfig({ scale: 'dB' })}
                  className={`flex-1 text-[10px] py-1 rounded font-bold ${polarPlotConfig.scale === 'dB' ? 'bg-[#101c2e] text-blue-400 shadow-sm border border-slate-600' : 'text-slate-500'}`}
                >
                  LOG (dB)
                </button>
             </div>

             <div className="grid grid-cols-2 gap-2 mt-2">
                <button onClick={handleExportImg} className="bg-[#101c2e] hover:bg-slate-800 text-slate-400 text-[10px] py-2 rounded border border-slate-700 flex items-center justify-center gap-1 shadow-sm">
                   <MousePointer2 size={12}/> LƯU ẢNH
                </button>
                <button onClick={handleExportCSV} className="bg-[#101c2e] hover:bg-slate-800 text-slate-400 text-[10px] py-2 rounded border border-slate-700 flex items-center justify-center gap-1 shadow-sm">
                   <Download size={12}/> LƯU CSV
                </button>
             </div>
          </div>
          
          <div className="text-[9px] font-mono text-slate-500 mt-auto">
             * E-Plane: φ=0<br/>
             * H-Plane: θ=90°<br/>
             * dB scale: -40dB đến 0dB
          </div>
       </div>
    </div>
  );
};