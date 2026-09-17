import React, { useEffect, useRef } from 'react';
import { useToolStore } from '../../store/useToolStore';
import { ColorPicker } from '../Common/ColorPicker';
import { Slider } from '../Common/Slider';
import { Feather, PenTool, Brush, Edit3 } from 'lucide-react';

const STROKE_PRESETS = [0.5, 1, 2, 3, 5, 8, 12];
const OPACITY_PRESETS = [0.25, 0.5, 0.75, 1.0];

export function PenSettingsPopup() {
  const {
    activePopup,
    closePopup,
    penType,
    setPenType,
    penColor,
    setPenColor,
    penWidth,
    setPenWidth,
    penOpacity,
    setPenOpacity
  } = useToolStore();

  const popupRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        // Only close if not clicking a toolbar button
        const isToolbarBtn = e.target.closest('[data-toolbar-btn]');
        if (!isToolbarBtn) {
          closePopup();
        }
      }
    };

    if (activePopup === 'pen') {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [activePopup, closePopup]);

  if (activePopup !== 'pen') return null;

  return (
    <div
      ref={popupRef}
      className="absolute top-14 left-1/2 -translate-x-1/2 z-40 w-80 bg-[#1e2126]/95 backdrop-blur-xl border border-neutral-700/80 rounded-2xl shadow-floating p-4 flex flex-col gap-4 text-neutral-200 animate-in fade-in zoom-in-95 duration-150"
    >
      {/* 1. Pen Type Selector */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Pen Style</span>
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-neutral-900/80 rounded-xl border border-neutral-800">
          {[
            { id: 'ball', label: 'Ball Pen', icon: PenTool },
            { id: 'fountain', label: 'Fountain', icon: Feather },
            { id: 'brush', label: 'Brush', icon: Brush },
            { id: 'pencil', label: 'Pencil', icon: Edit3 }
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = penType === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPenType(item.id)}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Stroke Thickness Presets */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-400 uppercase tracking-wider">Stroke Width</span>
          <span className="font-mono text-blue-400 font-semibold">{penWidth}px</span>
        </div>
        <div className="flex items-center gap-1.5 justify-between">
          {STROKE_PRESETS.map((width) => {
            const isSelected = penWidth === width;
            return (
              <button
                key={width}
                onClick={() => setPenWidth(width)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  isSelected
                    ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold'
                    : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {width}
              </button>
            );
          })}
        </div>
        <Slider
          min={0.5}
          max={20}
          step={0.5}
          value={penWidth}
          onChange={setPenWidth}
          valueSuffix="px"
          className="mt-1"
        />
      </div>

      {/* 3. Color Selection */}
      <ColorPicker
        label="COLOR"
        value={penColor}
        onChange={setPenColor}
      />

      {/* 4. Opacity Controls */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-400 uppercase tracking-wider">Opacity</span>
          <span className="font-mono text-blue-400 font-semibold">{Math.round(penOpacity * 100)}%</span>
        </div>
        <div className="flex items-center gap-2">
          {OPACITY_PRESETS.map((op) => (
            <button
              key={op}
              onClick={() => setPenOpacity(op)}
              className={`flex-1 py-1 rounded-lg text-xs transition-all border ${
                penOpacity === op
                  ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold'
                  : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {Math.round(op * 100)}%
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
