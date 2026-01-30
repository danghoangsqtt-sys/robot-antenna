
import React from 'react';
import { useStore } from '../../store';
import { createDefaultGeometry } from '../../modules/geometryBuilder';
import { Box, X, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { GeometryPrimitive } from '../../types';

export const GeometryEditorPanel: React.FC = () => {
    const { 
        physicalGeometry, setPhysicalGeometry, 
        antennaType, setActiveRightPanel 
    } = useStore();

    const handleReset = () => {
        setPhysicalGeometry(createDefaultGeometry(antennaType));
    };

    const handleUpdate = (index: number, updates: Partial<GeometryPrimitive>) => {
        if (!physicalGeometry) return;
        const newGeo = [...physicalGeometry];
        newGeo[index] = { ...newGeo[index], ...updates };
        setPhysicalGeometry(newGeo);
    };

    const handleUpdateDims = (index: number, dimKey: string, value: number) => {
        if (!physicalGeometry) return;
        const newGeo = [...physicalGeometry];
        const currentDims = newGeo[index].dimensions || {};
        newGeo[index] = {
            ...newGeo[index],
            dimensions: { ...currentDims, [dimKey]: value }
        };
        setPhysicalGeometry(newGeo);
    };

    return (
        <div className="w-80 h-full flex flex-col tech-panel border-l border-red-200 bg-white/95 z-20 shadow-xl">
            <div className="p-3 border-b border-red-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Box size={14} className="text-red-500"/> CHỈNH SỬA HÌNH HỌC
                </h2>
                <button onClick={() => setActiveRightPanel('polar')} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {!physicalGeometry || physicalGeometry.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-xs text-slate-500 mb-4">Chưa có mô hình vật lý nào được tải.</p>
                        <button 
                            onClick={handleReset}
                            className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded text-xs font-bold hover:bg-red-100"
                        >
                            TẠO MẪU MẶC ĐỊNH CHO {antennaType}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-end">
                            <button onClick={handleReset} className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-1 font-bold">
                                <RotateCcw size={10}/> KHÔI PHỤC MẶC ĐỊNH
                            </button>
                        </div>
                        
                        {physicalGeometry.map((geo, i) => (
                            <div key={i} className="bg-slate-50 border border-slate-200 rounded p-3 space-y-3 shadow-sm">
                                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                    <span className="text-[10px] font-bold text-red-500 uppercase">{geo.shape} #{i+1}</span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    {geo.shape === 'cylinder' && (
                                        <>
                                            <div>
                                                <label className="text-[9px] text-slate-500 font-bold block">CHIỀU DÀI (λ)</label>
                                                <input 
                                                    type="number" step="0.01"
                                                    value={geo.dimensions?.length_lambda || 0}
                                                    onChange={(e) => handleUpdateDims(i, 'length_lambda', parseFloat(e.target.value))}
                                                    className="w-full bg-white text-slate-700 p-1 rounded text-xs border border-slate-300 font-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-slate-500 font-bold block">BÁN KÍNH (λ)</label>
                                                <input 
                                                    type="number" step="0.001"
                                                    value={geo.dimensions?.radius_lambda || 0}
                                                    onChange={(e) => handleUpdateDims(i, 'radius_lambda', parseFloat(e.target.value))}
                                                    className="w-full bg-white text-slate-700 p-1 rounded text-xs border border-slate-300 font-mono"
                                                />
                                            </div>
                                        </>
                                    )}
                                    
                                    {geo.count !== undefined && (
                                         <div>
                                            <label className="text-[9px] text-slate-500 font-bold block">SỐ LƯỢNG</label>
                                            <input 
                                                type="number" step="1"
                                                value={geo.count}
                                                onChange={(e) => handleUpdate(i, { count: parseInt(e.target.value) })}
                                                className="w-full bg-white text-slate-700 p-1 rounded text-xs border border-slate-300 font-mono"
                                            />
                                        </div>
                                    )}

                                    {geo.count && geo.count > 1 && (
                                         <div>
                                            <label className="text-[9px] text-slate-500 font-bold block">KHOẢNG CÁCH (λ)</label>
                                            <input 
                                                type="number" step="0.01"
                                                value={geo.dimensions?.spacing_lambda || 0}
                                                onChange={(e) => handleUpdateDims(i, 'spacing_lambda', parseFloat(e.target.value))}
                                                className="w-full bg-white text-slate-700 p-1 rounded text-xs border border-slate-300 font-mono"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};