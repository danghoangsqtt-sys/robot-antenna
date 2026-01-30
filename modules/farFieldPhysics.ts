import { AntennaType } from '../types';

export const getPatternFunction = (type: AntennaType, customFormula: string) => {
    let formulaBody = "1";

    switch(type) {
        case AntennaType.DIPOLE:
            formulaBody = "Math.abs(Math.sin(theta))";
            break;
        case AntennaType.YAGI:
            formulaBody = "Math.abs(Math.sin(theta) * Math.cos(3 * theta))";
            break;
        case AntennaType.HORN:
            formulaBody = "Math.exp(-2 * theta * theta)";
            break;
        case AntennaType.PARABOLIC:
            formulaBody = "Math.pow(Math.cos(theta), 8) * (theta < 1.5 ? 1 : 0)";
            break;
        case AntennaType.MICROSTRIP:
            formulaBody = "Math.cos(theta)";
            break;
        case AntennaType.CUSTOM:
            formulaBody = customFormula || "1";
            break;
    }

    try {
        return new Function('theta', 'phi', `return ${formulaBody};`);
    } catch (e) {
        console.error("Invalid formula:", e);
        return () => 0.1;
    }
};