
import React, { useMemo } from 'react';
import { useStore } from '../../store';
import { MaterialType, Obstacle, TerrainType } from '../../types';
import { DIELECTRIC_MATERIALS } from '../../modules/materials';
import { computeMultipath } from '../../modules/multipathPhysics';
import { getPatternFunction } from '../../modules/farFieldPhysics';
import { X, Box, Layers, Trash2, Plus, Mountain, BarChart3 } from 'lucide-react';

export const EnvironmentPanel: React.FC = () => {
    const { 
        obstacles, addObstacle, removeObstacle, updateObstacle,
        multipathEnabled, maxReflections, terrainType, setAdvancedParams, setActiveRightPanel,
        antennaType, customFormula
    } = useStore();

    const metrics = useMemo(() => {
        if (!multipathEnabled) return null;
        const formulaFunc = getPatternFunction(antennaType, customFormula);
        const res = computeMultipath(obstacles, terrainType, maxReflections, formulaFunc);
        return res.metrics;
    }, [obstacles, terrainType, maxReflections, antennaType, customFormula, multipathEnabled]);

    return (
        <div className="w-80 h-full flex flex-col tech-panel border-l border-yellow-200 bg-white/95 z-20 shadow-xl">
            <div className="p-3 border-b border-yellow-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Layers size={14} className="text-yellow-600"/> MÔI TRƯỜNG & ĐA ĐƯỜNG
                </h2>
                <button onClick={() => setActiveRightPanel('polar')} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-yellow-700 font-bold uppercase">BẬT RAY TRACING</span>
                    <input 
                        type="checkbox" 
                        checked={multipathEnabled}
                        onChange={(e) => setAdvancedParams({ multipathEnabled: e.target.checked })}
                        className="accent-yellow-500"
                    />
                </div>

                {/* Physics Params */}
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <div className="flex justify-between text-[9px] text-slate-500 font-bold mb-1">
                        <span>SỐ LẦN PHẢN XẠ (BOUNCE)</span>
                        <span className="text-yellow-600">{maxReflections}</span>
                    </div>
                    <input 
                        type="range" min="0" max="5" step="1"
                        value={maxReflections}
                        onChange={(e) => setAdvancedParams({ maxReflections: parseInt(e.target.value) })}
                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none accent-yellow-500"
                    />
                </div>

                {/* Terrain Settings */}
                <div className="bg-slate-50 p-2 rounded border border-yellow-200 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] text-yellow-700 font-bold uppercase">
                        <Mountain size={12}/> LOẠI ĐỊA HÌNH
                    </div>
                    <select 
                        value={terrainType}
                        onChange={(e) => setAdvancedParams({ terrainType: e.target.value as TerrainType })}
                        className="w-full bg-white border border-slate-300 rounded text-xs text-slate-700 p-1 font-mono"
                    >
                        {Object.values(TerrainType).map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                {/* Metrics */}
                {metrics && (
                    <div className="bg-slate-800 p-3 rounded border border-slate-600 space-y-2 shadow-md">
                        <div className="flex items-center gap-2 text-[10px] text-slate-300 font-bold mb-1 uppercase">
                            <BarChart3 size={12}/> THÔNG SỐ KÊNH (Rx @ 10,0,10)
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[9px]">
                            <div>
                                <span className="block text-slate-400">TRỄ LAN TRUYỀN (RMS)</span>
                                <span className="text-emerald-400 font-mono font-bold">{metrics.delaySpread_ns.toFixed(2)} ns</span>
                            </div>
                            <div>
                                <span className="block text-slate-400">BĂNG THÔNG MẠCH LẠC</span>
                                <span className="text-amber-400 font-mono font-bold">{metrics.coherenceBandwidth_MHz.toFixed(2)} MHz</span>
                            </div>
                            <div>
                                <span className="block text-slate-400">SỐ ĐƯỜNG ĐA ĐƯỜNG</span>
                                <span className="text-white font-mono font-bold">{metrics.numPaths}</span>
                            </div>
                            <div>
                                <span className="block text-slate-400">CS THU TỔNG (Rel)</span>
                                <span className="text-white font-mono font-bold">{metrics.receivedPower_dBm.toFixed(1)} dB</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Obstacle List */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">VẬT CẢN ({obstacles.length})</span>
                        <button onClick={addObstacle} className="text-[10px] bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-200 flex items-center gap-1 font-bold hover:bg-yellow-100">
                            <Plus size={10}/> THÊM
                        </button>
                     </div>

                     {obstacles.map((obs, i) => (
                        <ObstacleItem 
                            key={obs.id} 
                            data={obs} 
                            index={i} 
                            onUpdate={(u) => updateObstacle(obs.id, u)}
                            onRemove={() => removeObstacle(obs.id)}
                        />
                     ))}

                     {obstacles.length === 0 && (
                        <div className="text-center py-4 text-slate-400 text-[10px] border-2 border-dashed border-slate-200 rounded uppercase">
                            CHƯA CÓ VẬT CẢN
                        </div>
                     )}
                </div>
            </div>
        </div>
    );
};

const ObstacleItem: React.FC<{
    data: Obstacle, 
    index: number,
    onUpdate: (u: Partial<Obstacle>) => void,
    onRemove: () => void
}> = ({ data, index, onUpdate, onRemove }) => {
    const matInfo = DIELECTRIC_MATERIALS[data.material];

    return (
        <div className="bg-white border border-slate-200 rounded p-2 text-[10px] space-y-2 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                <span className="font-bold text-yellow-600 flex items-center gap-1 uppercase">
                    <Box size={10}/> VẬT THỂ #{index + 1}
                </span>
                <button onClick={onRemove} className="text-red-400 hover:text-red-600"><Trash2 size={10}/></button>
            </div>

            <div className="space-y-1">
                <label className="text-slate-500 font-bold block uppercase">VẬT LIỆU</label>
                <select 
                    value={data.material}
                    onChange={(e) => onUpdate({ material: e.target.value as MaterialType })}
                    className="w-full bg-slate-50 text-slate-700 border border-slate-300 rounded p-1 font-mono"
                >
                    {Object.values(MaterialType).map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
                <div className="flex gap-2 text-[9px] text-slate-400 font-mono">
                    <span>εr: {matInfo.epsilon_r}</span>
                    <span>Loss: {matInfo.lossTangent}</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-1">
                <div className="space-y-1">
                    <label className="text-slate-500 text-[9px] block font-bold">POS X</label>
                    <input 
                        type="number" step="0.5" 
                        value={data.position[0]}
                        onChange={(e) => {
                            const p = [...data.position] as [number, number, number];
                            p[0] = parseFloat(e.target.value);
                            onUpdate({ position: p });
                        }}
                        className="w-full bg-white text-slate-700 p-1 rounded border border-slate-300 font-mono"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-slate-500 text-[9px] block font-bold">POS Y</label>
                    <input 
                        type="number" step="0.5"
                        value={data.position[1]}
                        onChange={(e) => {
                            const p = [...data.position] as [number, number, number];
                            p[1] = parseFloat(e.target.value);
                            onUpdate({ position: p });
                        }}
                        className="w-full bg-white text-slate-700 p-1 rounded border border-slate-300 font-mono"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-slate-500 text-[9px] block font-bold">POS Z</label>
                    <input 
                        type="number" step="0.5"
                        value={data.position[2]}
                        onChange={(e) => {
                            const p = [...data.position] as [number, number, number];
                            p[2] = parseFloat(e.target.value);
                            onUpdate({ position: p });
                        }}
                        className="w-full bg-white text-slate-700 p-1 rounded border border-slate-300 font-mono"
                    />
                </div>
            </div>
            
             <div className="grid grid-cols-3 gap-1">
                <div className="space-y-1">
                    <label className="text-slate-500 text-[9px] block font-bold">SCALE X</label>
                    <input 
                        type="number" step="0.5" min="0.1"
                        value={data.scale[0]}
                        onChange={(e) => {
                            const s = [...data.scale] as [number, number, number];
                            s[0] = parseFloat(e.target.value);
                            onUpdate({ scale: s });
                        }}
                        className="w-full bg-white text-slate-700 p-1 rounded border border-slate-300 font-mono"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-slate-500 text-[9px] block font-bold">SCALE Y</label>
                    <input 
                        type="number" step="0.5" min="0.1"
                        value={data.scale[1]}
                        onChange={(e) => {
                            const s = [...data.scale] as [number, number, number];
                            s[1] = parseFloat(e.target.value);
                            onUpdate({ scale: s });
                        }}
                        className="w-full bg-white text-slate-700 p-1 rounded border border-slate-300 font-mono"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-slate-500 text-[9px] block font-bold">SCALE Z</label>
                    <input 
                        type="number" step="0.5" min="0.1"
                        value={data.scale[2]}
                        onChange={(e) => {
                            const s = [...data.scale] as [number, number, number];
                            s[2] = parseFloat(e.target.value);
                            onUpdate({ scale: s });
                        }}
                        className="w-full bg-white text-slate-700 p-1 rounded border border-slate-300 font-mono"
                    />
                </div>
            </div>
        </div>
    );
};