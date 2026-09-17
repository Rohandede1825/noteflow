import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotebookStore } from '../../store/useNotebookStore';
import { useToolStore, QUICK_PEN_COLORS, QUICK_PEN_WIDTHS } from '../../store/useToolStore';
import { useUIStore } from '../../store/useUIStore';
import { TitleMenu } from './TitleMenu';
import {
  Home,
  X,
  Plus,
  BookOpen,
  Search,
  Bookmark,
  Share2,
  MoreHorizontal,
  Minus,
  Square,
  Lasso,
  Pen,
  Eraser,
  Type,
  Smile,
  Image as ImageIcon,
  Shapes,
  FileText,
  Wand2,
  Mic,
  ChevronDown,
  Palette
} from 'lucide-react';

export function NotebookHeader() {
  const navigate = useNavigate();
  const {
    currentNotebook,
    pages,
    currentPageIndex,
    addPage,
    toggleBookmark,
    currentPage
  } = useNotebookStore();

  const {
    activeTool,
    setActiveTool,
    penColor,
    setPenColor,
    penWidth,
    setPenWidth,
    highlighterColor,
    activePopup,
    setActivePopup
  } = useToolStore();

  const {
    isPageSidebarOpen,
    togglePageSidebar,
    openModal
  } = useUIStore();

  const [isTitleMenuOpen, setIsTitleMenuOpen] = useState(false);
  const fileInputRef = useRef(null);

  const isBookmarked = !!currentPage?.bookmarked;

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target.result;
      const img = new Image();
      img.onload = () => {
        const newImageElement = {
          id: 'elem-img-' + Date.now(),
          type: 'image',
          src: src,
          x: 200,
          y: 200,
          width_box: Math.min(img.width, 600),
          height_box: Math.min(img.height, (600 / img.width) * img.height),
          opacity: 1
        };

        const { currentPage: cp, setElements } = useNotebookStore.getState();
        if (cp) {
          setElements([...(cp.elements || []), newImageElement]);
          useUIStore.getState().addToast('Image added to page', 'success');
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <header className="relative z-40 w-full bg-[#204272] border-b border-[#1b3861] flex flex-col select-none shadow-md">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />

      {/* Row 1: Top Tab Bar & Window Controls */}
      <div className="flex items-center justify-between px-2 pt-1.5 pb-0 bg-[#1a3862] text-white">
        {/* Left: Home Button + Notebook Tab + Add Tab */}
        <div className="flex items-end gap-1.5">
          {/* Home Icon Tab */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center w-8 h-7 mb-0.5 rounded-t-lg bg-[#204272]/70 hover:bg-[#204272] text-white/90 hover:text-white transition-colors"
            title="Return to Library (Home)"
          >
            <Home className="w-4 h-4" />
          </button>

          {/* Active Notebook Tab */}
          <div className="relative flex items-center gap-2 px-3.5 py-1.5 bg-[#204272] rounded-t-xl text-white font-semibold text-xs border-t border-x border-[#2b558f]/40 shadow-sm max-w-[240px]">
            <button
              onClick={() => setIsTitleMenuOpen(!isTitleMenuOpen)}
              className="flex items-center gap-1.5 truncate text-left hover:text-blue-100 transition-colors"
              title="Notebook Options"
            >
              <span className="truncate">{currentNotebook?.title || 'Untitled Notebook (1)'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-white/70 shrink-0" />
            </button>

            <button
              onClick={() => navigate('/')}
              className="p-0.5 rounded-md hover:bg-white/20 text-white/70 hover:text-white transition-colors ml-1"
              title="Close Tab"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <TitleMenu
              isOpen={isTitleMenuOpen}
              onClose={() => setIsTitleMenuOpen(false)}
            />
          </div>

          {/* Add New Page / Tab Button */}
          <button
            onClick={() => addPage()}
            className="p-1.5 mb-0.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Add Page"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Window Controls */}
        <div className="flex items-center gap-2 pr-1 text-white/70">
          <button className="p-1 hover:text-white transition-colors" title="Minimize">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 hover:text-white transition-colors" title="Maximize">
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={() => navigate('/')}
            className="p-1 hover:text-rose-400 transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Row 2: Main Toolbar with Slightly Larger Instruments and Colors Component */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#204272] text-white">
        {/* 1. Left Group: Sidebar, Search, Bookmark */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={togglePageSidebar}
            className={`p-2.5 rounded-xl transition-all ${
              isPageSidebarOpen
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
            title="Page Thumbnails"
          >
            <BookOpen className="w-[18px] h-[18px]" />
          </button>

          <button
            onClick={() => openModal('search')}
            className="p-2.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Search in Note (Ctrl+F)"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>

          <button
            onClick={() => toggleBookmark()}
            className={`p-2.5 rounded-xl transition-colors ${
              isBookmarked ? 'text-amber-300 hover:text-amber-200' : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
            title={isBookmarked ? 'Bookmarked' : 'Bookmark Page'}
          >
            <Bookmark className={`w-[18px] h-[18px] ${isBookmarked ? 'fill-amber-300' : ''}`} />
          </button>
        </div>

        {/* 2. Center: Instruments + Integrated Pen Thickness & Colors Component */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Main Instruments */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Lasso */}
            <button
              onClick={() => setActiveTool('select')}
              className={`p-2.5 rounded-xl transition-all ${
                activeTool === 'select'
                  ? 'bg-[#E3EDFC] text-[#204272] shadow-sm font-bold'
                  : 'text-white/85 hover:text-white hover:bg-white/10'
              }`}
              title="Lasso / Select (S)"
            >
              <Lasso className="w-[19px] h-[19px]" />
            </button>

            {/* Pen */}
            <button
              data-penstyle-btn
              onClick={() => {
                if (activeTool === 'pen') {
                  setActivePopup(activePopup === 'penStyle' ? null : 'penStyle');
                } else {
                  setActiveTool('pen');
                }
              }}
              className={`p-2.5 rounded-xl transition-all relative flex items-center justify-center ${
                activeTool === 'pen'
                  ? 'bg-[#E3EDFC] text-[#204272] shadow-sm font-bold'
                  : 'text-white/85 hover:text-white hover:bg-white/10'
              }`}
              title="Pen (P) - Click to customize size, strength & style"
            >
              <Pen className="w-[19px] h-[19px]" />
              <span
                className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full border border-black/30 shadow-sm"
                style={{ backgroundColor: penColor }}
              />
            </button>

            {/* Eraser */}
            <button
              onClick={() => setActiveTool('eraser')}
              className={`p-2.5 rounded-xl transition-all ${
                activeTool === 'eraser'
                  ? 'bg-[#E3EDFC] text-[#204272] shadow-sm font-bold'
                  : 'text-white/85 hover:text-white hover:bg-white/10'
              }`}
              title="Eraser (E)"
            >
              <Eraser className="w-[19px] h-[19px]" />
            </button>

            {/* Text */}
            <button
              onClick={() => {
                if (activeTool === 'text') {
                  setActivePopup(activePopup === 'text' ? null : 'text');
                } else {
                  setActiveTool('text');
                }
              }}
              className={`p-2.5 rounded-xl transition-all ${
                activeTool === 'text'
                  ? 'bg-[#E3EDFC] text-[#204272] shadow-sm font-bold'
                  : 'text-white/85 hover:text-white hover:bg-white/10'
              }`}
              title="Text Box (T) - Click to customize font & size"
            >
              <Type className="w-[19px] h-[19px]" />
            </button>

            {/* Highlighter / Stickers */}
            <button
              onClick={() => setActiveTool('highlighter')}
              className={`p-2.5 rounded-xl transition-all relative flex items-center justify-center ${
                activeTool === 'highlighter'
                  ? 'bg-[#E3EDFC] text-[#204272] shadow-sm font-bold'
                  : 'text-white/85 hover:text-white hover:bg-white/10'
              }`}
              title="Highlighter (H)"
            >
              <Smile className="w-[19px] h-[19px]" />
              <span
                className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full border border-black/30 shadow-sm"
                style={{ backgroundColor: highlighterColor }}
              />
            </button>

            {/* Image */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl text-white/85 hover:text-white hover:bg-white/10 transition-colors"
              title="Insert Image (I)"
            >
              <ImageIcon className="w-[19px] h-[19px]" />
            </button>

            {/* Shapes */}
            <button
              onClick={() => {
                if (activeTool === 'shapes') {
                  setActivePopup(activePopup === 'shapes' ? null : 'shapes');
                } else {
                  setActiveTool('shapes');
                }
              }}
              className={`p-2.5 rounded-xl transition-all ${
                activeTool === 'shapes'
                  ? 'bg-[#E3EDFC] text-[#204272] shadow-sm font-bold'
                  : 'text-white/85 hover:text-white hover:bg-white/10'
              }`}
              title="Shapes (R) - Click to customize shapes, lines & colors"
            >
              <Shapes className="w-[19px] h-[19px]" />
            </button>

            {/* Tape / Paper */}
            <button
              onClick={() => openModal('paperSettings')}
              className="p-2.5 rounded-xl text-white/85 hover:text-white hover:bg-white/10 transition-colors"
              title="Paper Template & Tape"
            >
              <FileText className="w-[19px] h-[19px]" />
            </button>

            {/* Laser Pointer */}
            <button
              onClick={() => setActiveTool('laser')}
              className={`p-2.5 rounded-xl transition-all relative ${
                activeTool === 'laser'
                  ? 'bg-[#E3EDFC] text-[#204272] shadow-sm font-bold'
                  : 'text-white/85 hover:text-rose-300 hover:bg-white/10'
              }`}
              title="Laser Pointer (Click & Drag to glow)"
            >
              <Wand2 className="w-[19px] h-[19px]" />
            </button>

            {/* Audio / Mic */}
            <button
              onClick={() => useUIStore.getState().addToast('Voice Note recording ready', 'info')}
              className="flex items-center gap-0.5 p-2.5 rounded-xl text-white/85 hover:text-white hover:bg-white/10 transition-colors"
              title="Audio Recording"
            >
              <Mic className="w-[19px] h-[19px]" />
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>
          </div>

          <div className="h-6 w-px bg-white/20 mx-1 hidden md:block" />

          {/* Integrated Pen Sizes & Quick Colors Tab Component */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-black/25 rounded-full border border-white/15 shadow-inner">
            {/* 3 Pen Sizes */}
            <div className="flex items-center gap-1 px-1">
              {QUICK_PEN_WIDTHS.map((w, idx) => {
                const isSelected = Math.abs(penWidth - w) < 0.2;
                return (
                  <button
                    key={w}
                    data-penstyle-btn
                    onClick={() => {
                      if (isSelected && activePopup === 'penStyle') {
                        setActivePopup(null);
                      } else if (isSelected) {
                        setActivePopup('penStyle');
                      } else {
                        setPenWidth(w);
                      }
                    }}
                    className={`flex items-center justify-center w-7 h-6 rounded-lg transition-all ${
                      isSelected ? 'bg-white/30 ring-1 ring-white/60 shadow-sm' : 'hover:bg-white/10'
                    }`}
                    title={`Size ${w}px (Click to customize size/strength slider)`}
                  >
                    <span
                      className="rounded-full bg-white transition-all"
                      style={{
                        width: `${12 + idx * 3.5}px`,
                        height: `${Math.max(1.8, (idx + 1) * 1.8)}px`
                      }}
                    />
                  </button>
                );
              })}
            </div>

            <div className="h-4 w-px bg-white/20" />

            {/* Quick 5 Colors */}
            <div className="flex items-center gap-2 px-1">
              {QUICK_PEN_COLORS.slice(0, 5).map((c) => {
                const isSelected = penColor.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    data-color-btn
                    onClick={() => {
                      if (isSelected && activePopup === 'colorPalette') {
                        setActivePopup(null);
                      } else if (isSelected) {
                        setActivePopup('colorPalette');
                      } else {
                        setPenColor(c);
                      }
                    }}
                    className={`w-4.5 h-4.5 rounded-full transition-all ${
                      isSelected
                        ? 'scale-125 ring-2 ring-[#38bdf8] ring-offset-1.5 ring-offset-[#204272] border border-white shadow-sm'
                        : 'hover:scale-110 border border-white/25'
                    }`}
                    style={{ backgroundColor: c, width: '18px', height: '18px' }}
                    title={c}
                  />
                );
              })}

              <button
                data-color-btn
                onClick={() => setActivePopup('colorPalette')}
                className="p-1 text-white/80 hover:text-white hover:bg-white/15 rounded-full transition-colors ml-0.5"
                title="Custom Color Palette"
              >
                <Palette className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Right Group: Add Page, Share/Export, More */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => addPage()}
            className="p-2.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Add Page"
          >
            <Plus className="w-[18px] h-[18px]" />
          </button>

          <button
            onClick={() => openModal('export')}
            className="p-2.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Share / Export Document"
          >
            <Share2 className="w-[18px] h-[18px]" />
          </button>

          <button
            onClick={() => openModal('settings')}
            className="p-2.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="More Options"
          >
            <MoreHorizontal className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </header>
  );
}
