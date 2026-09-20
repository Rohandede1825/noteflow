import React, { useState, useRef, useEffect } from 'react';
import { useNotebookStore } from '../../store/useNotebookStore';
import { useToolStore, QUICK_PEN_COLORS, LASER_COLORS, QUICK_PEN_WIDTHS } from '../../store/useToolStore';
import { useUIStore } from '../../store/useUIStore';
import {
  Wand2,
  Pen,
  Highlighter,
  Eraser,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  GripVertical,
  ZoomIn,
  ZoomOut,
  X,
  Presentation,
  Plus,
  Undo2,
  Redo2,
  Trash2
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

// 1. Realistic Fountain / Stylus Pen Icon
function StylusPenIcon({ color = '#2F6BFF', isActive }) {
  return (
    <div className={`relative flex flex-col items-center justify-center transition-all duration-200 ${isActive ? '-translate-y-1 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}>
      <svg width="22" height="28" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Pen Barrel Upper */}
        <path d="M7 2H17V12H7V2Z" fill="#3A3D45" rx="1.5" />
        <rect x="8" y="3" width="8" height="2" fill="#525661" rx="0.5" />
        {/* Pen Grip Section */}
        <path d="M7 12H17L15.5 20H8.5L7 12Z" fill="#25272D" />
        {/* Nib Collar (Metallic) */}
        <rect x="9" y="19.5" width="6" height="2" fill="#D1D5DB" rx="0.5" />
        {/* Fountain Nib Cone */}
        <path d="M9 21.5L12 29L15 21.5H9Z" fill={color} />
        {/* Nib Metal Highlight & Slit */}
        <line x1="12" y1="22" x2="12" y2="28" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" />
        <circle cx="12" cy="24" r="0.75" fill="#FFFFFF" />
      </svg>
      {/* Active Glow Dot under the pen */}
      <span className="w-1.5 h-1.5 rounded-full mt-0.5 shadow-sm" style={{ backgroundColor: color }} />
    </div>
  );
}

// 2. Chisel Highlighter Marker Icon
function HighlighterIcon({ color = '#FACC15', isActive }) {
  return (
    <div className={`relative flex flex-col items-center justify-center transition-all duration-200 ${isActive ? '-translate-y-1 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}>
      <svg width="22" height="28" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Marker Body */}
        <rect x="6" y="2" width="12" height="14" rx="2" fill="#2E3038" />
        <rect x="7.5" y="4" width="9" height="10" rx="1" fill={color} fillOpacity="0.85" />
        {/* Chisel Collar */}
        <path d="M8 16H16L15 21H9L8 16Z" fill="#1C1E23" />
        {/* Angled Chisel Tip */}
        <path d="M9 21L15 22L13.5 28L10.5 28L9 21Z" fill={color} />
      </svg>
      <span className="w-1.5 h-1.5 rounded-full mt-0.5 shadow-sm" style={{ backgroundColor: color }} />
    </div>
  );
}

// 3. Laser Pointer Beam Icon
function LaserBeamIcon({ color = '#EF4444', isActive }) {
  return (
    <div className={`relative flex flex-col items-center justify-center transition-all duration-200 ${isActive ? '-translate-y-1 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}>
      <svg width="22" height="28" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Laser Torch Body */}
        <rect x="9" y="3" width="6" height="18" rx="1.5" fill="#374151" />
        <rect x="9.5" y="5" width="5" height="4" fill="#1F2937" rx="0.5" />
        {/* Button */}
        <circle cx="12" cy="12" r="1" fill={color} />
        {/* Emitter Tip */}
        <path d="M10 21H14L12.5 25H11.5L10 21Z" fill="#9CA3AF" />
        {/* Beam Glow Dot */}
        <circle cx="12" cy="27.5" r="2.5" fill={color} />
        <circle cx="12" cy="27.5" r="1" fill="#FFFFFF" />
      </svg>
      <span className="w-1.5 h-1.5 rounded-full mt-0.5 shadow-sm" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
    </div>
  );
}

// 4. Rubber Block Eraser Icon
function RubberEraserIcon({ isActive }) {
  return (
    <div className={`relative flex flex-col items-center justify-center transition-all duration-200 ${isActive ? '-translate-y-1 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}>
      <svg width="22" height="28" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Cardboard Sleeve */}
        <path d="M6 5H18V17H6V5Z" fill="#2563EB" rx="1.5" />
        <line x1="8" y1="11" x2="16" y2="11" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
        {/* Angled Rubber Tip (Pink / White) */}
        <path d="M6 17H18L16.5 26.5L7.5 26.5L6 17Z" fill="#F472B6" />
        <path d="M7.5 24H16.5L16 26.5H8L7.5 24Z" fill="#FFFFFF" />
      </svg>
      <span className="w-1.5 h-1.5 rounded-full mt-0.5 bg-pink-400 shadow-sm" />
    </div>
  );
}

// 5. Right-Side Stylus Scroller for Fullscreen/Teacher Mode
function RightSideScroller({ pages, currentPageIndex, onSelectPage, zoomLevel, panOffset, setPanOffset }) {
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverPage, setHoverPage] = useState(null);
  const totalPages = pages.length || 1;
  const PAGE_GAP = 32;

  // Calculate total doc height
  let totalDocHeight = 0;
  const pageOffsets = [];
  for (let i = 0; i < pages.length; i++) {
    const h = pages[i]?.height || 960;
    pageOffsets.push({ top: totalDocHeight, height: h });
    totalDocHeight += h + PAGE_GAP;
  }
  totalDocHeight = totalDocHeight > 0 ? totalDocHeight - PAGE_GAP : 960;
  const scaledHeight = totalDocHeight * zoomLevel;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  // Max and Min pan
  const maxPanY = 40;
  const minPanY = Math.min(40, viewportHeight - scaledHeight - 80);
  const totalPanRange = Math.max(1, maxPanY - minPanY);

  // Current scroll progress (0.0 to 1.0)
  const scrollProgress = Math.max(0, Math.min(1, (maxPanY - panOffset.y) / totalPanRange));

  const handlePointerDown = (e) => {
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    setIsDragging(true);
    handlePointerMove(e);
  };

  const handlePointerMove = (e) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clampedY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const fraction = clampedY / rect.height;

    // Calculate target pan
    const targetPanY = maxPanY - fraction * totalPanRange;
    setPanOffset(prev => ({ ...prev, y: targetPanY }));

    // Estimate page index under cursor
    const estimatedDocY = fraction * totalDocHeight;
    let targetIdx = 0;
    for (let i = 0; i < pageOffsets.length; i++) {
      if (estimatedDocY >= pageOffsets[i].top && estimatedDocY <= pageOffsets[i].top + pageOffsets[i].height + PAGE_GAP) {
        targetIdx = i;
        break;
      }
    }
    setHoverPage(targetIdx + 1);
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    setHoverPage(null);
    try {
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch (_) {}
  };

  const scrollStep = (direction) => {
    const step = 220 * zoomLevel;
    const nextY = direction === 'up'
      ? Math.min(maxPanY, panOffset.y + step)
      : Math.max(minPanY, panOffset.y - step);
    setPanOffset(prev => ({ ...prev, y: nextY }));
  };

  return (
    <div
      className="fixed right-3.5 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center select-none"
      style={{ touchAction: 'none' }}
    >
      {/* Live Tooltip when dragging with pen */}
      {isDragging && hoverPage && (
        <div className="absolute right-14 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#1e2025]/95 backdrop-blur-md border border-blue-500/50 shadow-floating text-white text-xs font-bold whitespace-nowrap animate-in fade-in zoom-in-95 pointer-events-none">
          Page {hoverPage} of {totalPages}
        </div>
      )}

      {/* Main Scroller Capsule */}
      <div className="flex flex-col items-center py-2.5 px-1.5 rounded-full bg-[#1c1d22]/90 backdrop-blur-2xl border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.6)] text-neutral-300 gap-2 w-9 md:w-10">
        {/* Scroll Up Button */}
        <button
          onClick={() => scrollStep('up')}
          className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Scroll Up"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        {/* Scroll Track */}
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={isDragging ? handlePointerMove : undefined}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative w-2.5 h-64 md:h-72 rounded-full bg-white/5 border border-white/10 cursor-pointer flex flex-col items-center justify-between py-1"
          title="Drag with stylus pen or touch to scroll pages"
        >
          {/* Page Marker Dots */}
          {Array.from({ length: totalPages }).map((_, idx) => (
            <div
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPage(idx);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                idx === currentPageIndex
                  ? 'bg-blue-400 scale-125 ring-2 ring-blue-500/50'
                  : 'bg-white/20 hover:bg-white/50'
              }`}
            />
          ))}

          {/* Draggable Pen Thumb */}
          <div
            style={{
              position: 'absolute',
              top: `calc(${scrollProgress * 100}% - ${scrollProgress * 36}px)`,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '18px',
              height: '36px'
            }}
            className={`rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-shadow ${
              isDragging
                ? 'bg-gradient-to-b from-[#3D78FF] to-[#204BB5] ring-2 ring-white/60 shadow-[0_0_12px_rgba(47,107,255,0.8)] scale-110'
                : 'bg-gradient-to-b from-[#33353D] to-[#202127] border border-white/25 hover:border-blue-400 shadow-md'
            }`}
          >
            <GripVertical className="w-3 h-3 text-white/80" />
          </div>
        </div>

        {/* Scroll Down Button */}
        <button
          onClick={() => scrollStep('down')}
          className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Scroll Down"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function TeachingOverlay() {
  const { isTeachingMode, setTeachingMode, zoomLevel, setZoomLevel, panOffset, setPanOffset, addToast, openModal } = useUIStore();
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

  // Tool click / re-click / double-click handler
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
        <div className="mb-3 w-80 bg-[#1e2126]/98 backdrop-blur-2xl border border-neutral-700/90 rounded-2xl shadow-floating p-3.5 flex flex-col gap-3 text-neutral-200 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-neutral-700/60 pb-2">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <Pen className="w-3.5 h-3.5" /> Pen Settings
            </span>
            <button
              onClick={() => setActiveMenu(null)}
              className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white"
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
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold text-left transition-all ${
                    penType === t.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300'
                  }`}
                >
                  <div>{t.label}</div>
                  <div className="text-[9px] opacity-70 font-normal">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Pen Colors */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Color</span>
            <div className="flex items-center gap-2 flex-wrap">
              {QUICK_PEN_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setPenColor(c)}
                  className={`w-6 h-6 rounded-full border transition-transform ${
                    penColor.toLowerCase() === c.toLowerCase()
                      ? 'scale-125 ring-2 ring-blue-400 ring-offset-2 ring-offset-neutral-900 border-white'
                      : 'border-white/20 hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Pen Width Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400">
              <span>SIZE</span>
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
        <div className="mb-3 w-80 bg-[#1e2126]/98 backdrop-blur-2xl border border-neutral-700/90 rounded-2xl shadow-floating p-3.5 flex flex-col gap-3 text-neutral-200 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-neutral-700/60 pb-2">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Highlighter className="w-3.5 h-3.5" /> Highlighter Settings
            </span>
            <button
              onClick={() => setActiveMenu(null)}
              className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Highlighter Colors */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Color</span>
            <div className="flex items-center gap-2 flex-wrap">
              {HIGHLIGHTER_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setHighlighterColor(c.hex)}
                  className={`w-6 h-6 rounded-full border transition-transform ${
                    highlighterColor.toLowerCase() === c.hex.toLowerCase()
                      ? 'scale-125 ring-2 ring-amber-400 ring-offset-2 ring-offset-neutral-900 border-white'
                      : 'border-white/20 hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
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
              <span>INTENSITY</span>
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
        <div className="mb-3 w-80 bg-[#1e2126]/98 backdrop-blur-2xl border border-neutral-700/90 rounded-2xl shadow-floating p-3.5 flex flex-col gap-3 text-neutral-200 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-neutral-700/60 pb-2">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5" /> Laser Pointer Settings
            </span>
            <button
              onClick={() => setActiveMenu(null)}
              className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Laser Colors */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Glow Color</span>
            <div className="flex items-center gap-2 flex-wrap">
              {LASER_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setLaserColor(c.hex)}
                  className={`w-6 h-6 rounded-full border transition-transform ${
                    laserColor.toLowerCase() === c.hex.toLowerCase()
                      ? 'scale-125 ring-2 ring-rose-400 ring-offset-2 ring-offset-neutral-900 border-white'
                      : 'border-white/20 hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
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
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300'
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
        <div className="mb-3 w-80 bg-[#1e2126]/98 backdrop-blur-2xl border border-neutral-700/90 rounded-2xl shadow-floating p-3.5 flex flex-col gap-3 text-neutral-200 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-neutral-700/60 pb-2">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <Eraser className="w-3.5 h-3.5" /> Eraser Settings
            </span>
            <button
              onClick={() => setActiveMenu(null)}
              className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white"
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
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                Standard Eraser
              </button>
              <button
                onClick={() => setEraserMode('object')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all ${
                  eraserMode === 'object'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300'
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
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300'
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
      {/* Main Teacher Mode Floating Dock (Goodnotes Stationery Style) */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#202126]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-neutral-200 select-none">
        {/* Badge / Title */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-xs font-bold text-purple-300">
          <Presentation className="w-4 h-4 text-purple-300" />
          <span className="hidden md:inline">Teacher Mode</span>
        </div>

        <div className="h-6 w-px bg-white/10" />

        {/* 1. Stationery Pen Tray */}
        <div className="flex items-center gap-1.5 bg-black/25 px-2 py-1 rounded-xl border border-white/5">
          {/* Laser Pointer */}
          <button
            onClick={() => handleToolClick('laser')}
            className={`p-2 rounded-xl transition-all relative ${
              activeTool === 'laser'
                ? 'bg-white/15 ring-1 ring-rose-400/50 shadow-md'
                : 'hover:bg-white/10'
            }`}
            title="Laser Pointer (Click to select, re-click to customize color & size)"
          >
            <LaserBeamIcon color={laserColor} isActive={activeTool === 'laser'} />
          </button>

          {/* Pen / Stylus */}
          <button
            onClick={() => handleToolClick('pen')}
            className={`p-2 rounded-xl transition-all relative ${
              activeTool === 'pen'
                ? 'bg-white/15 ring-1 ring-blue-400/50 shadow-md'
                : 'hover:bg-white/10'
            }`}
            title="Pen (Click to select, re-click to customize color, size & style)"
          >
            <StylusPenIcon color={penColor} isActive={activeTool === 'pen'} />
          </button>

          {/* Highlighter */}
          <button
            onClick={() => handleToolClick('highlighter')}
            className={`p-2 rounded-xl transition-all relative ${
              activeTool === 'highlighter'
                ? 'bg-white/15 ring-1 ring-yellow-400/50 shadow-md'
                : 'hover:bg-white/10'
            }`}
            title="Highlighter (Click to select, re-click to customize color & width)"
          >
            <HighlighterIcon color={highlighterColor} isActive={activeTool === 'highlighter'} />
          </button>

          {/* Eraser */}
          <button
            onClick={() => handleToolClick('eraser')}
            className={`p-2 rounded-xl transition-all relative ${
              activeTool === 'eraser'
                ? 'bg-white/15 ring-1 ring-pink-400/50 shadow-md'
                : 'hover:bg-white/10'
            }`}
            title="Eraser (Click to select, re-click to customize size & mode)"
          >
            <RubberEraserIcon isActive={activeTool === 'eraser'} />
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

      {/* ------------------------------------------------------------- */}
      {/* Right-Side Stylus Scroller Track (Smooth Multi-Page Drag) */}
      {/* ------------------------------------------------------------- */}
      <RightSideScroller
        pages={pages}
        currentPageIndex={currentPageIndex}
        onSelectPage={(pageIdx) => {
          useNotebookStore.setState({ targetScrollPageIndex: pageIdx, currentPageIndex: pageIdx, currentPage: pages[pageIdx] });
        }}
        zoomLevel={zoomLevel}
        panOffset={panOffset}
        setPanOffset={setPanOffset}
      />
    </div>
  );
}
