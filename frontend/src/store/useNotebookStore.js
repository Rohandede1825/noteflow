import { create } from 'zustand';
import { api } from '../services/api';

const MAX_HISTORY = 40;
const OPEN_TABS_KEY = 'noteflow_open_tabs_v1';

function getStoredOpenTabs() {
  try {
    const raw = localStorage.getItem(OPEN_TABS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [];
}

function saveStoredOpenTabs(tabs) {
  try {
    localStorage.setItem(OPEN_TABS_KEY, JSON.stringify(tabs));
  } catch (_) {}
}

export const useNotebookStore = create((set, get) => ({
  notebooks: [],
  currentNotebook: null,
  openTabs: getStoredOpenTabs(),
  pages: [],
  currentPageIndex: 0,
  currentPage: null,
  targetScrollPageIndex: null,
  
  // Undo / Redo history per page
  undoStack: [], // Array of element arrays
  redoStack: [], // Array of element arrays

  // Saving state
  saveStatus: 'saved', // 'saving' | 'saved' | 'error' | 'offline'
  lastSavedAt: null,
  isDirty: false,
  autoSaveTimer: null,

  // Fetch all notebooks
  fetchNotebooks: async (filter = {}) => {
    try {
      const data = await api.getNotebooks(filter);
      set({ notebooks: data });
      return data;
    } catch (err) {
      console.error('Failed to fetch notebooks:', err);
      return [];
    }
  },

  // Add a notebook to open tabs
  addOpenTab: (notebook) => {
    if (!notebook) return;
    const nbId = notebook._id || notebook.id;
    const { openTabs } = get();
    if (!openTabs.some(t => t.id === nbId)) {
      const nextTabs = [...openTabs, { id: nbId, title: notebook.title || 'Untitled Notebook' }];
      saveStoredOpenTabs(nextTabs);
      set({ openTabs: nextTabs });
    }
  },

  // Close an open tab
  closeTab: async (notebookId, navigate) => {
    const { openTabs, currentNotebook, isDirty } = get();
    if (isDirty) {
      await get().saveCurrentPageNow();
    }

    const nextTabs = openTabs.filter(t => t.id !== notebookId);
    saveStoredOpenTabs(nextTabs);
    set({ openTabs: nextTabs });

    const currentId = currentNotebook ? (currentNotebook._id || currentNotebook.id) : null;
    if (currentId === notebookId) {
      if (nextTabs.length > 0) {
        const nextActive = nextTabs[nextTabs.length - 1];
        if (navigate) {
          navigate(`/notebook/${nextActive.id}`);
        } else {
          get().setCurrentNotebook(nextActive.id);
        }
      } else {
        set({ currentNotebook: null, pages: [], currentPage: null });
        if (navigate) navigate('/');
      }
    }
  },

  // Switch to a different tab
  switchTab: async (notebookId, navigate) => {
    const { currentNotebook, isDirty } = get();
    const currentId = currentNotebook ? (currentNotebook._id || currentNotebook.id) : null;
    if (currentId === notebookId) return;

    if (isDirty) {
      await get().saveCurrentPageNow();
    }

    if (navigate) {
      navigate(`/notebook/${notebookId}`);
    } else {
      await get().setCurrentNotebook(notebookId);
    }
  },

  // Create a brand new independent notebook and open it in a new tab
  createNewNotebookAndTab: async (navigate) => {
    try {
      const { notebooks, isDirty } = get();
      if (isDirty) {
        await get().saveCurrentPageNow();
      }

      const count = notebooks.length + 1;
      const newNotebook = await api.createNotebook({
        title: `Untitled Notebook (${count})`,
        cover: 'classic-dark',
        theme: 'dark',
        pageTemplate: 'ruled'
      });

      if (newNotebook) {
        const nbId = newNotebook._id || newNotebook.id;
        get().addOpenTab(newNotebook);
        await get().fetchNotebooks();
        if (navigate) {
          navigate(`/notebook/${nbId}`);
        } else {
          await get().setCurrentNotebook(newNotebook);
        }
        return newNotebook;
      }
    } catch (err) {
      console.error('Failed to create new notebook tab:', err);
    }
  },

  // Set active notebook and load pages
  setCurrentNotebook: async (notebookOrId) => {
    try {
      let notebook = notebookOrId;
      if (typeof notebookOrId === 'string') {
        notebook = await api.getNotebookById(notebookOrId);
      }
      if (!notebook) return;

      const pages = notebook.pages || [];
      const firstPage = pages[0] || null;
      const nbId = notebook._id || notebook.id;

      // Update open tabs list
      const { openTabs } = get();
      let nextTabs = openTabs;
      const exists = openTabs.some(t => t.id === nbId);
      if (!exists) {
        nextTabs = [...openTabs, { id: nbId, title: notebook.title || 'Untitled Notebook' }];
      } else {
        nextTabs = openTabs.map(t => t.id === nbId ? { ...t, title: notebook.title || t.title } : t);
      }
      saveStoredOpenTabs(nextTabs);

      set({
        currentNotebook: notebook,
        openTabs: nextTabs,
        pages: pages,
        currentPageIndex: 0,
        currentPage: firstPage,
        targetScrollPageIndex: null,
        undoStack: [],
        redoStack: [],
        isDirty: false,
        saveStatus: 'saved'
      });
    } catch (err) {
      console.error('Failed to set current notebook:', err);
    }
  },

  // Set current page by index (explicit navigation triggers scroll, passive updates do not)
  setCurrentPageIndex: (index, shouldScroll = true) => {
    const { pages, currentPage, isDirty } = get();
    if (index < 0 || index >= pages.length) return;

    // Trigger immediate save for previous page if dirty
    if (isDirty && currentPage) {
      get().saveCurrentPageNow();
    }

    const targetPage = pages[index];
    set({
      currentPageIndex: index,
      currentPage: targetPage,
      targetScrollPageIndex: shouldScroll ? index : null,
      undoStack: [],
      redoStack: [],
      isDirty: false
    });
  },

  jumpToPage: (index) => {
    get().setCurrentPageIndex(index, true);
  },

  // Add new page to current notebook
  addPage: async (template = null) => {
    const { currentNotebook, pages } = get();
    if (!currentNotebook) return;

    try {
      const payload = {
        template: template || currentNotebook.pageTemplate || 'ruled',
        templateConfig: currentNotebook.templateConfig
      };
      const newPage = await api.createPage(currentNotebook._id || currentNotebook.id, payload);
      const updatedPages = [...pages, newPage];

      set({
        pages: updatedPages,
        currentPageIndex: updatedPages.length - 1,
        currentPage: newPage,
        undoStack: [],
        redoStack: []
      });

      // Update current notebook page count in list
      get().fetchNotebooks();
      return newPage;
    } catch (err) {
      console.error('Failed to add page:', err);
    }
  },

  // Duplicate page
  duplicatePage: async (pageId) => {
    try {
      const targetId = pageId || (get().currentPage ? (get().currentPage._id || get().currentPage.id) : null);
      if (!targetId) return;

      const newPage = await api.duplicatePage(targetId);
      const { currentNotebook } = get();
      if (currentNotebook) {
        const refreshed = await api.getNotebookById(currentNotebook._id || currentNotebook.id);
        const newIdx = (refreshed.pages || []).findIndex(p => (p._id === newPage._id || p.id === newPage.id));
        set({
          currentNotebook: refreshed,
          pages: refreshed.pages || [],
          currentPageIndex: newIdx !== -1 ? newIdx : get().currentPageIndex,
          currentPage: newPage
        });
      }
    } catch (err) {
      console.error('Failed to duplicate page:', err);
    }
  },

  // Delete page
  deletePage: async (pageId) => {
    const { currentNotebook, pages, currentPageIndex } = get();
    if (!currentNotebook || pages.length <= 1) {
      alert('Notebook must contain at least one page.');
      return;
    }

    const targetId = pageId || (get().currentPage ? (get().currentPage._id || get().currentPage.id) : null);
    if (!targetId) return;

    try {
      await api.deletePage(targetId);
      const updatedPages = pages.filter(p => (p._id !== targetId && p.id !== targetId));
      const nextIdx = Math.min(currentPageIndex, updatedPages.length - 1);

      set({
        pages: updatedPages,
        currentPageIndex: nextIdx,
        currentPage: updatedPages[nextIdx] || null,
        undoStack: [],
        redoStack: []
      });
      get().fetchNotebooks();
    } catch (err) {
      console.error('Failed to delete page:', err);
    }
  },

  // Reorder pages
  reorderPages: async (orderedPageIds) => {
    const { currentNotebook, pages } = get();
    if (!currentNotebook) return;

    const pageMap = new Map(pages.map(p => [p._id || p.id, p]));
    const reordered = orderedPageIds.map(id => pageMap.get(id)).filter(Boolean);

    set({ pages: reordered });

    try {
      await api.reorderPages(currentNotebook._id || currentNotebook.id, orderedPageIds);
    } catch (err) {
      console.error('Failed to reorder pages:', err);
    }
  },

  // Toggle bookmark on page
  toggleBookmark: async (pageId) => {
    const { pages, currentPage } = get();
    const targetId = pageId || (currentPage ? (currentPage._id || currentPage.id) : null);
    if (!targetId) return;

    const targetPage = pages.find(p => (p._id === targetId || p.id === targetId));
    if (!targetPage) return;

    const newBookmarked = !targetPage.bookmarked;
    const updatedPages = pages.map(p =>
      (p._id === targetId || p.id === targetId) ? { ...p, bookmarked: newBookmarked } : p
    );

    set({
      pages: updatedPages,
      currentPage: currentPage && (currentPage._id === targetId || currentPage.id === targetId)
        ? { ...currentPage, bookmarked: newBookmarked }
        : currentPage
    });

    try {
      await api.updatePage(targetId, { bookmarked: newBookmarked });
    } catch (err) {
      console.error('Failed to update bookmark:', err);
    }
  },

  // Change page template
  setPageTemplate: async (template, config = null) => {
    const { currentPage, pages } = get();
    if (!currentPage) return;

    const pageId = currentPage._id || currentPage.id;
    const update = {};
    if (template) update.template = template;
    if (config) update.templateConfig = { ...(currentPage.templateConfig || {}), ...config };

    const updatedCurrent = { ...currentPage, ...update };
    const updatedPages = pages.map(p =>
      (p._id === pageId || p.id === pageId) ? { ...p, ...update } : p
    );

    set({ currentPage: updatedCurrent, pages: updatedPages, isDirty: true });
    get().triggerAutoSave();
  },

  // Update elements for a specific page with history support
  setPageElements: (pageIndex, elementsOrUpdater, recordHistory = true) => {
    const { pages, currentPageIndex, undoStack } = get();
    const targetIdx = (pageIndex !== undefined && pageIndex >= 0 && pageIndex < pages.length) ? pageIndex : currentPageIndex;
    const targetPage = pages[targetIdx];
    if (!targetPage) return;

    const currentElements = targetPage.elements || [];
    const nextElements = typeof elementsOrUpdater === 'function'
      ? elementsOrUpdater(currentElements)
      : elementsOrUpdater;

    const updatedPages = pages.map((p, idx) => idx === targetIdx ? { ...p, elements: nextElements } : p);
    const isCurrent = targetIdx === currentPageIndex;

    if (recordHistory && isCurrent) {
      const newUndo = [...undoStack, JSON.parse(JSON.stringify(currentElements))].slice(-MAX_HISTORY);
      set({
        undoStack: newUndo,
        redoStack: [],
        pages: updatedPages,
        currentPage: updatedPages[currentPageIndex],
        isDirty: true
      });
    } else {
      set({
        pages: updatedPages,
        currentPage: updatedPages[currentPageIndex],
        isDirty: true
      });
    }

    get().triggerAutoSave();
  },

  // Update elements for current active page
  setElements: (elementsOrUpdater, recordHistory = true) => {
    const { currentPageIndex } = get();
    get().setPageElements(currentPageIndex, elementsOrUpdater, recordHistory);
  },

  // Undo action
  undo: () => {
    const { undoStack, redoStack, currentPage, pages, currentPageIndex } = get();
    if (undoStack.length === 0 || !currentPage) return;

    const previousState = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);
    const newRedoStack = [...redoStack, JSON.parse(JSON.stringify(currentPage.elements || []))];
    const updatedPages = pages.map((p, idx) => idx === currentPageIndex ? { ...p, elements: previousState } : p);

    set({
      undoStack: newUndoStack,
      redoStack: newRedoStack,
      currentPage: { ...currentPage, elements: previousState },
      pages: updatedPages,
      isDirty: true
    });
    get().triggerAutoSave();
  },

  // Redo action
  redo: () => {
    const { undoStack, redoStack, currentPage, pages, currentPageIndex } = get();
    if (redoStack.length === 0 || !currentPage) return;

    const nextState = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);
    const newUndoStack = [...undoStack, JSON.parse(JSON.stringify(currentPage.elements || []))];
    const updatedPages = pages.map((p, idx) => idx === currentPageIndex ? { ...p, elements: nextState } : p);

    set({
      undoStack: newUndoStack,
      redoStack: newRedoStack,
      currentPage: { ...currentPage, elements: nextState },
      pages: updatedPages,
      isDirty: true
    });
    get().triggerAutoSave();
  },

  // Clear specific page elements or current page elements
  clearSpecificPage: async (pageIndex) => {
    const { pages, currentPageIndex, undoStack } = get();
    const targetIdx = (pageIndex !== undefined && pageIndex >= 0 && pageIndex < pages.length)
      ? pageIndex
      : currentPageIndex;
    const targetPage = pages[targetIdx];
    if (!targetPage) return;

    const currentElements = targetPage.elements || [];
    const updatedPages = pages.map((p, idx) => idx === targetIdx ? { ...p, elements: [] } : p);
    const updatedCurrent = targetIdx === currentPageIndex ? updatedPages[targetIdx] : get().currentPage;

    const newUndo = targetIdx === currentPageIndex
      ? [...undoStack, JSON.parse(JSON.stringify(currentElements))].slice(-MAX_HISTORY)
      : undoStack;

    set({
      undoStack: newUndo,
      redoStack: targetIdx === currentPageIndex ? [] : get().redoStack,
      pages: updatedPages,
      currentPage: updatedCurrent,
      isDirty: false,
      saveStatus: 'saved'
    });

    const pageId = targetPage._id || targetPage.id;
    if (pageId) {
      try {
        await api.updatePage(pageId, {
          elements: [],
          title: targetPage.title,
          template: targetPage.template,
          templateConfig: targetPage.templateConfig,
          pdfBackground: targetPage.pdfBackground,
          bookmarked: targetPage.bookmarked
        });
      } catch (err) {
        console.warn('Failed to persist cleared page state:', err);
      }
    }
  },

  // Clear current page elements
  clearCurrentPage: () => {
    const { currentPageIndex } = get();
    get().clearSpecificPage(currentPageIndex);
  },

  // Debounced Autosave (2.5s)
  triggerAutoSave: () => {
    const { autoSaveTimer } = get();
    if (autoSaveTimer) clearTimeout(autoSaveTimer);

    set({ saveStatus: 'saving' });

    const timer = setTimeout(() => {
      get().saveCurrentPageNow();
    }, 2000);

    set({ autoSaveTimer: timer });
  },

  // Save current page immediately to backend/IndexedDB
  saveCurrentPageNow: async () => {
    const { currentPage, currentNotebook } = get();
    if (!currentPage) return;

    const pageId = currentPage._id || currentPage.id;
    try {
      set({ saveStatus: 'saving' });
      await api.updatePage(pageId, {
        elements: currentPage.elements,
        title: currentPage.title,
        template: currentPage.template,
        templateConfig: currentPage.templateConfig,
        pdfBackground: currentPage.pdfBackground,
        bookmarked: currentPage.bookmarked
      });

      set({
        saveStatus: 'saved',
        lastSavedAt: new Date(),
        isDirty: false
      });
    } catch (err) {
      console.warn('Autosave fallback to local storage:', err);
      set({ saveStatus: 'offline', isDirty: false });
    }
  },

  // Update notebook title
  renameNotebook: async (newTitle) => {
    const { currentNotebook } = get();
    if (!currentNotebook || !newTitle.trim()) return;

    const id = currentNotebook._id || currentNotebook.id;
    try {
      const updated = await api.updateNotebook(id, { title: newTitle.trim() });
      set({ currentNotebook: { ...currentNotebook, title: newTitle.trim() } });
      get().fetchNotebooks();
    } catch (err) {
      console.error('Failed to rename notebook:', err);
    }
  },

  // Toggle favorite on notebook
  toggleFavoriteNotebook: async (notebookId) => {
    const { notebooks, currentNotebook } = get();
    const targetId = notebookId || (currentNotebook ? (currentNotebook._id || currentNotebook.id) : null);
    if (!targetId) return;

    const targetNb = notebooks.find(n => (n._id === targetId || n.id === targetId)) || currentNotebook;
    if (!targetNb) return;

    const newFav = !targetNb.favorite;
    try {
      await api.updateNotebook(targetId, { favorite: newFav });
      set({
        notebooks: notebooks.map(n =>
          (n._id === targetId || n.id === targetId) ? { ...n, favorite: newFav } : n
        ),
        currentNotebook: currentNotebook && (currentNotebook._id === targetId || currentNotebook.id === targetId)
          ? { ...currentNotebook, favorite: newFav }
          : currentNotebook
      });
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  }
}));
