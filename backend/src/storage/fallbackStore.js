const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_FILE = path.join(__dirname, 'noteflow_data.json');

// Generate initial sample notebooks with rich handwriting strokes and templates
function generateSeedData() {
  const nb1Id = 'nb-react-class-notes';
  const nb2Id = 'nb-system-design';
  const nb3Id = 'nb-ui-sketchbook';

  const p1Id = 'p-react-1';
  const p2Id = 'p-react-2';
  const p3Id = 'p-react-3';

  const pSys1Id = 'p-sys-1';
  const pSys2Id = 'p-sys-2';

  const pUi1Id = 'p-ui-1';

  // Sample handwritten curved stroke for React title & notes
  const sampleReactStrokes = [
    {
      id: 'elem-header-1',
      type: 'text',
      x: 120,
      y: 90,
      text: 'React 19 & Next.js Core Concepts',
      fontSize: 28,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      color: '#60a5fa',
      width: 2,
      opacity: 1
    },
    {
      id: 'elem-hl-1',
      type: 'highlighter',
      color: 'rgba(250, 204, 21, 0.35)',
      width: 24,
      opacity: 0.8,
      points: [
        { x: 110, y: 120, pressure: 0.8 },
        { x: 340, y: 120, pressure: 0.8 },
        { x: 580, y: 120, pressure: 0.8 }
      ]
    },
    {
      id: 'elem-stroke-1',
      type: 'pen',
      penType: 'fountain',
      color: '#ffffff',
      width: 2.5,
      opacity: 1,
      points: [
        { x: 120, y: 160, pressure: 0.6 },
        { x: 135, y: 158, pressure: 0.7 },
        { x: 160, y: 162, pressure: 0.8 },
        { x: 200, y: 159, pressure: 0.6 }
      ]
    },
    {
      id: 'elem-text-bullet-1',
      type: 'text',
      x: 120,
      y: 195,
      text: '1. Server Components vs Client Components\n• Server components execute exclusively on Node.js/Edge runtime.\n• Client components hydrate with interactive state (useState, useEffect).',
      fontSize: 18,
      fontFamily: 'Inter',
      fontWeight: 'normal',
      color: '#e2e8f0',
      width: 2,
      opacity: 1
    },
    {
      id: 'elem-shape-box',
      type: 'shape',
      shapeType: 'roundedRect',
      x: 120,
      y: 290,
      width_box: 480,
      height_box: 160,
      color: '#3b82f6',
      fillColor: 'rgba(59, 130, 246, 0.08)',
      width: 2,
      opacity: 1
    },
    {
      id: 'elem-box-text',
      type: 'text',
      x: 140,
      y: 310,
      text: 'Action Hooks & Optimistic UI\nuseActionState(fn, initialState)\nuseOptimistic(state, updateFn)',
      fontSize: 16,
      fontFamily: 'Fira Code',
      fontWeight: '500',
      color: '#93c5fd',
      width: 2,
      opacity: 1
    },
    {
      id: 'elem-arrow-1',
      type: 'line',
      shapeType: 'arrow',
      points: [
        { x: 360, y: 470, pressure: 0.5 },
        { x: 360, y: 530, pressure: 0.5 }
      ],
      color: '#10b981',
      width: 2.5,
      opacity: 1
    },
    {
      id: 'elem-note-text',
      type: 'text',
      x: 120,
      y: 550,
      text: 'Note: Always validate form formData on server before database mutation.',
      fontSize: 16,
      fontFamily: 'Inter',
      fontStyle: 'italic',
      color: '#34d399',
      width: 2,
      opacity: 1
    }
  ];

  const pages = [
    {
      _id: p1Id,
      id: p1Id,
      notebookId: nb1Id,
      pageNumber: 1,
      title: 'Server Components & Actions',
      template: 'ruled',
      templateConfig: {
        lineSpacing: 32,
        dotSize: 1.5,
        gridSize: 28,
        lineColor: 'rgba(255, 255, 255, 0.08)',
        backgroundColor: '#1c1e22'
      },
      width: 1200,
      height: 1600,
      elements: sampleReactStrokes,
      bookmarked: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: p2Id,
      id: p2Id,
      notebookId: nb1Id,
      pageNumber: 2,
      title: 'State Management Architecture',
      template: 'ruled',
      templateConfig: {
        lineSpacing: 32,
        dotSize: 1.5,
        gridSize: 28,
        lineColor: 'rgba(255, 255, 255, 0.08)',
        backgroundColor: '#1c1e22'
      },
      width: 1200,
      height: 1600,
      elements: [
        {
          id: 'elem-p2-t1',
          type: 'text',
          x: 120,
          y: 90,
          text: 'Zustand vs Redux Toolkit Comparison',
          fontSize: 26,
          fontFamily: 'Inter',
          fontWeight: 'bold',
          color: '#a78bfa',
          width: 2,
          opacity: 1
        },
        {
          id: 'elem-p2-t2',
          type: 'text',
          x: 120,
          y: 160,
          text: '• Minimal boilerplate, no Context Provider wrapping needed.\n• Atomic selectors prevent wasteful component re-renders.\n• Middleware support: persist (LocalStorage / IndexedDB), devtools.',
          fontSize: 17,
          fontFamily: 'Inter',
          color: '#cbd5e1',
          width: 2,
          opacity: 1
        }
      ],
      bookmarked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: p3Id,
      id: p3Id,
      notebookId: nb1Id,
      pageNumber: 3,
      title: 'Performance & Memoization',
      template: 'grid',
      templateConfig: {
        lineSpacing: 32,
        dotSize: 1.5,
        gridSize: 28,
        lineColor: 'rgba(255, 255, 255, 0.07)',
        backgroundColor: '#1c1e22'
      },
      width: 1200,
      height: 1600,
      elements: [],
      bookmarked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: pSys1Id,
      id: pSys1Id,
      notebookId: nb2Id,
      pageNumber: 1,
      title: 'Distributed Cache Layer',
      template: 'dotted',
      templateConfig: {
        lineSpacing: 32,
        dotSize: 1.5,
        gridSize: 28,
        lineColor: 'rgba(255, 255, 255, 0.12)',
        backgroundColor: '#1a1c20'
      },
      width: 1200,
      height: 1600,
      elements: [
        {
          id: 'elem-sys-1',
          type: 'text',
          x: 120,
          y: 90,
          text: 'Redis Cluster & Cache Invalidation',
          fontSize: 26,
          fontFamily: 'Inter',
          fontWeight: 'bold',
          color: '#f87171',
          width: 2,
          opacity: 1
        }
      ],
      bookmarked: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: pSys2Id,
      id: pSys2Id,
      notebookId: nb2Id,
      pageNumber: 2,
      title: 'Message Queues (Kafka / RabbitMQ)',
      template: 'dotted',
      templateConfig: {
        lineSpacing: 32,
        dotSize: 1.5,
        gridSize: 28,
        lineColor: 'rgba(255, 255, 255, 0.12)',
        backgroundColor: '#1a1c20'
      },
      width: 1200,
      height: 1600,
      elements: [],
      bookmarked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: pUi1Id,
      id: pUi1Id,
      notebookId: nb3Id,
      pageNumber: 1,
      title: 'Design Tokens & Typography Scale',
      template: 'ruled',
      templateConfig: {
        lineSpacing: 32,
        dotSize: 1.5,
        gridSize: 28,
        lineColor: 'rgba(255, 255, 255, 0.08)',
        backgroundColor: '#1c1e22'
      },
      width: 1200,
      height: 1600,
      elements: [
        {
          id: 'elem-ui-1',
          type: 'text',
          x: 120,
          y: 90,
          text: 'Design System Guidelines',
          fontSize: 28,
          fontFamily: 'Inter',
          fontWeight: 'bold',
          color: '#fbbf24',
          width: 2,
          opacity: 1
        }
      ],
      bookmarked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const notebooks = [
    {
      _id: nb1Id,
      id: nb1Id,
      title: 'React 19 & Frontend Architecture',
      cover: 'react-blue',
      theme: 'dark',
      pageTemplate: 'ruled',
      templateConfig: {
        lineSpacing: 32,
        dotSize: 1.5,
        gridSize: 28,
        lineColor: 'rgba(255, 255, 255, 0.08)',
        backgroundColor: '#1c1e22'
      },
      pages: [p1Id, p2Id, p3Id],
      favorite: true,
      inTrash: false,
      trashedAt: null,
      tags: ['React', 'Frontend', 'TypeScript'],
      createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: nb2Id,
      id: nb2Id,
      title: 'System Design & Distributed Systems',
      cover: 'system-crimson',
      theme: 'dark',
      pageTemplate: 'dotted',
      templateConfig: {
        lineSpacing: 32,
        dotSize: 1.5,
        gridSize: 28,
        lineColor: 'rgba(255, 255, 255, 0.12)',
        backgroundColor: '#1a1c20'
      },
      pages: [pSys1Id, pSys2Id],
      favorite: true,
      inTrash: false,
      trashedAt: null,
      tags: ['Architecture', 'Backend', 'Databases'],
      createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      _id: nb3Id,
      id: nb3Id,
      title: 'UI/UX Visual Design & Tokens',
      cover: 'amber-amber',
      theme: 'dark',
      pageTemplate: 'ruled',
      templateConfig: {
        lineSpacing: 32,
        dotSize: 1.5,
        gridSize: 28,
        lineColor: 'rgba(255, 255, 255, 0.08)',
        backgroundColor: '#1c1e22'
      },
      pages: [pUi1Id],
      favorite: false,
      inTrash: false,
      trashedAt: null,
      tags: ['Design', 'Figma', 'CSS'],
      createdAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 20).toISOString()
    }
  ];

  return { notebooks, pages };
}

class FallbackStore {
  constructor() {
    this.data = this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('[FallbackStore] Failed to read disk store, re-seeding:', e.message);
    }
    const seed = generateSeedData();
    this.saveToDisk(seed);
    return seed;
  }

  saveToDisk(dataToSave) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('[FallbackStore] Failed to write data to disk:', e.message);
    }
  }

  // Notebook operations
  getNotebooks(query = {}) {
    let list = this.data.notebooks;
    if (query.inTrash !== undefined) {
      list = list.filter(n => Boolean(n.inTrash) === Boolean(query.inTrash));
    } else {
      list = list.filter(n => !n.inTrash);
    }
    if (query.favorite !== undefined) {
      list = list.filter(n => Boolean(n.favorite) === Boolean(query.favorite));
    }
    // Return populated pages count & previews
    return list.map(n => ({
      ...n,
      pageCount: (n.pages || []).length,
      pages: this.data.pages.filter(p => p.notebookId === (n._id || n.id))
    }));
  }

  getNotebookById(id) {
    const notebook = this.data.notebooks.find(n => (n._id === id || n.id === id));
    if (!notebook) return null;
    const pages = this.data.pages
      .filter(p => p.notebookId === (notebook._id || notebook.id))
      .sort((a, b) => a.pageNumber - b.pageNumber);
    return { ...notebook, pages };
  }

  createNotebook(payload) {
    const id = 'nb-' + uuidv4();
    const pageId = 'p-' + uuidv4();
    const newPage = {
      _id: pageId,
      id: pageId,
      notebookId: id,
      pageNumber: 1,
      title: 'Page 1',
      template: payload.pageTemplate || 'ruled',
      templateConfig: payload.templateConfig || {
        lineSpacing: 32,
        dotSize: 1.5,
        gridSize: 28,
        lineColor: payload.theme === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
        backgroundColor: payload.theme === 'light' ? '#ffffff' : '#1c1e22'
      },
      width: 1200,
      height: 1600,
      elements: [],
      bookmarked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newNotebook = {
      _id: id,
      id: id,
      title: payload.title || 'Untitled Notebook',
      cover: payload.cover || 'classic-dark',
      theme: payload.theme || 'dark',
      pageTemplate: payload.pageTemplate || 'ruled',
      templateConfig: newPage.templateConfig,
      pages: [pageId],
      favorite: Boolean(payload.favorite),
      inTrash: false,
      trashedAt: null,
      tags: payload.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.pages.push(newPage);
    this.data.notebooks.unshift(newNotebook);
    this.saveToDisk();

    return { ...newNotebook, pages: [newPage] };
  }

  updateNotebook(id, update) {
    const idx = this.data.notebooks.findIndex(n => (n._id === id || n.id === id));
    if (idx === -1) return null;

    this.data.notebooks[idx] = {
      ...this.data.notebooks[idx],
      ...update,
      updatedAt: new Date().toISOString()
    };
    this.saveToDisk();
    return this.getNotebookById(id);
  }

  deleteNotebook(id, permanent = false) {
    const idx = this.data.notebooks.findIndex(n => (n._id === id || n.id === id));
    if (idx === -1) return false;

    if (permanent) {
      this.data.notebooks.splice(idx, 1);
      this.data.pages = this.data.pages.filter(p => p.notebookId !== id);
    } else {
      this.data.notebooks[idx].inTrash = true;
      this.data.notebooks[idx].trashedAt = new Date().toISOString();
    }
    this.saveToDisk();
    return true;
  }

  duplicateNotebook(id) {
    const original = this.getNotebookById(id);
    if (!original) return null;

    const newNbId = 'nb-' + uuidv4();
    const newPages = original.pages.map((p, index) => {
      const newPageId = 'p-' + uuidv4();
      return {
        ...p,
        _id: newPageId,
        id: newPageId,
        notebookId: newNbId,
        pageNumber: index + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    const newNotebook = {
      ...original,
      _id: newNbId,
      id: newNbId,
      title: `${original.title} (Copy)`,
      pages: newPages.map(p => p._id),
      favorite: false,
      inTrash: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.pages.push(...newPages);
    this.data.notebooks.unshift(newNotebook);
    this.saveToDisk();
    return { ...newNotebook, pages: newPages };
  }

  // Page operations
  getPagesByNotebook(notebookId) {
    return this.data.pages
      .filter(p => p.notebookId === notebookId)
      .sort((a, b) => a.pageNumber - b.pageNumber);
  }

  getPageById(pageId) {
    return this.data.pages.find(p => (p._id === pageId || p.id === pageId)) || null;
  }

  createPage(notebookId, payload = {}) {
    const notebook = this.data.notebooks.find(n => (n._id === notebookId || n.id === notebookId));
    if (!notebook) return null;

    const existingPages = this.getPagesByNotebook(notebookId);
    const nextPageNum = existingPages.length + 1;
    const pageId = 'p-' + uuidv4();

    const newPage = {
      _id: pageId,
      id: pageId,
      notebookId,
      pageNumber: nextPageNum,
      title: payload.title || `Page ${nextPageNum}`,
      template: payload.template || notebook.pageTemplate || 'ruled',
      templateConfig: payload.templateConfig || notebook.templateConfig,
      width: payload.width || 1200,
      height: payload.height || 1600,
      elements: payload.elements || [],
      pdfBackground: payload.pdfBackground || null,
      bookmarked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.pages.push(newPage);
    if (!notebook.pages.includes(pageId)) {
      notebook.pages.push(pageId);
    }
    notebook.updatedAt = new Date().toISOString();
    this.saveToDisk();
    return newPage;
  }

  updatePage(pageId, update) {
    const idx = this.data.pages.findIndex(p => (p._id === pageId || p.id === pageId));
    if (idx === -1) return null;

    this.data.pages[idx] = {
      ...this.data.pages[idx],
      ...update,
      updatedAt: new Date().toISOString()
    };

    // Update notebook updatedAt
    const nb = this.data.notebooks.find(n => (n._id === this.data.pages[idx].notebookId || n.id === this.data.pages[idx].notebookId));
    if (nb) nb.updatedAt = new Date().toISOString();

    this.saveToDisk();
    return this.data.pages[idx];
  }

  deletePage(pageId) {
    const idx = this.data.pages.findIndex(p => (p._id === pageId || p.id === pageId));
    if (idx === -1) return false;

    const page = this.data.pages[idx];
    const notebookId = page.notebookId;

    this.data.pages.splice(idx, 1);

    const notebook = this.data.notebooks.find(n => (n._id === notebookId || n.id === notebookId));
    if (notebook) {
      notebook.pages = notebook.pages.filter(pId => pId !== pageId && pId !== page._id);
      notebook.updatedAt = new Date().toISOString();
    }

    // Re-index remaining pages
    const remaining = this.getPagesByNotebook(notebookId);
    remaining.forEach((p, index) => {
      p.pageNumber = index + 1;
    });

    this.saveToDisk();
    return true;
  }

  duplicatePage(pageId) {
    const original = this.getPageById(pageId);
    if (!original) return null;

    const newPageId = 'p-' + uuidv4();
    const existing = this.getPagesByNotebook(original.notebookId);
    const newPage = {
      ...original,
      _id: newPageId,
      id: newPageId,
      pageNumber: original.pageNumber + 1,
      title: `${original.title || 'Page'} (Copy)`,
      bookmarked: false,
      elements: JSON.parse(JSON.stringify(original.elements || [])),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Shift succeeding page numbers
    existing.forEach(p => {
      if (p.pageNumber > original.pageNumber) {
        p.pageNumber += 1;
      }
    });

    this.data.pages.push(newPage);
    const nb = this.data.notebooks.find(n => (n._id === original.notebookId || n.id === original.notebookId));
    if (nb) {
      nb.pages.push(newPageId);
      nb.updatedAt = new Date().toISOString();
    }
    this.saveToDisk();
    return newPage;
  }

  reorderPages(notebookId, orderedPageIds) {
    const notebook = this.data.notebooks.find(n => (n._id === notebookId || n.id === notebookId));
    if (!notebook) return false;

    orderedPageIds.forEach((id, index) => {
      const page = this.data.pages.find(p => (p._id === id || p.id === id));
      if (page && page.notebookId === notebookId) {
        page.pageNumber = index + 1;
      }
    });

    notebook.pages = orderedPageIds;
    notebook.updatedAt = new Date().toISOString();
    this.saveToDisk();
    return true;
  }

  search(queryStr) {
    if (!queryStr || queryStr.trim() === '') return [];
    const q = queryStr.toLowerCase();
    const results = [];

    // Search notebooks
    this.data.notebooks.forEach(nb => {
      if (nb.inTrash) return;
      if (nb.title.toLowerCase().includes(q) || (nb.tags && nb.tags.some(t => t.toLowerCase().includes(q)))) {
        results.push({
          type: 'notebook',
          id: nb._id || nb.id,
          notebookId: nb._id || nb.id,
          title: nb.title,
          snippet: `Notebook: ${nb.title} (${(nb.pages || []).length} pages)`,
          updatedAt: nb.updatedAt
        });
      }
    });

    // Search pages & elements
    this.data.pages.forEach(p => {
      const parentNb = this.data.notebooks.find(n => (n._id === p.notebookId || n.id === p.notebookId));
      if (parentNb && parentNb.inTrash) return;

      let matchedSnippet = '';
      if (p.title && p.title.toLowerCase().includes(q)) {
        matchedSnippet = `Page title: ${p.title}`;
      } else if (p.elements && Array.isArray(p.elements)) {
        for (const el of p.elements) {
          if (el.type === 'text' && el.text && el.text.toLowerCase().includes(q)) {
            matchedSnippet = el.text.length > 80 ? el.text.slice(0, 80) + '...' : el.text;
            break;
          }
        }
      }

      if (matchedSnippet) {
        results.push({
          type: 'page',
          id: p._id || p.id,
          pageId: p._id || p.id,
          notebookId: p.notebookId,
          notebookTitle: parentNb ? parentNb.title : 'Notebook',
          pageNumber: p.pageNumber,
          title: p.title || `Page ${p.pageNumber}`,
          snippet: matchedSnippet,
          updatedAt: p.updatedAt
        });
      }
    });

    return results;
  }

  importNoteFlow(bundle) {
    if (!bundle || !bundle.notebook) {
      throw new Error('Invalid .noteflow bundle');
    }
    const newNbId = 'nb-' + uuidv4();
    const pageIdMap = {};

    const importedPages = (bundle.pages || []).map((p, index) => {
      const newPageId = 'p-' + uuidv4();
      pageIdMap[p._id || p.id] = newPageId;
      return {
        ...p,
        _id: newPageId,
        id: newPageId,
        notebookId: newNbId,
        pageNumber: index + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    const importedNotebook = {
      ...bundle.notebook,
      _id: newNbId,
      id: newNbId,
      title: bundle.notebook.title ? `${bundle.notebook.title} (Imported)` : 'Imported Notebook',
      pages: importedPages.map(p => p._id),
      inTrash: false,
      trashedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.pages.push(...importedPages);
    this.data.notebooks.unshift(importedNotebook);
    this.saveToDisk();

    return { ...importedNotebook, pages: importedPages };
  }
}

const fallbackStore = new FallbackStore();
module.exports = fallbackStore;
