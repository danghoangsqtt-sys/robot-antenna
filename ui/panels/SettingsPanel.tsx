import React, { useState } from 'react';
import { useStore } from '../../store';
import { generateText } from '../../services/geminiService';
import { Settings, Copy, Check, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

const SYSTEM_GUIDE = [
  {
    id: 'antenna-dipole',
    category: 'antenna',
    title: 'Anten Dipole (Lưỡng cực)',
    description: 'Anten cơ bản nhất, chiều dài λ/2. Công thức bức xạ: R(θ) = |sin(θ)|. Phù hợp cho giao tiếp cơ bản và UHF.'
  },
  {
    id: 'antenna-yagi',
    category: 'antenna',
    title: 'Anten Yagi-Uda',
    description: 'Có phần tử chủ động, phần tử phản xạ, và các phần tử dẫn hướng. Độ lợi cao, định hướng mạnh.'
  },
  {
    id: 'antenna-horn',
    category: 'antenna',
    title: 'Anten Horn (Loa)',
    description: 'Dùng cho tần số microwave. Độ lợi rất cao. Búp sóng cực hẹp, phù hợp cho liên lạc vệ tinh.'
  },
  {
    id: 'antenna-parabolic',
    category: 'antenna',
    title: 'Anten Parabol',
    description: 'Mặt phản xạ cong tập trung sóng về tiêu điểm. Độ lợi rất lớn, búp sóng hẹp (pencil beam).'
  },
  {
    id: 'antenna-patch',
    category: 'antenna',
    title: 'Anten Vi dải (Patch)',
    description: 'Chế tạo trên PCB. Nhỏ gọn, nhẹ, dễ tích hợp nhưng băng thông hẹp.'
  },
  {
    id: 'physics-farfield',
    category: 'physics',
    title: 'Trường Tầu Xa (Far Field)',
    description: 'Công thức Fraunhofer. Khoảng cách >> λ. Dùng cho bức xạ phỏng đoán từ kích thước/hình dạng anten.'
  },
  {
    id: 'physics-nearfield',
    category: 'physics',
    title: 'Trường Tầu Gần (Near Field)',
    description: 'Công thức Fresnel. Khoảng cách ~ λ. Phức tạp hơn, cần tính toán thêm các thành phần phụ.'
  },
  {
    id: 'physics-fdtd',
    category: 'physics',
    title: 'FDTD (Finite Difference Time Domain)',
    description: 'Giải phương trình Maxwell trên lưới. Hiển thị lan truyền sóng theo thời gian thực. Yêu cầu tính toán lớn.'
  },
  {
    id: 'physics-mom',
    category: 'physics',
    title: 'MoM (Method of Moments)',
    description: 'Giải phương trình tích phân bề mặt. Hiệu quả cho anten kim loại và cấu trúc hình học phức tạp.'
  },
  {
    id: 'ai-eve',
    category: 'ai',
    title: 'Trợ lý AI EVE',
    description: 'Robot thông minh hỗ trợ giải thích anten, công thức, và hướng dẫn sử dụng. Cần API key Gemini để hoạt động.'
  },
  {
    id: 'ui-recording',
    category: 'ui',
    title: 'Ghi Hình & Video',
    description: 'Bản ghi lại toàn bộ mô phỏng thành video MP4. Hữu ích cho báo cáo, trình bày.'
  },
  {
    id: 'ui-export',
    category: 'export',
    title: 'Xuất Dữ Liệu',
    description: 'Xuất cấu hình anten, dữ liệu bức xạ, S-parameters dưới dạng JSON, CSV, hoặc hình ảnh PNG/SVG.'
  }
];

export const SettingsPanel: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { settings, setGeminiApiKey, setEveScale, setGeminiProxy } = useStore();
  const [apiKeyInput, setApiKeyInput] = useState(settings.geminiApiKey);
  const [proxyInput, setProxyInput] = useState(settings.geminiProxy || '');
  const [proxyTestResult, setProxyTestResult] = useState<string | null>(null);
  const [eveScaleInput, setEveScaleInput] = useState(settings.eveScale);
  const [copied, setCopied] = useState(false);
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

  const handleSaveApiKey = () => {
    setGeminiApiKey(apiKeyInput);
  };

  const handleSaveProxy = () => {
    setGeminiProxy(proxyInput);
  };

  const handleTestProxy = async () => {
    setProxyTestResult('Đang kiểm tra...');
    try {
      const prompt = 'Test connection: trả lời ngắn gọn "ping"';
      // If proxy is set in settings, generateText will prefer it
      const resp = await generateText(prompt, { temperature: 0.0, maxTokens: 20 });
      setProxyTestResult(String(resp).slice(0, 500));
    } catch (e: any) {
      setProxyTestResult(`Lỗi: ${String(e.message || e)}`);
    }
    setTimeout(() => setProxyTestResult(null), 8000);
  };

  const handleSaveEveScale = () => {
    setEveScale(eveScaleInput);
  };

  const handleCopyGuide = () => {
    const text = SYSTEM_GUIDE.map(g => `${g.title}\n${g.description}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* Modal Container */}
      <div className="w-[90vw] h-[85vh] max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Settings size={24} className="text-cyan-500" />
            <h2 className="text-xl font-bold text-slate-200">SETTINGS</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-cyan-400 transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-700">
          {/* Section 1: API Key */}
          <div className="bg-slate-850 border border-slate-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-cyan-300 mb-3 flex items-center gap-2">
              🔑 Gemini API Key
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Cấu hình API Key của Google Gemini để bật tính năng AI (EVE trợ lý thông minh). Lưu trữ ở localStorage máy của bạn.
            </p>
            <div className="space-y-3">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-...your-gemini-api-key..."
                className="w-full bg-slate-900 border border-slate-600 text-slate-100 px-4 py-3 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none text-sm"
                aria-label="Gemini API Key"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveApiKey}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Lưu API Key
                </button>
                <button
                  onClick={() => setApiKeyInput('')}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Xoá
                </button>
              </div>
              {apiKeyInput && (
                <p className="text-xs text-emerald-500 flex items-center gap-1">
                  ✓ API Key đã được cấu hình
                </p>
              )}
                {/* Proxy input and test */}
                <div className="mt-4">
                  <label className="text-sm text-slate-300">Proxy (optional)</label>
                  <input
                    type="text"
                    value={proxyInput}
                    onChange={(e) => setProxyInput(e.target.value)}
                    placeholder="https://your-proxy.example.com"
                    className="w-full mt-2 bg-slate-900 border border-slate-600 text-slate-100 px-3 py-2 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none text-sm"
                    aria-label="Gemini Proxy URL"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => { handleSaveProxy(); }}
                      className="flex-1 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                      Lưu Proxy
                    </button>
                    <button
                      onClick={handleTestProxy}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                      Test Kết Nối
                    </button>
                  </div>
                  {proxyTestResult && (
                    <div className="mt-2 text-sm text-slate-200 bg-slate-800 p-2 rounded">{proxyTestResult}</div>
                  )}
                </div>
            </div>
          </div>

          {/* Section 2: EVE Scale */}
          <div className="bg-slate-850 border border-slate-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-cyan-300 mb-3 flex items-center gap-2">
              🤖 Kích Thước Robot EVE
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Điều chỉnh kích thước hiển thị của robot EVE từ 50% (nhỏ) đến 200% (to).
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={eveScaleInput}
                  onChange={(e) => setEveScaleInput(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <span className="text-cyan-300 font-bold text-lg w-20 text-right">
                  {(eveScaleInput * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEveScale}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Áp Dụng Kích Thước
                </button>
                <button
                  onClick={() => setEveScaleInput(1.0)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Đặt Lại (100%)
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: System Guide */}
          <div className="bg-slate-850 border border-slate-700 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
                <BookOpen size={20} /> Hướng Dẫn Hệ Thống
              </h3>
              <button
                onClick={handleCopyGuide}
                className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check size={14} /> Đã Copy
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy Tất Cả
                  </>
                )}
              </button>
            </div>

            <p className="text-sm text-slate-400 mb-4">
              Tài liệu chi tiết về tất cả chức năng, công thức, và hướng dẫn sử dụng.
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {SYSTEM_GUIDE.map((item) => (
                <div
                  key={item.id}
                  className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900"
                >
                  <button
                    onClick={() =>
                      setExpandedGuide(expandedGuide === item.id ? null : item.id)
                    }
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800 transition-colors"
                  >
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-cyan-900/40 text-cyan-300 font-mono">
                          {item.category}
                        </span>
                        <span className="text-sm font-semibold text-slate-200">
                          {item.title}
                        </span>
                      </div>
                    </div>
                    {expandedGuide === item.id ? (
                      <ChevronUp size={18} className="text-slate-400" />
                    ) : (
                      <ChevronDown size={18} className="text-slate-400" />
                    )}
                  </button>
                  {expandedGuide === item.id && (
                    <div className="px-4 py-3 bg-slate-950 border-t border-slate-700 text-sm text-slate-300">
                      {item.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Info */}
          <div className="bg-slate-850 border border-cyan-500/20 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-cyan-300 mb-3">ℹ️ Thông Tin</h3>
            <div className="space-y-2 text-sm text-slate-400">
              <p>
                <strong>AntennaViz AI Advanced Edition</strong> v2.0.0
              </p>
              <p>
                Nền tảng mô phỏng anten, phân tích bức xạ, và trợ lý AI tích hợp cho kỹ sư viễn thông.
              </p>
              <p>
                © DHsystem 2026. Sản phẩm đang nghiên cứu phát triển (Close Beta).
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
