import React, { useRef, useEffect, useCallback, memo } from 'react';
import { renderPageTemplate } from '../../utils/templateRenderer';
import { drawSmoothStroke, getBoundingBox } from '../../utils/smoothStroke';
import { drawShape } from '../../utils/geometry';

function SinglePageCanvasComponent({
  page,
  pageIndex,
  isActive,
  isDarkMode,
  selectedElementIds = [],
  dpr = 1
}) {
  const bgCanvasRef = useRef(null);
  const hlCanvasRef = useRef(null);
  const drCanvasRef = useRef(null);

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
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, pageWidth, pageHeight);
      };
      img.src = page.pdfBackground;
    }
  }, [page?.template, page?.templateConfig, page?.pdfBackground, pageWidth, pageHeight, isDarkMode, dpr]);

  // 2. Render Main Elements (Highlighters, Inks, Shapes, Text, Images)
  const renderElements = useCallback(() => {
    if (!page) return;
    const elements = page.elements || [];

    // Highlighters Canvas
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

    // Main Inks Canvas
    const drCanvas = drCanvasRef.current;
    if (drCanvas) {
      drCanvas.width = pageWidth * dpr;
      drCanvas.height = pageHeight * dpr;
      drCanvas.style.width = `${pageWidth}px`;
      drCanvas.style.height = `${pageHeight}px`;

      const drCtx = drCanvas.getContext('2d');
      drCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drCtx.clearRect(0, 0, pageWidth, pageHeight);

      const nonHighlighters = elements.filter(el => el.type !== 'highlighter');
      for (let i = 0; i < nonHighlighters.length; i++) {
        const el = nonHighlighters[i];
        if (el.type === 'pen' || el.type === 'pencil') {
          drawSmoothStroke(drCtx, el.points, el.color, el.width, el.opacity || 1, el.penType || 'ball', el.strength || 1.0);
        } else if (el.type === 'shape' || el.type === 'line') {
          drawShape(drCtx, el);
        } else if (el.type === 'text') {
          drCtx.save();
          drCtx.font = `${el.fontStyle || 'normal'} ${el.fontWeight || 'normal'} ${el.fontSize || 18}px ${el.fontFamily || 'Inter'}`;
          drCtx.fillStyle = el.color || (isDarkMode ? '#F5F6F8' : '#17181C');
          drCtx.textAlign = el.textAlign || 'left';
          drCtx.textBaseline = 'top';

          const lines = (el.text || '').split('\n');
          const lineHeight = (el.fontSize || 18) * 1.35;
          lines.forEach((line, idx) => {
            drCtx.fillText(line, el.x, el.y + idx * lineHeight);
          });
          drCtx.restore();
        } else if (el.type === 'image' && el.src) {
          const img = new Image();
          img.onload = () => {
            drCtx.drawImage(img, el.x, el.y, el.width_box || 300, el.height_box || 200);
          };
          img.src = el.src;
        }

        // Selection boundary
        if (selectedElementIds.includes(el.id)) {
          drCtx.save();
          drCtx.strokeStyle = '#2F6BFF';
          drCtx.lineWidth = 1.5;
          drCtx.setLineDash([4, 4]);

          let box = { x: el.x, y: el.y, width: el.width_box || 100, height: el.height_box || 60 };
          if (el.points && el.points.length > 0) {
            box = getBoundingBox(el.points);
            box.x -= 6;
            box.y -= 6;
            box.width += 12;
            box.height += 12;
          }
          drCtx.strokeRect(box.x, box.y, box.width, box.height);

          drCtx.fillStyle = '#2F6BFF';
          drCtx.fillRect(box.x - 3, box.y - 3, 6, 6);
          drCtx.fillRect(box.x + box.width - 3, box.y - 3, 6, 6);
          drCtx.fillRect(box.x - 3, box.y + box.height - 3, 6, 6);
          drCtx.fillRect(box.x + box.width - 3, box.y + box.height - 3, 6, 6);
          drCtx.restore();
        }
      }
    }
  }, [page?.elements, pageWidth, pageHeight, selectedElementIds, isDarkMode, dpr]);

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
        padding: 0
      }}
      className={`relative ${
        isDarkMode ? 'shadow-paper-dark' : 'shadow-paper-light'
      } rounded-sm overflow-hidden shrink-0 transition-shadow ${
        isActive ? 'ring-1 ring-[#2F6BFF]/40' : ''
      }`}
    >
      {/* Background Template */}
      <canvas
        ref={bgCanvasRef}
        className="absolute inset-0 pointer-events-none rounded-sm"
      />

      {/* Highlighter Layer */}
      <canvas
        ref={hlCanvasRef}
        className="absolute inset-0 pointer-events-none rounded-sm"
        style={{ mixBlendMode: 'multiply', opacity: 0.9 }}
      />

      {/* Main Ink / Vector Layer */}
      <canvas
        ref={drCanvasRef}
        className="absolute inset-0 pointer-events-none rounded-sm"
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
    prev.selectedElementIds === next.selectedElementIds &&
    prev.dpr === next.dpr
  );
});
