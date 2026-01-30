
import { MaterialType, DielectricDefinition } from '../types';

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
    epsilon_r: 1.0, 
    lossTangent: 0.0, 
    color: '#94a3b8',
    roughness: 0.2,
    metalness: 1.0,
    opacity: 1.0
  }
};
