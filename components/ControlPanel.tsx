import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { AntennaType, MaterialType, Obstacle, BeamformingType } from '../types';
import { ANTENNA_PRESETS } from '../antenna/presets';
import { DIELECTRIC_MATERIALS } from '../modules/materials';
import { analyzeAntennaImage, optimizeAntennaDesign } from '../services/geminiService';
import { exportCanvasToPNG, exportCanvasToVideo } from '../io/exportUtils';
import { saveSimulationToFile, loadSimulationFromFile } from '../modules/statePersistence';
import { 
  Settings, Cpu, Upload, Video, Eye, EyeOff, Activity, FileCode, Radar, Camera, Box,
  Layers, Zap, CheckCircle2, Wifi, Globe2, ArrowUpRight, Magnet, Cuboid, Trash2, Plus,
  Network, Play, Pause, Waves, LineChart, Timer, RotateCcw, Calculator, Router, Beaker,
  PenTool, Ruler, Save, FolderOpen, FlaskConical, Scan, History, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toggleVRMode } from '../modules/vrControl';

export const ControlPanel: React.FC<{ onSettingsClick?: () => void }> = ({ onSettingsClick }) => {
  const store = useStore();
  const { 
    antennaType, setAntennaType,
    gain, setGain,
    resolution, setResolution,
    customFormula, setCustomFormula,
    gesture, toggleWebcam, showWebcam,
    techFreq, techLength, techElements, techSpacing,
    setTechParams,
    physicalGeometry, setPhysicalGeometry,
    togglePhysicalAntenna, showPhysicalAntenna,
    applyOptimization,
    arrayEnabled, arrayElements, elementSpacing, steeringAngle,
    transmitPowerdBm, receiverSensitivitydBm, frequencyGHz, showCoverage,
    nearFieldEnabled,
    multipathEnabled, obstacles, maxReflections, addObstacle, removeObstacle, updateObstacle,
    setAdvancedParams,
    polarPlotConfig, setPolarPlotConfig,
    mimo, setMimoParams,
    freqSweep, setFreqSweepParams,
    sParams,
    fdtd, setFDTDParams,
    activeRightPanel, setActiveRightPanel,
    loadSimulation,
    takeSnapshot 
  } = store;

  const [analyzing, setAnalyzing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);
  const [optimizationNotes, setOptimizationNotes] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadInputRef = useRef<HTMLInputElement>(null);

  // Sidebar Toggle State with Persistence
  const [isCollapsed, setIsCollapsed] = useState(() => {
      try {
          return localStorage.getItem('sidebar_collapsed') === 'true';
      } catch { return false; }
  });

  const toggleSidebar = () => {
      setIsCollapsed(prev => {
          const next = !prev;
          localStorage.setItem('sidebar_collapsed', String(next));
          return next;
      });
  };

  // Trigger resize event when sidebar toggles to ensure Canvas updates bounds
  useEffect(() => {
    const triggerResize = () => window.dispatchEvent(new Event('resize'));
    // Trigger immediately and after animation
    triggerResize();
    const t = setTimeout(triggerResize, 300);
    return () => clearTimeout(t);
  }, [isCollapsed]);

  useEffect(() => {
    let interval: number;
    if (freqSweep.running) {
        interval = window.setInterval(() => {
            let nextFreq = frequencyGHz + freqSweep.stepHz;
            if (nextFreq > freqSweep.endHz) {
                nextFreq = freqSweep.startHz; // Loop back
            }
            const ratio = nextFreq / frequencyGHz;
            const newSpacing = elementSpacing * ratio;

            setAdvancedParams({ 
                frequencyGHz: parseFloat(nextFreq.toFixed(2)),
                elementSpacing: parseFloat(newSpacing.toFixed(3)) 
            });

        }, 200);
    }
    return () => clearInterval(interval);
  }, [freqSweep.running, frequencyGHz, freqSweep.stepHz, freqSweep.endHz, freqSweep.startHz, elementSpacing]);

  const mimoMetrics = useMemo(() => {
    if (!mimo.enabled) return null;
    const BandwidthMHz = 20;
    const SNR_dB = -60 - (-100);
    const SNR_linear = Math.pow(10, SNR_dB / 10);
    const streams = Math.min(mimo.txCount, mimo.rxCount);
    const capacity = streams * BandwidthMHz * Math.log2(1 + SNR_linear);
    return {
       snr: SNR_dB.toFixed(1),
       capacity: capacity.toFixed(1),
       throughput: (capacity * 0.7).toFixed(1),
       streams
    };
  }, [mimo, gain]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setAnalyzing(true);
      setAiReasoning("Đang gửi dữ liệu cho AI (Hình ảnh + Thông số)...");
      setOptimizationNotes(null);
      
      try {
        const result = await analyzeAntennaImage(base64, {
          freq: techFreq,
          length: techLength,
          elements: techElements,
          spacing: techSpacing
        });

        // Snapshot before AI changes
        takeSnapshot("Pre-AI Analysis");

        let mappedType = AntennaType.CUSTOM;
        const typeStr = result.antennaType?.toLowerCase();
        if (typeStr?.includes('dipole')) mappedType = AntennaType.DIPOLE;
        else if (typeStr?.includes('yagi')) mappedType = AntennaType.YAGI;
        else if (typeStr?.includes('horn')) mappedType = AntennaType.HORN;
        else if (typeStr?.includes('parabol')) mappedType = AntennaType.PARABOLIC;
        else if (typeStr?.includes('patch') || typeStr?.includes('microstrip')) mappedType = AntennaType.MICROSTRIP;
        
        setAntennaType(mappedType);
        
        if (result.radiationPattern?.formula) {
           setAntennaType(AntennaType.CUSTOM);
           setCustomFormula(result.radiationPattern.formula);
        }
        if (result.radiationPattern?.gain_dBi) {
           setGain(result.radiationPattern.gain_dBi);
        }
        if (result.geometry3D) {
          setPhysicalGeometry(result.geometry3D);
        }
        setAiReasoning(`Đã nhận diện: ${result.antennaType} (${(result.confidence || 0) * 100}%). Số phần tử: ${result.estimatedParameters?.elements || 1}. Gain: ${result.radiationPattern.gain_dBi}dBi.`);
      } catch (err) {
        setAiReasoning("Lỗi kết nối AI hoặc phân tích thất bại.");
        console.error(err);
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOptimization = async () => {
    if (!physicalGeometry) {
      setOptimizationNotes("Vui lòng tải ảnh anten hoặc chọn preset có geometry để tối ưu.");
      return;
    }
    setOptimizing(true);
    setOptimizationNotes("AI Engineer đang tính toán lại cấu trúc hình học...");
    try {
      const currentFormulaStr = antennaType === AntennaType.CUSTOM ? customFormula : ANTENNA_PRESETS[antennaType].formula;
      const result = await optimizeAntennaDesign(antennaType, physicalGeometry, gain, currentFormulaStr);
      applyOptimization(result);
      setOptimizationNotes(result.designNotes);
    } catch (err) {
      console.error(err);
      setOptimizationNotes("Lỗi khi tối ưu hóa thiết kế.");
    } finally {
      setOptimizing(false);
    }
  };

  const handleSaveSimulation = () => {
      saveSimulationToFile(store);
  };

  const handleLoadSimulation = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      loadSimulationFromFile(file).then(state => {
          loadSimulation(state);
      }).catch(err => {
          console.error("Failed to load", err);
          alert("File mô phỏng bị lỗi");
      });
  };

  const handleExportPNG = () => exportCanvasToPNG('antenna-canvas');
  const handleExportVideo = () => {
      const recorder = exportCanvasToVideo('antenna-canvas');
      if (recorder) {
          alert("REC: Đang ghi hình 5 giây...");
          setTimeout(() => recorder.stop(), 5000);
      }
  };

  // DARK MODE STYLES
  const btnClass = "bg-[#101c2e] border border-slate-700 text-slate-300 hover:bg-[#1e293b] hover:text-blue-400 transition-colors py-2 rounded text-xs font-semibold flex items-center justify-center gap-2 shadow-sm";
  const labelClass = "block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest";
  const inputClass = "w-full bg-[#0b1220] border border-slate-700 text-slate-200 text-xs rounded p-2 focus:ring-1 focus:ring-blue-500 font-mono shadow-inner placeholder-slate-600";
  const panelSectionClass = "border border-slate-700 p-3 rounded bg-[#101c2e] shadow-sm";

  // Fixed widths to prevent squishing
  const PANEL_WIDTH = "w-[280px]";
  const COLLAPSED_WIDTH = "w-[56px]";

  return (
    <div className={`${isCollapsed ? COLLAPSED_WIDTH : PANEL_WIDTH} shrink-0 h-full flex flex-col z-10 overflow-hidden tech-panel border-r border-slate-800 bg-[#101c2e]/95 transition-[width] duration-[250ms] ease-in-out`}>
      {/* HEADER */}
      <div className={`flex-none h-14 border-b border-slate-800 bg-[#0b1220] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-4'}`}>
        {!isCollapsed ? (
             <>
                <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2 tracking-tight truncate">
                  <Radar className="text-blue-500 shrink-0" />
                  <span className="truncate">ANTENNAVIZ</span>
                  <span className="text-[10px] align-top bg-blue-900/30 border border-blue-800 text-blue-400 px-1 rounded ml-1 shrink-0">AI</span>
                </h1>
                <button onClick={toggleSidebar} className="text-slate-500 hover:text-blue-400 transition-colors p-1 hover:bg-slate-800 rounded shrink-0" aria-label="Toggle sidebar" title="Ẩn thanh công cụ">
                  <ChevronLeft size={18} />
                </button>
             </>
        ) : (
             <button onClick={toggleSidebar} className="text-slate-500 hover:text-blue-400 transition-colors p-1 hover:bg-slate-800 rounded">
                <ChevronRight size={18} />
             </button>
        )}
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 relative overflow-hidden">
          
          {/* EXPANDED CONTENT WRAPPER */}
          <div className={`absolute inset-0 overflow-y-auto overflow-x-hidden transition-opacity duration-200 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <div className={`${PANEL_WIDTH} p-4 space-y-6`}>
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={() => {
                                setPolarPlotConfig({ visible: true });
                                setActiveRightPanel('polar');
                            }}
                            className={`${btnClass} ${activeRightPanel === 'polar' ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white' : ''}`}
                        >
                            <Activity size={14} /> BỨC XẠ
                        </button>
                        <button 
                            onClick={() => setActiveRightPanel('sparam')}
                            className={`${btnClass} ${activeRightPanel === 'sparam' ? 'bg-amber-600 text-white border-amber-600' : 'text-amber-500 border-amber-900/50 hover:bg-amber-900/20'}`}
                        >
                            <LineChart size={14} /> MẠNG (S11)
                        </button>
                        <button 
                            onClick={() => setActiveRightPanel('smith')}
                            className={`${btnClass} ${activeRightPanel === 'smith' ? 'bg-amber-600 text-white border-amber-600' : 'text-amber-500 border-amber-900/50 hover:bg-amber-900/20'}`}
                        >
                            <Activity size={14} /> SMITH CHART
                        </button>
                        <button 
                            onClick={() => setActiveRightPanel('mimo')}
                            className={`${btnClass} ${activeRightPanel === 'mimo' ? 'bg-purple-600 text-white border-purple-600' : 'text-purple-400 border-purple-900/50 hover:bg-purple-900/20'}`}
                        >
                            <Router size={14} /> MIMO
                        </button>
                    </div>

                    {/* --- LINK BUDGET & ENV & TIME DOMAIN --- */}
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={() => setActiveRightPanel('linkBudget')}
                            className={`${btnClass} ${activeRightPanel === 'linkBudget' ? 'bg-cyan-600 text-white border-cyan-600' : 'text-cyan-400 border-cyan-900/50 hover:bg-cyan-900/20'}`}
                        >
                            <Calculator size={14} /> QUỸ TRUYỀN
                        </button>
                        <button 
                            onClick={() => setActiveRightPanel('environment')}
                            className={`${btnClass} ${activeRightPanel === 'environment' ? 'bg-yellow-600 text-white border-yellow-600' : 'text-yellow-500 border-yellow-900/50 hover:bg-yellow-900/20'}`}
                        >
                            <Layers size={14} /> MÔI TRƯỜNG
                        </button>
                    </div>

                    {/* --- NEW ADVANCED TOOLS --- */}
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={() => {
                            setFDTDParams({ enabled: true }); 
                            setActiveRightPanel('timeDomain');
                            }}
                            className={`${btnClass} ${activeRightPanel === 'timeDomain' ? 'bg-emerald-600 text-white border-emerald-600' : 'text-emerald-500 border-emerald-900/50 hover:bg-emerald-900/20'}`}
                        >
                            <Activity size={14} /> THỜI GIAN
                        </button>
                        <button 
                            onClick={() => setActiveRightPanel('materials')}
                            className={`${btnClass} ${activeRightPanel === 'materials' ? 'bg-pink-600 text-white border-pink-600' : 'text-pink-400 border-pink-900/50 hover:bg-pink-900/20'}`}
                        >
                            <Beaker size={14} /> VẬT LIỆU
                        </button>
                    </div>

                    <section className={panelSectionClass}>
                    <div className="flex justify-between items-center mb-2">
                        <label className={labelClass + " flex items-center gap-2 mb-0"}>
                            <Settings size={12} /> THÔNG SỐ & HÌNH HỌC
                        </label>
                        <div className="flex gap-1">
                            <button 
                                onClick={() => setActiveRightPanel('formulaLab')}
                                className="text-[9px] bg-lime-900/20 text-lime-400 border border-lime-800 px-2 py-1 rounded flex items-center gap-1 hover:bg-lime-900/40"
                            >
                                <FlaskConical size={10}/> PTN
                            </button>
                            <button 
                                onClick={() => setActiveRightPanel('metrics')}
                                className="text-[9px] bg-cyan-900/20 text-cyan-400 border border-cyan-800 px-2 py-1 rounded flex items-center gap-1 hover:bg-cyan-900/40"
                            >
                                <Ruler size={10}/> CHỈ SỐ
                            </button>
                            <button 
                                onClick={() => setActiveRightPanel('geometryEditor')}
                                className="text-[9px] bg-red-900/20 text-red-400 border border-red-800 px-2 py-1 rounded flex items-center gap-1 hover:bg-red-900/40"
                            >
                                <PenTool size={10}/> DỰNG HÌNH
                            </button>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setActiveRightPanel('visionBuilder')}
                                className="w-full bg-indigo-900/20 text-indigo-400 text-[10px] py-2 rounded border border-indigo-800 flex items-center justify-center gap-2 hover:bg-indigo-900/40 font-bold"
                            >
                                <Scan size={12}/> VISION BUILDER
                            </button>
                            <button 
                                onClick={() => setActiveRightPanel('maxwellSolver')}
                                className="w-full bg-blue-600 text-white text-[10px] py-2 rounded border border-blue-700 flex items-center justify-center gap-2 hover:bg-blue-700 font-bold shadow-sm"
                            >
                                <Cpu size={12}/> MAXWELL SOLVER
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full bg-blue-900/10 text-blue-400 text-[10px] py-2 rounded border border-blue-900/50 flex items-center justify-center gap-2 hover:bg-blue-900/30"
                            >
                                <Upload size={12}/> PHÂN TÍCH NHANH (QUICK)
                            </button>
                            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileUpload} aria-label="Upload antenna image"/>
                        </div>
                        
                        {analyzing && <div className="text-[10px] text-emerald-400 animate-pulse font-bold">AI ĐANG XỬ LÝ: {aiReasoning}</div>}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                        <input 
                            className={inputClass} 
                            placeholder="Tần số (GHz)" 
                            value={techFreq}
                            onChange={(e) => setTechParams({ techFreq: e.target.value })}
                        />
                        </div>
                        <div>
                        <input 
                            className={inputClass} 
                            placeholder="Chiều dài (λ)" 
                            value={techLength}
                            onChange={(e) => setTechParams({ techLength: e.target.value })}
                        />
                        </div>
                        <div>
                        <input 
                            className={inputClass} 
                            placeholder="Số phần tử" 
                            value={techElements}
                            onChange={(e) => setTechParams({ techElements: e.target.value })}
                        />
                        </div>
                        <div>
                        <input 
                            className={inputClass} 
                            placeholder="Khoảng cách" 
                            value={techSpacing}
                            onChange={(e) => setTechParams({ techSpacing: e.target.value })}
                        />
                        </div>
                    </div>
                    </section>

                    <section>
                    <label className={labelClass}>Cấu hình Anten (Presets)</label>
                    <select 
                        value={antennaType}
                        onChange={(e) => setAntennaType(e.target.value as AntennaType)}
                        className={inputClass}
                    >
                        {Object.values(ANTENNA_PRESETS).map((preset) => (
                        <option key={preset.name} value={preset.name}>
                            {preset.name}
                        </option>
                        ))}
                    </select>
                    </section>

                    <section className="bg-pink-900/10 border border-pink-900/30 p-3 rounded">
                        <div className="flex justify-between items-center">
                            <label className={`${labelClass} text-pink-500 mb-0 flex items-center gap-2`}>
                            <Magnet size={12} /> CHẾ ĐỘ TRƯỜNG GẦN
                            </label>
                            <button 
                                onClick={() => {
                                    setAdvancedParams({ nearFieldEnabled: true });
                                    setActiveRightPanel('nearField');
                                }}
                                className="text-[9px] bg-[#101c2e] text-pink-400 border border-pink-800 px-2 py-1 rounded hover:bg-pink-900/20"
                            >
                                CẤU HÌNH
                            </button>
                        </div>
                        
                        <div className="mt-2 flex items-center gap-2">
                            <input 
                            type="checkbox" 
                            checked={nearFieldEnabled}
                            onChange={(e) => setAdvancedParams({ nearFieldEnabled: e.target.checked })}
                            className="accent-pink-500"
                            />
                            <span className="text-[10px] text-pink-300 font-mono">BẬT TRỰC QUAN HÓA</span>
                        </div>
                    </section>

                    <section className={panelSectionClass}>
                        <div className="flex justify-between items-center mb-2">
                            <label className={`${labelClass} text-purple-400 mb-0 flex items-center gap-2`}>
                            <Timer size={12} /> MIỀN THỜI GIAN (FDTD)
                            </label>
                            <input 
                            type="checkbox" 
                            checked={fdtd.enabled}
                            onChange={(e) => setFDTDParams({ enabled: e.target.checked })}
                            className="accent-purple-500"
                            />
                        </div>
                        
                        {fdtd.enabled && (
                            <div className="animate-in fade-in space-y-3">
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setFDTDParams({ running: !fdtd.running })}
                                        className={`flex-1 py-1 rounded text-[10px] font-bold flex items-center justify-center gap-2 border ${fdtd.running ? 'bg-purple-900/30 border-purple-500 text-purple-300' : 'bg-[#0b1220] border-slate-700 text-slate-500'}`}
                                    >
                                        {fdtd.running ? <Pause size={12}/> : <Play size={12}/>}
                                        {fdtd.running ? 'TẠM DỪNG' : 'CHẠY MÔ PHỎNG'}
                                    </button>
                                    <button 
                                        onClick={() => setFDTDParams({ simulationTime: 0, running: false })} 
                                        className="w-8 flex items-center justify-center rounded border border-slate-700 hover:text-purple-400 bg-[#0b1220]"
                                    >
                                        <RotateCcw size={12}/>
                                    </button>
                                </div>

                                <div className="flex bg-slate-800 rounded p-1 border border-slate-700">
                                    {['XY', 'XZ', 'YZ'].map(plane => (
                                        <button 
                                        key={plane}
                                        onClick={() => setFDTDParams({ slicePlane: plane as 'XY' | 'XZ' | 'YZ' })}
                                        className={`flex-1 text-[10px] py-1 rounded ${fdtd.slicePlane === plane ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                        >
                                        {plane}
                                        </button>
                                    ))}
                                </div>

                                <div>
                                    <div className="flex justify-between text-[10px] text-purple-400">
                                        <span>TỐC ĐỘ (TIME STEP)</span>
                                        <span>{fdtd.timeStepSpeed}x</span>
                                    </div>
                                    <input 
                                        type="range" min="0.1" max="5.0" step="0.1"
                                        value={fdtd.timeStepSpeed}
                                        onChange={(e) => setFDTDParams({ timeStepSpeed: parseFloat(e.target.value) })}
                                        className="w-full h-1 accent-purple-500 bg-slate-700 rounded-lg appearance-none"
                                    />
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="bg-amber-900/10 border border-amber-900/30 p-3 rounded">
                        <div className="flex justify-between items-center mb-2">
                            <label className={`${labelClass} text-amber-500 mb-0 flex items-center gap-2`}>
                            <Waves size={12} /> QUÉT TẦN SỐ
                            </label>
                            <input 
                            type="checkbox" 
                            checked={freqSweep.enabled}
                            onChange={(e) => setFreqSweepParams({ enabled: e.target.checked })}
                            className="accent-amber-500"
                            />
                        </div>
                        
                        {freqSweep.enabled && (
                            <div className="animate-in fade-in space-y-3">
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <span className="text-[9px] text-amber-700/70 block">BẮT ĐẦU (GHz)</span>
                                        <input 
                                            type="number" step="0.1"
                                            value={freqSweep.startHz}
                                            onChange={(e) => setFreqSweepParams({ startHz: parseFloat(e.target.value) })}
                                            className="bg-[#0b1220] text-amber-500 text-[10px] w-full p-1 rounded border border-amber-900/50"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[9px] text-amber-700/70 block">KẾT THÚC (GHz)</span>
                                        <input 
                                            type="number" step="0.1"
                                            value={freqSweep.endHz}
                                            onChange={(e) => setFreqSweepParams({ endHz: parseFloat(e.target.value) })}
                                            className="bg-[#0b1220] text-amber-500 text-[10px] w-full p-1 rounded border border-amber-900/50"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[9px] text-amber-700/70 block">BƯỚC (GHz)</span>
                                        <input 
                                            type="number" step="0.05"
                                            value={freqSweep.stepHz}
                                            onChange={(e) => setFreqSweepParams({ stepHz: parseFloat(e.target.value) })}
                                            className="bg-[#0b1220] text-amber-500 text-[10px] w-full p-1 rounded border border-amber-900/50"
                                        />
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => {
                                        if (!freqSweep.running) {
                                            setAdvancedParams({ frequencyGHz: freqSweep.startHz });
                                        }
                                        setFreqSweepParams({ running: !freqSweep.running });
                                    }}
                                    className={`w-full py-1 rounded text-[10px] font-bold flex items-center justify-center gap-2 border ${freqSweep.running ? 'bg-amber-900/30 border-amber-600 text-amber-400' : 'bg-[#0b1220] border-slate-700 text-slate-500'}`}
                                >
                                    {freqSweep.running ? <Pause size={12}/> : <Play size={12}/>}
                                    {freqSweep.running ? 'DỪNG QUÉT' : 'BẮT ĐẦU QUÉT'}
                                </button>
                                
                                <div className="text-[9px] text-slate-500 font-mono">
                                    HIỆN TẠI: <span className="text-amber-500 font-bold">{frequencyGHz.toFixed(2)} GHz</span>
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="bg-slate-800 border border-slate-700 rounded p-3">
                    <div className="flex justify-between items-center mb-2">
                        <span className={labelClass + " mb-0"}>ĐIỀU KHIỂN CỬ CHỈ (VR)</span>
                        <div className="flex gap-2">
                            <button onClick={() => setActiveRightPanel('versionHistory')} className="text-slate-500 hover:text-blue-400" aria-label="View version history" title="Lịch sử">
                                <History size={14} />
                            </button>
                            <button onClick={toggleWebcam} className="text-slate-500 hover:text-blue-400">
                            {showWebcam ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                        <div className={gesture === 'FIST' ? 'text-emerald-400 font-bold border-l-2 border-emerald-500 pl-2' : 'pl-2 border-l-2 border-transparent'}>
                            NẮM TAY: XOAY
                        </div>
                        <div className={gesture === 'OPEN_PALM' ? 'text-emerald-400 font-bold border-l-2 border-emerald-500 pl-2' : 'pl-2 border-l-2 border-transparent'}>
                            MỞ TAY: SCALE
                        </div>
                        <div className="col-span-2 pl-2 border-l-2 border-transparent">
                            2 TAY: ZOOM
                        </div>
                    </div>
                    {/* VR Toggle */}
                    <button 
                        onClick={() => toggleVRMode(true)}
                        className="w-full mt-2 bg-[#0b1220] text-emerald-500 text-[10px] py-1 rounded border border-emerald-900/50 hover:bg-emerald-900/20"
                    >
                        VÀO CHẾ ĐỘ VR
                    </button>
                    </section>
              </div>
          </div>

          {/* COLLAPSED CONTENT */}
          <div className={`absolute inset-0 flex flex-col items-center pt-8 transition-opacity duration-200 ${!isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <Radar className="text-blue-500/50 mb-6" size={24} />
                <div className="text-[10px] font-bold tracking-widest uppercase text-slate-600 whitespace-nowrap cursor-default select-none" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                    ANTENNAVIZ AI
                </div>
          </div>
      </div>

      {/* FOOTER */}
      <div className={`flex-none border-t border-slate-800 bg-[#0b1220] transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0 p-0 border-t-0' : 'max-h-56 opacity-100 p-4 border-t'}`}>
         {/* Footer Content Wrapper to fix width */}
         <div className={PANEL_WIDTH}>
            {/* Save/Load Row */}
            <div className="grid grid-cols-2 gap-2 mb-2">
                <button onClick={handleSaveSimulation} className="bg-[#101c2e] hover:bg-slate-800 text-slate-400 text-[10px] py-2 rounded border border-slate-700 flex items-center justify-center gap-1 shadow-sm">
                <Save size={12}/> LƯU DỰ ÁN
                </button>
                <button onClick={() => loadInputRef.current?.click()} className="bg-[#101c2e] hover:bg-slate-800 text-slate-400 text-[10px] py-2 rounded border border-slate-700 flex items-center justify-center gap-1 shadow-sm">
                <FolderOpen size={12}/> MỞ DỰ ÁN
                </button>
                <input ref={loadInputRef} type="file" className="hidden" accept=".json" onChange={handleLoadSimulation} aria-label="Load simulation file"/>
            </div>
            
            {/* Export Row */}
            <div className="grid grid-cols-2 gap-2 mb-2">
                <button onClick={handleExportPNG} className={btnClass}>
                <Camera size={14} /> XUẤT ẢNH
                </button>
                <button onClick={handleExportVideo} className={`${btnClass} bg-blue-900/10 text-blue-400 border-blue-900/30`}>
                <Video size={14} /> QUAY VIDEO
                </button>
            </div>

            {/* Settings Button (Full Width) */}
            <button 
              onClick={onSettingsClick}
              className="w-full bg-cyan-900/20 hover:bg-cyan-800/30 text-cyan-400 border border-cyan-600/40 hover:border-cyan-500 text-[11px] py-2 rounded flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Settings size={14} /> CÀI ĐẶT HỆ THỐNG
            </button>
         </div>
      </div>
    </div>
  );
};