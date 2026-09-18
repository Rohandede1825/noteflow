import React, { useEffect, useRef } from 'react';
import { useToolStore } from '../../store/useToolStore';
import { Highlighter as HighlighterIcon, Check } from 'lucide-react';

const HIGHLIGHTER_PRESET_COLORS = [
  { id: 'yellow', name: 'Neon Yellow', hex: '#FACC15', bg: 'bg-[#FACC15]' },
  { id: 'green',  name: 'Lime Green',  hex: '#4ADE80', bg: 'bg-[#4ADE80]' },
  { id: 'cyan',   name: 'Sky Blue',    hex: '#38BDF8', bg: 'bg-[#38BDF8]' },
  { id: 'pink',   name: 'Neon Pink',   hex: '#F472B6', bg: 'bg-[#F472B6]' },
  { id: 'orange', name: 'Tangerine',   hex: '#FB923C', bg: 'bg-[#FB923C]' },
  { id: 'purple', name: 'Lavender',    hex: '#C084FC', bg: 'bg-[#C084FC]' },
  { id: 'rose',   name: 'Coral Rose',  hex: '#FB7185', bg: 'bg-[#FB7185]' },
  { id: 'mint',   name: 'Mint Teal',   hex: '#2DD4BF', bg: 'bg-[#2DD4BF]' }
];

const HIGHLIGHTER_PRESET_SIZES = [
  { id: 'thin',   label: 'Fine',   width: 12 },
  { id: 'medium', label: 'Medium', width: 24 },
  { id: 'broad',  label: 'Broad',  width: 38 },
  { id: 'jumbo',  label: 'Jumbo',  width: 54 }
];

export function HighlighterSettingsPopup() {
  const {
    activePopup,
    closePopup,
    highlighterColor,
    setHighlighterColor,
    highlighterWidth,
    setHighlighterWidth,
    highlighterOpacity,
    setHighlighterOpacity
  } = useToolStore();

  const popupRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        if (!e.target.closest('[data-highlighter-btn]')) {
          closePopup();
        }
      }
    };
    if (activePopup === 'highlighterSettings' || activePopup === 'highlighter') {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [activePopup, closePopup]);

  if (activePopup !== 'highlighterSettings' && activePopup !== 'highlighter') return null;

  return (
    <div
      ref={popupRef}
      className="absolute top-14 left-1/2 -translate-x-1/2 z-40 w-80 max-w-[92vw] bg-[#1e2126]/95 backdrop-blur-xl border border-neutral-700/80 rounded-2xl shadow-floating p-4 flex flex-col gap-4 text-neutral-200 animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      {/* 1. Header & Live Preview */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white tracking-wide uppercase">
            <HighlighterIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Highlighter Settings</span>
          </div>
          <span className="text-[11px] font-mono text-neutral-400 font-semibold">{highlighterWidth}px</span>
        </div>

        {/* Live Chisel Preview Card */}
        <div className="relative overflow-hidden rounded-xl bg-neutral-900/90 border border-neutral-800 p-3 flex flex-col justify-center items-center min-h-[52px]">
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
            <span className="font-serif italic text-xs text-neutral-300">Important NoteFlow Concept</span>
          </div>
          {/* Authentic fluorescent highlight overlay bar */}
          <div
            className="w-4/5 rounded-full transition-all duration-100 shadow-sm"
            style={{
              height: `${Math.min(28, Math.max(6, highlighterWidth * 0.45))}px`,
              backgroundColor: highlighterColor,
              opacity: highlighterOpacity || 0.45,
              filter: 'drop-shadow(0 0 4px currentColor)'
            }}
          />
        </div>
      </div>

      {/* 2. Color Palette */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Colors</span>
          <span className="text-[10px] text-neutral-400">Fluorescent & Pastels</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {HIGHLIGHTER_PRESET_COLORS.map((c) => {
            const isSelected = (highlighterColor || '').toLowerCase() === c.hex.toLowerCase();
            return (
              <button
                key={c.id}
                onClick={() => setHighlighterColor(c.hex)}
                className={`relative flex items-center justify-center h-9 rounded-xl transition-all ${
                  c.bg
                } ${
                  isSelected
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1e2126] scale-105 shadow-md'
                    : 'hover:scale-105 hover:opacity-95 opacity-85'
                }`}
                title={c.name}
              >
                {isSelected && <Check className="w-4 h-4 text-black stroke-[3]" />}
              </button>
            );
          })}
        </div>

        {/* Custom Color Input */}
        <div className="flex items-center justify-between mt-1 pt-2 border-t border-neutral-800/80">
          <span className="text-xs text-neutral-400">Custom Color</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={highlighterColor.startsWith('#') ? highlighterColor : '#FACC15'}
              onChange={(e) => setHighlighterColor(e.target.value)}
              className="w-7 h-7 rounded-lg border border-neutral-700 bg-transparent cursor-pointer"
            />
            <span className="text-xs font-mono text-neutral-300">
              {highlighterColor.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Preset Sizes */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Thickness</span>
        <div className="grid grid-cols-4 gap-1.5">
          {HIGHLIGHTER_PRESET_SIZES.map((item) => {
            const isSelected = highlighterWidth === item.width;
            return (
              <button
                key={item.id}
                onClick={() => setHighlighterWidth(item.width)}
                className={`flex flex-col items-center py-2 rounded-xl border text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 font-bold shadow-sm'
                    : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span>{item.label}</span>
                <span className="text-[10px] text-neutral-500">{item.width}px</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Fine Width Slider */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>Custom Width</span>
          <span className="font-mono text-white">{highlighterWidth}px</span>
        </div>
        <input
          type="range"
          min="8"
          max="80"
          step="1"
          value={highlighterWidth}
          onChange={(e) => setHighlighterWidth(Number(e.target.value))}
          className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
        />
      </div>

      {/* 5. Opacity / Fluorescent Intensity Slider */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>Fluorescent Intensity</span>
          <span className="font-mono text-white">{Math.round((highlighterOpacity || 0.45) * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.15"
          max="0.80"
          step="0.05"
          value={highlighterOpacity || 0.45}
          onChange={(e) => setHighlighterOpacity(Number(e.target.value))}
          className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
        />
      </div>
    </div>
  );
}
