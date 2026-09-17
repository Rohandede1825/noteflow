import React from 'react';

export function Slider({ min, max, step = 1, value, onChange, label, valueSuffix = 'px', className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-neutral-400">{label}</span>
          <span className="font-mono text-neutral-300">
            {value}
            {valueSuffix}
          </span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
      />
    </div>
  );
}
