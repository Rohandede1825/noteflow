import React from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useNotebookStore } from '../../store/useNotebookStore';
import { Trash2 } from 'lucide-react';

export function ClearPageConfirmModal() {
  const { activeModal, closeModal, modalProps, addToast } = useUIStore();
  const { clearSpecificPage } = useNotebookStore();

  if (activeModal !== 'clearPageConfirm') return null;

  const pageIndexToClear = modalProps?.pageIndex;

  const handleConfirm = async () => {
    await clearSpecificPage(pageIndexToClear);
    closeModal();
    addToast('Page cleared successfully', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-sm bg-[#1e2025] border border-neutral-700/80 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 text-white animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Clear this page?</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              All content on this page will be permanently removed.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Page</span>
          </button>
        </div>
      </div>
    </div>
  );
}
