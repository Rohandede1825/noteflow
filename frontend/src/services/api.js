const rawApiUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.trim().replace(/\/$/, '') : '';
const API_BASE = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`)
  : '/api';

export const api = {
  // Notebooks
  async getNotebooks(query = {}) {
    const params = new URLSearchParams();
    if (query.inTrash !== undefined) params.append('inTrash', query.inTrash);
    if (query.favorite !== undefined) params.append('favorite', query.favorite);

    const res = await fetch(`${API_BASE}/notebooks?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.data || [];
  },

  async getNotebookById(id) {
    const res = await fetch(`${API_BASE}/notebooks/${id}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.data;
  },

  async createNotebook(payload) {
    const res = await fetch(`${API_BASE}/notebooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.data;
  },

  async updateNotebook(id, payload) {
    const res = await fetch(`${API_BASE}/notebooks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.data;
  },

  async deleteNotebook(id, permanent = false) {
    const res = await fetch(`${API_BASE}/notebooks/${id}?permanent=${permanent}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  },

  async duplicateNotebook(id) {
    const res = await fetch(`${API_BASE}/notebooks/${id}/duplicate`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.data;
  },

  // Pages
  async getPagesByNotebook(notebookId) {
    const res = await fetch(`${API_BASE}/notebooks/${notebookId}/pages`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.data || [];
  },

  async getPageById(id) {
    const res = await fetch(`${API_BASE}/pages/${id}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.data;
  },

  async createPage(notebookId, payload = {}) {
    const res = await fetch(`${API_BASE}/notebooks/${notebookId}/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.data;
  },

  async updatePage(id, payload) {
    const res = await fetch(`${API_BASE}/pages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.data;
  },

  async deletePage(id) {
    const res = await fetch(`${API_BASE}/pages/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  },

  async duplicatePage(id) {
    const res = await fetch(`${API_BASE}/pages/${id}/duplicate`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.data;
  },

  async reorderPages(notebookId, orderedPageIds) {
    const res = await fetch(`${API_BASE}/notebooks/${notebookId}/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedPageIds })
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  },

  // File Upload
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.data;
  },

  // Search
  async search(query) {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.data || [];
  },

  // NoteFlow File Import
  async importNoteFlow(bundle) {
    const res = await fetch(`${API_BASE}/notebooks/import/noteflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bundle)
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.data;
  }
};
