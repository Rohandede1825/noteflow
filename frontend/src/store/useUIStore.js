import { create } from 'zustand';

export const useUIStore = create((set, get) => ({
  // Viewport navigation
  zoomLevel: 1.0,
  panOffset: { x: 0, y: 0 },
  isPanning: false,

  // Layout sidebars
  isPageSidebarOpen: true,
  isAppSidebarOpen: false,

  // Presentation & Fullscreen
  isTeachingMode: false,
  isFullscreen: false,

  // Modals & Drawers
  activeModal: null, // 'createNotebook' | 'export' | 'share' | 'search' | 'settings' | 'importPdf' | 'paperSettings'
  modalProps: {},

  // Right-click context menu
  contextMenu: {
    isOpen: false,
    x: 0,
    y: 0,
    canvasX: 0,
    canvasY: 0,
    targetElementId: null
  },

  // Toast notifications
  toasts: [],

  // Zoom Actions
  setZoomLevel: (zoom) => {
    const clamped = Math.max(0.25, Math.min(5.0, Number(zoom.toFixed(2))));
    set({ zoomLevel: clamped });
  },

  zoomIn: () => {
    const current = get().zoomLevel;
    get().setZoomLevel(Math.min(5.0, current + 0.15));
  },

  zoomOut: () => {
    const current = get().zoomLevel;
    get().setZoomLevel(Math.max(0.25, current - 0.15));
  },

  resetZoom: () => {
    set({ zoomLevel: 1.0, panOffset: { x: 0, y: 0 } });
  },

  // Zoom centered around cursor
  zoomAroundCursor: (deltaZoom, clientX, clientY, containerRect) => {
    if (!containerRect) {
      get().setZoomLevel(get().zoomLevel + deltaZoom);
      return;
    }

    const { zoomLevel, panOffset } = get();
    const newZoom = Math.max(0.25, Math.min(5.0, zoomLevel + deltaZoom));
    if (newZoom === zoomLevel) return;

    // Viewport relative mouse position
    const mouseX = clientX - containerRect.left - containerRect.width / 2;
    const mouseY = clientY - containerRect.top - containerRect.height / 2;

    // Adjust pan offset so point under cursor remains fixed
    const scaleFactor = newZoom / zoomLevel;
    const newPanX = mouseX - (mouseX - panOffset.x) * scaleFactor;
    const newPanY = mouseY - (mouseY - panOffset.y) * scaleFactor;

    set({
      zoomLevel: Number(newZoom.toFixed(3)),
      panOffset: { x: newPanX, y: newPanY }
    });
  },

  setPanOffset: (offsetOrUpdater) => {
    set((state) => ({
      panOffset: typeof offsetOrUpdater === 'function' ? offsetOrUpdater(state.panOffset) : offsetOrUpdater
    }));
  },

  setIsPanning: (isPanning) => set({ isPanning }),

  togglePageSidebar: () => set((state) => ({ isPageSidebarOpen: !state.isPageSidebarOpen })),
  setPageSidebarOpen: (isOpen) => set({ isPageSidebarOpen: isOpen }),

  toggleAppSidebar: () => set((state) => ({ isAppSidebarOpen: !state.isAppSidebarOpen })),
  setAppSidebarOpen: (isOpen) => set({ isAppSidebarOpen: isOpen }),

  setTeachingMode: (isTeaching) => set({ isTeachingMode: isTeaching }),
  toggleTeachingMode: () => set((state) => ({ isTeachingMode: !state.isTeachingMode })),

  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  toggleFullscreen: () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      set({ isFullscreen: true });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      set({ isFullscreen: false });
    }
  },

  openModal: (modalName, props = {}) => set({ activeModal: modalName, modalProps: props }),
  closeModal: () => set({ activeModal: null, modalProps: {} }),

  openContextMenu: (coords) => set({
    contextMenu: {
      isOpen: true,
      x: coords.x,
      y: coords.y,
      canvasX: coords.canvasX,
      canvasY: coords.canvasY,
      targetElementId: coords.targetElementId || null
    }
  }),

  closeContextMenu: () => set((state) => ({
    contextMenu: { ...state.contextMenu, isOpen: false }
  })),

  addToast: (message, type = 'info', duration = 3000) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));

    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  }))
}));
