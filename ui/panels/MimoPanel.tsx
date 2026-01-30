
import React from 'react';
import { useStore } from '../../store';
import { BeamformingType } from '../../types';
import { X, Router, Wifi, Zap } from 'lucide-react';

export const MimoPanel: React.FC = () => {
    const { 
        mimo, setMimoParams, 
        arrayEnabled, arrayElements, elementSpacing, steeringAngle,
        setAdvancedParams, setActiveRightPanel
    } = useStore();

    return (
        <div className="w-80 h-full flex flex-col tech-panel border-l border-purple-200 bg-white/95 z-20 shadow-xl">
            <div className="p-3 border-b border-purple-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Router size={14} className="text-purple-600"/> MIMO & MẢNG PHA
                </h2>
                <button onClick={() => setActiveRightPanel('polar')} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
            </div>

            <div className="p-4 space-y-6 overflow-y-auto">
                {/* 1. Beam Steering */}
                <section className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">ĐIỀU KHIỂN HƯỚNG SÓNG (STEERING)</label>
                        <input 
                            type="checkbox" 
                            checked={arrayEnabled}
                            onChange={(e) => setAdvancedParams({ arrayEnabled: e.target.checked })}
                            className="accent-purple-600"
                        />
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded border border-purple-100 space-y-3 shadow-sm">
                        <div>
                            <div className="flex justify-between text-[9px] text-slate-500 font-bold mb-1">
                                <span>GÓC QUÉT (θ)</span>
                                <span className="text-purple-600 font-mono">{steeringAngle}°</span>
                            </div>
                            <input 
                                type="range" min="-60" max="60" step="1"
                                value={steeringAngle}
                                onChange={(e) => setAdvancedParams({ steeringAngle: parseInt(e.target.value) })}
                                className="w-full h-1 bg-slate-200 rounded-lg appearance-none accent-purple-600"
                            />
                            <div className="flex justify-between text-[8px] text-slate-400 mt-1 font-mono">
                                <span>-60°</span>
                                <span>0°</span>
                                <span>+60°</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                             <div>
                                 <span className="block text-[9px] text-slate-500 font-bold">SỐ PHẦN TỬ (N)</span>
                                 <input 
                                    type="number" min="1" max="64"
                                    value={arrayElements}
                                    onChange={(e) => setAdvancedParams({ arrayElements: parseInt(e.target.value) })}
                                    className="w-full bg-white border border-slate-300 rounded text-[10px] text-slate-700 p-1 font-mono"
                                 />
                             </div>
                             <div>
                                 <span className="block text-[9px] text-slate-500 font-bold">KHOẢNG CÁCH (λ)</span>
                                 <input 
                                    type="number" min="0.1" max="2.0" step="0.1"
                                    value={elementSpacing}
                                    onChange={(e) => setAdvancedParams({ elementSpacing: parseFloat(e.target.value) })}
                                    className="w-full bg-white border border-slate-300 rounded text-[10px] text-slate-700 p-1 font-mono"
                                 />
                             </div>
                        </div>
                    </div>
                </section>

                {/* 2. MIMO Config */}
                <section className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] text-emerald-600 font-bold flex items-center gap-2 uppercase tracking-wider">
                            <Wifi size={12}/> MASSIVE MIMO
                        </label>
                        <input 
                            type="checkbox" 
                            checked={mimo.enabled}
                            onChange={(e) => setMimoParams({ enabled: e.target.checked })}
                            className="accent-emerald-600"
                        />
                    </div>

                    <div className="bg-slate-50 p-3 rounded border border-emerald-100 space-y-3 shadow-sm">
                         <div className="grid grid-cols-2 gap-2">
                             <div>
                                 <span className="block text-[9px] text-slate-500 font-bold">ANTEN PHÁT (Tx)</span>
                                 <input 
                                    type="number" min="1" max="128"
                                    value={mimo.txCount}
                                    onChange={(e) => setMimoParams({ txCount: parseInt(e.target.value) })}
                                    className="w-full bg-white border border-slate-300 rounded text-[10px] text-slate-700 p-1 font-mono"
                                 />
                             </div>
                             <div>
                                 <span className="block text-[9px] text-slate-500 font-bold">ANTEN THU (Rx)</span>
                                 <input 
                                    type="number" min="1" max="16"
                                    value={mimo.rxCount}
                                    onChange={(e) => setMimoParams({ rxCount: parseInt(e.target.value) })}
                                    className="w-full bg-white border border-slate-300 rounded text-[10px] text-slate-700 p-1 font-mono"
                                 />
                             </div>
                        </div>

                        <div>
                            <span className="block text-[9px] text-slate-500 font-bold mb-1">THUẬT TOÁN PRECODING</span>
                            <div className="flex flex-col gap-1">
                                {Object.values(BeamformingType).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setMimoParams({ beamformingType: type })}
                                        className={`text-[9px] text-left px-2 py-1 rounded border ${mimo.beamformingType === type ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold' : 'border-transparent text-slate-500 hover:bg-slate-100'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="p-2 bg-slate-800 rounded border border-slate-700 shadow-md">
                     <div className="flex items-center gap-2 text-emerald-400 mb-1">
                        <Zap size={12}/> <span className="text-[10px] font-bold uppercase">DUNG LƯỢNG KÊNH (LÝ THUYẾT)</span>
                     </div>
                     <div className="text-2xl font-mono text-white text-center font-bold">
                        {mimo.enabled ? (mimo.txCount * 150).toFixed(0) : 0} <span className="text-[10px] text-slate-400">Mbps</span>
                     </div>
                </div>
            </div>
        </div>
    );
};