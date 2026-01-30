
import React, { useMemo } from 'react';
import { useStore } from '../../store';
import { calculateAntennaMetrics } from '../../modules/antennaPhysics';
import { prettifyFormula } from '../../modules/formulaParser';
import { AntennaType } from '../../types';
import { ANTENNA_PRESETS } from '../../antenna/presets';
import { X, Ruler, Calculator, Brain } from 'lucide-react';

export const AntennaMetricsPanel: React.FC = () => {
    const { 
        gain, efficiency, setEfficiency, frequencyGHz, 
        antennaType, customFormula, physicalGeometry,
        setActiveRightPanel 
    } = useStore();

    const metrics = useMemo(() => calculateAntennaMetrics(gain, efficiency, frequencyGHz), [gain, efficiency, frequencyGHz]);
    
    const activeFormula = antennaType === AntennaType.CUSTOM ? customFormula : ANTENNA_PRESETS[antennaType].formula;
    const prettyFormula = useMemo(() => prettifyFormula(activeFormula), [activeFormula]);

    return (
        <div className="w-80 h-full flex flex-col tech-panel border-l border-cyan-200 bg-white/95 z-20 shadow-xl">
            <div className="p-3 border-b border-cyan-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Ruler size={14} className="text-cyan-600"/> CHỈ SỐ VẬT LÝ
                </h2>
                <button onClick={() => setActiveRightPanel('polar')} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-6">
                {/* 1. Gain & Directivity */}
                <section className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] text-cyan-600 font-bold uppercase">
                        <Calculator size={12}/> ĐỘ LỢI & HIỆU SUẤT
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded border border-cyan-100 space-y-3 shadow-sm">
                         <div>
                            <span className="block text-[9px] text-slate-500 font-bold">TỔNG GAIN (dBi)</span>
                            <span className="text-xl font-mono text-emerald-600 font-bold">{metrics.gain_dBi.toFixed(2)}</span>
                         </div>
                         
                         <div>
                             <div className="flex justify-between text-[9px] text-slate-500 font-bold mb-1">
                                <span>HIỆU SUẤT (η)</span>
                                <span className="text-cyan-600">{Math.round(metrics.efficiency * 100)}%</span>
                             </div>
                             <input 
                                type="range" min="0" max="100" step="1"
                                value={Math.round(efficiency * 100)}
                                onChange={(e) => setEfficiency(parseInt(e.target.value) / 100)}
                                className="w-full h-1 bg-slate-200 rounded-lg appearance-none accent-cyan-600"
                            />
                         </div>

                         <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                             <div>
                                <span className="block text-[9px] text-slate-500 font-bold">HỆ SỐ ĐỊNH HƯỚNG</span>
                                <span className="text-sm font-mono text-slate-700 font-bold">{metrics.directivity_dBi.toFixed(2)} dBi</span>
                             </div>
                             <div>
                                <span className="block text-[9px] text-slate-500 font-bold">TỶ SỐ F/B</span>
                                <span className="text-sm font-mono text-slate-700 font-bold">{metrics.frontToBackRatio_dB.toFixed(0)} dB</span>
                             </div>
                         </div>
                    </div>
                </section>

                {/* 2. Beam Parameters */}
                <section className="space-y-3">
                    <label className="text-[10px] text-slate-400 font-bold block uppercase">ĐẶC TÍNH BÚP SÓNG</label>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white p-2 rounded border border-slate-200 shadow-sm">
                             <span className="block text-[9px] text-slate-500 font-bold">GÓC NỬA CÔNG SUẤT (HPBW)</span>
                             <span className="text-sm font-mono text-amber-600 font-bold">{metrics.hpbw_deg.toFixed(1)}°</span>
                        </div>
                         <div className="bg-white p-2 rounded border border-slate-200 shadow-sm">
                             <span className="block text-[9px] text-slate-500 font-bold">DIỆN TÍCH HIỆU DỤNG</span>
                             <span className="text-sm font-mono text-amber-600 font-bold">{(metrics.effectiveArea_m2 * 10000).toFixed(1)} cm²</span>
                        </div>
                    </div>
                </section>

                {/* 3. Formula Engine Display */}
                <section className="space-y-2">
                     <div className="flex items-center gap-2 text-[10px] text-pink-500 font-bold uppercase">
                        <Brain size={12}/> CÔNG THỨC TOÁN HỌC
                    </div>
                    <div className="bg-slate-50 p-3 rounded border border-pink-200 font-mono text-xs text-pink-600 break-words leading-relaxed shadow-inner">
                        F(θ,φ) = {prettyFormula}
                    </div>
                    <div className="text-[9px] text-slate-400 font-italic">
                        * Biên độ trường E chuẩn hóa theo góc θ, φ
                    </div>
                </section>

                {/* 4. AI Geometry Stats */}
                {physicalGeometry && (
                    <section className="space-y-2 pt-2 border-t border-slate-200">
                         <div className="flex items-center gap-2 text-[10px] text-purple-600 font-bold uppercase">
                            AI TÁI TẠO CẤU TRÚC
                        </div>
                        <div className="text-[9px] text-slate-500 grid grid-cols-2 gap-2">
                            <div>KHỐI HÌNH HỌC: <span className="text-slate-800 font-bold">{physicalGeometry.length}</span></div>
                            <div>TỔNG PHẦN TỬ: <span className="text-slate-800 font-bold">{physicalGeometry.reduce((acc, g) => acc + (g.count || 1), 0)}</span></div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};