import React, { useState } from 'react';
import { useNotebookStore } from '../../store/useNotebookStore';
import { useUIStore } from '../../store/useUIStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { PageThumbnail } from './PageThumbnail';
import {
  Plus,
  Star,
  ChevronLeft,
  LayoutGrid
} from 'lucide-react';

export function PageSidebar() {
  const {
    pages,
    currentPageIndex,
    setCurrentPageIndex,
    addPage,
    duplicatePage,
    deletePage,
    toggleBookmark
  } = useNotebookStore();

  const { isPageSidebarOpen, togglePageSidebar } = useUIStore();
  const { settings } = useSettingsStore();
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'bookmarks'

  const isDarkMode = settings.theme !== 'light';

  const displayedPages = filterTab === 'bookmarks'
    ? pages.filter(p => p.bookmarked)
    : pages;

  if (!isPageSidebarOpen) return null;

  return (
    <aside className="relative z-20 w-48 shrink-0 h-full bg-[#1F2024] dark:bg-[#1F2024] light:bg-white border-r border-[var(--color-border)] flex flex-col justify-between select-none animate-in slide-in-from-left duration-150">
      {/* 1. Header & Filter Tabs */}
      <div className="p-3 border-b border-[var(--color-border)] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
            <LayoutGrid className="w-3.5 h-3.5 text-[#2F6BFF]" />
            <span>Pages</span>
          </div>

          <button
            onClick={togglePageSidebar}
            className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
            title="Close Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-1 bg-[var(--color-bg-primary)] p-0.5 rounded-xl border border-[var(--color-border)]">
          <button
            onClick={() => setFilterTab('all')}
            className={`py-1 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'all'
                ? 'bg-[#2F6BFF] text-white shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            All ({pages.length})
          </button>
          <button
            onClick={() => setFilterTab('bookmarks')}
            className={`flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'bookmarks'
                ? 'bg-[#2F6BFF] text-white shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Star className="w-3 h-3" />
            <span>Saved</span>
          </button>
        </div>
      </div>

      {/* 2. Scrollable Thumbnails list */}
      <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5">
        {displayedPages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-2 text-[var(--color-text-muted)] text-xs">
            <Star className="w-6 h-6 mb-1.5 opacity-40" />
            <p>No bookmarked pages</p>
          </div>
        ) : (
          displayedPages.map((page, index) => {
            const pageKey = page._id || page.id;
            const actualIndex = pageKey
              ? pages.findIndex(p => (p._id === pageKey || p.id === pageKey))
              : (filterTab === 'all' ? index : pages.indexOf(page));
            
            const resolvedIndex = actualIndex !== -1 ? actualIndex : index;
            const isActive = resolvedIndex === currentPageIndex;

            return (
              <PageThumbnail
                key={pageKey || `page-idx-${resolvedIndex}`}
                page={page}
                pageIndex={resolvedIndex}
                isActive={isActive}
                onSelect={() => setCurrentPageIndex(resolvedIndex, true)}
                onDuplicate={duplicatePage}
                onDelete={deletePage}
                onToggleBookmark={toggleBookmark}
                isDarkMode={isDarkMode}
              />
            );
          })
        )}
      </div>

      {/* 3. Bottom Add Page Button */}
      <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-bg-primary)]/40">
        <button
          onClick={() => addPage()}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#2F6BFF] hover:bg-[#2159E6] text-white text-xs font-semibold shadow-sm transition-all active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Page</span>
        </button>
      </div>
    </aside>
  );
}
