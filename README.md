# NoteFlow — Professional Digital Notebook & Canvas Workspace

NoteFlow is a high-performance, desktop-first, tablet-friendly digital note-taking platform inspired by professional notebook interfaces. It combines fluid handwriting physics, dark/light ruled paper templates, floating tool settings, a left thumbnail page navigator, a glowing laser pointer, PDF import/export, and a standalone `.noteflow` archive format.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18+ or v20+ recommended
- **MongoDB** *(optional)*: Connected automatically if running on `mongodb://127.0.0.1:27017/noteflow`. If MongoDB is not running, NoteFlow automatically switches to its local JSON database with zero setup needed!

### 1. Start the Backend API Server
```bash
cd noteflow/backend
npm install
npm run dev
```
*Backend runs on port `http://localhost:5000`*

### 2. Start the Frontend Application
```bash
cd noteflow/frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🎨 Feature Overview

### 1. High-Performance Canvas Engine
- **Multi-Layer Architecture**:
  - `Background Layer`: Renders Ruled lines (with left red margin line), Dotted grid, Graph paper, or Blank paper.
  - `Highlighter Layer`: Composite `multiply` blend mode behind normal ink.
  - `Vector Elements Layer`: Catmull-Rom & Quadratic Bezier smoothed strokes, shapes, editable text, and images.
  - `Active Scratch Layer`: 60 FPS in-flight stroke previews.
  - `Laser Pointer Layer`: Physics-based exponential fading glowing red laser trail for presentations.
- **Pointer Events**: Native support for Stylus/Pen with pressure sensitivity, mouse, trackpad, and touch.
- **Palm Rejection & Navigation**: `Space + drag` or middle-mouse to pan, `Ctrl + Mouse Wheel` to zoom around cursor.

### 2. Digital Note Instruments
- **Pen**: Ball Pen, Fountain Pen (pressure-sensitive), Brush Pen, Pencil.
- **Highlighter**: Semi-transparent highlighter behind ink.
- **Eraser**:
  - `Pixel Eraser`: Natural eraser erasing touched coordinates.
  - `Object Eraser`: Hit-tests and removes entire strokes or elements.
- **Shapes & Lines**: Rectangle, Rounded Rectangle, Circle, Ellipse, Triangle, Star, Line, Arrow, Double Arrow.
- **Text Box**: Inline typography editor (Inter, Caveat handwriting, Fira Code, Serif).
- **Images**: Insert, drag & drop, or paste PNG, JPG, WEBP images.
- **Laser Pointer**: Bright glowing laser trail with 1.4-second automatic decay for lectures and teaching.

### 3. Notebook & Page System
- **Left Collapsible Thumbnail Drawer**: Live interactive canvas previews, page numbers, drag/drop reordering, bookmarks, page duplication, and "+ Add Page".
- **Page Templates**: Ruled, Dotted, Grid, and Blank.
- **Teaching Mode**: Distraction-free full-screen presentation mode with a floating minimalist dock.
- **Import / Export**:
  - **PDF Export**: jsPDF vector & raster export of single pages or entire notebooks.
  - **PDF Import**: Drag & drop PDF files to convert pages into notebook backgrounds.
  - **.noteflow Files**: Standalone JSON archive format for offline backup and sharing.
  - **PNG / JPG Export**: Instant high-res page image snapshots.
  - **Browser Print**: Clean print stylesheets hiding app UI.

---

## 🛠️ REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/notebooks` | List all notebooks (filters: `inTrash`, `favorite`) |
| `POST` | `/api/notebooks` | Create a new notebook |
| `GET` | `/api/notebooks/:id` | Get notebook details with populated pages |
| `PUT` | `/api/notebooks/:id` | Update notebook title, theme, template, favorite |
| `DELETE` | `/api/notebooks/:id` | Soft delete to trash or permanently delete |
| `POST` | `/api/notebooks/:id/duplicate` | Duplicate notebook with all pages |
| `GET` | `/api/notebooks/:notebookId/pages` | Get all pages in notebook |
| `POST` | `/api/notebooks/:notebookId/pages` | Add new page |
| `PUT` | `/api/pages/:id` | Autosave page elements, template, and title |
| `DELETE` | `/api/pages/:id` | Delete page |
| `POST` | `/api/pages/:id/duplicate` | Duplicate page |
| `PUT` | `/api/notebooks/:notebookId/reorder` | Reorder page IDs |
| `GET` | `/api/search?q=query` | Full-text search across notebooks and notes |
| `POST` | `/api/files/upload` | Upload image or document asset |
| `GET` | `/api/health` | Service health and database connection status |

---

## ⌨️ Keyboard Shortcuts

- `P` — Pen Tool
- `E` — Eraser Tool
- `H` — Highlighter Tool
- `S` — Select / Move Tool
- `T` — Text Tool
- `L` — Line / Arrow Tool
- `R` — Shape Tool
- `I` — Insert Image
- `Z` — Zoom In
- `X` — Zoom Out
- `Ctrl + Z` — Undo
- `Ctrl + Shift + Z` / `Ctrl + Y` — Redo
- `Ctrl + S` — Save
- `Ctrl + P` — Print
- `Escape` — Close popup / Exit Teaching Mode
- `Arrow Left / Right` — Previous / Next Page (in Teaching Mode)
# noteflow
# noteflow
