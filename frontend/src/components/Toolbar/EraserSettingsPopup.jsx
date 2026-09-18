import React, { useEffect, useRef } from 'react';
import { useToolStore } from '../../store/useToolStore';
import { useNotebookStore } from '../../store/useNotebookStore';
import { useUIStore } from '../../store/useUIStore';
import { Eraser, Trash2, Scissors } from 'lucide-react';

export function EraserSettingsPopup() {
  const { activePopup, closePopup, eraserMode, setEraserMode, eraserSize, setEraserSize } = useToolStore();
  const { currentPageIndex } = useNotebookStore();
  const { openModal } = useUIStore();
  const popupRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        if (!e.target.closest('[data-eraser-btn]')) {
          closePopup();
        }
      }
    };
    if (activePopup === 'eraserSettings' || activePopup === 'eraser') {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [activePopup, closePopup]);

  if (activePopup !== 'eraserSettings' && activePopup !== 'eraser') return null;

  return (
    <div
      ref={popupRef}
      className="absolute top-14 left-1/2 -translate-x-1/2 z-40 w-72 bg-[#1e2126]/95 backdrop-blur-xl border border-neutral-700/80 rounded-2xl shadow-floating p-4 flex flex-col gap-4 text-neutral-200 animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      {/* 1. Eraser Mode */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Eraser Mode</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setEraserMode('pixel')}
            className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
              eraserMode === 'pixel'
                ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold'
                : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Eraser className="w-4 h-4 text-blue-400 shrink-0" />
            <div className="text-left">
              <div>Pixel Eraser</div>
              <div className="text-[10px] text-neutral-400 font-normal">Erases touched area</div>
            </div>
          </button>

          <button
            onClick={() => setEraserMode('object')}
            className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
              eraserMode === 'object'
                ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold'
                : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Scissors className="w-4 h-4 text-purple-400 shrink-0" />
            <div className="text-left">
              <div>Object Eraser</div>
              <div className="text-[10px] text-neutral-400 font-normal">Removes entire stroke</div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Eraser Size */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Eraser Size</span>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: 'small', label: 'Small', size: '16px' },
            { id: 'medium', label: 'Medium', size: '36px' },
            { id: 'large', label: 'Large', size: '64px' },
            { id: 'xlarge', label: 'XL', size: '104px' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setEraserSize(item.id)}
              className={`flex flex-col items-center py-2 rounded-xl border text-xs font-medium transition-all ${
                eraserSize === item.id
                  ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold'
                  : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>{item.label}</span>
              <span className="text-[10px] text-neutral-500">{item.size}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Clear Page Action */}
      <div className="pt-2 border-t border-neutral-800">
        <button
          onClick={() => {
            closePopup();
            openModal('clearPageConfirm', { pageIndex: currentPageIndex });
          }}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Entire Page
        </button>
      </div>
    </div>
  );
}
