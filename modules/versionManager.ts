
import { VersionSnapshot, SimulationState } from '../types';

/**
 * Creates a human-readable diff summary between two snapshots.
 */
export const diffSnapshots = (current: Partial<SimulationState>, previous: Partial<SimulationState>): string[] => {
    const changes: string[] = [];

    if (current.antennaType !== previous.antennaType) {
        changes.push(`Type: ${previous.antennaType} -> ${current.antennaType}`);
    }
    if (Math.abs((current.gain || 0) - (previous.gain || 0)) > 0.1) {
        changes.push(`Gain: ${previous.gain} -> ${current.gain} dBi`);
    }
    if (current.frequencyGHz !== previous.frequencyGHz) {
        changes.push(`Freq: ${previous.frequencyGHz} -> ${current.frequencyGHz} GHz`);
    }
    
    // Geometry check
    const curGeoLen = current.physicalGeometry?.length || 0;
    const prevGeoLen = previous.physicalGeometry?.length || 0;
    if (curGeoLen !== prevGeoLen) {
        changes.push(`Geometry: ${prevGeoLen} elements -> ${curGeoLen} elements`);
    }

    return changes;
};

/**
 * Formats a timestamp into a readable locale string.
 */
export const formatTime = (ts: number): string => {
    return new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};
