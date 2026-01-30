
import { AntennaType, AntennaPreset, MaterialType, DielectricDefinition } from './types';

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

export const DIELECTRIC_MATERIALS: Record<MaterialType, DielectricDefinition> = {
  [MaterialType.AIR]: { 
    name: MaterialType.AIR,
    epsilon_r: 1.0006, 
    lossTangent: 0.0, 
    color: '#87ceeb',
    roughness: 0.0,
    metalness: 0.0,
    opacity: 0.1
  },
  [MaterialType.FR4]: { 
    name: MaterialType.FR4,
    epsilon_r: 4.4, 
    lossTangent: 0.02, 
    color: '#16a34a', // PCB Green
    roughness: 0.3,
    metalness: 0.1,
    opacity: 0.9
  },
  [MaterialType.ROGERS]: { 
    name: MaterialType.ROGERS,
    epsilon_r: 3.55, 
    lossTangent: 0.0027, 
    color: '#f8fafc', // Ceramic white
    roughness: 0.1,
    metalness: 0.05,
    opacity: 1.0
  },
  [MaterialType.GLASS]: { 
    name: MaterialType.GLASS,
    epsilon_r: 6.5, 
    lossTangent: 0.005, 
    color: '#a5f3fc',
    roughness: 0.0,
    metalness: 0.1,
    opacity: 0.3
  },
  [MaterialType.CONCRETE]: { 
    name: MaterialType.CONCRETE,
    epsilon_r: 5.0, 
    lossTangent: 0.03, 
    color: '#64748b',
    roughness: 0.9,
    metalness: 0.0,
    opacity: 1.0
  },
  [MaterialType.METAL]: { 
    name: MaterialType.METAL,
    epsilon_r: 1.0, // Effectively infinite conductivity, treated separately in physics engine
    lossTangent: 0.0, 
    color: '#94a3b8',
    roughness: 0.2,
    metalness: 1.0,
    opacity: 1.0
  }
};

export const SHADER_VERTEX = `
varying float vIntensity;

void main() {
  // Map Y position to intensity for gradient color mapping
  // Normalized 0.0 to 1.0 based on height approximation
  vIntensity = clamp(position.y * 0.5 + 0.5, 0.0, 1.0);

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  // Fixed size as requested, or can be dynamic
  gl_PointSize = 2.0; 
}
`;

export const SHADER_FRAGMENT = `
precision mediump float;

varying float vIntensity;

void main() {
    // Soft gradient calculation
    float glow = smoothstep(0.0, 1.0, vIntensity);

    vec3 lowColor = vec3(0.0, 0.8, 0.2);   // xanh radar
    vec3 midColor = vec3(1.0, 1.0, 0.0);   // vàng
    vec3 highColor = vec3(1.0, 0.1, 0.1);  // đỏ

    vec3 color = mix(lowColor, midColor, glow);
    color = mix(color, highColor, pow(glow, 2.0));

    // Reduced alpha to prevent whiteout
    float alpha = glow * 0.9;

    gl_FragColor = vec4(color, alpha);
}
`;
