import React, { useState, useRef, useEffect } from 'react';
import { useNotebookStore } from '../../store/useNotebookStore';
import {
  useToolStore,
  QUICK_PEN_COLORS,
  FULL_COLOR_PALETTE,
  LASER_COLORS,
  QUICK_PEN_WIDTHS
} from '../../store/useToolStore';
import { useUIStore } from '../../store/useUIStore';
import {
  Wand2,
  Pen,
  Highlighter,
  Eraser,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  X,
  Presentation,
  Plus,
  Undo2,
  Redo2,
  Trash2,
  Palette
} from 'lucide-react';

const PEN_TYPES = [
  { id: 'ball', label: 'Ball Pen', desc: 'Crisp & Predictable' },
  { id: 'fountain', label: 'Fountain', desc: 'Calligraphic Flair' },
  { id: 'brush', label: 'Brush', desc: 'Pressure Lettering' },
  { id: 'pencil', label: 'Pencil', desc: 'Soft & Textured' }
];

const HIGHLIGHTER_COLORS = [
  { hex: '#FACC15', label: 'Yellow' },
  { hex: '#4ADE80', label: 'Green' },
  { hex: '#38BDF8', label: 'Blue' },
  { hex: '#C084FC', label: 'Purple' },
  { hex: '#F472B6', label: 'Pink' },
  { hex: '#FB923C', label: 'Orange' }
];

const ERASER_SIZES = [
  { id: 'small', label: 'Small', radius: 8 },
  { id: 'medium', label: 'Medium', radius: 18 },
  { id: 'large', label: 'Large', radius: 32 },
  { id: 'xlarge', label: 'X-Large', radius: 52 }
];

const LASER_SIZES = [
  { id: 'fine', label: 'Fine', width: 4 },
  { id: 'standard', label: 'Standard', width: 8 },
  { id: 'broad', label: 'Broad', width: 14 },
  { id: 'intense', label: 'Intense', width: 22 }
];

export function TeachingOverlay() {
  const { isTeachingMode, setTeachingMode, zoomLevel, setZoomLevel, addToast, openModal } = useUIStore();
  const {
    activeTool,
    setActiveTool,
    penType,
    setPenType,
    penColor,
    setPenColor,
    penWidth,
    setPenWidth,
    strokeStrength,
    setStrokeStrength,
    highlighterColor,
    setHighlighterColor,
    highlighterWidth,
    setHighlighterWidth,
    highlighterOpacity,
    setHighlighterOpacity,
    eraserMode,
    setEraserMode,
    eraserSize,
    setEraserSize,
    laserColor,
    setLaserColor,
    laserWidth,
    setLaserWidth
  } = useToolStore();

  const {
    pages,
    currentPageIndex,
    setCurrentPageIndex,
    addPage,
    undo,
    redo,
    undoStack,
    redoStack
  } = useNotebookStore();

  // Active popup menu in Teacher Mode ('pen' | 'highlighter' | 'laser' | 'eraser' | null)
  const [activeMenu, setActiveMenu] = useState(null);
  const menuContainerRef = useRef(null);

  // Close any active menu when clicking anywhere on screen or canvas
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    if (activeMenu) {
      window.addEventListener('pointerdown', handleOutsideClick, true);
    }
    return () => window.removeEventListener('pointerdown', handleOutsideClick, true);
  }, [activeMenu]);

  if (!isTeachingMode) return null;

  const totalPages = pages.length || 1;
  const currentNum = currentPageIndex + 1;
  const canUndo = (undoStack || []).length > 0;
  const canRedo = (redoStack || []).length > 0;

  const handlePrev = () => {
    if (currentPageIndex > 0) setCurrentPageIndex(currentPageIndex - 1);
  };

  const handleNext = () => {
    if (currentPageIndex < pages.length - 1) setCurrentPageIndex(currentPageIndex + 1);
  };

  // Tool click / re-click handler
  const handleToolClick = (toolName) => {
    if (activeTool === toolName) {
      // Re-click on active tool toggles its customization popup
      setActiveMenu(activeMenu === toolName ? null : toolName);
    } else {
      setActiveTool(toolName);
      setActiveMenu(null);
    }
  };

  const handleAddNewPage = async () => {
    try {
      const newPage = await addPage();
      if (newPage) {
        addToast('New page added to presentation', 'success', 2000);
      }
    } catch (err) {
      console.error('Failed to add page in Teacher Mode:', err);
    }
  };

  return (
    <div
      ref={menuContainerRef}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center select-none animate-in slide-in-from-bottom-5 duration-200"
    >
      {/* ------------------------------------------------------------- */}
      {/* Floating Customization Popups (Pen, Highlighter, Laser, Eraser) */}
      {/* ------------------------------------------------------------- */}
      {activeMenu === 'pen' && (
        <div className="mb-3 w-84 bg-[#1c1e24]/98 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-floating p-4 flex flex-col gap-3.5 text-neutral-200 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <Pen className="w-3.5 h-3.5" /> Pen Settings
            </span>
            <button
              onClick={() => setActiveMenu(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Pen Style */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Style</span>
            <div className="grid grid-cols-2 gap-1.5">
              {PEN_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setPenType(t.id)}
                  className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                    penType === t.id
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-300'
                  }`}
                >
                  <div>{t.label}</div>
                  <div className="text-[9px] opacity-70 font-normal">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Pen Colors + Custom Multicolor Picker */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              <span>Color Palette</span>
              <span className="font-mono text-white/80 lowercase">{penColor}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {FULL_COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setPenColor(c)}
                  className={`w-6 h-6 rounded-full border transition-transform ${
                    penColor.toLowerCase() === c.toLowerCase()
                      ? 'scale-125 ring-2 ring-blue-400 ring-offset-2 ring-offset-neutral-900 border-white shadow-sm'
                      : 'border-white/20 hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}

              {/* Custom Multicolor Rainbow Picker Button */}
              <label
                className="relative w-6 h-6 rounded-full border-2 border-white/40 hover:scale-125 cursor-pointer flex items-center justify-center overflow-hidden shadow-md transition-transform bg-[conic-gradient(from_0deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)]"
                title="Choose Custom Color"
              >
                <input
                  type="color"
                  value={penColor.startsWith('#') && penColor.length === 7 ? penColor : '#38BDF8'}
                  onChange={(e) => setPenColor(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
                <Plus className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] stroke-[3]" />
              </label>
            </div>
          </div>

          {/* Pen Width Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400">
              <span>STROKE WIDTH</span>
              <span className="text-white font-mono">{penWidth} px</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={penWidth}
              onChange={(e) => setPenWidth(parseFloat(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer h-1.5 bg-neutral-700 rounded-lg"
            />
          </div>

          {/* Stroke Strength */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400">
              <span>INK STRENGTH</span>
              <span className="text-white font-mono">{Math.round(strokeStrength * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="1.8"
              step="0.1"
              value={strokeStrength}
              onChange={(e) => setStrokeStrength(parseFloat(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer h-1.5 bg-neutral-700 rounded-lg"
            />
          </div>
        </div>
      )}

      {activeMenu === 'highlighter' && (
        <div className="mb-3 w-84 bg-[#1c1e24]/98 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-floating p-4 flex flex-col gap-3.5 text-neutral-200 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Highlighter className="w-3.5 h-3.5" /> Highlighter Settings
            </span>
            <button
              onClick={() => setActiveMenu(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Highlighter Colors + Custom Multicolor Picker */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              <span>Highlight Tint</span>
              <span className="font-mono text-white/80 lowercase">{highlighterColor}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {HIGHLIGHTER_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setHighlighterColor(c.hex)}
                  className={`w-6 h-6 rounded-full border transition-transform ${
                    highlighterColor.toLowerCase() === c.hex.toLowerCase()
                      ? 'scale-125 ring-2 ring-amber-400 ring-offset-2 ring-offset-neutral-900 border-white shadow-sm'
                      : 'border-white/20 hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}

              {/* Custom Multicolor Rainbow Picker Button */}
              <label
                className="relative w-6 h-6 rounded-full border-2 border-white/40 hover:scale-125 cursor-pointer flex items-center justify-center overflow-hidden shadow-md transition-transform bg-[conic-gradient(from_0deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)]"
                title="Choose Custom Highlighter Color"
              >
                <input
                  type="color"
                  value={highlighterColor.startsWith('#') && highlighterColor.length === 7 ? highlighterColor : '#FACC15'}
                  onChange={(e) => setHighlighterColor(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
                <Plus className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] stroke-[3]" />
              </label>
            </div>
          </div>

          {/* Highlighter Width Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400">
              <span>WIDTH</span>
              <span className="text-white font-mono">{highlighterWidth} px</span>
            </div>
            <input
              type="range"
              min="10"
              max="44"
              step="2"
              value={highlighterWidth}
              onChange={(e) => setHighlighterWidth(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-700 rounded-lg"
            />
          </div>

          {/* Highlighter Opacity */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400">
              <span>OPACITY / INTENSITY</span>
              <span className="text-white font-mono">{Math.round(highlighterOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="0.8"
              step="0.05"
              value={highlighterOpacity}
              onChange={(e) => setHighlighterOpacity(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-700 rounded-lg"
            />
          </div>
        </div>
      )}

      {activeMenu === 'laser' && (
        <div className="mb-3 w-84 bg-[#1c1e24]/98 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-floating p-4 flex flex-col gap-3.5 text-neutral-200 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5" /> Laser Pointer Settings
            </span>
            <button
              onClick={() => setActiveMenu(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Laser Colors + Custom Multicolor Picker */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              <span>Beam Glow Color</span>
              <span className="font-mono text-white/80 lowercase">{laserColor}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {LASER_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setLaserColor(c.hex)}
                  className={`w-6 h-6 rounded-full border transition-transform ${
                    laserColor.toLowerCase() === c.hex.toLowerCase()
                      ? 'scale-125 ring-2 ring-rose-400 ring-offset-2 ring-offset-neutral-900 border-white shadow-sm'
                      : 'border-white/20 hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}

              {/* Custom Multicolor Rainbow Picker Button */}
              <label
                className="relative w-6 h-6 rounded-full border-2 border-white/40 hover:scale-125 cursor-pointer flex items-center justify-center overflow-hidden shadow-md transition-transform bg-[conic-gradient(from_0deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)]"
                title="Choose Custom Laser Glow Color"
              >
                <input
                  type="color"
                  value={laserColor.startsWith('#') && laserColor.length === 7 ? laserColor : '#EF4444'}
                  onChange={(e) => setLaserColor(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
                <Plus className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] stroke-[3]" />
              </label>
            </div>
          </div>

          {/* Laser Beam Size */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Beam Size</span>
            <div className="grid grid-cols-4 gap-1.5">
              {LASER_SIZES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setLaserWidth(s.width)}
                  className={`py-1.5 px-1 rounded-xl text-xs font-semibold text-center transition-all ${
                    laserWidth === s.width
                      ? 'bg-rose-600 text-white shadow-sm font-bold'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeMenu === 'eraser' && (
        <div className="mb-3 w-80 bg-[#1c1e24]/98 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-floating p-4 flex flex-col gap-3.5 text-neutral-200 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <Eraser className="w-3.5 h-3.5" /> Eraser Settings
            </span>
            <button
              onClick={() => setActiveMenu(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Eraser Mode */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Mode</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setEraserMode('pixel')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all ${
                  eraserMode === 'pixel'
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'bg-white/5 hover:bg-white/10 text-neutral-300'
                }`}
              >
                Standard Eraser
              </button>
              <button
                onClick={() => setEraserMode('object')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all ${
                  eraserMode === 'object'
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'bg-white/5 hover:bg-white/10 text-neutral-300'
                }`}
              >
                Stroke / Object
              </button>
            </div>
          </div>

          {/* Eraser Size */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Size</span>
            <div className="grid grid-cols-4 gap-1.5">
              {ERASER_SIZES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setEraserSize(s.id)}
                  className={`py-1.5 px-1 rounded-xl text-xs font-semibold text-center transition-all ${
                    eraserSize === s.id
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Clear Page */}
          <button
            onClick={() => {
              setActiveMenu(null);
              openModal('clearPageConfirm', { pageIndex: currentPageIndex });
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors mt-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Current Page</span>
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Main Teacher Mode Floating Dock (Same Icons as Normal Toolbar) */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#1c1d22]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-neutral-200 select-none">
        {/* Badge / Title */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-xs font-bold text-purple-300">
          <Presentation className="w-4 h-4 text-purple-300" />
          <span className="hidden md:inline">Teacher Mode</span>
        </div>

        <div className="h-6 w-px bg-white/10" />

        {/* 1. Core Teaching Instruments */}
        <div className="flex items-center gap-1">
          {/* Laser Pointer */}
          <button
            onClick={() => handleToolClick('laser')}
            className={`p-2.5 rounded-xl transition-all relative flex items-center justify-center ${
              activeTool === 'laser'
                ? 'bg-[#E3EDFC] text-[#204272] shadow-sm font-bold'
                : 'text-neutral-300 hover:text-white hover:bg-white/10'
            }`}
            title="Laser Pointer (Click to select, re-click to customize color & size)"
          >
            <Wand2 className="w-[19px] h-[19px]" />
            <span
              className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-black/40 shadow-sm"
              style={{ backgroundColor: laserColor }}
            />
          </button>

          {/* Pen / Stylus */}
          <button
            onClick={() => handleToolClick('pen')}
            className={`p-2.5 rounded-xl transition-all relative flex items-center justify-center ${
              activeTool === 'pen'
                ? 'bg-[#E3EDFC] text-[#204272] shadow-sm font-bold'
                : 'text-neutral-300 hover:text-white hover:bg-white/10'
            }`}
            title="Pen (Click to select, re-click to customize style, color & size)"
          >
            <Pen className="w-[19px] h-[19px]" />
            <span
              className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-black/40 shadow-sm"
              style={{ backgroundColor: penColor }}
            />
          </button>

          {/* Highlighter */}
          <button
            onClick={() => handleToolClick('highlighter')}
            className={`p-2.5 rounded-xl transition-all relative flex items-center justify-center ${
              activeTool === 'highlighter'
                ? 'bg-[#E3EDFC] text-[#204272] shadow-sm font-bold'
                : 'text-neutral-300 hover:text-white hover:bg-white/10'
            }`}
            title="Highlighter (Click to select, re-click to customize color & width)"
          >
            <Highlighter className="w-[19px] h-[19px]" />
            <span
              className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-black/40 shadow-sm"
              style={{ backgroundColor: highlighterColor }}
            />
          </button>

          {/* Eraser */}
          <button
            onClick={() => handleToolClick('eraser')}
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
              activeTool === 'eraser'
                ? 'bg-[#E3EDFC] text-[#204272] shadow-sm font-bold'
                : 'text-neutral-300 hover:text-white hover:bg-white/10'
            }`}
            title="Eraser (Click to select, re-click to change size & mode)"
          >
            <Eraser className="w-[19px] h-[19px]" />
          </button>
        </div>

        <div className="h-6 w-px bg-white/10" />

        {/* 2. Undo & Redo */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`p-2 rounded-xl transition-all ${
              canUndo
                ? 'text-neutral-300 hover:text-white hover:bg-white/10'
                : 'text-neutral-600 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`p-2 rounded-xl transition-all ${
              canRedo
                ? 'text-neutral-300 hover:text-white hover:bg-white/10'
                : 'text-neutral-600 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-white/10" />

        {/* 3. Add New Page Button */}
        <button
          onClick={handleAddNewPage}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#2F6BFF] to-[#1E50D8] hover:from-[#3D78FF] hover:to-[#2A5CE6] text-white text-xs font-bold shadow-md transition-all active:scale-95 border border-white/15"
          title="Add New Blank Page"
        >
          <Plus className="w-4 h-4 text-white" />
          <span className="hidden md:inline">Add Page</span>
        </button>

        <div className="h-6 w-px bg-white/10" />

        {/* 4. Page Stepper Navigation */}
        <div className="flex items-center gap-1 bg-black/30 px-2.5 py-1.5 rounded-xl border border-white/10">
          <button
            onClick={handlePrev}
            disabled={currentPageIndex <= 0}
            className="p-1 rounded-lg text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold px-2 font-mono text-neutral-200">
            {currentNum} <span className="text-neutral-500">/</span> {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPageIndex >= pages.length - 1}
            className="p-1 rounded-lg text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-white/10" />

        {/* 5. Zoom Stepper */}
        <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-xl border border-white/10">
          <button
            onClick={() => setZoomLevel(Math.max(0.3, zoomLevel - 0.15))}
            className="p-1 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(1.0)}
            className="px-2 py-0.5 text-[11px] font-mono font-semibold text-neutral-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            title="Reset Zoom to 100%"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button
            onClick={() => setZoomLevel(Math.min(3.0, zoomLevel + 0.15))}
            className="p-1 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-6 w-px bg-white/10" />

        {/* 6. Exit button */}
        <button
          onClick={() => {
            setTeachingMode(false);
            if (document.fullscreenElement && document.exitFullscreen) {
              document.exitFullscreen().catch(() => {});
            }
          }}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white text-xs font-semibold transition-colors border border-white/10"
          title="Exit Teaching Mode (Escape)"
        >
          <X className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>
      </div>
    </div>
  );
}
