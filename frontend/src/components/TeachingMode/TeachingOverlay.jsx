import React from 'react';
import { useNotebookStore } from '../../store/useNotebookStore';
import { useToolStore } from '../../store/useToolStore';
import { useUIStore } from '../../store/useUIStore';
import {
  Flame,
  PenTool,
  Highlighter,
  Eraser,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  X,
  Presentation
} from 'lucide-react';

export function TeachingOverlay() {
  const { isTeachingMode, setTeachingMode, zoomLevel, setZoomLevel } = useUIStore();
  const { activeTool, setActiveTool } = useToolStore();
  const { pages, currentPageIndex, setCurrentPageIndex } = useNotebookStore();

  if (!isTeachingMode) return null;

  const totalPages = pages.length || 1;
  const currentNum = currentPageIndex + 1;

  const handlePrev = () => {
    if (currentPageIndex > 0) setCurrentPageIndex(currentPageIndex - 1);
  };

  const handleNext = () => {
    if (currentPageIndex < pages.length - 1) setCurrentPageIndex(currentPageIndex + 1);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 p-2 bg-[#18191d]/95 backdrop-blur-xl border border-neutral-700/80 rounded-2xl shadow-floating text-neutral-200 select-none animate-in slide-in-from-bottom-5 duration-200">
      {/* Indicator */}
      <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-purple-400">
        <Presentation className="w-4 h-4" />
        <span className="hidden sm:inline">Teaching Mode</span>
      </div>

      <div className="h-5 w-px bg-neutral-800" />

      {/* Teaching Tools */}
      <div className="flex items-center gap-1">
        {/* Laser */}
        <button
          onClick={() => setActiveTool('laser')}
          className={`p-2 rounded-xl transition-all ${
            activeTool === 'laser'
              ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
              : 'text-neutral-400 hover:text-red-400 hover:bg-neutral-800'
          }`}
          title="Laser Pointer"
        >
          <Flame className="w-4 h-4" />
        </button>

        {/* Pen */}
        <button
          onClick={() => setActiveTool('pen')}
          className={`p-2 rounded-xl transition-all ${
            activeTool === 'pen'
              ? 'bg-blue-600 text-white'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
          title="Pen"
        >
          <PenTool className="w-4 h-4" />
        </button>

        {/* Highlighter */}
        <button
          onClick={() => setActiveTool('highlighter')}
          className={`p-2 rounded-xl transition-all ${
            activeTool === 'highlighter'
              ? 'bg-blue-600 text-white'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
          title="Highlighter"
        >
          <Highlighter className="w-4 h-4" />
        </button>

        {/* Eraser */}
        <button
          onClick={() => setActiveTool('eraser')}
          className={`p-2 rounded-xl transition-all ${
            activeTool === 'eraser'
              ? 'bg-blue-600 text-white'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
          title="Eraser"
        >
          <Eraser className="w-4 h-4" />
        </button>
      </div>

      <div className="h-5 w-px bg-neutral-800" />

      {/* Page Navigation */}
      <div className="flex items-center gap-1 bg-neutral-900/80 px-2 py-1 rounded-xl border border-neutral-800">
        <button
          onClick={handlePrev}
          disabled={currentPageIndex <= 0}
          className="p-1 rounded-lg text-neutral-400 hover:text-white disabled:opacity-30"
          title="Previous Page (ArrowLeft)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-semibold px-2">
          {currentNum} / {totalPages}
        </span>
        <button
          onClick={handleNext}
          disabled={currentPageIndex >= pages.length - 1}
          className="p-1 rounded-lg text-neutral-400 hover:text-white disabled:opacity-30"
          title="Next Page (ArrowRight)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="h-5 w-px bg-neutral-800" />

      {/* Zoom controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setZoomLevel(zoomLevel - 0.15)}
          className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomLevel(zoomLevel + 0.15)}
          className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>

      <div className="h-5 w-px bg-neutral-800" />

      {/* Exit button */}
      <button
        onClick={() => setTeachingMode(false)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold transition-colors"
        title="Exit Teaching Mode (Escape)"
      >
        <X className="w-3.5 h-3.5" />
        <span>Exit</span>
      </button>
    </div>
  );
}
