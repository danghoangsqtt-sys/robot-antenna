import React, { useMemo } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * MarkdownRenderer (Simplified)
 * Renders markdown with basic formatting and LaTeX support
 * Note: For production, install marked and katex from npm
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const htmlContent = useMemo(() => {
    if (!content) return '';

    let html = content;

    // Basic markdown conversions
    // Headers
    html = html.replace(/^### (.*?)$/gm, '<h3 class="font-bold text-emerald-400 mt-3 mb-2 text-lg">$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2 class="font-bold text-emerald-400 mt-4 mb-2 text-xl">$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1 class="font-bold text-emerald-400 mt-4 mb-3 text-2xl">$1</h1>');

    // Bold and Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-emerald-300">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-emerald-200">$1</em>');
    html = html.replace(/__(.*?)__/g, '<strong class="font-bold text-emerald-300">$1</strong>');
    html = html.replace(/_(.*?)_/g, '<em class="italic text-emerald-200">$1</em>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-800 text-emerald-300 px-2 py-1 rounded font-mono text-sm border border-emerald-500/20">$1</code>');

    // Code blocks
    html = html.replace(/```(.*?)\n([\s\S]*?)```/g, '<pre class="bg-slate-900 text-emerald-400 p-3 rounded overflow-x-auto border border-emerald-500/20 my-2"><code>$2</code></pre>');

    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-emerald-400 hover:text-emerald-300 underline">$1</a>');

    // Lists
    html = html.replace(/^\* (.*?)$/gm, '<li class="ml-4 text-slate-300">$1</li>');
    html = html.replace(/^\- (.*?)$/gm, '<li class="ml-4 text-slate-300">$1</li>');
    html = html.replace(/(<li.*?<\/li>)/s, '<ul class="my-2">$1</ul>');

    // LaTeX support (simple regex-based, non-functional rendering for now)
    // Display mode $$...$$ 
    html = html.replace(/\$\$(.*?)\$\$/gs, (match, formula) => {
      return `<div class="bg-slate-900 p-3 rounded border border-emerald-500/20 my-2 overflow-x-auto font-mono text-emerald-300 text-sm">[Formula: ${formula}]</div>`;
    });

    // Inline mode $...$
    html = html.replace(/\$([^\$]+)\$/g, (match, formula) => {
      if (match.includes('<')) return match; // Avoid HTML
      return `<span class="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300 font-mono text-sm border border-emerald-500/10">${formula}</span>`;
    });

    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    html = `<p>${html}</p>`;

    return html;
  }, [content]);

  return (
    <div
      className={`text-slate-300 leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
