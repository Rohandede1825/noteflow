import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { NotebookPage } from './pages/NotebookPage';
import { TrashPage } from './pages/TrashPage';
import { SettingsPage } from './pages/SettingsPage';
import { ToastContainer } from './components/Common/Toast';
import { WelcomeAgreementModal } from './components/Modals/WelcomeAgreementModal';
import { useSettingsStore } from './store/useSettingsStore';

export function App() {
  const { settings, applyTheme } = useSettingsStore();

  useEffect(() => {
    applyTheme(settings.theme || 'dark');
  }, [settings.theme, applyTheme]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-sans">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/favorites" element={<Home />} />
        <Route path="/notebook/:id" element={<NotebookPage />} />
        <Route path="/trash" element={<TrashPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <WelcomeAgreementModal />
      <ToastContainer />
    </div>
  );
}

export default App;
