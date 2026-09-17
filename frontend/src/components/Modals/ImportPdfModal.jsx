import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNotebookStore } from '../../store/useNotebookStore';
import { useUIStore } from '../../store/useUIStore';
import { convertPdfToPageImages } from '../../services/pdfImportService';
import { api } from '../../services/api';
import {
  X,
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export function ImportPdfModal() {
  const { activeModal, closeModal, addToast } = useUIStore();
  const { currentNotebook, fetchNotebooks, setCurrentNotebook } = useNotebookStore();

  const [isLoading, setIsLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file || !currentNotebook) return;

    try {
      setIsLoading(true);
      setProgressMsg('Rendering PDF pages...');
      const pagesData = await convertPdfToPageImages(file);

      setProgressMsg(`Adding ${pagesData.length} pages to notebook...`);

      const notebookId = currentNotebook._id || currentNotebook.id;

      for (let i = 0; i < pagesData.length; i++) {
        const item = pagesData[i];
        await api.createPage(notebookId, {
          title: `PDF Page ${item.pageNumber}`,
          template: 'blank',
          width: item.width,
          height: item.height,
          pdfBackground: item.dataUrl,
          elements: []
        });
      }

      const refreshed = await api.getNotebookById(notebookId);
      await setCurrentNotebook(refreshed);
      await fetchNotebooks();

      addToast(`Imported ${pagesData.length} PDF pages!`, 'success');
      closeModal();
    } catch (err) {
      console.error('PDF Import error:', err);
      addToast('Failed to import PDF: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
      setProgressMsg('');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: isLoading
  });

  if (activeModal !== 'importPdf') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#18191d] border border-neutral-700/80 rounded-3xl shadow-floating overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Import PDF Document</h2>
              <p className="text-xs text-neutral-400">Converts PDF pages into interactive notebook pages</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            disabled={isLoading}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dropzone Area */}
        <div className="p-6 flex flex-col gap-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-blue-500 bg-blue-500/10 scale-102'
                : 'border-neutral-700/80 hover:border-neutral-500 bg-neutral-900/40'
            }`}
          >
            <input {...getInputProps()} />
            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                <p className="text-xs font-semibold text-neutral-300">{progressMsg}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center text-blue-400 mb-1 shadow-inner">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-white">Drag & drop your PDF file here</p>
                <p className="text-[11px] text-neutral-400">or click to browse from computer</p>
                <span className="text-[10px] text-neutral-500 mt-2">Supports multi-page slides, books, worksheets</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
