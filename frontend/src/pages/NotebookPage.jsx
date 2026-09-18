import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotebookStore } from '../store/useNotebookStore';
import { useUIStore } from '../store/useUIStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { NotebookHeader } from '../components/Header/NotebookHeader';
import { TopToolbar } from '../components/Toolbar/TopToolbar';
import { PageSidebar } from '../components/PageSidebar/PageSidebar';
import { CanvasEngine } from '../components/Canvas/CanvasEngine';
import { TeachingOverlay } from '../components/TeachingMode/TeachingOverlay';
import { RightClickMenu } from '../components/Modals/RightClickMenu';
import { CreateNotebookModal } from '../components/Modals/CreateNotebookModal';
import { ExportModal } from '../components/Modals/ExportModal';
import { ShareModal } from '../components/Modals/ShareModal';
import { SearchModal } from '../components/Modals/SearchModal';
import { SettingsModal } from '../components/Modals/SettingsModal';
import { ImportPdfModal } from '../components/Modals/ImportPdfModal';
import { ClearPageConfirmModal } from '../components/Modals/ClearPageConfirmModal';
import { PaperSettingsPopup } from '../components/Toolbar/PaperSettingsPopup';
import { Loader2 } from 'lucide-react';

export function NotebookPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentNotebook, setCurrentNotebook, currentPage } = useNotebookStore();
  const { isTeachingMode } = useUIStore();

  const fileInputTriggerRef = useRef(null);

  // Initialize shortcuts
  useKeyboardShortcuts({
    onTriggerImageUpload: () => {
      const btn = document.querySelector('button[title*="Insert Image"]');
      if (btn) btn.click();
    }
  });

  useEffect(() => {
    if (id) {
      setCurrentNotebook(id);
    }
  }, [id, setCurrentNotebook]);

  if (!currentNotebook) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#121316] text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-xs font-semibold text-neutral-400">Loading Notebook Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#121316] overflow-hidden select-none">
      {/* 1. Top Header (Hidden in Teaching Mode) */}
      {!isTeachingMode && <NotebookHeader />}

      {/* 2. Top Drawing Toolbar (Hidden in Teaching Mode) */}
      {!isTeachingMode && <TopToolbar />}

      {/* 3. Main Workspace: Left Thumbnail Sidebar + Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        {!isTeachingMode && <PageSidebar />}

        <CanvasEngine />
      </div>

      {/* 4. Teaching / Presentation Mode Floating Overlay */}
      <TeachingOverlay />

      {/* 5. Right-Click Context Menu */}
      <RightClickMenu />

      {/* 6. Modals */}
      <CreateNotebookModal />
      <ExportModal />
      <ShareModal />
      <SearchModal />
      <SettingsModal />
      <ImportPdfModal />
      <ClearPageConfirmModal />
      <PaperSettingsPopup />
    </div>
  );
}
