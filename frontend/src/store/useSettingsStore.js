import { create } from 'zustand';

const LOCAL_STORAGE_KEY = 'noteflow_settings';

const defaultSettings = {
  theme: 'dark', // 'dark' | 'light' | 'system'
  defaultPageTemplate: 'ruled',
  defaultPenColor: '#ffffff',
  defaultPenWidth: 2.5,
  defaultPenType: 'ball',
  defaultPaperColorDark: '#1c1e22',
  defaultPaperColorLight: '#ffffff',
  autoSave: true,
  autoSaveInterval: 2500,
  showThumbnails: true,
  smoothStrokes: true,
  defaultPdfSize: 'a4',
  defaultPdfOrientation: 'portrait'
};

function loadStoredSettings() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('Failed to parse settings from localStorage:', e);
  }
  return defaultSettings;
}

export const useSettingsStore = create((set, get) => ({
  settings: loadStoredSettings(),

  updateSettings: (updates) => {
    const updated = { ...get().settings, ...updates };
    set({ settings: updated });
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save settings to localStorage:', e);
    }

    // Apply theme changes to document root
    if (updates.theme) {
      get().applyTheme(updates.theme);
    }
  },

  applyTheme: (theme) => {
    const root = document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  },

  resetSettings: () => {
    set({ settings: defaultSettings });
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    get().applyTheme(defaultSettings.theme);
  }
}));
