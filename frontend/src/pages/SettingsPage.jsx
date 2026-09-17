import React from 'react';
import { AppSidebar } from '../components/Sidebar/AppSidebar';
import { useSettingsStore } from '../store/useSettingsStore';
import { useUIStore } from '../store/useUIStore';
import { ColorPicker } from '../components/Common/ColorPicker';
import { Slider } from '../components/Common/Slider';
import {
  Sliders,
  Sun,
  Moon,
  Monitor,
  RotateCcw
} from 'lucide-react';

export function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const { addToast } = useUIStore();

  return (
    <div className="flex h-screen w-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] overflow-hidden select-none">
      <AppSidebar />

      <main className="flex-1 h-full overflow-y-auto p-8 flex flex-col gap-6 max-w-3xl">
        <div className="border-b border-[var(--color-border)] pb-3 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight">Settings</h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Customize preferences and paper defaults</p>
          </div>

          <button
            onClick={() => {
              resetSettings();
              addToast('Settings reset to defaults', 'info');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-xl text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
        </div>

        {/* Setting sections */}
        <div className="flex flex-col gap-5 text-xs">
          {/* Theme */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl p-5 flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Appearance Theme</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'dark', label: 'Dark', icon: Moon, desc: 'Dark Charcoal' },
                { id: 'light', label: 'Light', icon: Sun, desc: 'Crisp White' },
                { id: 'system', label: 'System', icon: Monitor, desc: 'OS Default' }
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = settings.theme === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => updateSettings({ theme: item.id })}
                    className={`flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#2F6BFF]/15 border-[#2F6BFF] text-[#2F6BFF]'
                        : 'bg-[var(--color-bg-primary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <div>
                      <div className="font-bold text-xs text-[var(--color-text-primary)]">{item.label}</div>
                      <div className="text-[10px] text-[var(--color-text-muted)]">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paper Defaults */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Paper & Instrument Defaults</h3>

            <div className="flex flex-col gap-1.5">
              <span className="text-[var(--color-text-secondary)] font-semibold">Default Page Template</span>
              <div className="grid grid-cols-4 gap-2">
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

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--color-border)]">
              <ColorPicker
                label="DEFAULT INK COLOR"
                value={settings.defaultPenColor}
                onChange={(c) => updateSettings({ defaultPenColor: c })}
              />

              <Slider
                label="DEFAULT PEN WIDTH"
                min={0.5}
                max={12}
                step={0.5}
                value={settings.defaultPenWidth}
                onChange={(w) => updateSettings({ defaultPenWidth: w })}
              />
            </div>
          </div>

          {/* Autosave behavior */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl p-5 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-xs">Continuous Background Autosave</h4>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                Automatically persists strokes and drawings after each modification.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoSave}
              onChange={(e) => updateSettings({ autoSave: e.target.checked })}
              className="w-4 h-4 rounded accent-[#2F6BFF] cursor-pointer"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
