
import React from 'react';
import { useStore } from '../../store';
import { MaxwellMethod } from '../../modules/maxwell/types';
import { solveMoM } from '../../modules/maxwell/momSolver';
import { solveFDTD } from '../../modules/maxwell/fdtdSolver';
import { Cpu, Play, Loader2, BarChart2, CheckCircle, X } from 'lucide-react';
import { createDefaultGeometry } from '../../modules/geometryBuilder';

export const MaxwellSolverPanel: React.FC = () => {
    const { 
        maxwellSolver, setMaxwellState, 
        frequencyGHz, physicalGeometry, antennaType, 
        setActiveRightPanel 
    } = useStore();
    const { config, isRunning, lastResult } = maxwellSolver;

    const handleRun = async () => {
        setMaxwellState({ isRunning: true, progress: 0 });
        
        // Ensure geometry exists
        const geo = physicalGeometry || createDefaultGeometry(antennaType);

        try {
            let result;
            if (config.method === MaxwellMethod.MoM) {
                result = await solveMoM(geo, frequencyGHz, config.segments);
            } else if (config.method === MaxwellMethod.FDTD) {
                result = await solveFDTD(config.gridSize, config.iterations, frequencyGHz);
            } else {
                // FEM Placeholder
                result = { converged: true, iterationsTaken: 0, maxFieldStrength: 0 };
            }
            setMaxwellState({ lastResult: result, isRunning: false, progress: 100 });
        } catch (e) {
            console.error(e);
            setMaxwellState({ isRunning: false });
        }
    };

    return (
        <div className="w-80 h-full flex flex-col tech-panel border-l border-blue-400 bg-white/95 z-20 shadow-xl">
            <div className="p-3 border-b border-blue-200 flex justify-between items-center bg-slate-50">
                <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Cpu size={14} className="text-blue-600"/> MAXWELL CORE
                </h2>
                <button onClick={() => setActiveRightPanel('polar')} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-5">
                {/* Method Selection */}
                <div className="space-y-2">
                    <label className="text-[10px] text-blue-600 font-bold uppercase">PHƯƠNG PHÁP GIẢI</label>
                    <div className="flex flex-col gap-1">
                        {Object.values(MaxwellMethod).map(m => (
                            <button
                                key={m}
                                onClick={() => setMaxwellState({ config: { ...config, method: m } })}
                                className={`text-left text-[10px] p-2 rounded border ${config.method === m ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Parameters */}
                <div className="space-y-3 bg-slate-50 p-3 rounded border border-blue-100">
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">THAM SỐ CẤU HÌNH</div>
                    
                    {config.method === MaxwellMethod.MoM ? (
                        <div>
                            <span className="block text-[9px] text-slate-500 font-bold">SỐ PHÂN ĐOẠN (SEGMENTS)</span>
                            <input 
                                type="number" value={config.segments}
                                onChange={(e) => setMaxwellState({ config: { ...config, segments: parseInt(e.target.value) } })}
                                className="w-full bg-white border border-slate-300 rounded text-xs p-1"
                            />
                        </div>
                    ) : (
                        <div>
                            <span className="block text-[9px] text-slate-500 font-bold">KÍCH THƯỚC LƯỚI (GRID SIZE)</span>
                            <input 
                                type="number" value={config.gridSize}
                                onChange={(e) => setMaxwellState({ config: { ...config, gridSize: parseInt(e.target.value) } })}
                                className="w-full bg-white border border-slate-300 rounded text-xs p-1"
                            />
                        </div>
                    )}
                    
                    <div>
                        <span className="block text-[9px] text-slate-500 font-bold">SỐ LẦN LẶP (ITERATIONS)</span>
                        <input 
                            type="number" value={config.iterations}
                            onChange={(e) => setMaxwellState({ config: { ...config, iterations: parseInt(e.target.value) } })}
                            className="w-full bg-white border border-slate-300 rounded text-xs p-1"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2">
                        <input 
                            type="checkbox" checked={config.gpuAcceleration}
                            onChange={(e) => setMaxwellState({ config: { ...config, gpuAcceleration: e.target.checked } })}
                            className="accent-blue-600"
                        />
                        <span className="text-[10px] text-slate-600 font-bold">GPU ACCELERATION</span>
                    </div>
                </div>

                {/* Actions */}
                <button 
                    onClick={handleRun}
                    disabled={isRunning}
                    className={`w-full py-2.5 rounded text-xs font-bold flex items-center justify-center gap-2 shadow-sm ${isRunning ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                    {isRunning ? <Loader2 size={14} className="animate-spin"/> : <Play size={14}/>}
                    {isRunning ? 'ĐANG TÍNH TOÁN...' : 'CHẠY MÔ PHỎNG'}
                </button>

                {/* Results */}
                {lastResult && (
                    <div className="animate-in fade-in space-y-3 pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                            <CheckCircle size={14}/> TÍNH TOÁN HOÀN TẤT
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div className="bg-slate-50 p-2 rounded border border-slate-200">
                                <div className="text-slate-400 font-bold">TRỞ KHÁNG VÀO</div>
                                <div className="font-mono text-slate-700">
                                    {lastResult.inputImpedance?.real.toFixed(1)} + j{lastResult.inputImpedance?.imag.toFixed(1)} Ω
                                </div>
                            </div>
                            <div className="bg-slate-50 p-2 rounded border border-slate-200">
                                <div className="text-slate-400 font-bold">FIELD MAX</div>
                                <div className="font-mono text-slate-700">
                                    {(lastResult.maxFieldStrength || 1.0).toFixed(4)} V/m
                                </div>
                            </div>
                        </div>

                        {lastResult.currentDistribution && (
                            <div className="bg-slate-800 p-2 rounded">
                                <div className="flex items-center gap-1 text-[9px] text-blue-300 font-bold mb-1">
                                    <BarChart2 size={10}/> PHÂN BỐ DÒNG ĐIỆN
                                </div>
                                <div className="flex items-end h-16 gap-px">
                                    {Array.from(lastResult.currentDistribution).map((val, i) => (
                                        <div 
                                            key={i} 
                                            className="flex-1 bg-blue-500 hover:bg-blue-400 transition-all"
                                            style={{ height: `${(val as number) * 100}%` }}
                                        ></div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
