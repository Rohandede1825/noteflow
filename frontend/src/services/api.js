const defaultCloudBackend = 'https://noteflow-j904.onrender.com';
const rawApiUrl = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim())
  ? import.meta.env.VITE_API_URL.trim().replace(/\/$/, '')
  : defaultCloudBackend;

const API_BASE = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

// Local Offline Storage Fallback Engine
const LOCAL_STORAGE_KEY = 'noteflow_offline_data_v1';

function getLocalData() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return { notebooks: [], pages: [] };
}

function saveLocalData(data) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (_) {}
}

function generateUUID(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

export const api = {
  // Notebooks
  async getNotebooks(query = {}) {
    try {
      const params = new URLSearchParams();
      if (query.inTrash !== undefined) params.append('inTrash', query.inTrash);
      if (query.favorite !== undefined) params.append('favorite', query.favorite);

      const res = await fetch(`${API_BASE}/notebooks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const serverNotebooks = data.data || [];
        // Cache server notebooks to local storage
        const local = getLocalData();
        local.notebooks = serverNotebooks;
        saveLocalData(local);
        return serverNotebooks;
      }
    } catch (err) {
      console.warn('[API] Cloud fetch failed, using local offline store:', err.message);
    }

    // Fallback: Local offline store
    const local = getLocalData();
    let list = local.notebooks || [];
    if (query.inTrash !== undefined) {
      list = list.filter(n => Boolean(n.inTrash) === Boolean(query.inTrash));
    } else {
      list = list.filter(n => !n.inTrash);
    }
    if (query.favorite !== undefined) {
      list = list.filter(n => Boolean(n.favorite) === Boolean(query.favorite));
    }
    return list;
  },

  async getNotebookById(id) {
    try {
      const res = await fetch(`${API_BASE}/notebooks/${id}`);
      if (res.ok) {
        const data = await res.json();
        return data.data;
      }
    } catch (err) {
      console.warn('[API] Cloud getNotebookById failed, using local store:', err.message);
    }

    const local = getLocalData();
    const nb = local.notebooks.find(n => (n._id === id || n.id === id));
    if (nb) {
      const pages = (local.pages || []).filter(p => p.notebookId === id);
      return { ...nb, pages };
    }
    return null;
  },

  async createNotebook(payload) {
    try {
      const res = await fetch(`${API_BASE}/notebooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return data.data;
      }
    } catch (err) {
      console.warn('[API] Cloud createNotebook failed, saving locally:', err.message);
    }

    // Offline local creation
    const local = getLocalData();
    const nbId = generateUUID('nb');
    const pageId = generateUUID('p');

    const firstPage = {
      _id: pageId,
      id: pageId,
      notebookId: nbId,
      pageNumber: 1,
      title: 'Page 1',
      template: payload.pageTemplate || 'ruled',
      templateConfig: payload.templateConfig || {
        lineSpacing: 44,
        dotSize: 1.25,
        gridSize: 28,
        lineColor: payload.theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        backgroundColor: payload.theme === 'dark' ? '#262729' : '#ffffff'
      },
      elements: [],
      bookmarked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newNotebook = {
      _id: nbId,
      id: nbId,
      title: payload.title || 'Untitled Notebook',
      cover: payload.cover || 'classic-dark',
      theme: payload.theme || 'dark',
      pageTemplate: payload.pageTemplate || 'ruled',
      templateConfig: firstPage.templateConfig,
      pages: [firstPage],
      favorite: Boolean(payload.favorite),
      inTrash: false,
      trashedAt: null,
      tags: payload.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    local.notebooks.unshift(newNotebook);
    local.pages.push(firstPage);
    saveLocalData(local);

    return newNotebook;
  },

  async updateNotebook(id, payload) {
    try {
      const res = await fetch(`${API_BASE}/notebooks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return data.data;
      }
    } catch (err) {
      console.warn('[API] Cloud updateNotebook failed, updating local store:', err.message);
    }

    const local = getLocalData();
    const idx = local.notebooks.findIndex(n => (n._id === id || n.id === id));
    if (idx !== -1) {
      local.notebooks[idx] = { ...local.notebooks[idx], ...payload, updatedAt: new Date().toISOString() };
      saveLocalData(local);
      return local.notebooks[idx];
    }
    return null;
  },

  async deleteNotebook(id, permanent = false) {
    try {
      const res = await fetch(`${API_BASE}/notebooks/${id}?permanent=${permanent}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[API] Cloud deleteNotebook failed, deleting locally:', err.message);
    }

    const local = getLocalData();
    if (permanent) {
      local.notebooks = local.notebooks.filter(n => (n._id !== id && n.id !== id));
      local.pages = local.pages.filter(p => p.notebookId !== id);
    } else {
      const nb = local.notebooks.find(n => (n._id === id || n.id === id));
      if (nb) {
        nb.inTrash = true;
        nb.trashedAt = new Date().toISOString();
      }
    }
    saveLocalData(local);
    return { success: true };
  },

  async duplicateNotebook(id) {
    try {
      const res = await fetch(`${API_BASE}/notebooks/${id}/duplicate`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        return data.data;
      }
    } catch (err) {
      console.warn('[API] Cloud duplicateNotebook failed, using local duplicate:', err.message);
    }

    const original = await this.getNotebookById(id);
    if (!original) return null;

    const newNb = await this.createNotebook({
      title: `${original.title} (Copy)`,
      cover: original.cover,
      theme: original.theme,
      pageTemplate: original.pageTemplate,
      templateConfig: original.templateConfig,
      tags: original.tags
    });
    return newNb;
  },

  // Pages
  async getPagesByNotebook(notebookId) {
    try {
      const res = await fetch(`${API_BASE}/notebooks/${notebookId}/pages`);
      if (res.ok) {
        const data = await res.json();
        return data.data || [];
      }
    } catch (err) {
      console.warn('[API] Cloud getPagesByNotebook failed, using local store:', err.message);
    }

    const local = getLocalData();
    return (local.pages || []).filter(p => p.notebookId === notebookId);
  },

  async getPageById(id) {
    try {
      const res = await fetch(`${API_BASE}/pages/${id}`);
      if (res.ok) {
        const data = await res.json();
        return data.data;
      }
    } catch (err) {
      console.warn('[API] Cloud getPageById failed, using local store:', err.message);
    }

    const local = getLocalData();
    return (local.pages || []).find(p => (p._id === id || p.id === id)) || null;
  },

  async createPage(notebookId, payload = {}) {
    try {
      const res = await fetch(`${API_BASE}/notebooks/${notebookId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return data.data;
      }
    } catch (err) {
      console.warn('[API] Cloud createPage failed, creating locally:', err.message);
    }

    const local = getLocalData();
    const existing = (local.pages || []).filter(p => p.notebookId === notebookId);
    const pageId = generateUUID('p');
    const newPage = {
      _id: pageId,
      id: pageId,
      notebookId,
      pageNumber: existing.length + 1,
      title: payload.title || `Page ${existing.length + 1}`,
      template: payload.template || 'ruled',
      templateConfig: payload.templateConfig || {},
      width: payload.width || 1200,
      height: payload.height || 1600,
      elements: payload.elements || [],
      pdfBackground: payload.pdfBackground || null,
      bookmarked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    local.pages.push(newPage);
    saveLocalData(local);
    return newPage;
  },

  async updatePage(id, payload) {
    try {
      const res = await fetch(`${API_BASE}/pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return data.data;
      }
    } catch (err) {
      console.warn('[API] Cloud updatePage failed, updating local store:', err.message);
    }

    const local = getLocalData();
    const idx = (local.pages || []).findIndex(p => (p._id === id || p.id === id));
    if (idx !== -1) {
      local.pages[idx] = { ...local.pages[idx], ...payload, updatedAt: new Date().toISOString() };
      saveLocalData(local);
      return local.pages[idx];
    }
    return null;
  },

  async deletePage(id) {
    try {
      const res = await fetch(`${API_BASE}/pages/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[API] Cloud deletePage failed, deleting locally:', err.message);
    }

    const local = getLocalData();
    local.pages = (local.pages || []).filter(p => (p._id !== id && p.id !== id));
    saveLocalData(local);
    return { success: true };
  },

  async duplicatePage(id) {
    try {
      const res = await fetch(`${API_BASE}/pages/${id}/duplicate`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        return data.data;
      }
    } catch (err) {
      console.warn('[API] Cloud duplicatePage failed, duplicating locally:', err.message);
    }

    const original = await this.getPageById(id);
    if (!original) return null;

    return await this.createPage(original.notebookId, {
      title: `${original.title || 'Page'} (Copy)`,
      template: original.template,
      templateConfig: original.templateConfig,
      elements: JSON.parse(JSON.stringify(original.elements || [])),
      pdfBackground: original.pdfBackground
    });
  },

  async reorderPages(notebookId, orderedPageIds) {
    try {
      const res = await fetch(`${API_BASE}/notebooks/${notebookId}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedPageIds })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[API] Cloud reorderPages failed:', err.message);
    }
    return { success: true };
  },

  // File Upload
  async uploadFile(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/files/upload`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        return data.data;
      }
    } catch (err) {
      console.warn('[API] Cloud uploadFile failed:', err.message);
    }
    return null;
  },

  // Search
  async search(query) {
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        return data.data || [];
      }
    } catch (err) {
      console.warn('[API] Cloud search failed, searching local store:', err.message);
    }

    const local = getLocalData();
    const q = (query || '').toLowerCase();
    return (local.notebooks || []).filter(n => n.title && n.title.toLowerCase().includes(q));
  },

  // NoteFlow File Import
  async importNoteFlow(bundle) {
    try {
      const res = await fetch(`${API_BASE}/notebooks/import/noteflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bundle)
      });
      if (res.ok) {
        const data = await res.json();
        return data.data;
      }
    } catch (err) {
      console.warn('[API] Cloud importNoteFlow failed:', err.message);
    }
    return null;
  }
};
