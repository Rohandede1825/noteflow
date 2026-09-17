import React from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useUIStore } from '../../store/useUIStore';
import { ColorPicker } from '../Common/ColorPicker';
import { Slider } from '../Common/Slider';
import {
  X,
  Sliders,
  Sun,
  Moon,
  Monitor,
  RotateCcw
} from 'lucide-react';

export function SettingsModal() {
  const { activeModal, closeModal, addToast } = useUIStore();
  const { settings, updateSettings, resetSettings } = useSettingsStore();

  if (activeModal !== 'settings') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#1F2024] dark:bg-[#1F2024] light:bg-white border border-[var(--color-border)] rounded-3xl shadow-floating overflow-hidden text-[var(--color-text-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#2F6BFF]" />
            <h2 className="text-sm font-bold">Settings</h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[70vh] overflow-y-auto flex flex-col gap-5 text-xs">
          {/* 1. Theme Selection */}
          <div className="flex flex-col gap-1.5">
            <span className="font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px]">Appearance</span>
            <div className="grid grid-cols-3 gap-1.5 bg-[var(--color-bg-primary)] p-1 rounded-xl border border-[var(--color-border)]">
              {[
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'system', label: 'System', icon: Monitor }
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = settings.theme === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => updateSettings({ theme: item.id })}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold transition-all ${
                      isSelected ? 'bg-[#2F6BFF] text-white shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Default Page Template */}
          <div className="flex flex-col gap-1.5">
            <span className="font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px]">Default Page Template</span>
            <div className="grid grid-cols-4 gap-1.5">
              {['ruled', 'dotted', 'grid', 'blank'].map((t) => (
                <button
                  key={t}
                  onClick={() => updateSettings({ defaultPageTemplate: t })}
                  className={`py-1.5 rounded-xl capitalize font-semibold border transition-all ${
                    settings.defaultPageTemplate === t
                      ? 'bg-[#2F6BFF]/15 border-[#2F6BFF] text-[#2F6BFF]'
                      : 'bg-[var(--color-bg-primary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Pen Defaults */}
          <div className="flex flex-col gap-3 p-3.5 bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border)]">
            <span className="font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px]">Default Pen Instrument</span>
            <div className="grid grid-cols-2 gap-3">
              <ColorPicker
                label="DEFAULT COLOR"
                value={settings.defaultPenColor}
                onChange={(c) => updateSettings({ defaultPenColor: c })}
              />

              <Slider
                label="DEFAULT WIDTH"
                min={0.5}
                max={12}
                step={0.5}
                value={settings.defaultPenWidth}
                onChange={(w) => updateSettings({ defaultPenWidth: w })}
              />
            </div>
          </div>

          {/* 4. Autosave */}
          <div className="flex items-center justify-between p-3 bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border)]">
            <div>
              <div className="font-semibold text-[var(--color-text-primary)]">Continuous Autosave</div>
              <div className="text-[10px] text-[var(--color-text-muted)]">Automatically saves drawings and notes in background.</div>
            </div>
            <input
              type="checkbox"
              checked={settings.autoSave}
              onChange={(e) => updateSettings({ autoSave: e.target.checked })}
              className="w-4 h-4 rounded accent-[#2F6BFF] cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-primary)]/40">
          <button
            onClick={() => {
              resetSettings();
              addToast('Settings reset to defaults', 'info');
            }}
            className="flex items-center gap-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-xs font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={closeModal}
            className="px-4 py-1.5 bg-[#2F6BFF] hover:bg-[#2159E6] text-white font-bold rounded-xl text-xs shadow-sm transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
