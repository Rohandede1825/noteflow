import React, { useState, useRef, useEffect } from 'react';
import { useNotebookStore } from '../../store/useNotebookStore';
import { useUIStore } from '../../store/useUIStore';
import {
  Edit2,
  Download,
  Trash2,
  Sliders,
  Check,
  Star
} from 'lucide-react';

export function TitleMenu({ isOpen, onClose }) {
  const { currentNotebook, renameNotebook, toggleFavoriteNotebook } = useNotebookStore();
  const { openModal, addToast } = useUIStore();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    if (currentNotebook) {
      setTitleInput(currentNotebook.title || '');
    }
  }, [currentNotebook]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
        setIsEditingTitle(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen, onClose]);

  if (!isOpen || !currentNotebook) return null;

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      renameNotebook(titleInput.trim());
      addToast('Notebook renamed', 'success');
    }
    setIsEditingTitle(false);
  };

  return (
    <div
      ref={menuRef}
      className="absolute top-10 left-0 z-50 w-64 bg-[#1F2024] dark:bg-[#1F2024] light:bg-white border border-[var(--color-border)] rounded-2xl shadow-floating p-2.5 flex flex-col gap-1.5 text-xs text-[var(--color-text-primary)] animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Title Rename Input / Display */}
      <div className="p-2 bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border)]">
        {isEditingTitle ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
              autoFocus
              className="flex-1 bg-[var(--color-bg-tertiary)] px-2 py-1 rounded-lg text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[#2F6BFF]"
            />
            <button
              onClick={handleSaveTitle}
              className="p-1 bg-[#2F6BFF] rounded-lg text-white hover:bg-[#2159E6]"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => setIsEditingTitle(true)}
            className="flex items-center justify-between cursor-pointer group"
          >
            <span className="text-xs font-semibold truncate">
              {currentNotebook.title || 'Untitled Notebook'}
            </span>
            <Edit2 className="w-3.5 h-3.5 text-[var(--color-text-muted)] group-hover:text-[#2F6BFF]" />
          </div>
        )}
      </div>

      {/* Menu Actions */}
      <div className="flex flex-col gap-0.5 text-xs">
        {/* Toggle Favorite */}
        <button
          onClick={() => {
            toggleFavoriteNotebook();
            onClose();
          }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
        >
          <Star className={`w-4 h-4 ${currentNotebook.favorite ? 'text-[#2F6BFF] fill-[#2F6BFF]' : 'text-[var(--color-text-muted)]'}`} />
          <span>{currentNotebook.favorite ? 'Favorited' : 'Add to Favorites'}</span>
        </button>

        {/* Paper Settings */}
        <button
          onClick={() => {
            onClose();
            openModal('paperSettings');
          }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
        >
          <Sliders className="w-4 h-4 text-[#2F6BFF]" />
          <span>Paper Settings...</span>
        </button>

        {/* Export */}
        <button
          onClick={() => {
            onClose();
            openModal('export');
          }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
        >
          <Download className="w-4 h-4 text-[#2F6BFF]" />
          <span>Export Options...</span>
        </button>

        <div className="h-px bg-[var(--color-border)] my-1" />

        {/* Move to Trash */}
        <button
          onClick={() => {
            if (window.confirm('Move this notebook to trash?')) {
              onClose();
              useNotebookStore.getState().deleteNotebook(currentNotebook._id || currentNotebook.id);
            }
          }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Move to Trash</span>
        </button>
      </div>
    </div>
  );
}
