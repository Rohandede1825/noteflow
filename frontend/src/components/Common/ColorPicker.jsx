import React from 'react';

const PRESET_COLORS = [
  '#ffffff', // White
  '#f87171', // Red
  '#fb923c', // Orange
  '#facc15', // Yellow
  '#4ade80', // Green
  '#60a5fa', // Blue
  '#a78bfa', // Purple
  '#f472b6', // Pink
  '#94a3b8', // Slate gray
  '#000000', // Black
];

export function ColorPicker({ value, onChange, label, className = '' }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && <span className="text-xs font-medium text-neutral-400">{label}</span>}
      <div className="flex items-center gap-2 flex-wrap">
        {PRESET_COLORS.map((color) => {
          const isSelected = value.toLowerCase() === color.toLowerCase();
          return (
            <button
              key={color}
              type="button"
              onClick={() => onChange(color)}
              className={`w-6 h-6 rounded-full transition-transform border ${
                isSelected
                  ? 'scale-125 ring-2 ring-blue-500 ring-offset-2 ring-offset-neutral-900 border-white'
                  : 'hover:scale-110 border-neutral-700/60'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          );
        })}

        {/* Custom native color input */}
        <label
          className="relative w-6 h-6 rounded-full overflow-hidden border border-neutral-600 cursor-pointer flex items-center justify-center hover:scale-110 transition-transform bg-gradient-to-tr from-rose-500 via-emerald-500 to-blue-500"
          title="Custom Color"
        >
          <input
            type="color"
            value={value.startsWith('#') ? value : '#ffffff'}
            onChange={(e) => onChange(e.target.value)}
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
}
