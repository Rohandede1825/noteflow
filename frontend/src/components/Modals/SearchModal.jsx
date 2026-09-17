import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../store/useUIStore';
import { useNotebookStore } from '../../store/useNotebookStore';
import { api } from '../../services/api';
import {
  Search,
  X,
  BookOpen,
  FileText,
  ArrowRight,
  Loader2
} from 'lucide-react';

export function SearchModal() {
  const navigate = useNavigate();
  const { activeModal, closeModal } = useUIStore();
  const { setCurrentNotebook, setCurrentPageIndex } = useNotebookStore();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const data = await api.search(query.trim());
        setResults(data);
      } catch (err) {
        console.error('Search query failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  if (activeModal !== 'search') return null;

  const handleSelectResult = async (item) => {
    closeModal();
    if (item.type === 'notebook') {
      await setCurrentNotebook(item.notebookId || item.id);
      navigate(`/notebook/${item.notebookId || item.id}`);
    } else if (item.type === 'page') {
      await setCurrentNotebook(item.notebookId);
      if (item.pageNumber) {
        setCurrentPageIndex(item.pageNumber - 1);
      }
      navigate(`/notebook/${item.notebookId}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#1F2024] dark:bg-[#1F2024] light:bg-white border border-[var(--color-border)] rounded-3xl shadow-floating overflow-hidden text-[var(--color-text-primary)]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-2.5 p-3.5 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]/50">
          <Search className="w-4 h-4 text-[#2F6BFF] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all notebooks and page notes..."
            autoFocus
            className="flex-1 bg-transparent text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none"
          />
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-[#2F6BFF] animate-spin" />
          ) : query ? (
            <button onClick={() => setQuery('')} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
              <X className="w-4 h-4" />
            </button>
          ) : null}
          <button
            onClick={closeModal}
            className="px-2 py-0.5 text-[10px] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] bg-[var(--color-bg-tertiary)] rounded-md"
          >
            Esc
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2.5 flex flex-col gap-1 text-xs">
          {!query && (
            <div className="p-6 text-center text-[var(--color-text-muted)] flex flex-col items-center gap-1.5">
              <Search className="w-6 h-6 opacity-40" />
              <p className="text-xs">Type keywords to search across notebooks and contents.</p>
            </div>
          )}

          {query && !isLoading && results.length === 0 && (
            <div className="p-6 text-center text-[var(--color-text-muted)]">
              No matching notes found for <span className="font-semibold text-[var(--color-text-primary)]">"{query}"</span>
            </div>
          )}

          {results.map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleSelectResult(item)}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--color-bg-tertiary)] cursor-pointer group transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-1.5 rounded-lg shrink-0 ${item.type === 'notebook' ? 'bg-[#2F6BFF]/15 text-[#2F6BFF]' : 'bg-purple-600/15 text-purple-400'}`}>
                  {item.type === 'notebook' ? <BookOpen className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold truncate">{item.title}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--color-bg-primary)] text-[var(--color-text-muted)] uppercase font-semibold">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)] truncate">{item.snippet}</p>
                </div>
              </div>

              <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-muted)] group-hover:text-[#2F6BFF] transition-all shrink-0 ml-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
