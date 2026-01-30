
import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { X, FlaskConical, Calculator, FunctionSquare, ArrowRight, BookOpen, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import { AntennaType, GeometryPrimitive, MaterialType } from '../../types';
import { DIELECTRIC_MATERIALS } from '../../modules/materials';
import { parseInputToJS, validateFormula, prettifyFormula } from '../../modules/formulaParser';

const FORMULA_PRESETS = [
    { name: "Dipole", label: "R(θ)=sin(θ)", formula: "sin(theta)" },
    { name: "Horn", label: "R(θ)=exp(-θ²/0.5)", formula: "exp(-theta**2 / 0.5)" },
    { name: "Parabolic", label: "R(θ)=cos⁴(θ)", formula: "cos(theta)^4" },
    { name: "Isotropic", label: "R(θ)=1", formula: "1" },
    { name: "Cardioid", label: "R(θ)=1+cos(θ)", formula: "1 + cos(theta)" }
];

export const FormulaLabPanel: React.FC = () => {
    const { 
        setActiveRightPanel, frequencyGHz, setPhysicalGeometry, 
        customFormula, setCustomFormula, setAntennaType 
    } = useStore();
    
    const [mode, setMode] = useState<'design' | 'lab'>('design');
    const [designType, setDesignType] = useState('dipole');
    
    // Design State
    const [vf, setVf] = useState(0.95); // Velocity Factor
    const [calculatedLen, setCalculatedLen] = useState(0);
    
    // PCB Props
    const [substrate, setSubstrate] = useState<MaterialType>(MaterialType.FR4);
    const [substrateH, setSubstrateH] = useState(1.6); // mm
    const [patchW, setPatchW] = useState(0);
    const [patchL, setPatchL] = useState(0);

    // Advanced Formula Lab State
    const [labInput, setLabInput] = useState(prettifyFormula(customFormula));
    const [labStatus, setLabStatus] = useState<{ valid: boolean; error?: string }>({ valid: true });

    // --- DESIGN CALCULATOR ---
    useEffect(() => {
        const c = 299.792458; // mm/ns or m/us
        const lambda = c / (frequencyGHz * 1000); // meters
        
        let len = 0;
        if (designType === 'dipole') {
            len = (0.5 * lambda) * vf; 
            setCalculatedLen(len);
        } else if (designType === 'monopole') {
            len = (0.25 * lambda) * vf;
            setCalculatedLen(len);
        } else if (designType === 'patch') {
            const er = DIELECTRIC_MATERIALS[substrate].epsilon_r;
            const f = frequencyGHz * 1e9;
            const c0 = 3e8;
            const h = substrateH / 1000; // meters

            const W = (c0 / (2 * f)) * Math.sqrt(2 / (er + 1));
            const ereff = (er + 1) / 2 + ((er - 1) / 2) * Math.pow(1 + 12 * (h / W), -0.5);
            const num = (ereff + 0.3) * (W / h + 0.264);
            const den = (ereff - 0.258) * (W / h + 0.8);
            const deltaL = 0.412 * h * (num / den);
            const Leff = c0 / (2 * f * Math.sqrt(ereff));
            const L = Leff - 2 * deltaL;

            setPatchW(W * 1000); // mm
            setPatchL(L * 1000); // mm
            setCalculatedLen(L); 
        }
    }, [frequencyGHz, designType, vf, substrate, substrateH]);

    const applyDesignGeometry = () => {
        const lambdaRef = 0.29979 / frequencyGHz;
        let newGeo: GeometryPrimitive[] = [];
        
        if (designType === 'dipole') {
            const lenLambda = calculatedLen / lambdaRef;
            newGeo = [{
                shape: 'cylinder', count: 1, 
                dimensions: { length_lambda: lenLambda, radius_lambda: 0.005 },
                orientation: 'vertical', material: MaterialType.METAL
            }];
        } else if (designType === 'monopole') {
            const lenLambda = calculatedLen / lambdaRef;
            newGeo = [
                {
                    shape: 'cylinder', count: 1,
                    dimensions: { length_lambda: lenLambda, radius_lambda: 0.005 },
                    orientation: 'vertical', material: MaterialType.METAL
                },
                {
                    shape: 'box', count: 1,
                    dimensions: { width_lambda: 1.0, length_lambda: 1.0, height_lambda: 0.01 },
                    orientation: 'horizontal', material: MaterialType.METAL
                }
            ];
        } else if (designType === 'patch') {
            const wLambda = (patchW / 1000) / lambdaRef;
            const lLambda = (patchL / 1000) / lambdaRef;
            const hLambda = (substrateH / 1000) / lambdaRef;
            const groundW = wLambda * 2;
            const groundL = lLambda * 2;

            newGeo = [
                {
                    shape: 'plane', count: 1,
                    dimensions: { width_lambda: groundW, length_lambda: groundL },
                    orientation: 'horizontal', material: MaterialType.METAL
                },
                {
                    shape: 'box', count: 1,
                    dimensions: { width_lambda: groundW, length_lambda: groundL, height_lambda: hLambda },
                    orientation: 'horizontal', material: substrate
                },
                {
                    shape: 'plane', count: 1,
                    dimensions: { width_lambda: wLambda, length_lambda: lLambda },
                    orientation: 'horizontal', material: MaterialType.METAL,
                    feedPoint: [0, 0, 0]
                }
            ];
        }
        setPhysicalGeometry(newGeo);
    };

    // --- LAB FORMULA LOGIC ---
    useEffect(() => {
        const js = parseInputToJS(labInput);
        const check = validateFormula(js);
        setLabStatus(check);
    }, [labInput]);

    const applyLabFormula = () => {
        if (!labStatus.valid) return;
        const js = parseInputToJS(labInput);
        setAntennaType(AntennaType.CUSTOM);
        setCustomFormula(js);
    };

    return (
        <div className="w-80 h-full flex flex-col tech-panel border-l border-lime-200 bg-white/95 z-20 shadow-xl">
            <div className="p-3 border-b border-lime-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <FlaskConical size={14} className="text-lime-600"/> FORMULA LAB
                </h2>
                <button onClick={() => setActiveRightPanel('polar')} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
            </div>

            <div className="flex border-b border-lime-100 bg-slate-50">
                <button 
                    onClick={() => setMode('design')}
                    className={`flex-1 py-2 text-[10px] font-bold border-b-2 ${mode === 'design' ? 'border-lime-500 text-lime-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    THIẾT KẾ VẬT LÝ
                </button>
                <button 
                    onClick={() => setMode('lab')}
                    className={`flex-1 py-2 text-[10px] font-bold border-b-2 ${mode === 'lab' ? 'border-lime-500 text-lime-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    HÀM BỨC XẠ
                </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-6">
                {mode === 'design' && (
                    <div className="animate-in fade-in space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] text-lime-600 font-bold flex items-center gap-1 uppercase">
                                <Calculator size={12}/> THÔNG SỐ CẤU TRÚC
                            </label>
                            
                            <div className="bg-slate-50 p-2 rounded border border-lime-100 space-y-2 shadow-sm">
                                <div>
                                    <span className="text-[9px] text-slate-500 font-bold block">LOẠI ANTEN</span>
                                    <select 
                                        value={designType}
                                        onChange={(e) => setDesignType(e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded text-xs text-slate-700 p-1 font-mono"
                                    >
                                        <option value="dipole">Dipole Nửa Sóng</option>
                                        <option value="monopole">Monopole 1/4 Sóng</option>
                                        <option value="patch">Vi dải (PCB Patch)</option>
                                    </select>
                                </div>
                                
                                {designType !== 'patch' && (
                                    <div>
                                        <div className="flex justify-between">
                                            <span className="text-[9px] text-slate-500 font-bold">HỆ SỐ VẬN TỐC (VF)</span>
                                            <span className="text-[9px] text-lime-600 font-mono font-bold">{vf.toFixed(2)}</span>
                                        </div>
                                        <input 
                                            type="range" min="0.5" max="1.0" step="0.01"
                                            value={vf}
                                            onChange={(e) => setVf(parseFloat(e.target.value))}
                                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none accent-lime-600"
                                        />
                                    </div>
                                )}

                                {designType === 'patch' && (
                                    <div className="space-y-2 pt-2 border-t border-slate-200">
                                        <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold uppercase">
                                            <Layers size={10}/> CẤU TRÚC PCB
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <span className="text-[9px] text-slate-500 block">VẬT LIỆU NỀN</span>
                                                <select 
                                                    value={substrate}
                                                    onChange={(e) => setSubstrate(e.target.value as MaterialType)}
                                                    className="w-full text-[10px] bg-white border border-slate-300 rounded p-1"
                                                >
                                                    <option value={MaterialType.FR4}>FR4 (εr=4.4)</option>
                                                    <option value={MaterialType.ROGERS}>Rogers 4003 (εr=3.55)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <span className="text-[9px] text-slate-500 block">CHIỀU DÀY (mm)</span>
                                                <input 
                                                    type="number" step="0.1" value={substrateH}
                                                    onChange={(e) => setSubstrateH(parseFloat(e.target.value))}
                                                    className="w-full text-[10px] bg-white border border-slate-300 rounded p-1"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-3 bg-slate-800 border border-slate-600 rounded text-center shadow-md">
                            <span className="text-[9px] text-lime-300 block mb-1 font-bold">KẾT QUẢ (@{frequencyGHz}GHz)</span>
                            {designType === 'patch' ? (
                                <div className="grid grid-cols-2 gap-2 text-white font-mono text-sm">
                                    <div className="bg-slate-700/50 p-1 rounded">
                                        <div className="text-[8px] text-slate-400">CHIỀU RỘNG (W)</div>
                                        <div className="font-bold">{patchW.toFixed(2)} mm</div>
                                    </div>
                                    <div className="bg-slate-700/50 p-1 rounded">
                                        <div className="text-[8px] text-slate-400">CHIỀU DÀI (L)</div>
                                        <div className="font-bold">{patchL.toFixed(2)} mm</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xl font-mono text-white mb-1 font-bold">
                                    {(calculatedLen * 1000).toFixed(2)} mm
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={applyDesignGeometry}
                            className="w-full bg-lime-50 hover:bg-lime-100 text-lime-700 border border-lime-200 rounded py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                        >
                            CẬP NHẬT MÔ HÌNH 3D <ArrowRight size={12}/>
                        </button>
                    </div>
                )}

                {mode === 'lab' && (
                    <div className="animate-in fade-in space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] text-lime-600 font-bold flex items-center gap-1 uppercase">
                                <FunctionSquare size={12}/> NHẬP CÔNG THỨC (PLAIN MATH)
                            </label>
                            
                            <div className="relative">
                                <textarea
                                    value={labInput}
                                    onChange={(e) => setLabInput(e.target.value)}
                                    className={`w-full h-32 p-2 text-sm font-mono border rounded outline-none resize-none ${labStatus.valid ? 'border-lime-300 focus:ring-1 focus:ring-lime-500' : 'border-red-300 bg-red-50 focus:ring-1 focus:ring-red-500'}`}
                                    placeholder="Ví dụ: sin(theta)^2 * cos(theta)"
                                />
                                <div className="absolute bottom-2 right-2 text-xs">
                                    {labStatus.valid ? (
                                        <span className="text-lime-600 flex items-center gap-1 font-bold"><CheckCircle2 size={12}/> HỢP LỆ</span>
                                    ) : (
                                        <span className="text-red-600 flex items-center gap-1 font-bold"><AlertCircle size={12}/> LỖI</span>
                                    )}
                                </div>
                            </div>
                            
                            {labStatus.error && (
                                <div className="text-[10px] text-red-500 font-mono bg-red-50 p-1 rounded border border-red-100">
                                    {labStatus.error}
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">MẪU CÓ SẴN (PRESETS)</label>
                            <div className="grid grid-cols-2 gap-2">
                                {FORMULA_PRESETS.map((p) => (
                                    <button 
                                        key={p.name}
                                        onClick={() => setLabInput(p.formula)}
                                        className="text-left bg-slate-50 hover:bg-lime-50 border border-slate-200 hover:border-lime-300 p-2 rounded transition-colors"
                                    >
                                        <div className="text-[10px] font-bold text-slate-700">{p.name}</div>
                                        <div className="text-[9px] text-slate-500 font-mono truncate">{p.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[9px] text-slate-500 space-y-1">
                            <div className="font-bold text-slate-600">HƯỚNG DẪN:</div>
                            <ul className="list-disc pl-3 space-y-1 font-mono">
                                <li>Biến số: <b>theta</b> (θ), <b>phi</b> (φ)</li>
                                <li>Hàm: <b>sin, cos, exp, log, abs, sqrt</b></li>
                                <li>Phép toán: <b>^</b> (lũy thừa), <b>*</b> (nhân)</li>
                                <li>Hằng số: <b>pi</b> (π)</li>
                            </ul>
                        </div>

                        <button 
                            onClick={applyLabFormula}
                            disabled={!labStatus.valid}
                            className={`w-full py-2 rounded text-xs font-bold flex items-center justify-center gap-2 shadow-sm border ${labStatus.valid ? 'bg-lime-500 hover:bg-lime-600 text-white border-lime-600' : 'bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed'}`}
                        >
                            ÁP DỤNG CÔNG THỨC <BookOpen size={12}/>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
