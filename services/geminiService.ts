
import { GoogleGenAI } from "@google/genai";
import { AntennaType, AIAnalysisResponse, AntennaOptimizationResponse, GeometryPrimitive, VisionHints } from "../types";
import { useStore } from "../store";

// Get API key from env or store (user-configured)
const getGeminiApiKey = (): string => {
  const envKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
  if (envKey) return envKey; // [FIX] use import.meta.env in Vite instead of process.env

  // Fallback to user-configured key from store
  try {
    const storeKey = useStore.getState().settings.geminiApiKey || '';
    if (storeKey) return storeKey;
    console.error('[FIX] Gemini API key missing. Set VITE_GEMINI_API_KEY or configure in Settings.'); // [FIX] defensive log, do not crash
    return '';
  } catch {
    console.error('[FIX] Gemini API key missing and store unavailable.'); // [FIX] defensive log
    return '';
  }
};

// Demo mode active if no API key OR explicitly enabled
const isDemoMode = (): boolean => {
  const key = getGeminiApiKey();
  return !key || import.meta.env.VITE_USE_MOCK === 'true';
};

export const analyzeAntennaImage = async (
  base64Image: string, 
  techParams?: { freq: string, length: string, elements: string, spacing: string },
  visionHints?: VisionHints
): Promise<AIAnalysisResponse> => {
  
  if (isDemoMode()) {
    // DEMO MODE: Return mock data
    console.log("AI Analysis running in DEMO MODE (no API key configured).");
    return new Promise((resolve) => {
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
  }
  
  // PROD MODE: Call real Gemini API (placeholder)
  throw new Error("Production API not implemented yet. Use demo mode.");
};

export const optimizeAntennaDesign = async (
  antennaType: string,
  currentGeometry: GeometryPrimitive[],
  currentGain: number,
  currentFormula: string
): Promise<AntennaOptimizationResponse> => {

  if (isDemoMode()) {
    // DEMO MODE: Return mock optimization result
    console.log("Antenna optimization running in DEMO MODE.");
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
  }

  // PROD MODE: Call real Gemini API (placeholder)
  throw new Error("Production API not implemented yet. Use demo mode.");
};

/**
 * Generate text response via Gemini (or proxy) when API key is configured.
 * Falls back to demo mode when no key or when mock mode enabled.
 */
export const generateText = async (prompt: string, options?: {temperature?: number, maxTokens?: number}): Promise<string> => {
  const key = getGeminiApiKey();
  const demo = isDemoMode();

  if (demo) {
    // Simple demo reply to keep UX responsive
    return Promise.resolve(`(DEMO) Tôi đã nhận được yêu cầu: "${prompt}". Trong chế độ demo, EVE trả lời một bản tóm tắt ngắn. Hãy cấu hình Gemini API key trong Settings để bật chế độ sản xuất.`);
  }

  try {
    // If a proxy URL is provided via env, prefer it to avoid CORS issues
    const proxy = (import.meta.env.VITE_GEMINI_PROXY as string) || (useStore.getState().settings.geminiProxy || ''); // [FIX]
    if (proxy) {
      const res = await fetch(`${proxy.replace(/\/$/, '')}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ prompt, options })
      });
      if (!res.ok) throw new Error('Proxy error');
      const json = await res.json();
      return json.text || JSON.stringify(json);
    }

    // Direct call to Google Gen AI REST API (may be blocked by CORS in browser)
    const endpoint = (import.meta.env.VITE_GEMINI_ENDPOINT as string) || 'https://generativelanguage.googleapis.com/v1beta2/models/gemini-1.5-flash:generate'; // [FIX] set explicit model name

    // [FIX] Defensive check: Browsers cannot call Google's GenAI API directly due to CORS.
    // If no proxy is configured and we're running in a browser context, return a clear error message
    // so the UI can show guidance instead of attempting a doomed fetch and throwing CORS errors.
    if (typeof window !== 'undefined' && !proxy && endpoint.includes('generativelanguage.googleapis.com')) {
      console.error('[FIX] Browser CORS: Direct requests to Google GenAI blocked. Configure VITE_GEMINI_PROXY.');
      return `(ERROR) Browser CORS: Direct browser requests to Google GenAI are blocked by CORS. Set VITE_GEMINI_PROXY to a server-side proxy or use the Electron main process to call the API.`;
    }
    const body = {
      prompt: { text: prompt },
      temperature: options?.temperature ?? 0.2,
      maxOutputTokens: options?.maxTokens ?? 512
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Gemini API error: ${res.status} ${txt}`);
    }

    const data = await res.json();
    // Try to find text in response structure
    const candidates = [data?.candidates?.[0]?.content?.[0]?.text, data?.output?.[0]?.content?.text, data?.text];
    const text = candidates.find(Boolean) || JSON.stringify(data);
    return String(text);
  } catch (err) {
    console.error('generateText error:', err);
    return `(ERROR) Không thể liên hệ Gemini: ${String(err)}. Kiểm tra API key và proxy.`;
  }
};
