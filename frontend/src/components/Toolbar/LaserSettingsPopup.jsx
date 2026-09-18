import React, { useEffect, useRef } from 'react';
import { useToolStore, LASER_COLORS } from '../../store/useToolStore';
import { ColorPicker } from '../Common/ColorPicker';
import { Wand2, Check } from 'lucide-react';

export function LaserSettingsPopup() {
  const { activePopup, closePopup, laserColor, setLaserColor } = useToolStore();
  const popupRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        if (!e.target.closest('[data-laser-btn]')) {
          closePopup();
        }
      }
    };
    if (activePopup === 'laserSettings') {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [activePopup, closePopup]);

  if (activePopup !== 'laserSettings') return null;

  return (
    <div
      ref={popupRef}
      className="absolute top-14 left-1/2 -translate-x-1/2 z-40 w-72 bg-[#1e2126]/95 backdrop-blur-xl border border-neutral-700/80 rounded-2xl shadow-floating p-4 flex flex-col gap-3 text-neutral-200 animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
        <Wand2 className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Laser Pointer Color</span>
      </div>

      {/* Preset Laser Colors */}
      <div className="grid grid-cols-4 gap-2">
        {LASER_COLORS.map((item) => {
          const isSelected = laserColor.toLowerCase() === item.hex.toLowerCase();
          return (
            <button
              key={item.id}
              onClick={() => setLaserColor(item.hex)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-blue-600/30 border-blue-500 shadow-sm'
                  : 'bg-neutral-900/60 border-neutral-800 hover:bg-neutral-800/80'
              }`}
            >
              <div
                className="w-5 h-5 rounded-full border border-white/20 shadow-md flex items-center justify-center"
                style={{ backgroundColor: item.hex }}
              >
                {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
              </div>
              <span className="text-[10px] text-neutral-300 font-medium">{item.name}</span>
            </button>
          );
        })}
      </div>

      {/* Custom Color Picker */}
      <div className="pt-2 border-t border-neutral-800">
        <ColorPicker
          label="CUSTOM LASER COLOR"
          value={laserColor}
          onChange={(c) => setLaserColor(c)}
        />
      </div>
    </div>
  );
}
