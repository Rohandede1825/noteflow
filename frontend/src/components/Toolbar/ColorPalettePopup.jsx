import React, { useEffect, useRef } from 'react';
import { useToolStore, FULL_COLOR_PALETTE } from '../../store/useToolStore';
import { Plus } from 'lucide-react';

export function ColorPalettePopup() {
  const { activePopup, closePopup, penColor, setPenColor } = useToolStore();
  const popupRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        if (!e.target.closest('[data-color-btn]') && !e.target.closest('[data-toolbar-btn]')) {
          closePopup();
        }
      }
    };
    if (activePopup === 'colorPalette') {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [activePopup, closePopup]);

  if (activePopup !== 'colorPalette') return null;

  return (
    <div
      ref={popupRef}
      className="absolute top-14 right-32 z-50 w-64 bg-[#1F2024]/95 dark:bg-[#1F2024]/95 light:bg-white/95 backdrop-blur-xl border border-[var(--color-border)] rounded-2xl shadow-floating p-3 flex flex-col gap-3 text-xs animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px]">
          Pen Color Palette
        </span>
        <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
          {penColor}
        </span>
      </div>

      {/* Preset 14 colors grid */}
      <div className="grid grid-cols-7 gap-2">
        {FULL_COLOR_PALETTE.map((color) => {
          const isSelected = penColor.toLowerCase() === color.toLowerCase();
          return (
            <button
              key={color}
              type="button"
              onClick={() => {
                setPenColor(color);
                closePopup();
              }}
              className={`w-6 h-6 rounded-full transition-transform border ${
                isSelected
                  ? 'scale-125 ring-2 ring-[#2F6BFF] ring-offset-2 ring-offset-[#1F2024] border-white'
                  : 'hover:scale-110 border-black/20 dark:border-white/10'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          );
        })}
      </div>

      {/* Custom native color picker */}
      <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between">
        <span className="text-[11px] text-[var(--color-text-secondary)] font-medium">Custom Color</span>
        <label className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border)] cursor-pointer transition-colors">
          <div
            className="w-4 h-4 rounded-full border border-black/20"
            style={{ backgroundColor: penColor }}
          />
          <span className="text-[11px] font-semibold text-[var(--color-text-primary)]">Choose...</span>
          <input
            type="color"
            value={penColor.startsWith('#') ? penColor : '#2F6BFF'}
            onChange={(e) => setPenColor(e.target.value)}
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
}
