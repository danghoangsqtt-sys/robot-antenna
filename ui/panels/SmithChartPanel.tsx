import React, { useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { convertSParamsToSmithCoords } from '../../modules/smithChart';
import { X, Activity } from 'lucide-react';

export const SmithChartPanel: React.FC = () => {
    const { sParams, setActiveRightPanel } = useStore();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const r = Math.min(w, h) / 2 - 20;

        // Clear Dark Mode
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#101c2e'; 
        ctx.fillRect(0, 0, w, h);

        // Draw Smith Chart Grid (Simplified)
        ctx.strokeStyle = '#334155'; // Slate-700
        ctx.lineWidth = 1;

        // 1. Unit Circle (Resistance = 0)
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.stroke();

        // 2. Horizontal Line (Reactance = 0)
        ctx.beginPath();
        ctx.moveTo(cx - r, cy);
        ctx.lineTo(cx + r, cy);
        ctx.stroke();

        // 3. Constant Resistance Circles
        const drawRCircle = (res: number) => {
            const gammaC = res / (res + 1);
            const radiusGamma = 1 / (res + 1);
            const screenX = cx + gammaC * r;
            const screenY = cy;
            const screenR = radiusGamma * r;
            ctx.beginPath();
            ctx.arc(screenX, screenY, screenR, 0, 2 * Math.PI);
            ctx.stroke();
        };

        [0.5, 1.0, 2.0, 5.0].forEach(drawRCircle);

        // 4. Constant Reactance Arcs
        const drawXArc = (xVal: number) => {
            const radiusGamma = 1 / Math.abs(xVal);
            const screenX = cx + 1 * r;
            const screenY = cy - (1/xVal) * r;
            const screenR = radiusGamma * r;
            ctx.beginPath();
            ctx.arc(screenX, screenY, screenR, 0, 2 * Math.PI);
            ctx.stroke();
        };
        
        ctx.strokeStyle = '#1e293b'; // Darker Slate
        [0.5, 1.0, 2.0, -0.5, -1.0, -2.0].forEach(drawXArc);

        // Draw Data Trace
        if (sParams.points.length > 0) {
            const coords = convertSParamsToSmithCoords(sParams.points);
            
            ctx.strokeStyle = '#d97706'; // Amber-600
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            coords.forEach((p, i) => {
                const px = cx + p.r * r;
                const py = cy - p.i * r; // Flip Y
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            });
            ctx.stroke();

            // Draw End Point
            const last = coords[coords.length - 1];
            ctx.fillStyle = '#10b981'; // Emerald
            ctx.beginPath();
            ctx.arc(cx + last.r * r, cy - last.i * r, 4, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Label
        ctx.fillStyle = '#64748b';
        ctx.font = '10px monospace';
        ctx.fillText('OPEN', cx + r + 5, cy);
        ctx.fillText('SHORT', cx - r - 35, cy);
        ctx.fillText('CẢM KHÁNG (Trên)', cx - 40, cy - r - 5);
        ctx.fillText('DUNG KHÁNG (Dưới)', cx - 40, cy + r + 15);

    }, [sParams.points]);

    return (
        <div className="w-80 h-full flex flex-col tech-panel border-l border-amber-900/50 bg-[#101c2e]/95 z-20 shadow-xl">
            <div className="p-3 border-b border-amber-900/30 flex justify-between items-center bg-[#0b1220]">
                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Activity size={14} className="text-amber-500"/> BIỂU ĐỒ SMITH
                </h2>
                <button onClick={() => setActiveRightPanel('sparam')} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
            </div>
            <div className="p-4 flex-1 flex flex-col items-center justify-center bg-[#0b1220]">
                 <canvas ref={canvasRef} width={280} height={280} className="border border-slate-700 rounded-full bg-[#101c2e] shadow-sm"/>
                 <div className="mt-4 text-xs text-slate-500 font-mono text-center">
                    TRỞ KHÁNG CHUẨN HÓA (Z0 = 50Ω)<br/>
                    <span className="text-amber-500 font-bold">Vàng: Quét tần số</span>
                 </div>
            </div>
        </div>
    );
};