import React, { useRef, useEffect, useCallback, memo } from 'react';
import { renderPageTemplate } from '../../utils/templateRenderer';
import { drawSmoothStroke } from '../../utils/smoothStroke';
import { drawShape } from '../../utils/geometry';

const imageCache = new Map();

function getImage(src, onLoaded) {
  if (!src) return null;
  if (imageCache.has(src)) {
    const cached = imageCache.get(src);
    if (cached.complete) return cached;
  }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    imageCache.set(src, img);
    if (onLoaded) onLoaded();
  };
  img.src = src;
  imageCache.set(src, img);
  return img;
}

function SinglePageCanvasComponent({
  page,
  pageIndex,
  isActive,
  isDarkMode,
  dpr = 1
}) {
  const bgCanvasRef = useRef(null);
  const objCanvasRef = useRef(null);
  const hlCanvasRef = useRef(null);
  const inkCanvasRef = useRef(null);

  const pageWidth = page?.width || 1200;
  const pageHeight = page?.height || 1600;

  // 1. Render Background & Templates Layer
  const renderBackground = useCallback(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas || !page) return;

    canvas.width = pageWidth * dpr;
    canvas.height = pageHeight * dpr;
    canvas.style.width = `${pageWidth}px`;
    canvas.style.height = `${pageHeight}px`;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    renderPageTemplate(
      ctx,
      pageWidth,
      pageHeight,
      page.template || 'ruled',
      page.templateConfig || {},
      isDarkMode
    );

    if (page.pdfBackground) {
      const pdfImg = getImage(page.pdfBackground, () => renderBackground());
      if (pdfImg && pdfImg.complete) {
        ctx.drawImage(pdfImg, 0, 0, pageWidth, pageHeight);
      }
    }
  }, [page?.template, page?.templateConfig, page?.pdfBackground, pageWidth, pageHeight, isDarkMode, dpr]);

  // 2. Render Main Elements in Strict Layer Order: Objects -> Highlighters -> Pen Drawing Inks
  const renderElements = useCallback(() => {
    if (!page) return;
    const elements = page.elements || [];

    // Layer A: Objects Canvas (Images, Shapes, Text, Emojis)
    const objCanvas = objCanvasRef.current;
    if (objCanvas) {
      objCanvas.width = pageWidth * dpr;
      objCanvas.height = pageHeight * dpr;
      objCanvas.style.width = `${pageWidth}px`;
      objCanvas.style.height = `${pageHeight}px`;

      const objCtx = objCanvas.getContext('2d');
      objCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      objCtx.clearRect(0, 0, pageWidth, pageHeight);

      const objectElements = elements.filter(el =>
        el.type === 'image' || el.type === 'shape' || el.type === 'line' || el.type === 'text' || el.type === 'emoji'
      );

      for (let i = 0; i < objectElements.length; i++) {
        const el = objectElements[i];
        if (el.type === 'image' && el.src) {
          const img = getImage(el.src, () => renderElements());
          if (img && img.complete) {
            objCtx.save();
            objCtx.globalAlpha = el.opacity ?? 1;
            objCtx.drawImage(img, el.x, el.y, el.width_box || 300, el.height_box || 200);
            objCtx.restore();
          }
        } else if (el.type === 'shape' || el.type === 'line') {
          drawShape(objCtx, el);
        } else if (el.type === 'text') {
          objCtx.save();
          objCtx.font = `${el.fontStyle || 'normal'} ${el.fontWeight || 'normal'} ${el.fontSize || 18}px ${el.fontFamily || 'Inter'}`;
          objCtx.fillStyle = el.color || (isDarkMode ? '#F5F6F8' : '#17181C');
          objCtx.textAlign = el.textAlign || 'left';
          objCtx.textBaseline = 'top';

          const lines = (el.text || '').split('\n');
          const lineHeight = (el.fontSize || 18) * 1.35;
          lines.forEach((line, idx) => {
            objCtx.fillText(line, el.x, el.y + idx * lineHeight);
          });
          objCtx.restore();
        } else if (el.type === 'emoji' && el.emoji) {
          objCtx.save();
          const fontSize = el.fontSize || 54;
          objCtx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
          objCtx.textAlign = 'left';
          objCtx.textBaseline = 'top';
          objCtx.fillText(el.emoji, el.x, el.y);
          objCtx.restore();
        }
      }
    }

    // Layer B: Highlighters Canvas
    const hlCanvas = hlCanvasRef.current;
    if (hlCanvas) {
      hlCanvas.width = pageWidth * dpr;
      hlCanvas.height = pageHeight * dpr;
      hlCanvas.style.width = `${pageWidth}px`;
      hlCanvas.style.height = `${pageHeight}px`;

      const hlCtx = hlCanvas.getContext('2d');
      hlCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      hlCtx.clearRect(0, 0, pageWidth, pageHeight);

      const highlighters = elements.filter(el => el.type === 'highlighter');
      highlighters.forEach(hl => {
        drawSmoothStroke(hlCtx, hl.points, hl.color, hl.width, hl.opacity || 0.4, 'highlighter');
      });
    }

    // Layer C: Pen Drawing Inks Canvas (Freehand Pen & Pencil Strokes - Drawn Above Objects)
    const inkCanvas = inkCanvasRef.current;
    if (inkCanvas) {
      inkCanvas.width = pageWidth * dpr;
      inkCanvas.height = pageHeight * dpr;
      inkCanvas.style.width = `${pageWidth}px`;
      inkCanvas.style.height = `${pageHeight}px`;

      const inkCtx = inkCanvas.getContext('2d');
      inkCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      inkCtx.clearRect(0, 0, pageWidth, pageHeight);

      const penStrokes = elements.filter(el => el.type === 'pen' || el.type === 'pencil');
      for (let i = 0; i < penStrokes.length; i++) {
        const el = penStrokes[i];
        drawSmoothStroke(
          inkCtx,
          el.points,
          el.color,
          el.width,
          el.opacity || 1,
          el.penType || 'ball',
          el.strength || 1.0
        );
      }
    }
  }, [page?.elements, pageWidth, pageHeight, isDarkMode, dpr]);

  useEffect(() => {
    renderBackground();
  }, [renderBackground]);

  useEffect(() => {
    renderElements();
  }, [renderElements]);

  return (
    <div
      data-page-index={pageIndex}
      style={{
        width: `${pageWidth}px`,
        height: `${pageHeight}px`,
        margin: 0,
        padding: 0,
        touchAction: 'none'
      }}
      className={`relative ${
        isDarkMode ? 'shadow-paper-dark' : 'shadow-paper-light'
      } rounded-sm overflow-hidden shrink-0 transition-shadow touch-none ${
        isActive ? 'ring-1 ring-[#2F6BFF]/40' : ''
      }`}
    >
      {/* 1. Background Template Layer */}
      <canvas
        ref={bgCanvasRef}
        className="absolute inset-0 pointer-events-none rounded-sm z-0 touch-none"
      />

      {/* 2. Objects Layer (Images, Shapes, Text, Emojis) */}
      <canvas
        ref={objCanvasRef}
        className="absolute inset-0 pointer-events-none rounded-sm z-10 touch-none"
      />

      {/* 3. Highlighter Layer */}
      <canvas
        ref={hlCanvasRef}
        className="absolute inset-0 pointer-events-none rounded-sm z-15 touch-none"
        style={{ mixBlendMode: isDarkMode ? 'screen' : 'multiply', opacity: isDarkMode ? 0.85 : 0.95 }}
      />

      {/* 4. Pen Drawing Inks Layer */}
      <canvas
        ref={inkCanvasRef}
        className="absolute inset-0 pointer-events-none rounded-sm z-20 touch-none"
      />
    </div>
  );
}

export const SinglePageCanvas = memo(SinglePageCanvasComponent, (prev, next) => {
  return (
    prev.page?._id === next.page?._id &&
    prev.page?.elements === next.page?.elements &&
    prev.page?.template === next.page?.template &&
    prev.page?.templateConfig === next.page?.templateConfig &&
    prev.page?.pdfBackground === next.page?.pdfBackground &&
    prev.pageIndex === next.pageIndex &&
    prev.isActive === next.isActive &&
    prev.isDarkMode === next.isDarkMode &&
    prev.dpr === next.dpr
  );
});

