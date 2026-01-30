
import React from 'react';
import { useStore } from '../../store';
import { Magnet, X, Layers, Zap } from 'lucide-react';

export const NearFieldPanel: React.FC = () => {
    const { 
        nearFieldEnabled, nearFieldConfig, setNearFieldConfig, 
        setAdvancedParams, setActiveRightPanel 
    } = useStore();

    return (
        <div className="w-80 h-full flex flex-col tech-panel border-l border-pink-200 bg-white/95 z-20 shadow-xl">
            <div className="p-3 border-b border-pink-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Magnet size={14} className="text-pink-500"/> PHÒNG TRƯỜNG GẦN (NEAR FIELD)
                </h2>
                <button onClick={() => setActiveRightPanel('polar')} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
            </div>

            <div className="p-4 space-y-6 overflow-y-auto">
                {/* Main Toggle */}
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded border border-pink-200 shadow-sm">
                    <span className="text-xs font-bold text-pink-600 uppercase">BẬT MÔ PHỎNG TRƯỜNG GẦN</span>
                    <input 
                        type="checkbox"
                        checked={nearFieldEnabled}
                        onChange={(e) => setAdvancedParams({ nearFieldEnabled: e.target.checked })}
                        className="accent-pink-500 w-4 h-4"
                    />
                </div>

                {nearFieldEnabled ? (
                    <div className="animate-in fade-in space-y-4">
                        
                        {/* Visualization Mode */}
                        <section className="space-y-2">
                            <label className="text-[10px] text-slate-400 font-bold block uppercase">CHẾ ĐỘ HIỂN THỊ</label>
                            <div className="flex bg-slate-100 rounded p-1 border border-slate-200">
                                <button 
                                    onClick={() => setNearFieldConfig({ visualizationMode: 'particles' })}
                                    className={`flex-1 text-[9px] py-1 rounded font-bold ${nearFieldConfig.visualizationMode === 'particles' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    HẠT (PARTICLES)
                                </button>
                                <button 
                                    onClick={() => setNearFieldConfig({ visualizationMode: 'slice' })}
                                    className={`flex-1 text-[9px] py-1 rounded font-bold ${nearFieldConfig.visualizationMode === 'slice' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    MẶT CẮT (SLICE)
                                </button>
                                <button 
                                    onClick={() => setNearFieldConfig({ visualizationMode: 'both' })}
                                    className={`flex-1 text-[9px] py-1 rounded font-bold ${nearFieldConfig.visualizationMode === 'both' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    CẢ HAI
                                </button>
                            </div>
                        </section>

                        {/* Slice Settings */}
                        {(nearFieldConfig.visualizationMode === 'slice' || nearFieldConfig.visualizationMode === 'both') && (
                            <section className="bg-slate-50 p-3 rounded border border-pink-100 space-y-3 shadow-sm">
                                <div className="flex items-center gap-2 text-pink-500 text-[10px] font-bold uppercase">
                                    <Layers size={12}/> CẤU HÌNH MẶT CẮT
                                </div>
                                
                                <div className="grid grid-cols-3 gap-1">
                                    {['XY', 'XZ', 'YZ'].map((plane) => (
                                        <button
                                            key={plane}
                                            onClick={() => setNearFieldConfig({ slicePlane: plane as any })}
                                            className={`text-[10px] py-1 border rounded font-bold ${nearFieldConfig.slicePlane === plane ? 'bg-pink-50 border-pink-300 text-pink-600' : 'bg-white border-slate-200 text-slate-500'}`}
                                        >
                                            {plane}
                                        </button>
                                    ))}
                                </div>

                                <div>
                                    <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                                        <span>VỊ TRÍ CẮT (OFFSET)</span>
                                        <span className="text-pink-600">{nearFieldConfig.sliceOffset.toFixed(1)}</span>
                                    </div>
                                    <input 
                                        type="range" min="-10" max="10" step="0.5"
                                        value={nearFieldConfig.sliceOffset}
                                        onChange={(e) => setNearFieldConfig({ sliceOffset: parseFloat(e.target.value) })}
                                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none accent-pink-500"
                                    />
                                </div>
                            </section>
                        )}

                        {/* Field Type Settings */}
                        <section className="bg-slate-50 p-3 rounded border border-pink-100 space-y-3 shadow-sm">
                            <div className="flex items-center gap-2 text-pink-500 text-[10px] font-bold uppercase">
                                <Zap size={12}/> LOẠI TRƯỜNG VẬT LÝ
                            </div>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setNearFieldConfig({ fieldType: 'E' })}
                                    className={`flex-1 py-1 text-[10px] border rounded font-bold ${nearFieldConfig.fieldType === 'E' ? 'border-pink-300 text-pink-600 bg-pink-50' : 'bg-white border-slate-200 text-slate-400'}`}
                                >
                                    ĐIỆN TRƯỜNG (E)
                                </button>
                                <button 
                                    onClick={() => setNearFieldConfig({ fieldType: 'H' })}
                                    className={`flex-1 py-1 text-[10px] border rounded font-bold ${nearFieldConfig.fieldType === 'H' ? 'border-pink-300 text-pink-600 bg-pink-50' : 'bg-white border-slate-200 text-slate-400'}`}
                                >
                                    TỪ TRƯỜNG (H)
                                </button>
                                <button 
                                    onClick={() => setNearFieldConfig({ fieldType: 'Poynting' })}
                                    className={`flex-1 py-1 text-[10px] border rounded font-bold ${nearFieldConfig.fieldType === 'Poynting' ? 'border-pink-300 text-pink-600 bg-pink-50' : 'bg-white border-slate-200 text-slate-400'}`}
                                >
                                    CÔNG SUẤT (P)
                                </button>
                            </div>

                             <div>
                                <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                                    <span>CƯỜNG ĐỘ HIỂN THỊ</span>
                                    <span className="text-pink-600">{nearFieldConfig.intensityScale.toFixed(1)}x</span>
                                </div>
                                <input 
                                    type="range" min="0.1" max="5.0" step="0.1"
                                    value={nearFieldConfig.intensityScale}
                                    onChange={(e) => setNearFieldConfig({ intensityScale: parseFloat(e.target.value) })}
                                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none accent-pink-500"
                                />
                            </div>
                        </section>

                         <div className="text-[9px] text-slate-500 font-mono italic p-2 border border-slate-200 rounded bg-white">
                            Mô phỏng các thành phần trường phản kháng (1/r³, 1/r²) thường bị bỏ qua trong tính toán trường xa. Chế độ Slice sử dụng GPU shader để vẽ bản đồ nhiệt.
                        </div>

                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-400 text-xs italic">
                        Vui lòng bật chế độ Trường Gần để truy cập công cụ.
                    </div>
                )}
            </div>
        </div>
    );
};