import React, { useEffect, useRef } from 'react';
import { useToolStore } from '../../store/useToolStore';
import { ColorPicker } from '../Common/ColorPicker';
import { Slider } from '../Common/Slider';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type
} from 'lucide-react';

const FONT_FAMILIES = [
  { id: 'Inter', label: 'Inter' },
  { id: 'Arial', label: 'Arial' },
  { id: 'Caveat', label: 'Handwriting' },
  { id: 'Fira Code', label: 'Code / Mono' },
  { id: 'Newsreader', label: 'Serif / Georgia' }
];

export function TextSettingsPopup() {
  const { activePopup, closePopup, textSettings, setTextSettings } = useToolStore();
  const popupRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        if (!e.target.closest('[data-toolbar-btn]')) {
          closePopup();
        }
      }
    };
    if (activePopup === 'text') {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [activePopup, closePopup]);

  if (activePopup !== 'text') return null;

  return (
    <div
      ref={popupRef}
      className="absolute top-14 left-1/2 -translate-x-1/2 z-40 w-80 bg-[#1e2126]/95 backdrop-blur-xl border border-neutral-700/80 rounded-2xl shadow-floating p-4 flex flex-col gap-4 text-neutral-200 animate-in fade-in zoom-in-95 duration-150"
    >
      {/* 1. Font Family */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Font Family</span>
        <select
          value={textSettings.fontFamily}
          onChange={(e) => setTextSettings({ fontFamily: e.target.value })}
          className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Font Size */}
      <Slider
        label="FONT SIZE"
        min={12}
        max={72}
        step={1}
        value={textSettings.fontSize}
        onChange={(fontSize) => setTextSettings({ fontSize })}
        valueSuffix="pt"
      />

      {/* 3. Style & Alignment */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-neutral-900/80 p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => setTextSettings({ fontWeight: textSettings.fontWeight === 'bold' ? 'normal' : 'bold' })}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              textSettings.fontWeight === 'bold' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
            }`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTextSettings({ fontStyle: textSettings.fontStyle === 'italic' ? 'normal' : 'italic' })}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              textSettings.fontStyle === 'italic' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
            }`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTextSettings({ textDecoration: textSettings.textDecoration === 'underline' ? 'none' : 'underline' })}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              textSettings.textDecoration === 'underline' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
            }`}
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 bg-neutral-900/80 p-1 rounded-xl border border-neutral-800">
          {[
            { id: 'left', icon: AlignLeft },
            { id: 'center', icon: AlignCenter },
            { id: 'right', icon: AlignRight }
          ].map((align) => {
            const Icon = align.icon;
            const isSelected = textSettings.textAlign === align.id;
            return (
              <button
                key={align.id}
                onClick={() => setTextSettings({ textAlign: align.id })}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  isSelected ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Text Color */}
      <ColorPicker
        label="TEXT COLOR"
        value={textSettings.color}
        onChange={(color) => setTextSettings({ color })}
      />
    </div>
  );
}
