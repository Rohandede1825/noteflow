import { create } from 'zustand';

export const QUICK_PEN_COLORS = [
  '#000000', // Black
  '#38BDF8', // Light Sky Blue
  '#FFFFFF', // White
  '#A855F7', // Purple
  '#9CA3AF', // Gray
  '#F87171'  // Coral / Salmon Pink
];

export const FULL_COLOR_PALETTE = [
  '#000000', // Black
  '#1F2937', // Dark Slate
  '#4B5563', // Slate
  '#9CA3AF', // Light Gray
  '#FFFFFF', // White
  '#EF4444', // Red
  '#F87171', // Coral Red
  '#F97316', // Orange
  '#FBBF24', // Amber
  '#34D399', // Emerald
  '#10B981', // Green
  '#38BDF8', // Sky Blue
  '#2563EB', // Royal Blue
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#EC4899'  // Pink
];

export const QUICK_PEN_WIDTHS = [1.5, 2.5, 4.5];

export const useToolStore = create((set, get) => ({
  activeTool: 'pen', // 'select' | 'pen' | 'highlighter' | 'eraser' | 'shapes' | 'line' | 'text' | 'image' | 'laser' | 'pan'
  activePopup: null, // 'colorPalette' | 'penStyle' | 'shapePicker' | 'eraserSettings' | 'text' | null

  // Pen Settings
  penType: 'ball', // 'ball' | 'fountain' | 'brush' | 'pencil'
  penColor: '#38BDF8',
  penWidth: 2.5,
  penOpacity: 1,
  strokeStrength: 1.0, // 0.3 (Soft) to 2.0 (Strong), default 1.0

  // Highlighter Settings
  highlighterColor: 'rgba(250, 204, 21, 0.38)',
  highlighterWidth: 24,
  highlighterOpacity: 0.4,

  // Eraser Settings - DEFAULT: PIXEL / STANDARD ERASER
  eraserMode: 'pixel', // 'pixel' (standard eraser) | 'stroke' (object eraser)
  eraserSize: 'medium',
  eraserRadius: 20,

  // Shapes Settings
  shapeType: 'rectangle', // 'rectangle' | 'circle' | 'line' | 'arrow' | 'triangle' | 'roundedRect'
  shapeStrokeColor: '#38BDF8',
  shapeFillColor: 'transparent',
  shapeWidth: 2,
  isDashed: false,

  // Line Settings
  lineType: 'line',
  lineColor: '#38BDF8',
  lineWidth: 2.5,

  // Text Settings
  textSettings: {
    fontSize: 20,
    fontFamily: 'Inter',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'left',
    color: '#F5F6F8'
  },

  // Selection
  selectedElementIds: [],
  selectionBounds: null,

  // Laser Pointer Trail Points
  laserTrail: [],

  // 1-Click Action Tool Selection
  setActiveTool: (tool) => {
    set({
      activeTool: tool,
      activePopup: null,
      selectedElementIds: tool === 'select' ? get().selectedElementIds : []
    });
  },

  setActivePopup: (popup) => {
    set((state) => ({
      activePopup: state.activePopup === popup ? null : popup
    }));
  },

  closePopup: () => set({ activePopup: null }),

  // Pen updates
  setPenType: (penType) => set({ penType }),
  setPenColor: (penColor) => set({ penColor }),
  setPenWidth: (penWidth) => set({ penWidth }),
  setPenOpacity: (penOpacity) => set({ penOpacity }),
  setStrokeStrength: (strokeStrength) => set({ strokeStrength }),

  // Highlighter updates
  setHighlighterColor: (highlighterColor) => set({ highlighterColor }),
  setHighlighterWidth: (highlighterWidth) => set({ highlighterWidth }),
  setHighlighterOpacity: (highlighterOpacity) => set({ highlighterOpacity }),

  // Eraser updates
  setEraserMode: (eraserMode) => set({ eraserMode }),
  setEraserSize: (eraserSize) => {
    const radii = { small: 10, medium: 20, large: 36, xlarge: 56 };
    set({ eraserSize, eraserRadius: radii[eraserSize] || 20 });
  },

  // Shape updates
  setShapeType: (shapeType) => set({ shapeType }),
  setShapeStrokeColor: (shapeStrokeColor) => set({ shapeStrokeColor }),
  setShapeFillColor: (shapeFillColor) => set({ shapeFillColor }),
  setShapeWidth: (shapeWidth) => set({ shapeWidth }),
  setIsDashed: (isDashed) => set({ isDashed }),

  // Text updates
  setTextSettings: (updates) => set((state) => ({
    textSettings: { ...state.textSettings, ...updates }
  })),

  // Selection updates
  setSelectedElementIds: (ids) => set({ selectedElementIds: ids }),

  // Laser Pointer Actions
  addLaserPoint: (point) => {
    const now = Date.now();
    const trail = get().laserTrail;
    const ptWithTime = { ...point, timestamp: now };
    set({ laserTrail: [...trail.slice(-140), ptWithTime] });
  },

  decayLaserTrail: () => {
    const now = Date.now();
    const CUTOFF_MS = 1000; // 1 second smooth fade
    set((state) => ({
      laserTrail: state.laserTrail.filter(p => now - p.timestamp < CUTOFF_MS)
    }));
  },

  clearLaserTrail: () => set({ laserTrail: [] })
}));
