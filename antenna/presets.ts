import { AntennaType, AntennaPreset } from '../types';

export const ANTENNA_PRESETS: Record<AntennaType, AntennaPreset> = {
  [AntennaType.DIPOLE]: {
    name: AntennaType.DIPOLE,
    formula: "Math.abs(Math.sin(theta))",
    description: "Anten lưỡng cực (Dipole) λ/2. Bức xạ đẳng hướng trên mặt phẳng H.",
    defaultGain: 2.15
  },
  [AntennaType.YAGI]: {
    name: AntennaType.YAGI,
    formula: "Math.abs(Math.sin(theta) * Math.cos(3 * theta))",
    description: "Anten Yagi-Uda định hướng cao. Có các thùy phụ (side lobes).",
    defaultGain: 10
  },
  [AntennaType.HORN]: {
    name: AntennaType.HORN,
    formula: "Math.exp(-2 * theta * theta)", // Gaussian-like approximation
    description: "Anten loa (Horn). Búp sóng hẹp, độ lợi cao.",
    defaultGain: 15
  },
  [AntennaType.PARABOLIC]: {
    name: AntennaType.PARABOLIC,
    formula: "Math.pow(Math.cos(theta), 8) * (theta < 1.5 ? 1 : 0)",
    description: "Anten chảo Parabol. Búp sóng cực hẹp (Pencil beam).",
    defaultGain: 25
  },
  [AntennaType.MICROSTRIP]: {
    name: AntennaType.MICROSTRIP,
    formula: "Math.cos(theta)",
    description: "Anten vi dải (Patch). Bức xạ bán cầu rộng.",
    defaultGain: 5
  },
  [AntennaType.CUSTOM]: {
    name: AntennaType.CUSTOM,
    formula: "1", // Isotropic default
    description: "Nhập công thức JavaScript tùy chỉnh (biến: theta, phi).",
    defaultGain: 1
  }
};
