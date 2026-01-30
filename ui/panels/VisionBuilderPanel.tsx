
import React, { useRef, useState } from 'react';
import { useStore } from '../../store';
import { analyzeAntennaImage } from '../../services/geminiService';
import { AIAnalysisResponse, AntennaType, VisionHints } from '../../types';
import { Scan, Upload, ArrowRight, Wand2, X, Microscope, Ruler, Palette, FileSearch, CheckCircle2 } from 'lucide-react';

export const VisionBuilderPanel: React.FC = () => {
    const { 
        setActiveRightPanel, setPhysicalGeometry, setAntennaType, setGain, setCustomFormula 
    } = useStore();
    
    const [image, setImage] = useState<string | null>(null);
    const [scaleRef, setScaleRef] = useState("");
    const [materialHint, setMaterialHint] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [progressStep, setProgressStep] = useState(0);
    const [result, setResult] = useState<AIAnalysisResponse | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const steps = [
        "Shape Detection...",
        "Dimension Estimation...",
        "Material Analysis...",
        "Symmetry & Feed Point...",
        "Finalizing Model..."
    ];

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setImage(ev.target?.result as string);
            reader.readAsDataURL(file);
            setResult(null);
            setProgressStep(0);
        }
    };

    const runAnalysis = async () => {
        if (!image) return;
        setAnalyzing(true);
        setResult(null);
        
        // Simulate progress for UX
        let step = 0;
        const interval = setInterval(() => {
            step++;
            if (step < steps.length) setProgressStep(step);
        }, 800);

        try {
            const hints: VisionHints = {
                scaleRef: scaleRef || "Unknown",
                materialHint: materialHint || "Standard"
            };
            
            const data = await analyzeAntennaImage(image, undefined, hints);
            clearInterval(interval);
            setProgressStep(steps.length);
            setResult(data);
        } catch (e) {
            clearInterval(interval);
            console.error(e);
            alert("Lỗi phân tích AI Vision.");
        } finally {
            setAnalyzing(false);
        }
    };

    const applyModel = () => {
        if (!result) return;
        
        if (result.geometry3D) setPhysicalGeometry(result.geometry3D);
        if (result.radiationPattern?.gain_dBi) setGain(result.radiationPattern.gain_dBi);
        if (result.radiationPattern?.formula) {
            setAntennaType(AntennaType.CUSTOM);
            setCustomFormula(result.radiationPattern.formula);
        } else {
             // Map type if possible
             const typeStr = result.antennaType?.toLowerCase();
             if (typeStr?.includes('dipole')) setAntennaType(AntennaType.DIPOLE);
             else if (typeStr?.includes('yagi')) setAntennaType(AntennaType.YAGI);
             else setAntennaType(AntennaType.CUSTOM);
        }
        setActiveRightPanel('geometryEditor');
    };

    return (
        <div className="w-80 h-full flex flex-col tech-panel border-l border-indigo-200 bg-white/95 z-20 shadow-xl">
            <div className="p-3 border-b border-indigo-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Scan size={14} className="text-indigo-600"/> VISION BUILDER
                </h2>
                <button onClick={() => setActiveRightPanel('polar')} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-5">
                {/* 1. Upload Section */}
                <div className="space-y-2">
                    <div 
                        onClick={() => fileRef.current?.click()}
                        className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${image ? 'border-indigo-300 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
                    >
                        {image ? (
                            <img src={image} className="max-h-32 rounded shadow-sm object-contain" alt="Preview"/>
                        ) : (
                            <>
                                <Upload size={24} className="text-slate-400 mb-2"/>
                                <span className="text-xs text-slate-500 font-bold">CLICK ĐỂ TẢI ẢNH</span>
                            </>
                        )}
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile}/>
                    </div>
                </div>

                {/* 2. Context Inputs */}
                <div className="space-y-3 bg-slate-50 p-3 rounded border border-indigo-100 shadow-sm">
                    <div className="flex items-center gap-2 text-[10px] text-indigo-600 font-bold uppercase">
                        <FileSearch size={12}/> THÔNG TIN BỔ TRỢ (HINTS)
                    </div>
                    
                    <div>
                        <label className="flex items-center gap-1 text-[9px] text-slate-500 font-bold mb-1">
                            <Ruler size={10}/> THAM CHIẾU KÍCH THƯỚC
                        </label>
                        <input 
                            value={scaleRef}
                            onChange={(e) => setScaleRef(e.target.value)}
                            placeholder="Ví dụ: Chiều dài 15cm, Anten Wifi..."
                            className="w-full text-xs p-1.5 rounded border border-slate-300 focus:border-indigo-500 outline-none"
                        />
                    </div>
                    
                    <div>
                        <label className="flex items-center gap-1 text-[9px] text-slate-500 font-bold mb-1">
                            <Palette size={10}/> GỢI Ý VẬT LIỆU
                        </label>
                        <input 
                            value={materialHint}
                            onChange={(e) => setMaterialHint(e.target.value)}
                            placeholder="Ví dụ: PCB FR4, Nhôm, Đồng..."
                            className="w-full text-xs p-1.5 rounded border border-slate-300 focus:border-indigo-500 outline-none"
                        />
                    </div>
                </div>

                {/* 3. Action */}
                {!analyzing && !result && (
                    <button 
                        onClick={runAnalysis}
                        disabled={!image}
                        className={`w-full py-2.5 rounded text-xs font-bold flex items-center justify-center gap-2 shadow-sm ${image ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                    >
                        <Wand2 size={14}/> BẮT ĐẦU PHÂN TÍCH
                    </button>
                )}

                {/* 4. Progress */}
                {analyzing && (
                    <div className="space-y-2 py-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                            <Microscope size={14} className="animate-bounce"/>
                            {steps[Math.min(progressStep, steps.length - 1)]}
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                                className="bg-indigo-500 h-full transition-all duration-300 ease-out"
                                style={{ width: `${((progressStep + 1) / steps.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* 5. Result */}
                {result && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-3">
                        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded shadow-sm">
                            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-2">
                                <CheckCircle2 size={14}/> PHÂN TÍCH HOÀN TẤT
                            </div>
                            <div className="text-[10px] space-y-1 text-emerald-800">
                                <div>LOẠI: <span className="font-mono font-bold">{result.antennaType}</span></div>
                                <div>SỐ PHẦN TỬ: <span className="font-mono font-bold">{result.geometry3D?.length || 0}</span></div>
                                <div>ĐỘ TIN CẬY: <span className="font-mono font-bold">{((result.confidence || 0) * 100).toFixed(0)}%</span></div>
                            </div>
                        </div>

                        <button 
                            onClick={applyModel}
                            className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                        >
                            DỰNG MÔ HÌNH 3D <ArrowRight size={14}/>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
