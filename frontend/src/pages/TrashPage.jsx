import React, { useEffect, useState } from 'react';
import { AppSidebar } from '../components/Sidebar/AppSidebar';
import { useNotebookStore } from '../store/useNotebookStore';
import { useUIStore } from '../store/useUIStore';
import { api } from '../services/api';
import {
  Trash2,
  RotateCcw,
  BookOpen
} from 'lucide-react';

export function TrashPage() {
  const { fetchNotebooks } = useNotebookStore();
  const { addToast } = useUIStore();
  const [trashedNotebooks, setTrashedNotebooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTrashed = async () => {
    try {
      setIsLoading(true);
      const list = await api.getNotebooks({ inTrash: true });
      setTrashedNotebooks(list);
    } catch (err) {
      console.error('Failed to load trash:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrashed();
  }, []);

  const handleRestore = async (id) => {
    try {
      await api.updateNotebook(id, { inTrash: false, trashedAt: null });
      await loadTrashed();
      await fetchNotebooks();
      addToast('Notebook restored to library', 'success');
    } catch (err) {
      console.error('Failed to restore:', err);
    }
  };

  const handleDeletePermanent = async (id) => {
    if (window.confirm('Permanently delete this notebook? This action cannot be undone.')) {
      try {
        await api.deleteNotebook(id, true);
        await loadTrashed();
        await fetchNotebooks();
        addToast('Notebook permanently deleted', 'info');
      } catch (err) {
        console.error('Failed to permanently delete:', err);
      }
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] overflow-hidden select-none">
      <AppSidebar />

      <main className="flex-1 h-full overflow-y-auto p-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight">Trash</h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Manage deleted notebooks</p>
          </div>
        </div>

        {/* Trashed Items */}
        {trashedNotebooks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-[var(--color-text-muted)]">
            <Trash2 className="w-8 h-8 opacity-30 mb-2" />
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Trash is empty</h3>
            <p className="text-xs mt-0.5">Deleted notebooks will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {trashedNotebooks.map((nb) => (
              <div
                key={nb._id || nb.id}
                className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl p-4 flex flex-col justify-between gap-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[var(--color-bg-tertiary)] text-[#2F6BFF]">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-xs font-bold truncate">{nb.title}</h3>
                    <span className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                      {(nb.pages || []).length} pages
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)] text-xs">
                  <button
                    onClick={() => handleRestore(nb._id || nb.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2F6BFF]/10 hover:bg-[#2F6BFF]/20 text-[#2F6BFF] font-semibold rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>

                  <button
                    onClick={() => handleDeletePermanent(nb._id || nb.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-rose-500 hover:bg-rose-500/10 font-semibold rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
