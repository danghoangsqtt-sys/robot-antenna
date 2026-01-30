
import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { calculateLinkBudget, calculateMaxRangeKm } from '../modules/linkBudget';
import { Calculator, Signal, Wifi, X } from 'lucide-react';

export const LinkBudgetPanel: React.FC = () => {
    const { 
        transmitPowerdBm, receiverSensitivitydBm, frequencyGHz, 
        gain, arrayEnabled, arrayElements, mimo, setAdvancedParams, setActiveRightPanel
    } = useStore();
    
    const [distanceKm, setDistanceKm] = useState(1.0);
    const [lossesdB, setLossesdB] = useState(2.0); // Cable + connector losses default
    const [rxGaindBi, setRxGaindBi] = useState(2.0); // Default dipole Rx

    const totalTxGain = useMemo(() => {
        let g = gain;
        if (arrayEnabled) g += 10 * Math.log10(arrayElements);
        if (mimo.enabled) g += 10 * Math.log10(mimo.txCount); // MIMO array gain assumption
        return g;
    }, [gain, arrayEnabled, arrayElements, mimo]);

    const stats = useMemo(() => {
        return calculateLinkBudget({
            freqGHz: frequencyGHz,
            txPowerdBm: transmitPowerdBm,
            txGaindBi: totalTxGain,
            rxGaindBi: rxGaindBi,
            distanceKm: distanceKm,
            rxSensdBm: receiverSensitivitydBm,
            lossesdB: lossesdB
        });
    }, [frequencyGHz, transmitPowerdBm, totalTxGain, rxGaindBi, distanceKm, receiverSensitivitydBm, lossesdB]);

    const maxRange = useMemo(() => {
        return calculateMaxRangeKm(frequencyGHz, transmitPowerdBm, totalTxGain + rxGaindBi, receiverSensitivitydBm, lossesdB);
    }, [frequencyGHz, transmitPowerdBm, totalTxGain, rxGaindBi, receiverSensitivitydBm, lossesdB]);

    return (
        <div className="w-80 h-full flex flex-col tech-panel border-l border-cyan-200 bg-white/95 z-20 shadow-xl">
            <div className="p-3 border-b border-cyan-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Calculator size={14} className="text-cyan-600"/> QUỸ ĐƯỜNG TRUYỀN
                </h2>
                <button onClick={() => setActiveRightPanel('polar')} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto">
                {/* Inputs */}
                <div className="space-y-2">
                    <label className="text-[10px] text-cyan-600 font-bold uppercase tracking-wider">THÔNG SỐ LIÊN KẾT</label>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <span className="text-[9px] text-slate-500 font-bold block">KHOẢNG CÁCH (km)</span>
                            <input 
                                type="number" step="0.1" value={distanceKm} 
                                onChange={(e) => setDistanceKm(parseFloat(e.target.value))}
                                className="w-full bg-slate-50 border border-slate-300 text-slate-700 text-xs p-1 rounded font-mono"
                            />
                        </div>
                        <div>
                            <span className="text-[9px] text-slate-500 font-bold block">GAIN THU (dBi)</span>
                            <input 
                                type="number" step="0.5" value={rxGaindBi} 
                                onChange={(e) => setRxGaindBi(parseFloat(e.target.value))}
                                className="w-full bg-slate-50 border border-slate-300 text-slate-700 text-xs p-1 rounded font-mono"
                            />
                        </div>
                        <div>
                            <span className="text-[9px] text-slate-500 font-bold block">SUY HAO (dB)</span>
                            <input 
                                type="number" step="0.5" value={lossesdB} 
                                onChange={(e) => setLossesdB(parseFloat(e.target.value))}
                                className="w-full bg-slate-50 border border-slate-300 text-slate-700 text-xs p-1 rounded font-mono"
                            />
                        </div>
                         <div>
                            <span className="text-[9px] text-slate-500 font-bold block">TẦN SỐ (GHz)</span>
                            <div className="text-xs text-cyan-700 font-bold py-1 bg-cyan-50 px-2 rounded border border-cyan-100">{frequencyGHz.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-200"></div>

                {/* Results */}
                <div className="space-y-3">
                    <label className="text-[10px] text-cyan-600 font-bold flex items-center gap-2 uppercase tracking-wider">
                        <Signal size={12}/> KẾT QUẢ TÍNH TOÁN
                    </label>

                    <div className="bg-slate-50 p-2 rounded border border-slate-200 space-y-1 shadow-sm">
                        <div className="flex justify-between text-xs border-b border-slate-100 pb-1">
                            <span className="text-slate-500">Suy hao không gian (FSPL)</span>
                            <span className="text-slate-700 font-mono font-bold">{stats.fspl.toFixed(2)} dB</span>
                        </div>
                        <div className="flex justify-between text-xs border-b border-slate-100 py-1">
                            <span className="text-slate-500">Công suất thu (Pr)</span>
                            <span className={`${stats.rxPower > receiverSensitivitydBm ? 'text-emerald-600' : 'text-red-500'} font-mono font-bold`}>
                                {stats.rxPower.toFixed(2)} dBm
                            </span>
                        </div>
                        <div className="flex justify-between text-xs pt-1">
                            <span className="text-slate-500">SNR (Nhiệt)</span>
                            <span className="text-amber-600 font-mono font-bold">{stats.snr.toFixed(1)} dB</span>
                        </div>
                    </div>

                    <div className={`p-2 rounded border shadow-sm ${stats.isLinked ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-slate-500">DỰ TRỮ FADING (MARGIN)</span>
                            <Wifi size={14} className={stats.isLinked ? 'text-emerald-500' : 'text-red-500'}/>
                        </div>
                        <div className={`text-2xl font-mono font-bold text-center ${stats.isLinked ? 'text-emerald-600' : 'text-red-600'}`}>
                            {stats.margin > 0 ? '+' : ''}{stats.margin.toFixed(1)} dB
                        </div>
                        <div className="text-[9px] text-center text-slate-500 mt-1 font-bold">
                            {stats.isLinked ? 'KẾT NỐI ỔN ĐỊNH' : 'MẤT KẾT NỐI'}
                        </div>
                    </div>

                    <div className="bg-slate-800 p-2 rounded text-center shadow-md">
                        <span className="text-[9px] text-cyan-300 block font-bold">KHOẢNG CÁCH TỐI ĐA (LÝ THUYẾT)</span>
                        <span className="text-lg font-mono text-white font-bold">{maxRange.toFixed(3)} km</span>
                    </div>
                </div>
            </div>
        </div>
    );
};