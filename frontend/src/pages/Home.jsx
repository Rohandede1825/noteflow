import React, { useEffect, useState } from 'react';
import { useNotebookStore } from '../store/useNotebookStore';
import { useUIStore } from '../store/useUIStore';
import { AppSidebar } from '../components/Sidebar/AppSidebar';
import { NotebookCard } from '../components/NotebookCard/NotebookCard';
import { CreateNotebookModal } from '../components/Modals/CreateNotebookModal';
import { SearchModal } from '../components/Modals/SearchModal';
import { SettingsModal } from '../components/Modals/SettingsModal';
import { api } from '../services/api';
import {
  Home as HomeIcon,
  Plus,
  Search,
  Settings,
  Lock,
  ChevronDown,
  CheckCircle2,
  Loader2,
  BookOpen
} from 'lucide-react';

export function Home() {
  const { notebooks, fetchNotebooks } = useNotebookStore();
  const { openModal, addToast } = useUIStore();
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('date'); // 'date' | 'name'

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchNotebooks();
      setIsLoading(false);
    };
    load();
  }, [fetchNotebooks]);

  // Handle drag and drop .noteflow files onto dashboard
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    if (file.name.endsWith('.noteflow') || file.type === 'application/json') {
      try {
        const text = await file.text();
        const bundle = JSON.parse(text);
        const imported = await api.importNoteFlow(bundle);
        await fetchNotebooks();
        addToast(`Imported "${imported.title}" successfully!`, 'success');
      } catch (err) {
        console.error('Failed to import .noteflow:', err);
        addToast('Invalid .noteflow file: ' + err.message, 'error');
      }
    }
  };

  const activeNotebooks = notebooks.filter(n => !n.inTrash);

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex flex-col h-screen w-screen bg-[#19181a] text-white overflow-hidden select-none"
    >
      {/* 1. Top Header Bar (Exact match to Image 1: Home tab on left, Search & Settings on right) */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#141416] border-b border-white/5 shrink-0">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-8 h-7 rounded-t-lg bg-[#202024] text-white">
            <HomeIcon className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-center gap-3 text-neutral-400">
          <button
            onClick={() => openModal('search')}
            className="p-1.5 hover:text-white transition-colors"
            title="Search (Ctrl+F)"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => openModal('settings')}
            className="p-1.5 hover:text-white transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main Area with Left Sidebar + Documents Grid */}
      <div className="flex-1 flex overflow-hidden">
        <AppSidebar />

        {/* Content View */}
        <main className="flex-1 h-full overflow-y-auto p-10 flex flex-col gap-8">
          {/* Header Row: Large "Documents" title + Actions */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Documents
            </h1>

            {/* Right Action Buttons (Image 1 match) */}
            <div className="flex items-center gap-3">
              {/* Blue + New Button */}
              <button
                onClick={() => openModal('createNotebook')}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1b58ca] hover:bg-[#184ebd] text-white text-xs font-bold rounded-full shadow-md transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>New</span>
                <Lock className="w-3 h-3 text-white/80 ml-0.5" />
                <ChevronDown className="w-3.5 h-3.5 text-white/80" />
              </button>

              {/* Date Filter Dropdown */}
              <div className="flex items-center gap-1 px-3 py-1.5 bg-[#252427] hover:bg-[#2d2c30] text-white text-xs font-medium rounded-full cursor-pointer transition-colors border border-white/5">
                <span>Date</span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </div>

              {/* Multi-Select Circle Checkmark Button */}
              <button
                className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                title="Select Documents"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notebooks Grid */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : activeNotebooks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-white/5 bg-[#201f22]/50">
              <div className="w-14 h-14 rounded-2xl bg-[#28272b] flex items-center justify-center text-blue-400 mb-4">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">No documents</h3>
              <p className="text-xs text-neutral-400 max-w-xs mt-1 mb-5">
                Create a new digital notebook to start taking handwritten notes and sketching.
              </p>
              <button
                onClick={() => openModal('createNotebook')}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1b58ca] hover:bg-[#184ebd] text-white text-xs font-bold rounded-full shadow-md transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Create Notebook</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-8 items-start">
              {activeNotebooks.map((notebook) => (
                <NotebookCard
                  key={notebook._id || notebook.id}
                  notebook={notebook}
                  onRefresh={fetchNotebooks}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Global modals */}
      <CreateNotebookModal />
      <SearchModal />
      <SettingsModal />
    </div>
  );
}
