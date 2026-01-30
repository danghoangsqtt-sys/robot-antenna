
import React, { useState } from 'react';
import { useStore } from '../../store';
import { DielectricDefinition, MaterialType } from '../../types';
import { DIELECTRIC_MATERIALS } from '../../modules/materials';
import { Layers, X, Save, Plus, Trash2 } from 'lucide-react';

export const MaterialEditorPanel: React.FC = () => {
    const { setActiveRightPanel } = useStore();
    const [customMaterials, setCustomMaterials] = useState<DielectricDefinition[]>([]);
    const [editing, setEditing] = useState<DielectricDefinition>({
        name: 'Custom-1' as any,
        epsilon_r: 2.2,
        lossTangent: 0.001,
        color: '#ff00ff',
        roughness: 0.5,
        metalness: 0.0,
        opacity: 0.8
    });

    const handleSave = () => {
        setCustomMaterials([...customMaterials, { ...editing, name: `${editing.name}-${customMaterials.length}` as any }]);
    };

    return (
        <div className="w-80 h-full flex flex-col tech-panel border-l border-pink-200 bg-white/95 z-20 shadow-xl">
            <div className="p-3 border-b border-pink-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Layers size={14} className="text-pink-500"/> THƯ VIỆN VẬT LIỆU
                </h2>
                <button onClick={() => setActiveRightPanel('environment')} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-6">
                
                {/* Editor Form */}
                <div className="space-y-3 bg-slate-50 p-3 rounded border border-pink-200 shadow-sm">
                    <div className="text-[10px] text-pink-600 font-bold uppercase tracking-wider mb-2">TẠO VẬT LIỆU MỚI</div>
                    
                    <div>
                        <span className="text-[9px] text-slate-500 font-bold block">TÊN VẬT LIỆU</span>
                        <input 
                            type="text" value={editing.name} 
                            onChange={(e) => setEditing({...editing, name: e.target.value as any})}
                            className="w-full bg-white border border-slate-300 rounded text-xs text-slate-700 p-1 font-mono"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <span className="text-[9px] text-slate-500 font-bold block">HẰNG SỐ ĐIỆN MÔI (εr)</span>
                            <input 
                                type="number" step="0.1" value={editing.epsilon_r} 
                                onChange={(e) => setEditing({...editing, epsilon_r: parseFloat(e.target.value)})}
                                className="w-full bg-white border border-slate-300 rounded text-xs text-slate-700 p-1 font-mono"
                            />
                        </div>
                        <div>
                            <span className="text-[9px] text-slate-500 font-bold block">GÓC TỔN HAO (tanδ)</span>
                            <input 
                                type="number" step="0.001" value={editing.lossTangent} 
                                onChange={(e) => setEditing({...editing, lossTangent: parseFloat(e.target.value)})}
                                className="w-full bg-white border border-slate-300 rounded text-xs text-slate-700 p-1 font-mono"
                            />
                        </div>
                    </div>

                    <div>
                        <span className="text-[9px] text-slate-500 font-bold block">MÀU HIỂN THỊ</span>
                        <div className="flex gap-2 items-center">
                            <input 
                                type="color" value={editing.color} 
                                onChange={(e) => setEditing({...editing, color: e.target.value})}
                                className="h-6 w-8 bg-transparent border-0 cursor-pointer"
                            />
                            <span className="text-xs text-slate-600 font-mono py-1">{editing.color}</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleSave}
                        className="w-full bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200 rounded py-1 text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                    >
                        <Save size={12}/> LƯU VẬT LIỆU
                    </button>
                </div>

                {/* Library List */}
                <div className="space-y-2">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 pb-1">THƯ VIỆN CHUẨN</div>
                    {Object.values(DIELECTRIC_MATERIALS).map((mat, i) => (
                         <div key={i} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full border border-slate-300" style={{backgroundColor: mat.color}}></div>
                                <div>
                                    <div className="text-xs text-slate-700 font-bold">{mat.name}</div>
                                    <div className="text-[9px] text-slate-400 font-mono">εr:{mat.epsilon_r} tanδ:{mat.lossTangent}</div>
                                </div>
                            </div>
                         </div>
                    ))}
                    
                    {customMaterials.length > 0 && (
                        <>
                            <div className="text-[10px] text-pink-500 font-bold uppercase tracking-wider mt-4 border-b border-pink-100 pb-1">THƯ VIỆN CÁ NHÂN</div>
                            {customMaterials.map((mat, i) => (
                                <div key={`custom-${i}`} className="flex justify-between items-center bg-white p-2 rounded border border-pink-200 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full border border-slate-300" style={{backgroundColor: mat.color}}></div>
                                        <div>
                                            <div className="text-xs text-pink-600 font-bold">{mat.name}</div>
                                            <div className="text-[9px] text-slate-400 font-mono">εr:{mat.epsilon_r} tanδ:{mat.lossTangent}</div>
                                        </div>
                                    </div>
                                    <button className="text-slate-400 hover:text-red-500"><Trash2 size={12}/></button>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};