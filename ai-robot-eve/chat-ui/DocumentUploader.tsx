import React, { useRef, useState } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle } from 'lucide-react';
import { DocumentFile } from '../../types';

interface DocumentUploaderProps {
  onDocumentAdd?: (doc: DocumentFile) => void;
  documents?: DocumentFile[];
  onRemove?: (docId: string) => void;
}

/**
 * DocumentUploader
 * Allows users to:
 * - Upload PDF/TXT/MD files
 * - Preview file metadata
 * - Remove documents
 * - Integration with RAG system
 */
export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onDocumentAdd,
  documents = [],
  onRemove,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (files: FileList) => {
    if (!files.length) return;

    setUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      try {
        // Validate file type
        const validTypes = ['application/pdf', 'text/plain', 'text/markdown'];
        if (!validTypes.includes(file.type) && !file.name.endsWith('.md')) {
          setError(`File type not supported: ${file.name}`);
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setError(`File too large: ${file.name} (max 10MB)`);
          continue;
        }

        // Read file content
        const content = await readFileAsText(file);

        // Create document object
        const doc: DocumentFile = {
          id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.name.endsWith('.pdf') ? 'pdf' : file.name.endsWith('.md') ? 'md' : 'txt',
          size: file.size,
          uploadedAt: Date.now(),
          content: content,
        };

        onDocumentAdd?.(doc);
      } catch (e) {
        setError(`Failed to read file: ${file.name}`);
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3 bg-slate-900/30 p-4 rounded-lg border border-emerald-500/20">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative p-6 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
          isDragging
            ? 'border-emerald-400 bg-emerald-950/30'
            : 'border-emerald-500/30 hover:border-emerald-400/50 bg-slate-950/50 hover:bg-slate-900/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md"
          onChange={(e) => handleFileSelect(e.target.files || new FileList())}
          className="hidden"
          disabled={uploading}
        />

        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <Upload
            size={28}
            className={`${isDragging ? 'text-emerald-400 animate-bounce' : 'text-emerald-500'}`}
          />
          <div>
            <p className="text-sm font-semibold text-emerald-300">
              {uploading ? 'Đang tải lên...' : 'Kéo file hoặc nhấp để tải'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              PDF, TXT, hoặc Markdown (max 10MB)
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-950/30 border border-red-500/30 rounded-lg text-red-300 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
            Tài liệu đã tải ({documents.length})
          </p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-2 bg-slate-800/50 rounded border border-slate-700/50 hover:border-emerald-500/30 transition-colors group"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <File size={16} className="text-emerald-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-300 truncate" title={doc.name}>
                      {doc.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {(doc.size / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                </div>
                <button
                  onClick={() => onRemove?.(doc.id)}
                  className="ml-2 p-1 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  title="Xoá"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <p className="text-[10px] text-slate-500 italic">
        💡 Tài liệu sẽ được phân tích để cải thiện chất lượng câu trả lời (RAG System)
      </p>
    </div>
  );
};

/**
 * Read file as text (handles PDF extraction)
 */
async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type === 'application/pdf') {
      // For PDF, we'll use a simple text extraction approach
      // In production, use pdf-parse or pdfjs
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          // Extract text from PDF (simplified - use pdf.js library in production)
          const extractedText = extractTextFromPDF(text);
          resolve(extractedText || 'Unable to extract PDF text');
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Text files
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    }
  });
}

/**
 * Simple PDF text extraction (basic)
 * In production, use: npm install pdfjs-dist
 */
function extractTextFromPDF(buffer: ArrayBuffer): string {
  // Convert buffer to string
  const view = new Uint8Array(buffer);
  let text = '';
  for (let i = 0; i < view.length; i++) {
    const char = String.fromCharCode(view[i]);
    // Filter out binary data, keep readable text
    if ((char >= ' ' && char <= '~') || char === '\n' || char === '\t') {
      text += char;
    }
  }
  // Extract text between parentheses (crude PDF text extraction)
  const matches = text.match(/\((.*?)\)/g);
  return matches ? matches.join(' ') : text;
}
