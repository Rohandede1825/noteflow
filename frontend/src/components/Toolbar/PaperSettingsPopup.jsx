import React, { useState, useEffect } from 'react';
import { useNotebookStore } from '../../store/useNotebookStore';
import { useUIStore } from '../../store/useUIStore';
import { X, AlignJustify, Grid, CircleDot, Square, Check } from 'lucide-react';

export function PaperSettingsPopup() {
  const { activeModal, closeModal, addToast } = useUIStore();
  const { currentPage, setPageTemplate } = useNotebookStore();

  const [template, setTemplate] = useState('ruled');
  const [paperColor, setPaperColor] = useState('white');
  const [lineSpacing, setLineSpacing] = useState(44);
  const [showMargin, setShowMargin] = useState(true);

  useEffect(() => {
    if (currentPage) {
      setTemplate(currentPage.template || 'ruled');
      const cfg = currentPage.templateConfig || {};
      setPaperColor(cfg.paperColor || 'white');
      setLineSpacing(cfg.lineSpacing || 44);
      setShowMargin(cfg.showMargin !== undefined ? cfg.showMargin : (currentPage.template === 'ruled'));
    }
  }, [currentPage, activeModal]);

  if (activeModal !== 'paperSettings') return null;

  const handleApply = () => {
    setPageTemplate(template, {
      paperColor,
      lineSpacing: Number(lineSpacing),
      showMargin: Boolean(showMargin)
    });
    addToast('Paper settings updated', 'success');
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-[#1F2024] dark:bg-[#1F2024] light:bg-white border border-[var(--color-border)] rounded-3xl shadow-floating overflow-hidden text-[var(--color-text-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-bold">Paper Settings</h2>
          <button
            onClick={closeModal}
            className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 text-xs">
          {/* Paper Type */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px]">
              Paper Pattern
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'ruled', label: 'Ruled', icon: AlignJustify },
                { id: 'dotted', label: 'Dotted', icon: CircleDot },
                { id: 'grid', label: 'Grid', icon: Grid },
                { id: 'blank', label: 'Blank', icon: Square }
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = template === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-[#2F6BFF]/15 border-[#2F6BFF] text-[#2F6BFF] font-bold'
                        : 'bg-[var(--color-bg-primary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px]">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paper Color */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px]">
              Paper Color
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'white', label: 'White', bg: '#FFFFFF', border: '#D1D5DB', text: '#111827' },
                { id: 'dark', label: 'Dark', bg: '#202124', border: '#374151', text: '#F9FAFB' },
                { id: 'cream', label: 'Cream', bg: '#FDFBF7', border: '#E5E7EB', text: '#1F2937' }
              ].map((c) => {
                const isSelected = paperColor === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setPaperColor(c.id)}
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl border font-semibold transition-all ${
                      isSelected
                        ? 'ring-2 ring-[#2F6BFF] border-transparent font-bold'
                        : 'border-[var(--color-border)] opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.bg, color: c.text }}
                  >
                    <span>{c.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#2F6BFF]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Line spacing (if ruled or grid) */}
          {(template === 'ruled' || template === 'grid') && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px]">
                  Line Spacing
                </label>
                <span className="font-mono text-[var(--color-text-muted)] text-[11px]">{lineSpacing}px</span>
              </div>
              <input
                type="range"
                min="24"
                max="56"
                step="2"
                value={lineSpacing}
                onChange={(e) => setLineSpacing(e.target.value)}
                className="w-full accent-[#2F6BFF] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[var(--color-text-muted)]">
                <span>Small (24px)</span>
                <span>Medium (34px)</span>
                <span>Large (48px)</span>
              </div>
            </div>
          )}

          {/* Margin toggle (if ruled) */}
          {template === 'ruled' && (
            <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
              <div>
                <span className="font-semibold text-xs">Vertical Margin Line</span>
                <p className="text-[10px] text-[var(--color-text-muted)]">Classic notebook side margin</p>
              </div>
              <input
                type="checkbox"
                checked={showMargin}
                onChange={(e) => setShowMargin(e.target.checked)}
                className="w-4 h-4 rounded accent-[#2F6BFF] cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-primary)]/40">
          <button
            type="button"
            onClick={closeModal}
            className="px-3 py-1.5 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-1.5 bg-[#2F6BFF] hover:bg-[#2159E6] text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
