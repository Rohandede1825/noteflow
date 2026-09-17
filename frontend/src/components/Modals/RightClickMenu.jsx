import React, { useEffect, useRef } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useNotebookStore } from '../../store/useNotebookStore';
import { useToolStore } from '../../store/useToolStore';
import {
  Undo2,
  Redo2,
  Type,
  Trash2,
  Download,
  Copy,
  Plus
} from 'lucide-react';

export function RightClickMenu() {
  const { contextMenu, closeContextMenu, openModal } = useUIStore();
  const { undo, redo, clearCurrentPage, duplicatePage, addPage } = useNotebookStore();
  const { setActiveTool } = useToolStore();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        closeContextMenu();
      }
    };

    if (contextMenu.isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [contextMenu.isOpen, closeContextMenu]);

  if (!contextMenu.isOpen) return null;

  return (
    <div
      ref={menuRef}
      style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
      className="fixed z-50 w-52 bg-[#1e2126]/95 backdrop-blur-xl border border-neutral-700/80 rounded-2xl shadow-floating p-1.5 flex flex-col gap-0.5 text-xs text-neutral-200 animate-in fade-in zoom-in-95 duration-100"
    >
      <button
        onClick={() => {
          undo();
          closeContextMenu();
        }}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-800 transition-colors"
      >
        <Undo2 className="w-3.5 h-3.5 text-neutral-400" />
        <span>Undo (Ctrl+Z)</span>
      </button>

      <button
        onClick={() => {
          redo();
          closeContextMenu();
        }}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-800 transition-colors"
      >
        <Redo2 className="w-3.5 h-3.5 text-neutral-400" />
        <span>Redo (Ctrl+Shift+Z)</span>
      </button>

      <div className="h-px bg-neutral-800 my-1" />

      <button
        onClick={() => {
          setActiveTool('text');
          closeContextMenu();
        }}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-800 transition-colors"
      >
        <Type className="w-3.5 h-3.5 text-blue-400" />
        <span>Add Text Here</span>
      </button>

      <button
        onClick={() => {
          duplicatePage();
          closeContextMenu();
        }}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-800 transition-colors"
      >
        <Copy className="w-3.5 h-3.5 text-purple-400" />
        <span>Duplicate Page</span>
      </button>

      <button
        onClick={() => {
          addPage();
          closeContextMenu();
        }}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-800 transition-colors"
      >
        <Plus className="w-3.5 h-3.5 text-emerald-400" />
        <span>Insert New Page</span>
      </button>

      <div className="h-px bg-neutral-800 my-1" />

      <button
        onClick={() => {
          closeContextMenu();
          openModal('export');
        }}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-800 transition-colors"
      >
        <Download className="w-3.5 h-3.5 text-blue-400" />
        <span>Export Page...</span>
      </button>

      <button
        onClick={() => {
          if (window.confirm('Clear all drawings and notes on this page?')) {
            clearCurrentPage();
          }
          closeContextMenu();
        }}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Clear Page</span>
      </button>
    </div>
  );
}
