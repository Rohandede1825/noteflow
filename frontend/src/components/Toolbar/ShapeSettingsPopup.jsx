import React, { useEffect, useRef } from 'react';
import { useToolStore } from '../../store/useToolStore';
import { ColorPicker } from '../Common/ColorPicker';
import { Slider } from '../Common/Slider';
import {
  Square,
  Circle,
  Triangle,
  Star,
  MoveRight,
  ArrowLeftRight,
  Minus
} from 'lucide-react';

export function ShapeSettingsPopup() {
  const {
    activePopup,
    closePopup,
    shapeType,
    setShapeType,
    shapeStrokeColor,
    setShapeStrokeColor,
    shapeFillColor,
    setShapeFillColor,
    shapeWidth,
    setShapeWidth,
    isDashed,
    setIsDashed
  } = useToolStore();

  const popupRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        if (!e.target.closest('[data-toolbar-btn]')) {
          closePopup();
        }
      }
    };
    if (activePopup === 'shapes' || activePopup === 'line') {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [activePopup, closePopup]);

  if (activePopup !== 'shapes' && activePopup !== 'line') return null;

  return (
    <div
      ref={popupRef}
      className="absolute top-14 left-1/2 -translate-x-1/2 z-40 w-80 bg-[#1e2126]/95 backdrop-blur-xl border border-neutral-700/80 rounded-2xl shadow-floating p-4 flex flex-col gap-4 text-neutral-200 animate-in fade-in zoom-in-95 duration-150"
    >
      {/* 1. Shape Type Selection */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Shape / Line Type</span>
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-neutral-900/80 rounded-xl border border-neutral-800">
          {[
            { id: 'rectangle', label: 'Box', icon: Square },
            { id: 'roundedRect', label: 'Rounded', icon: Square },
            { id: 'circle', label: 'Circle', icon: Circle },
            { id: 'triangle', label: 'Triangle', icon: Triangle },
            { id: 'star', label: 'Star', icon: Star },
            { id: 'line', label: 'Line', icon: Minus },
            { id: 'arrow', label: 'Arrow', icon: MoveRight },
            { id: 'doubleArrow', label: 'Double', icon: ArrowLeftRight }
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = shapeType === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setShapeType(item.id)}
                className={`flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${
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

      {/* 2. Stroke Width & Style */}
      <div className="flex flex-col gap-2">
        <Slider
          label="STROKE THICKNESS"
          min={1}
          max={16}
          step={0.5}
          value={shapeWidth}
          onChange={setShapeWidth}
          valueSuffix="px"
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-medium text-neutral-400">Dashed Stroke</span>
          <button
            onClick={() => setIsDashed(!isDashed)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
              isDashed
                ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {isDashed ? 'Dashed' : 'Solid'}
          </button>
        </div>
      </div>

      {/* 3. Stroke Color */}
      <ColorPicker
        label="BORDER COLOR"
        value={shapeStrokeColor}
        onChange={setShapeStrokeColor}
      />

      {/* 4. Fill Color presets */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Fill Color</span>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShapeFillColor('transparent')}
            className={`px-3 py-1 rounded-lg text-xs font-medium border ${
              shapeFillColor === 'transparent'
                ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold'
                : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            None
          </button>
          {['rgba(59, 130, 246, 0.15)', 'rgba(16, 185, 129, 0.15)', 'rgba(239, 68, 68, 0.15)', 'rgba(245, 158, 11, 0.15)', '#ffffff'].map((c) => (
            <button
              key={c}
              onClick={() => setShapeFillColor(c)}
              className={`w-6 h-6 rounded-full border ${shapeFillColor === c ? 'ring-2 ring-blue-500 scale-110' : 'border-neutral-700'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
