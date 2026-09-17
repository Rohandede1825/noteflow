import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotebookStore } from '../../store/useNotebookStore';
import { useUIStore } from '../../store/useUIStore';
import {
  Star,
  ChevronDown,
  BookOpen,
  Copy,
  Trash2
} from 'lucide-react';

export function NotebookCard({ notebook, onRefresh }) {
  const navigate = useNavigate();
  const { setCurrentNotebook, toggleFavoriteNotebook, deleteNotebook, duplicateNotebook } = useNotebookStore();
  const { addToast } = useUIStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isMenuOpen]);

  const handleOpen = async () => {
    await setCurrentNotebook(notebook._id || notebook.id);
    navigate(`/notebook/${notebook._id || notebook.id}`);
  };

  const handleFavorite = (e) => {
    e.stopPropagation();
    toggleFavoriteNotebook(notebook._id || notebook.id);
    addToast(notebook.favorite ? 'Removed from favorites' : 'Added to favorites', 'info');
  };

  const handleDuplicate = async (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    await duplicateNotebook(notebook._id || notebook.id);
    if (onRefresh) onRefresh();
    addToast('Notebook duplicated', 'success');
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (window.confirm(`Move "${notebook.title}" to trash?`)) {
      await deleteNotebook(notebook._id || notebook.id, false);
      if (onRefresh) onRefresh();
      addToast('Notebook moved to trash', 'info');
    }
  };

  const template = notebook.pageTemplate || 'ruled';
  const paperColor = notebook.templateConfig?.paperColor || (notebook.theme === 'dark' ? 'dark' : 'white');
  const isDark = paperColor === 'dark' || template === 'ruled';

  const dateStr = notebook.updatedAt
    ? new Date(notebook.updatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) + ' at ' + new Date(notebook.updatedAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : 'Sep 16, 2026 at 10:17 PM';

  return (
    <div
      onClick={handleOpen}
      className="group relative flex flex-col items-start cursor-pointer select-none transition-all duration-150 hover:-translate-y-1 w-44"
    >
      {/* 1. Goodnotes Style Notebook Thumbnail Card */}
      <div
        className={`relative w-44 h-56 rounded-2xl p-4 flex flex-col justify-between overflow-hidden shadow-xl border ${
          isDark
            ? 'bg-[#292b2e] border-white/10 text-white'
            : 'bg-white border-neutral-200 text-neutral-800'
        }`}
      >
        {/* Left Binding Spine on Dark Notebooks (Exact Goodnotes match from Image 1) */}
        {isDark && (
          <div className="absolute left-0 top-0 bottom-0 w-3.5 bg-[#1f2022] border-r border-white/10" />
        )}

        {/* Textured Ruled Lines Preview */}
        <div className={`absolute inset-0 pointer-events-none ${isDark ? 'pl-6 pr-3 pt-6' : 'px-4 pt-6'} flex flex-col gap-3.5 opacity-70`}>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`w-full h-px ${isDark ? 'bg-[#3f4348]' : 'bg-[#e2f0fc]'}`}
              style={!isDark && i < 3 ? { height: '10px', backgroundColor: '#e2f0fc', borderRadius: '4px' } : {}}
            />
          ))}
        </div>

        {/* Top-Right Favorite Star Bookmark Icon */}
        <div className="flex items-center justify-end w-full z-10">
          <button
            onClick={handleFavorite}
            className={`p-1 rounded-md transition-colors ${
              notebook.favorite
                ? 'text-amber-400'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Favorite"
          >
            <Star className={`w-4 h-4 ${notebook.favorite ? 'fill-amber-400' : ''}`} />
          </button>
        </div>

        <div />
      </div>

      {/* 2. Metadata underneath card (Title ⌵ and Timestamp) */}
      <div className="flex flex-col items-start w-full pt-2.5 px-0.5" ref={menuRef}>
        <div className="flex items-center justify-between w-full">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="flex items-center gap-1 text-sm font-semibold text-white/95 group-hover:text-blue-400 truncate transition-colors text-left"
          >
            <span className="truncate">{notebook.title || 'Untitled'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-white/60 shrink-0" />
          </button>
        </div>

        <span className="text-[11px] text-neutral-400 font-normal mt-0.5">
          {dateStr}
        </span>

        {/* Dropdown menu */}
        {isMenuOpen && (
          <div className="absolute left-0 bottom-12 z-40 w-44 bg-[#25262B] border border-white/10 rounded-xl shadow-2xl p-1 flex flex-col gap-0.5 text-xs text-white animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={handleOpen}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/10 text-left transition-colors"
            >
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>Open Notebook</span>
            </button>

            <button
              onClick={handleDuplicate}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/10 text-left transition-colors"
            >
              <Copy className="w-4 h-4 text-purple-400" />
              <span>Duplicate</span>
            </button>

            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-rose-400 hover:bg-rose-500/15 text-left transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Move to Trash</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
