import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotebookStore } from '../../store/useNotebookStore';
import { useUIStore } from '../../store/useUIStore';
import { api } from '../../services/api';
import { X, BookOpen, Plus, Loader2 } from 'lucide-react';

export function CreateNotebookModal() {
  const navigate = useNavigate();
  const { activeModal, closeModal, addToast } = useUIStore();
  const { fetchNotebooks, setCurrentNotebook } = useNotebookStore();

  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState('ruled');
  const [paperColor, setPaperColor] = useState('white');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (activeModal !== 'createNotebook') return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const payload = {
        title: title.trim() || 'Untitled Notebook',
        pageTemplate: template,
        theme: paperColor === 'dark' ? 'dark' : 'light',
        templateConfig: {
          paperColor: paperColor,
          lineSpacing: 44,
          dotSize: 1.25,
          gridSize: 28,
          showMargin: template === 'ruled'
        }
      };

      const newNotebook = await api.createNotebook(payload);
      await fetchNotebooks();
      await setCurrentNotebook(newNotebook);
      closeModal();
      addToast('Notebook created', 'success');
      navigate(`/notebook/${newNotebook._id || newNotebook.id}`);
    } catch (err) {
      console.error('Failed to create notebook:', err);
      addToast('Failed to create notebook', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-[#1F2024] dark:bg-[#1F2024] light:bg-white border border-[var(--color-border)] rounded-3xl shadow-floating overflow-hidden text-[var(--color-text-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#2F6BFF]" />
            <h2 className="text-sm font-bold">New Notebook</h2>
          </div>
          <button
            onClick={closeModal}
            className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 text-xs">
          {/* Notebook Name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px]">
              Notebook Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled Notebook"
              autoFocus
              className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[#2F6BFF] transition-all"
            />
          </div>

          {/* Paper Type */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px]">
              Paper
            </label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[#2F6BFF] transition-all"
            >
              <option value="ruled">Ruled</option>
              <option value="dotted">Dotted</option>
              <option value="grid">Grid</option>
              <option value="blank">Blank</option>
            </select>
          </div>

          {/* Paper Color */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider text-[10px]">
              Paper Color
            </label>
            <select
              value={paperColor}
              onChange={(e) => setPaperColor(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[#2F6BFF] transition-all"
            >
              <option value="white">White</option>
              <option value="dark">Dark</option>
              <option value="cream">Cream</option>
            </select>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={closeModal}
              className="px-3 py-1.5 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#2F6BFF] hover:bg-[#2159E6] text-white font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Create</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
