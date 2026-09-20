import React, { useRef, useEffect, useState } from 'react';
import { renderPageTemplate } from '../../utils/templateRenderer';
import { drawSmoothStroke } from '../../utils/smoothStroke';
import { drawShape } from '../../utils/geometry';
import { Star, MoreVertical, Copy, Trash2 } from 'lucide-react';

export function PageThumbnail({
  page,
  pageIndex,
  isActive,
  onSelect,
  onDuplicate,
  onDelete,
  onToggleBookmark,
  isDarkMode
}) {
  const canvasRef = useRef(null);
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const thumbWidth = 130;
    const thumbHeight = 173; // 3:4 aspect ratio

    const pWidth = page?.width || 720;
    const pHeight = page?.height || 960;

    canvas.width = thumbWidth * 2;
    canvas.height = thumbHeight * 2;
    ctx.scale((thumbWidth * 2) / pWidth, (thumbHeight * 2) / pHeight);

    // 1. Draw template
    renderPageTemplate(
      ctx,
      pWidth,
      pHeight,
      page.template || 'ruled',
      page.templateConfig || {},
      isDarkMode
    );

    // 2. Draw PDF background if present
    if (page.pdfBackground) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, pWidth, pHeight);
      };
      img.src = page.pdfBackground;
    }

    // 3. Draw highlighters
    const elements = page.elements || [];
    const highlighters = elements.filter(el => el.type === 'highlighter');
    highlighters.forEach(hl => {
      drawSmoothStroke(ctx, hl.points, hl.color, hl.width, hl.opacity || 0.4, 'highlighter');
    });

    // 4. Draw ink & shapes
    const nonHighlighters = elements.filter(el => el.type !== 'highlighter');
    nonHighlighters.forEach(el => {
      if (el.type === 'pen' || el.type === 'pencil') {
        drawSmoothStroke(ctx, el.points, el.color, el.width, el.opacity || 1, el.penType || 'ball', el.strength || 1.0);
      } else if (el.type === 'shape' || el.type === 'line') {
        drawShape(ctx, el);
      } else if (el.type === 'text') {
        ctx.save();
        ctx.font = `${el.fontWeight || 'normal'} ${el.fontSize || 18}px ${el.fontFamily || 'Inter'}`;
        ctx.fillStyle = el.color || (isDarkMode ? '#ffffff' : '#000000');
        ctx.fillText(el.text || '', el.x, el.y);
        ctx.restore();
      }
    });
  }, [page, isDarkMode]);

  return (
    <div
      onClick={onSelect}
      className={`group relative flex flex-col items-center gap-1.5 p-1.5 rounded-xl cursor-pointer transition-all ${
        isActive
          ? 'bg-[#2F6BFF]/10 ring-2 ring-[#2F6BFF] shadow-sm'
          : 'hover:bg-[var(--color-bg-tertiary)]'
      }`}
    >
      {/* Thumbnail canvas container */}
      <div className="relative w-[130px] h-[173px] rounded-lg overflow-hidden shadow-sm border border-[var(--color-border)] bg-[#202124]">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* Bookmark star badge */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark(page._id || page.id);
          }}
          className={`absolute top-1.5 right-1.5 p-1 rounded-full backdrop-blur-md transition-all ${
            page.bookmarked
              ? 'bg-[#2F6BFF]/20 text-[#2F6BFF] opacity-100'
              : 'bg-black/30 text-white/50 opacity-0 group-hover:opacity-100 hover:text-white'
          }`}
          title={page.bookmarked ? 'Remove Bookmark' : 'Bookmark Page'}
        >
          <Star className={`w-3.5 h-3.5 ${page.bookmarked ? 'fill-[#2F6BFF]' : ''}`} />
        </button>
      </div>

      {/* Page Info and More Menu */}
      <div className="w-full flex items-center justify-between px-1 text-xs">
        <span className={`font-semibold ${isActive ? 'text-[#2F6BFF]' : 'text-[var(--color-text-secondary)]'}`}>
          Page {pageIndex + 1}
        </span>

        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 bottom-6 z-50 w-32 bg-[#25262B] dark:bg-[#25262B] light:bg-white border border-[var(--color-border)] rounded-xl shadow-floating p-1 flex flex-col gap-0.5 text-xs text-[var(--color-text-primary)] animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  onDuplicate(page._id || page.id);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-left transition-colors"
              >
                <Copy className="w-3 h-3 text-[#2F6BFF]" />
                <span>Duplicate</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  onDelete(page._id || page.id);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 text-left transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
