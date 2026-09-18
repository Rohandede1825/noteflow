import React, { useEffect, useRef } from 'react';
import { useToolStore, QUICK_PEN_WIDTHS } from '../../store/useToolStore';
import { Pen, Feather, Brush, Edit3, Sliders, Sparkles } from 'lucide-react';

export function PenStylePopup() {
  const {
    activePopup,
    closePopup,
    penType,
    setPenType,
    penWidth,
    setPenWidth,
    strokeStrength,
    setStrokeStrength,
    autoShapeRecognition,
    setAutoShapeRecognition
  } = useToolStore();
  const popupRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        if (!e.target.closest('[data-penstyle-btn]')) {
          closePopup();
        }
      }
    };
    if (activePopup === 'penStyle') {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [activePopup, closePopup]);

  if (activePopup !== 'penStyle') return null;

  const styles = [
    { id: 'ball', label: 'Ball Pen', icon: Pen, desc: 'Crisp & natural' },
    { id: 'fountain', label: 'Fountain Pen', icon: Feather, desc: 'Calligraphic pressure' },
    { id: 'brush', label: 'Brush Pen', icon: Brush, desc: 'Expressive taper' },
    { id: 'pencil', label: 'Pencil', icon: Edit3, desc: 'Soft texture' }
  ];

  return (
    <div
      ref={popupRef}
      className="absolute top-16 left-1/2 -translate-x-1/2 z-50 w-72 bg-[#1F2024]/95 dark:bg-[#1F2024]/95 light:bg-white/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-floating p-3.5 flex flex-col gap-3 text-xs animate-in fade-in zoom-in-95 duration-100 text-white"
    >
      {/* 1. Pen Type Grid */}
      <div>
        <div className="px-1 mb-1.5 text-[10px] font-bold text-white/60 uppercase tracking-wider">
          Pen Type
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {styles.map((item) => {
            const Icon = item.icon;
            const isSelected = penType === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPenType(item.id)}
                className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all ${
                  isSelected
                    ? 'bg-[#204272] border border-blue-400/50 text-white font-semibold shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-300' : 'text-white/60'}`} />
                <span className="truncate text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-white/10" />

      {/* 2. Pen Size (0.5px to 10.0px Slider + Quick Presets) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
            Pen Size
          </span>
          <span className="font-mono text-xs text-blue-300 font-bold">
            {penWidth.toFixed(1)} px
          </span>
        </div>

        <input
          type="range"
          min="0.5"
          max="10.0"
          step="0.5"
          value={penWidth}
          onChange={(e) => setPenWidth(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#38BDF8]"
        />

        {/* Quick Size Presets */}
        <div className="flex items-center justify-between gap-1 mt-1">
          {[0.5, 1.5, 2.5, 4.5, 7.0, 10.0].map((size) => (
            <button
              key={size}
              onClick={() => setPenWidth(size)}
              className={`px-2 py-1 rounded-md text-[10px] font-mono transition-colors ${
                Math.abs(penWidth - size) < 0.2
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-white/5 hover:bg-white/15 text-white/70'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-white/10" />

      {/* 3. Stroke Strength (Pressure / Strength Sensitivity) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
            Stroke Strength
          </span>
          <span className="text-xs text-blue-300 font-medium">
            {strokeStrength < 0.7 ? 'Soft' : strokeStrength > 1.3 ? 'Strong' : 'Medium'} ({strokeStrength.toFixed(1)}x)
          </span>
        </div>

        <input
          type="range"
          min="0.3"
          max="2.0"
          step="0.1"
          value={strokeStrength}
          onChange={(e) => setStrokeStrength(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#38BDF8]"
        />

        <div className="flex justify-between text-[10px] text-white/50 px-1 font-medium">
          <span>Soft</span>
          <span>Normal</span>
          <span>Strong</span>
        </div>
      </div>

      <div className="h-px bg-white/10" />

      {/* 4. Smart Auto Shape Recognition Toggle */}
      <div className="flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${autoShapeRecognition ? 'bg-blue-600/30 text-blue-300' : 'bg-white/5 text-white/50'}`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-white">Auto Shape Recognition</span>
            <span className="text-[10px] text-white/50">Clean shapes upon stroke finish</span>
          </div>
        </div>

        <button
          onClick={() => setAutoShapeRecognition(!autoShapeRecognition)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            autoShapeRecognition ? 'bg-blue-600' : 'bg-white/20'
          }`}
          role="switch"
          aria-checked={autoShapeRecognition}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              autoShapeRecognition ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
