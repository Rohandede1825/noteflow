import React, { useState } from 'react';
import { useNotebookStore } from '../../store/useNotebookStore';
import { useUIStore } from '../../store/useUIStore';
import {
  X,
  Share2,
  Copy,
  Check,
  Globe,
  Lock,
  Download
} from 'lucide-react';

export function ShareModal() {
  const { activeModal, closeModal, addToast, openModal } = useUIStore();
  const { currentNotebook } = useNotebookStore();
  const [copied, setCopied] = useState(false);

  if (activeModal !== 'share') return null;

  const shareUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    addToast('Notebook URL copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-[#1F2024] dark:bg-[#1F2024] light:bg-white border border-[var(--color-border)] rounded-3xl shadow-floating overflow-hidden text-[var(--color-text-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#2F6BFF]" />
            <h2 className="text-sm font-bold">Share Notebook</h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3 text-xs">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px]">
              Notebook Link
            </label>
            <div className="flex items-center gap-1.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-1">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent px-2 text-xs text-[var(--color-text-primary)] outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#2F6BFF] hover:bg-[#2159E6] text-white font-semibold rounded-lg shadow-sm transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border)] flex flex-col gap-1 text-[11px] text-[var(--color-text-muted)]">
            <div className="font-semibold text-[var(--color-text-primary)]">Local Storage & .noteflow files</div>
            <p>You can export this notebook as a <code className="text-[#2F6BFF] font-mono">.noteflow</code> file to share all pages, strokes, and images.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3.5 border-t border-[var(--color-border)] bg-[var(--color-bg-primary)]/40">
          <button
            onClick={() => {
              closeModal();
              openModal('export');
            }}
            className="flex items-center gap-1 text-[#2F6BFF] hover:underline font-semibold text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export File...</span>
          </button>

          <button
            onClick={closeModal}
            className="px-3.5 py-1.5 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] font-semibold rounded-xl text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
