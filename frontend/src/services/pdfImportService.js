import * as pdfjsLib from 'pdfjs-dist';

// Point to PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Parses a PDF file and converts each page into a dataURL image for NoteFlow notebook pages
 */
export async function convertPdfToPageImages(file) {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const pageImages = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: ctx,
      viewport: viewport
    }).promise;

    pageImages.push({
      pageNumber: pageNum,
      width: Math.round(viewport.width),
      height: Math.round(viewport.height),
      dataUrl: canvas.toDataURL('image/png')
    });
  }

  return pageImages;
}
