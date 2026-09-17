import jsPDF from 'jspdf';
import { renderPageTemplate } from '../utils/templateRenderer';
import { drawSmoothStroke } from '../utils/smoothStroke';
import { drawShape } from '../utils/geometry';
import { downloadFile } from '../utils/fileHelpers';

/**
 * Render a complete page offscreen onto an HTML5 canvas
 */
export async function renderPageToCanvas(page, isDarkMode = true, scale = 2) {
  const width = (page.width || 1200) * scale;
  const height = (page.height || 1600) * scale;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.scale(scale, scale);

  // 1. Render background template (ruled, dotted, grid, blank)
  const templateConfig = page.templateConfig || {};
  renderPageTemplate(ctx, page.width || 1200, page.height || 1600, page.template || 'ruled', templateConfig, isDarkMode);

  // 2. Render PDF background backdrop if present
  if (page.pdfBackground) {
    await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, page.width || 1200, page.height || 1600);
        resolve();
      };
      img.onerror = resolve;
      img.src = page.pdfBackground;
    });
  }

  // 3. Render Highlighters first (so they stay underneath strokes)
  const elements = page.elements || [];
  const highlighters = elements.filter(el => el.type === 'highlighter');
  highlighters.forEach(hl => {
    drawSmoothStroke(ctx, hl.points, hl.color, hl.width, hl.opacity || 0.4, 'highlighter');
  });

  // 4. Render other elements (pen, pencil, shapes, text, images)
  const nonHighlighters = elements.filter(el => el.type !== 'highlighter');
  for (const el of nonHighlighters) {
    if (el.type === 'pen' || el.type === 'pencil') {
      drawSmoothStroke(ctx, el.points, el.color, el.width, el.opacity || 1, el.penType || 'ball', el.strength || 1.0);
    } else if (el.type === 'shape' || el.type === 'line') {
      drawShape(ctx, el);
    } else if (el.type === 'text') {
      ctx.save();
      ctx.font = `${el.fontStyle || 'normal'} ${el.fontWeight || 'normal'} ${el.fontSize || 18}px ${el.fontFamily || 'Inter'}`;
      ctx.fillStyle = el.color || '#ffffff';
      ctx.textAlign = el.textAlign || 'left';
      ctx.textBaseline = 'top';

      const lines = (el.text || '').split('\n');
      const lineHeight = (el.fontSize || 18) * 1.35;
      lines.forEach((line, idx) => {
        ctx.fillText(line, el.x, el.y + idx * lineHeight);
      });
      ctx.restore();
    } else if (el.type === 'image' && el.src) {
      await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, el.x, el.y, el.width_box || 300, el.height_box || 200);
          resolve();
        };
        img.onerror = resolve;
        img.src = el.src;
      });
    }
  }

  return canvas;
}

/**
 * Export single page as PNG or JPG
 */
export async function exportPageToImage(page, format = 'png', isDarkMode = true, filename = 'page') {
  const canvas = await renderPageToCanvas(page, isDarkMode, 2);
  const mimeType = format === 'jpeg' || format === 'jpg' ? 'image/jpeg' : 'image/png';
  const dataUrl = canvas.toDataURL(mimeType, 0.95);

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${filename}.${format === 'jpeg' ? 'jpg' : 'png'}`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => document.body.removeChild(a), 200);
}

/**
 * Export single page or full notebook to PDF
 */
export async function exportToPdf({ notebook, page = null, pageSize = 'a4', orientation = 'portrait', isDarkMode = true }) {
  const doc = new jsPDF({
    orientation: orientation,
    unit: 'pt',
    format: pageSize.toLowerCase()
  });

  const pdfWidth = doc.internal.pageSize.getWidth();
  const pdfHeight = doc.internal.pageSize.getHeight();

  const pagesToExport = page ? [page] : (notebook.pages || []);
  if (pagesToExport.length === 0) return;

  for (let i = 0; i < pagesToExport.length; i++) {
    const p = pagesToExport[i];
    if (i > 0) {
      doc.addPage(pageSize.toLowerCase(), orientation);
    }

    const canvas = await renderPageToCanvas(p, isDarkMode, 1.5);
    const imgData = canvas.toDataURL('image/jpeg', 0.92);

    doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
  }

  const safeTitle = (notebook?.title || page?.title || 'NoteFlow-Document').replace(/[^a-zA-Z0-9-_]/g, '_');
  doc.save(`${safeTitle}.pdf`);
}

/**
 * Export standalone .noteflow archive file
 */
export function exportNoteFlowFile(notebook) {
  const bundle = {
    version: 1,
    format: 'noteflow',
    generator: 'NoteFlow Web 1.0',
    exportedAt: new Date().toISOString(),
    notebook: {
      title: notebook.title,
      cover: notebook.cover,
      theme: notebook.theme,
      pageTemplate: notebook.pageTemplate,
      templateConfig: notebook.templateConfig,
      tags: notebook.tags
    },
    pages: notebook.pages
  };

  const safeTitle = (notebook.title || 'Untitled').replace(/[^a-zA-Z0-9-_]/g, '_');
  downloadFile(JSON.stringify(bundle, null, 2), `${safeTitle}.noteflow`, 'application/json');
}
