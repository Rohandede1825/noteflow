import React, { useState } from 'react';
import { useNotebookStore } from '../../store/useNotebookStore';
import { useUIStore } from '../../store/useUIStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import {
  exportToPdf,
  exportPageToImage,
  exportNoteFlowFile
} from '../../services/exportService';
import {
  X,
  FileDown,
  FileText,
  Image as ImageIcon,
  Package,
  Printer,
  Loader2
} from 'lucide-react';

export function ExportModal() {
  const { activeModal, closeModal, addToast } = useUIStore();
  const { currentNotebook, currentPage } = useNotebookStore();
  const { settings } = useSettingsStore();

  const [exportScope, setExportScope] = useState('notebook'); // 'notebook' | 'page'
  const [format, setFormat] = useState('pdf'); // 'pdf' | 'png' | 'jpg' | 'noteflow'
  const [pageSize, setPageSize] = useState('a4');
  const [orientation, setOrientation] = useState('portrait');
  const [isExporting, setIsExporting] = useState(false);

  if (activeModal !== 'export') return null;

  const isDarkMode = settings.theme !== 'light';

  const handleExport = async () => {
    if (!currentNotebook) return;

    try {
      setIsExporting(true);

      if (format === 'pdf') {
        await exportToPdf({
          notebook: currentNotebook,
          page: exportScope === 'page' ? currentPage : null,
          pageSize,
          orientation,
          isDarkMode
        });
        addToast('PDF downloaded successfully', 'success');
      } else if (format === 'png' || format === 'jpg') {
        const targetPage = currentPage || (currentNotebook.pages && currentNotebook.pages[0]);
        if (targetPage) {
          await exportPageToImage(
            targetPage,
            format,
            isDarkMode,
            `${currentNotebook.title}_Page_${targetPage.pageNumber}`
          );
          addToast(`${format.toUpperCase()} image downloaded`, 'success');
        }
      } else if (format === 'noteflow') {
        exportNoteFlowFile(currentNotebook);
        addToast('.noteflow archive downloaded', 'success');
      }

      closeModal();
    } catch (err) {
      console.error('Export failed:', err);
      addToast('Export failed: ' + err.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-[#1F2024] dark:bg-[#1F2024] light:bg-white border border-[var(--color-border)] rounded-3xl shadow-floating overflow-hidden text-[var(--color-text-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <FileDown className="w-4 h-4 text-[#2F6BFF]" />
            <h2 className="text-sm font-bold">Export Document</h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-3.5 text-xs">
          {/* Target */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px]">Target</label>
            <div className="grid grid-cols-2 gap-1.5 bg-[var(--color-bg-primary)] p-0.5 rounded-xl border border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setExportScope('notebook')}
                className={`py-1.5 rounded-lg font-semibold transition-all ${
                  exportScope === 'notebook' ? 'bg-[#2F6BFF] text-white shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                Entire Notebook ({(currentNotebook?.pages || []).length}p)
              </button>
              <button
                type="button"
                onClick={() => setExportScope('page')}
                className={`py-1.5 rounded-lg font-semibold transition-all ${
                  exportScope === 'page' ? 'bg-[#2F6BFF] text-white shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                Current Page
              </button>
            </div>
          </div>

          {/* Format selection */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px]">Format</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'pdf', label: 'PDF', icon: FileText },
                { id: 'png', label: 'PNG', icon: ImageIcon },
                { id: 'jpg', label: 'JPG', icon: ImageIcon },
                { id: 'noteflow', label: '.noteflow', icon: Package }
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = format === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormat(item.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-[#2F6BFF]/15 border-[#2F6BFF] text-[#2F6BFF] font-bold'
                        : 'bg-[var(--color-bg-primary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-bold text-[10px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PDF specific options */}
          {format === 'pdf' && (
            <div className="grid grid-cols-2 gap-2 p-2.5 bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border)]">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold">Size</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value)}
                  className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg p-1 text-xs text-[var(--color-text-primary)] focus:outline-none"
                >
                  <option value="a4">A4</option>
                  <option value="a5">A5</option>
                  <option value="letter">Letter</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold">Orientation</span>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value)}
                  className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg p-1 text-xs text-[var(--color-text-primary)] focus:outline-none"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>
          )}

          {/* Browser Print */}
          <button
            type="button"
            onClick={() => {
              closeModal();
              window.print();
            }}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-xl border border-[var(--color-border)] transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Dialog</span>
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-3.5 border-t border-[var(--color-border)] bg-[var(--color-bg-primary)]/40">
          <button
            type="button"
            onClick={closeModal}
            className="px-3 py-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#2F6BFF] hover:bg-[#2159E6] text-white font-bold rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
            <span>{isExporting ? 'Exporting...' : 'Export'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
