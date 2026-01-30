
import { GoogleGenAI } from "@google/genai";
import { AntennaType, AIAnalysisResponse, AntennaOptimizationResponse, GeometryPrimitive, VisionHints } from "../types";

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || ''; 

// Force Demo Mode active regardless of API Key presence
const isMock = !GEMINI_API_KEY || import.meta.env.VITE_USE_MOCK === 'true';

export const analyzeAntennaImage = async (
  base64Image: string, 
  techParams?: { freq: string, length: string, elements: string, spacing: string },
  visionHints?: VisionHints
): Promise<AIAnalysisResponse> => {
  
  // DEMO MODE: Always return mock data
  return new Promise((resolve) => {
    console.log("AI Analysis running in DEMO MODE.");
    setTimeout(() => {
      resolve({
        antennaType: "Yagi-Uda (AI Demo)",
        geometry3D: [
          {
            shape: "cylinder",
            count: 5,
            dimensions: {
              length_lambda: 0.45,
              radius_lambda: 0.005,
              spacing_lambda: 0.2
            },
            orientation: "parallel",
            material: "Metal (Perfect)" as any
          },
          {
            shape: "box",
            count: 1,
            dimensions: {
              width_lambda: 0.1,
              height_lambda: 0.05,
              length_lambda: 1.2
            },
            orientation: "horizontal",
            material: "Metal (Perfect)" as any
          }
        ],
        estimatedParameters: {
          frequency_GHz: 2.4,
          elements: 5,
          overall_length_lambda: 1.2,
          gain_dBi: 12
        },
        radiationPattern: {
          formula: "Math.abs(Math.sin(theta) * Math.cos(3*theta))",
          gain_dBi: 12,
          mainLobeDirection: "forward"
        },
        confidence: 0.98
      });
    }, 1500);
  });
};

export const optimizeAntennaDesign = async (
  antennaType: string,
  currentGeometry: GeometryPrimitive[],
  currentGain: number,
  currentFormula: string
): Promise<AntennaOptimizationResponse> => {

  // DEMO MODE: Always return mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        optimizedGeometry: currentGeometry, // Keep geometry same for demo
        optimizedPattern: {
          formula: currentFormula, 
          gain_dBi: currentGain + 2.5 // Simulated gain improvement
        },
        designNotes: "DEMO MODE: Đây là kết quả tối ưu hóa giả lập. Trong phiên bản thương mại, AI sẽ tính toán lại cấu trúc hình học dựa trên phương trình Maxwell và Genetic Algorithms."
      });
    }, 2000);
  });
};
