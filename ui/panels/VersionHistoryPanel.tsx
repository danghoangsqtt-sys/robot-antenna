
import React, { useState } from 'react';
import { useStore } from '../../store';
import { History, RotateCcw, Save, X, Clock, FileDiff } from 'lucide-react';
import { formatTime, diffSnapshots } from '../../modules/versionManager';

export const VersionHistoryPanel: React.FC = () => {
    const { history, takeSnapshot, restoreSnapshot, setActiveRightPanel } = useStore();
    const [newLabel, setNewLabel] = useState("");

    const handleCreate = () => {
        if (!newLabel.trim()) return;
        takeSnapshot(newLabel);
        setNewLabel("");
    };

    return (
        <div className="w-80 h-full flex flex-col tech-panel border-l border-slate-300 bg-white/95 z-20 shadow-xl">
            <div className="p-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <History size={14} className="text-slate-600"/> VERSION HISTORY
                </h2>
                <button onClick={() => setActiveRightPanel('polar')} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {/* Create Snapshot */}
                <div className="bg-slate-50 p-3 rounded border border-slate-200 shadow-sm space-y-2">
                    <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Save size={10}/> TẠO ĐIỂM KHÔI PHỤC
                    </div>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            placeholder="Nhập tên phiên bản..."
                            className="flex-1 text-xs p-2 border border-slate-300 rounded focus:border-blue-500 outline-none"
                        />
                        <button 
                            onClick={handleCreate}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded text-xs font-bold shadow-sm"
                        >
                            LƯU
                        </button>
                    </div>
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">TIMELINE ({history.length})</span>
                    </div>

                    <div className="relative border-l-2 border-slate-200 ml-2 space-y-4 pb-2">
                        {history.length === 0 && (
                            <div className="ml-4 text-xs text-slate-400 italic">Chưa có lịch sử phiên bản.</div>
                        )}

                        {history.map((snap, index) => {
                            const prevSnap = history[index + 1];
                            const changes = prevSnap ? diffSnapshots(snap.data, prevSnap.data) : ['Phiên bản khởi tạo'];

                            return (
                                <div key={snap.id} className="ml-4 relative group">
                                    {/* Dot */}
                                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white group-hover:bg-blue-500 transition-colors shadow-sm"></div>
                                    
                                    <div className="bg-white border border-slate-200 rounded p-2 shadow-sm group-hover:border-blue-300 transition-all">
                                        <div className="flex justify-between items-start mb-1">
                                            <div>
                                                <div className="text-xs font-bold text-slate-700">{snap.label || 'Unnamed Snapshot'}</div>
                                                <div className="text-[9px] text-slate-400 flex items-center gap-1 font-mono">
                                                    <Clock size={8}/> {formatTime(snap.timestamp)}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => restoreSnapshot(snap.id)}
                                                className="text-[9px] bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                            >
                                                <RotateCcw size={10}/> KHÔI PHỤC
                                            </button>
                                        </div>
                                        
                                        {/* Diff Summary */}
                                        <div className="mt-2 pt-2 border-t border-slate-100 text-[9px] text-slate-500 space-y-0.5">
                                            {changes.slice(0, 3).map((change, i) => (
                                                <div key={i} className="flex items-center gap-1">
                                                    <FileDiff size={8} className="text-slate-400"/> {change}
                                                </div>
                                            ))}
                                            {changes.length > 3 && <div className="italic text-slate-400">... và {changes.length - 3} thay đổi khác</div>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
