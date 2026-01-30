
import { SimulationState } from '../types';

export const saveSimulationToFile = (state: SimulationState) => {
    const data = {
        antennaType: state.antennaType,
        gain: state.gain,
        customFormula: state.customFormula,
        physicalGeometry: state.physicalGeometry,
        advancedParams: {
            arrayEnabled: state.arrayEnabled,
            arrayElements: state.arrayElements,
            elementSpacing: state.elementSpacing,
            steeringAngle: state.steeringAngle,
            frequencyGHz: state.frequencyGHz,
            multipathEnabled: state.multipathEnabled,
            obstacles: state.obstacles,
            polarPlotConfig: state.polarPlotConfig,
            mimo: state.mimo
        },
        timestamp: new Date().toISOString(),
        version: "2.0"
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `antenna_sim_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

export const loadSimulationFromFile = (file: File): Promise<Partial<SimulationState>> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                if (!data.version) throw new Error("Invalid file format");
                
                // Map persistence object back to partial state
                const loadedState: Partial<SimulationState> = {
                    antennaType: data.antennaType,
                    gain: data.gain,
                    customFormula: data.customFormula,
                    physicalGeometry: data.physicalGeometry,
                    ...data.advancedParams
                };
                resolve(loadedState);
            } catch (err) {
                reject(err);
            }
        };
        reader.readAsText(file);
    });
};
