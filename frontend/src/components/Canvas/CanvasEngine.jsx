import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNotebookStore } from '../../store/useNotebookStore';
import { useToolStore } from '../../store/useToolStore';
import { useUIStore } from '../../store/useUIStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { SinglePageCanvas } from './SinglePageCanvas';
import { LaserLayer } from './LaserLayer';
import { TextOverlayEditor } from './TextOverlayEditor';
import {
  drawSmoothStroke,
  calculateWidth,
  isPointNearStroke,
  doesStrokeIntersectEraser,
  isPointInEraserSweep,
  getPointDistance,
  doesElementIntersectEraser,
  getBoundingBox
} from '../../utils/smoothStroke';
import { drawShape } from '../../utils/geometry';
import { recognizeShape } from '../../utils/shapeRecognition';
import {
  ZoomIn,
  ZoomOut,
  ChevronDown,
  Plus,
  ArrowDown
} from 'lucide-react';

const PAGE_GAP = 32;
const ZOOM_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0];

export function CanvasEngine() {
  const containerRef = useRef(null);
  const stackWrapperRef = useRef(null);
  const inFlightCanvasRef = useRef(null);

  const {
    pages,
    currentPageIndex,
    targetScrollPageIndex,
    setCurrentPageIndex,
    setPageElements,
    addPage
  } = useNotebookStore();

  const {
    activeTool,
    penType,
    penColor,
    penWidth,
    penOpacity,
    strokeStrength,
    autoShapeRecognition,
    highlighterColor,
    highlighterWidth,
    highlighterOpacity,
    eraserMode,
    eraserRadius,
    shapeType,
    shapeStrokeColor,
    shapeFillColor,
    shapeWidth,
    isDashed,
    addLaserPoint,
    selectedElementIds,
    setSelectedElementIds
  } = useToolStore();

  const {
    zoomLevel,
    setZoomLevel,
    panOffset,
    setPanOffset,
    isPanning,
    setIsPanning,
    zoomAroundCursor,
    openContextMenu
  } = useUIStore();

  const { settings } = useSettingsStore();

  // In-flight imperative drawing buffers (ZERO React state lag during pointer movements)
  const isDrawingRef = useRef(false);
  const isSpacePressedRef = useRef(false);
  const isMiddleClickPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const activePageIndexRef = useRef(0);
  const activeStrokePointsRef = useRef([]);
  const activeShapeStartRef = useRef(null);
  const prevEraserCoordsRef = useRef(null);
  const lastLaserCoordsRef = useRef(null);

  // In-flight scratch rAF loop
  const rafScratchRef = useRef(null);
  const scratchNeedsRenderRef = useRef(false);

  // Pull-to-create / force-down state
  const isCreatingPageRef = useRef(false);
  const [pullDownAmount, setPullDownAmount] = useState(0);

  // Dragging & Resizing selected elements state
  const isDraggingSelectedRef = useRef(false);
  const isResizingSelectedRef = useRef(false);
  const activeResizeHandleRef = useRef(null);
  const dragStartCoordsRef = useRef(null);
  const resizeInitialBoxRef = useRef(null);

  // Eraser cursor position state (Smooth 0ms tracking)
  const [eraserCursorPos, setEraserCursorPos] = useState({ x: -100, y: -100, isOver: false });

  // Inline text editing state
  const [editingText, setEditingText] = useState(null);
  const [showZoomPresets, setShowZoomPresets] = useState(false);

  const isDarkMode = settings.theme !== 'light';
  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
  const totalPages = pages.length || 1;

  // Calculate top Y position for each page in document space (Starting strictly at y = 0 with NO padding)
  const getPageOffsets = useCallback(() => {
    const offsets = [];
    let currentY = 0;
    for (let i = 0; i < pages.length; i++) {
      const h = pages[i]?.height || 960;
      const w = pages[i]?.width || 720;
      offsets.push({ top: currentY, height: h, width: w });
      currentY += h + PAGE_GAP;
    }
    const totalHeight = currentY > 0 ? currentY - PAGE_GAP : 960;
    return { offsets, totalHeight };
  }, [pages]);

  const { offsets, totalHeight } = getPageOffsets();
  const maxPageWidth = Math.max(...pages.map(p => p.width || 720), 720);

  // Convert screen coordinates to specific page index and page-relative (x, y) with 100% exact pixel precision
  const screenToPageCoordinates = useCallback((clientX, clientY) => {
    const stackWrapper = stackWrapperRef.current;
    if (!stackWrapper) return { pageIndex: 0, x: 0, y: 0, globalDocY: 0, docX: 0 };

    const rect = stackWrapper.getBoundingClientRect();
    const docX = (clientX - rect.left) / zoomLevel;
    const docY = (clientY - rect.top) / zoomLevel;

    const { offsets: pageOffsets } = getPageOffsets();
    let targetIdx = 0;

    for (let i = 0; i < pageOffsets.length; i++) {
      const p = pageOffsets[i];
      if (docY >= p.top && docY <= p.top + p.height + PAGE_GAP) {
        targetIdx = i;
        break;
      }
      if (docY > p.top + p.height) {
        targetIdx = i;
      }
    }

    targetIdx = Math.max(0, Math.min(pages.length - 1, targetIdx));
    const pageOffset = pageOffsets[targetIdx] || { top: 0, height: 960, width: 720 };
    const pageRelativeX = docX;
    const pageRelativeY = docY - pageOffset.top;

    return {
      pageIndex: targetIdx,
      x: pageRelativeX,
      y: pageRelativeY,
      globalDocY: docY,
      docX: docX
    };
  }, [zoomLevel, getPageOffsets, pages.length]);

  // Scroll to a specific page smoothly
  const scrollToPage = useCallback((index) => {
    const { offsets: pageOffsets } = getPageOffsets();
    const target = pageOffsets[index];
    if (!target) return;

    const desiredPanY = -(target.top * zoomLevel) + 40;
    setPanOffset({
      x: 0,
      y: desiredPanY
    });
  }, [getPageOffsets, zoomLevel, setPanOffset]);

  // When explicit page jump is requested (from sidebar, keyboard shortcut, or search), smoothly jump to it
  useEffect(() => {
    if (targetScrollPageIndex !== null && targetScrollPageIndex !== undefined && targetScrollPageIndex >= 0 && targetScrollPageIndex < pages.length) {
      scrollToPage(targetScrollPageIndex);
      useNotebookStore.setState({ targetScrollPageIndex: null });
    }
  }, [targetScrollPageIndex, pages.length, scrollToPage]);

  // -------------------------------------------------------------
  // Imperative 120fps In-Flight Scratch Canvas Loop (Zero React lag, 100% exact alignment)
  // -------------------------------------------------------------
  useEffect(() => {
    const canvas = inFlightCanvasRef.current;
    if (!canvas) return;

    const { totalHeight } = getPageOffsets();
    const maxPageWidth = Math.max(...pages.map(p => p.width || 720), 720);

    canvas.width = maxPageWidth * dpr;
    canvas.height = totalHeight * dpr;
    canvas.style.width = `${maxPageWidth}px`;
    canvas.style.height = `${totalHeight}px`;

    const ctx = canvas.getContext('2d');

    const loop = () => {
      if (scratchNeedsRenderRef.current) {
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, maxPageWidth, totalHeight);

        if (isDrawingRef.current) {
          const pts = activeStrokePointsRef.current;
          const pageIdx = activePageIndexRef.current;
          const { offsets } = getPageOffsets();
          const pageTop = offsets[pageIdx]?.top || 0;

          if (pts.length > 0) {
            const isHl = activeTool === 'highlighter';
            const shiftedPts = pts.map(p => ({ ...p, y: p.y + pageTop }));
            drawSmoothStroke(
              ctx,
              shiftedPts,
              isHl ? highlighterColor : penColor,
              isHl ? highlighterWidth : penWidth,
              isHl ? highlighterOpacity : penOpacity,
              isHl ? 'highlighter' : penType,
              strokeStrength
            );
          } else if ((activeTool === 'shapes' || activeTool === 'line') && activeShapeStartRef.current) {
            const start = activeShapeStartRef.current;
            const current = pts[pts.length - 1] || start;
            const w = current.x - start.x;
            const h = current.y - start.y;

            const previewShape = {
              type: activeTool === 'line' ? 'line' : 'shape',
              shapeType: shapeType,
              x: Math.min(start.x, current.x),
              y: Math.min(start.y, current.y) + pageTop,
              width_box: Math.abs(w),
              height_box: Math.abs(h),
              color: shapeStrokeColor,
              fillColor: shapeFillColor,
              width: shapeWidth,
              opacity: 1,
              isDashed: isDashed,
              points: [{ ...start, y: start.y + pageTop }, { ...current, y: current.y + pageTop }]
            };
            drawShape(ctx, previewShape);
          }
        }
        ctx.restore();
        scratchNeedsRenderRef.current = false;
      }
      rafScratchRef.current = requestAnimationFrame(loop);
    };

    rafScratchRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafScratchRef.current) cancelAnimationFrame(rafScratchRef.current);
    };
  }, [
    activeTool,
    penColor,
    penWidth,
    penOpacity,
    penType,
    strokeStrength,
    highlighterColor,
    highlighterWidth,
    highlighterOpacity,
    shapeType,
    shapeStrokeColor,
    shapeFillColor,
    shapeWidth,
    isDashed,
    getPageOffsets,
    pages,
    dpr
  ]);

  // -------------------------------------------------------------
  // Universal Eraser Action — Erases Pen strokes, shapes, lines, images, text, emojis
  // -------------------------------------------------------------
  const handleEraserAction = (pageIndex, p1, p2) => {
    const targetPage = pages[pageIndex];
    if (!targetPage) return;
    const elements = targetPage.elements || [];
    if (elements.length === 0) return;

    let hasMutated = false;
    const updatedElements = [];

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];

      // 1. Freehand Pen, Pencil, and Highlighter strokes
      if (el.points && (el.type === 'pen' || el.type === 'pencil' || el.type === 'highlighter')) {
        if (eraserMode === 'object') {
          if (doesStrokeIntersectEraser(el.points, p1, p2, eraserRadius)) {
            hasMutated = true;
            continue; // Remove entire stroke
          } else {
            updatedElements.push(el);
          }
        } else {
          // Pixel mode: split/trim stroke segments touched by eraser capsule
          const isAnyTouched = el.points.some(pt => isPointInEraserSweep(pt, p1, p2, eraserRadius));
          if (!isAnyTouched) {
            updatedElements.push(el);
            continue;
          }

          hasMutated = true;
          const segments = [];
          let currentSegment = [];

          for (let j = 0; j < el.points.length; j++) {
            const pt = el.points[j];
            if (!isPointInEraserSweep(pt, p1, p2, eraserRadius)) {
              currentSegment.push(pt);
            } else {
              if (currentSegment.length > 0) {
                segments.push(currentSegment);
                currentSegment = [];
              }
            }
          }
          if (currentSegment.length > 0) {
            segments.push(currentSegment);
          }

          segments.forEach((segPts, segIdx) => {
            if (segPts.length > 0) {
              updatedElements.push({
                ...el,
                id: segIdx === 0 ? el.id : `elem-split-${Date.now()}-${segIdx}-${Math.random().toString(36).substr(2, 4)}`,
                points: segPts
              });
            }
          });
        }
      } else {
        // 2. Objects: Shapes, Lines, Images, Text, Emojis
        const doesHit = doesElementIntersectEraser(el, p1, p2, eraserRadius);
        if (doesHit) {
          hasMutated = true;
          continue; // Object is erased
        } else {
          updatedElements.push(el);
        }
      }
    }

    if (hasMutated) {
      setPageElements(pageIndex, updatedElements, false);
    }
  };

  // -------------------------------------------------------------
  // Pointer Down Handler
  // -------------------------------------------------------------
  const handlePointerDown = (e) => {
    if (e.button === 2) return;

    if (isSpacePressedRef.current || e.button === 1 || activeTool === 'pan') {
      setIsPanning(true);
      isMiddleClickPanningRef.current = true;
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }

    // Set pointer capture on the element that has listeners
    const targetElement = e.currentTarget || stackWrapperRef.current;
    if (targetElement && typeof targetElement.setPointerCapture === 'function') {
      try {
        targetElement.setPointerCapture(e.pointerId);
      } catch (_) {}
    }

    // Prevent default touch gestures / browser panning interference
    if (e.cancelable) {
      e.preventDefault();
    }

    const { pageIndex, x, y, globalDocY, docX } = screenToPageCoordinates(e.clientX, e.clientY);
    
    // Distinguish pointer types and ensure non-zero fallback pressure for pen
    const pointerType = e.pointerType || 'mouse';
    let pressure = 0.5;
    if (pointerType === 'pen') {
      pressure = (typeof e.pressure === 'number' && e.pressure > 0) ? e.pressure : 0.4;
    } else if (pointerType === 'touch') {
      pressure = (typeof e.pressure === 'number' && e.pressure > 0) ? e.pressure : 0.5;
    }

    const pageCoords = { x, y, pressure };

    isDrawingRef.current = true;
    activePageIndexRef.current = pageIndex;

    // Laser Pointer: ONLY record on click and drag with genuine coordinates
    if (activeTool === 'laser') {
      const laserDocCoords = { x: docX, y: globalDocY, pressure, timestamp: Date.now() };
      lastLaserCoordsRef.current = laserDocCoords;
      addLaserPoint(laserDocCoords);
      return;
    }

    // Text Tool: Click to create text box
    if (activeTool === 'text') {
      setEditingText({
        pageIndex,
        x,
        y,
        initialText: '',
        isNew: true
      });
      isDrawingRef.current = false;
      return;
    }

    // Select Tool: Hit test elements
    if (activeTool === 'select') {
      const targetPage = pages[pageIndex];
      const elements = targetPage?.elements || [];

      const hit = elements.slice().reverse().find(el => {
        if (el.points && (el.type === 'pen' || el.type === 'pencil' || el.type === 'highlighter' || el.type === 'line' || (el.type === 'shape' && el.points.length >= 2))) {
          return isPointNearStroke(pageCoords, el.points, 14);
        }
        if (el.x !== undefined && el.y !== undefined) {
          const w = el.width_box !== undefined ? el.width_box : (el.type === 'emoji' ? 60 : (el.type === 'text' ? 140 : 100));
          const h = el.height_box !== undefined ? el.height_box : (el.type === 'emoji' ? 60 : (el.type === 'text' ? 40 : 100));
          return x >= el.x && x <= el.x + w && y >= el.y && y <= el.y + h;
        }
        return false;
      });

      if (hit) {
        setSelectedElementIds([hit.id]);
        isDraggingSelectedRef.current = true;
        dragStartCoordsRef.current = pageCoords;
      } else {
        setSelectedElementIds([]);
      }
      return;
    }

    if (activeTool === 'eraser') {
      prevEraserCoordsRef.current = pageCoords;
      handleEraserAction(pageIndex, pageCoords, pageCoords);
      return;
    }

    if (activeTool === 'shapes' || activeTool === 'line') {
      activeShapeStartRef.current = pageCoords;
      activeStrokePointsRef.current = [pageCoords];
      scratchNeedsRenderRef.current = true;
    } else {
      activeStrokePointsRef.current = [pageCoords];
      scratchNeedsRenderRef.current = true;
    }
  };

  // -------------------------------------------------------------
  // Pointer Move Handler
  // -------------------------------------------------------------
  const handlePointerMove = (e) => {
    // Update circular eraser position
    if (activeTool === 'eraser') {
      setEraserCursorPos({ x: e.clientX, y: e.clientY, isOver: true });
    }

    if (isMiddleClickPanningRef.current || (isPanning && isDrawingRef.current)) {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
      return;
    }

    if (activeTool === 'laser') {
      if (!isDrawingRef.current) return;
      const { docX, globalDocY } = screenToPageCoordinates(e.clientX, e.clientY);
      const pressure = (e.pressure !== undefined && e.pressure > 0) ? e.pressure : 0.5;
      const currentLaserCoords = { x: docX, y: globalDocY, pressure };
      const last = lastLaserCoordsRef.current;
      if (!last || getPointDistance(last, currentLaserCoords) > 0.4) {
        addLaserPoint(currentLaserCoords);
        lastLaserCoordsRef.current = currentLaserCoords;
      }
      return;
    }

    if (!isDrawingRef.current && !isResizingSelectedRef.current) return;

    if (e.cancelable) {
      e.preventDefault();
    }

    // Extract all coalesced events reliably from native or synthetic event
    let rawEvents = [e];
    if (typeof e.getCoalescedEvents === 'function') {
      const coalesced = e.getCoalescedEvents();
      if (coalesced && coalesced.length > 0) rawEvents = coalesced;
    } else if (typeof e.nativeEvent?.getCoalescedEvents === 'function') {
      const coalesced = e.nativeEvent.getCoalescedEvents();
      if (coalesced && coalesced.length > 0) rawEvents = coalesced;
    }

    const pageIdx = activePageIndexRef.current;
    const { offsets } = getPageOffsets();
    const pageTop = offsets[pageIdx]?.top || 0;
    const stackWrapper = stackWrapperRef.current;
    const rect = stackWrapper ? stackWrapper.getBoundingClientRect() : { left: 0, top: 0 };

    for (let evIdx = 0; evIdx < rawEvents.length; evIdx++) {
      const ev = rawEvents[evIdx];
      const docX = (ev.clientX - rect.left) / zoomLevel;
      const docY = (ev.clientY - rect.top) / zoomLevel;
      const x = docX;
      const y = docY - pageTop;

      const pType = ev.pointerType || e.pointerType || 'mouse';
      let pressure = 0.5;
      if (pType === 'pen') {
        pressure = (typeof ev.pressure === 'number' && ev.pressure > 0) ? ev.pressure : 0.4;
      } else if (pType === 'touch') {
        pressure = (typeof ev.pressure === 'number' && ev.pressure > 0) ? ev.pressure : 0.5;
      }

      const coords = { x, y, pressure };

      // Handle dragging selected element
      if (isDraggingSelectedRef.current && dragStartCoordsRef.current) {
        const dx = coords.x - dragStartCoordsRef.current.x;
        const dy = coords.y - dragStartCoordsRef.current.y;
        dragStartCoordsRef.current = coords;

        setPageElements(pageIdx, prev => prev.map(el => {
          if (selectedElementIds.includes(el.id)) {
            const updated = { ...el };
            if (el.points) {
              updated.points = el.points.map(p => ({ ...p, x: p.x + dx, y: p.y + dy }));
            }
            if (el.x !== undefined) updated.x = el.x + dx;
            if (el.y !== undefined) updated.y = el.y + dy;
            return updated;
          }
          return el;
        }), false);
        continue;
      }

      // Handle resizing selected element
      if (isResizingSelectedRef.current && resizeInitialBoxRef.current && dragStartCoordsRef.current) {
        const handle = activeResizeHandleRef.current;
        const init = resizeInitialBoxRef.current;
        const dx = coords.x - dragStartCoordsRef.current.x;
        const dy = coords.y - dragStartCoordsRef.current.y;

        let newX = init.x;
        let newY = init.y;
        let newW = init.width_box;
        let newH = init.height_box;

        if (handle.includes('e')) newW = Math.max(20, init.width_box + dx);
        if (handle.includes('s')) newH = Math.max(20, init.height_box + dy);
        if (handle.includes('w')) {
          const clampedDx = Math.min(dx, init.width_box - 20);
          newX = init.x + clampedDx;
          newW = init.width_box - clampedDx;
        }
        if (handle.includes('n')) {
          const clampedDy = Math.min(dy, init.height_box - 20);
          newY = init.y + clampedDy;
          newH = init.height_box - clampedDy;
        }

        // For image / emoji, lock aspect ratio
        if (init.type === 'image' || init.type === 'emoji') {
          const ratio = (init.width_box || 1) / (init.height_box || 1);
          if (handle === 'se' || handle === 'nw') {
            newH = newW / ratio;
          } else if (handle === 'ne' || handle === 'sw') {
            newH = newW / ratio;
          }
        }

        setPageElements(pageIdx, prev => prev.map(el => {
          if (selectedElementIds.includes(el.id)) {
            if (el.type === 'emoji') {
              const scale = newW / (init.width_box || 60);
              return {
                ...el,
                x: newX,
                y: newY,
                width_box: newW,
                height_box: newH,
                fontSize: Math.max(16, Math.round((init.fontSize || 54) * scale))
              };
            }
            if (el.type === 'text') {
              const scale = newW / (init.width_box || 120);
              return {
                ...el,
                x: newX,
                y: newY,
                width_box: newW,
                height_box: newH,
                fontSize: Math.max(12, Math.round((init.fontSize || 18) * Math.min(3, Math.max(0.4, scale))))
              };
            }
            if (el.type === 'shape' || el.type === 'line') {
              let updatedPoints = el.points;
              if (el.points && el.points.length >= 2) {
                updatedPoints = [
                  { x: newX, y: newY },
                  { x: newX + newW, y: newY + newH }
                ];
              }
              return {
                ...el,
                x: newX,
                y: newY,
                width_box: newW,
                height_box: newH,
                points: updatedPoints
              };
            }
            return {
              ...el,
              x: newX,
              y: newY,
              width_box: newW,
              height_box: newH
            };
          }
          return el;
        }), false);
        continue;
      }

      if (activeTool === 'eraser') {
        const prev = prevEraserCoordsRef.current || coords;
        handleEraserAction(pageIdx, prev, coords);
        prevEraserCoordsRef.current = coords;
        continue;
      }

      if (activeTool === 'pen' || activeTool === 'pencil' || activeTool === 'highlighter') {
        const pts = activeStrokePointsRef.current;
        const lastPt = pts[pts.length - 1];
        if (!lastPt || getPointDistance(lastPt, coords) > 0.08) {
          pts.push(coords);
          scratchNeedsRenderRef.current = true;
        }
      } else if (activeTool === 'shapes' || activeTool === 'line') {
        activeStrokePointsRef.current = [coords];
        scratchNeedsRenderRef.current = true;
      }
    }
  };

  // -------------------------------------------------------------
  // Pointer Up Handler
  // -------------------------------------------------------------
  const handlePointerUp = (e) => {
    if (isMiddleClickPanningRef.current) {
      isMiddleClickPanningRef.current = false;
      setIsPanning(false);
    }

    const targetElement = e.currentTarget || stackWrapperRef.current;
    if (targetElement && typeof targetElement.releasePointerCapture === 'function') {
      try {
        if (targetElement.hasPointerCapture?.(e.pointerId)) {
          targetElement.releasePointerCapture(e.pointerId);
        }
      } catch (_) {}
    }

    lastLaserCoordsRef.current = null;

    if (isDraggingSelectedRef.current || isResizingSelectedRef.current) {
      isDraggingSelectedRef.current = false;
      isResizingSelectedRef.current = false;
      activeResizeHandleRef.current = null;
      resizeInitialBoxRef.current = null;
      dragStartCoordsRef.current = null;
      useNotebookStore.getState().triggerAutoSave();
    }

    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    prevEraserCoordsRef.current = null;

    // Clear active in-flight scratch canvas
    const canvas = inFlightCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const { totalHeight } = getPageOffsets();
      const maxPageWidth = Math.max(...pages.map(p => p.width || 720), 720);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, maxPageWidth, totalHeight);
    }

    const pageIdx = activePageIndexRef.current;
    const { offsets } = getPageOffsets();
    const pageTop = offsets[pageIdx]?.top || 0;
    const stackWrapper = stackWrapperRef.current;
    const rect = stackWrapper ? stackWrapper.getBoundingClientRect() : { left: 0, top: 0 };
    const docX = (e.clientX - rect.left) / zoomLevel;
    const docY = (e.clientY - rect.top) / zoomLevel;
    const x = docX;
    const y = docY - pageTop;
    const pType = e.pointerType || 'mouse';
    let pressure = 0.5;
    if (pType === 'pen') {
      pressure = (typeof e.pressure === 'number' && e.pressure > 0) ? e.pressure : 0.4;
    } else if (pType === 'touch') {
      pressure = (typeof e.pressure === 'number' && e.pressure > 0) ? e.pressure : 0.5;
    }
    const coords = { x, y, pressure };

    if (activeTool === 'pen' || activeTool === 'pencil' || activeTool === 'highlighter') {
      const points = activeStrokePointsRef.current;
      if (points && points.length > 0) {
        const isHl = activeTool === 'highlighter';

        // Smart Shape Recognition check (active only for Pen tool when enabled)
        let recognizedShape = null;
        if (activeTool === 'pen' && autoShapeRecognition) {
          recognizedShape = recognizeShape(points);
        }

        if (recognizedShape) {
          // Replace rough stroke with clean NoteFlow shape object in 1 atomic undo step
          const newShapeElement = {
            id: 'elem-shape-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            type: recognizedShape.type || 'shape',
            shapeType: recognizedShape.shapeType,
            x: recognizedShape.x,
            y: recognizedShape.y,
            width_box: recognizedShape.width_box,
            height_box: recognizedShape.height_box,
            points: recognizedShape.points || null,
            color: penColor,
            fillColor: 'transparent',
            width: penWidth,
            opacity: penOpacity,
            isDashed: false
          };
          setPageElements(pageIdx, prev => [...prev, newShapeElement], true);
        } else {
          // Keep as normal pen / pencil / highlighter handwriting
          const newElement = {
            id: 'elem-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            type: isHl ? 'highlighter' : activeTool,
            penType: isHl ? 'highlighter' : penType,
            points: [...points],
            color: isHl ? highlighterColor : penColor,
            width: isHl ? highlighterWidth : penWidth,
            opacity: isHl ? highlighterOpacity : penOpacity,
            strength: strokeStrength
          };
          setPageElements(pageIdx, prev => [...prev, newElement], true);
        }
      }
      activeStrokePointsRef.current = [];
    } else if (activeTool === 'shapes' || activeTool === 'line') {
      if (activeShapeStartRef.current) {
        const start = activeShapeStartRef.current;
        const w = coords.x - start.x;
        const h = coords.y - start.y;

        if (Math.abs(w) > 4 || Math.abs(h) > 4) {
          const newShape = {
            id: 'elem-shape-' + Date.now(),
            type: activeTool === 'line' ? 'line' : 'shape',
            shapeType: shapeType,
            x: Math.min(start.x, coords.x),
            y: Math.min(start.y, coords.y),
            width_box: Math.abs(w),
            height_box: Math.abs(h),
            color: shapeStrokeColor,
            fillColor: shapeFillColor,
            width: shapeWidth,
            opacity: 1,
            isDashed: isDashed,
            points: [start, coords]
          };
          setPageElements(pageIdx, prev => [...prev, newShape], true);
        }
      }
      activeShapeStartRef.current = null;
      activeStrokePointsRef.current = [];
    }
  };

  const handleLostPointerCapture = (e) => {
    if (isDrawingRef.current) {
      handlePointerUp(e);
    }
  };

  // -------------------------------------------------------------
  // Math-Exact Multi-Page Scroll & Force-Down Creation Logic
  // -------------------------------------------------------------
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.002;
      const rect = containerRef.current?.getBoundingClientRect();
      zoomAroundCursor(delta, e.clientX, e.clientY, rect);
    } else {
      e.preventDefault();
      const container = containerRef.current;
      const containerHeight = container?.clientHeight || 800;
      const containerWidth = container?.clientWidth || 1000;

      const { offsets, totalHeight } = getPageOffsets();
      const scaledTotalHeight = totalHeight * zoomLevel;
      const maxPageWidth = Math.max(...pages.map(p => p.width || 720), 720);
      const scaledWidth = maxPageWidth * zoomLevel;

      // Exact vertical boundaries
      const maxPanY = 40; // Top margin
      const minPanY = Math.min(40, containerHeight - scaledTotalHeight - 80);

      // Horizontal boundaries
      const maxPanX = Math.max(20, (scaledWidth - containerWidth) / 2 + 40);
      const minPanX = -maxPanX;

      setPanOffset(prev => {
        let nextY = prev.y - e.deltaY * 0.95;
        const nextX = Math.max(minPanX, Math.min(maxPanX, prev.x - e.deltaX * 0.95));

        // Force-Down Detection when pulling down at bottom of last page
        if (nextY < minPanY) {
          const overscroll = minPanY - nextY;
          setPullDownAmount(overscroll);

          if (overscroll > 150 && !isCreatingPageRef.current) {
            isCreatingPageRef.current = true;
            addPage().then(() => {
              setPullDownAmount(0);
              setTimeout(() => {
                isCreatingPageRef.current = false;
              }, 1200);
            });
          }
          nextY = minPanY - Math.min(60, overscroll * 0.35);
        } else {
          setPullDownAmount(0);
          nextY = Math.min(maxPanY, nextY);
        }

        // Passively update active page index based on visible center
        const currentCenterDocY = (-nextY + containerHeight / 2) / zoomLevel;
        for (let i = 0; i < offsets.length; i++) {
          const off = offsets[i];
          if (currentCenterDocY >= off.top && currentCenterDocY <= off.top + off.height + PAGE_GAP) {
            if (i !== currentPageIndex) {
              useNotebookStore.setState({ currentPageIndex: i, currentPage: pages[i] });
            }
            break;
          }
        }

        return { x: nextX, y: nextY };
      });
    }
  };

  const handleManualAddPage = async () => {
    if (isCreatingPageRef.current) return;
    isCreatingPageRef.current = true;
    await addPage();
    setTimeout(() => {
      isCreatingPageRef.current = false;
      scrollToPage(pages.length);
    }, 300);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    const { pageIndex, x, y } = screenToPageCoordinates(e.clientX, e.clientY);
    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      canvasX: x,
      canvasY: y,
      pageIndex: pageIndex
    });
  };

  const handleDeleteSelected = useCallback(() => {
    if (selectedElementIds.length > 0) {
      const targetPage = pages[currentPageIndex];
      if (targetPage) {
        const remaining = (targetPage.elements || []).filter(el => !selectedElementIds.includes(el.id));
        setPageElements(currentPageIndex, remaining, true);
        setSelectedElementIds([]);
      }
    }
  }, [selectedElementIds, currentPageIndex, pages, setPageElements, setSelectedElementIds]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat && e.target.tagName.toLowerCase() !== 'textarea' && e.target.tagName.toLowerCase() !== 'input') {
        isSpacePressedRef.current = true;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && activeTool === 'select' && selectedElementIds.length > 0) {
        if (e.target.tagName.toLowerCase() !== 'textarea' && e.target.tagName.toLowerCase() !== 'input') {
          e.preventDefault();
          handleDeleteSelected();
        }
      }
    };
    const onKeyUp = (e) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [setIsPanning, activeTool, selectedElementIds, handleDeleteSelected]);

  const handleCompleteText = (textValue) => {
    if (textValue && textValue.trim() && editingText) {
      if (editingText.id) {
        // Update existing text
        setPageElements(editingText.pageIndex, prev => prev.map(el => {
          if (el.id === editingText.id) {
            return {
              ...el,
              text: textValue.trim()
            };
          }
          return el;
        }), true);
      } else {
        // Create new text
        const newTextElement = {
          id: 'elem-text-' + Date.now(),
          type: 'text',
          x: editingText.x,
          y: editingText.y,
          text: textValue.trim(),
          width_box: Math.max(120, textValue.trim().length * 12),
          height_box: (textValue.split('\n').length || 1) * 28,
          ...useToolStore.getState().textSettings
        };
        setPageElements(editingText.pageIndex, prev => [...prev, newTextElement], true);
      }
    }
    setEditingText(null);
  };

  const handleResizeStart = (e, handle, el, bounds) => {
    e.stopPropagation();
    try {
      e.target.setPointerCapture?.(e.pointerId);
    } catch (_) {}
    const { x, y } = screenToPageCoordinates(e.clientX, e.clientY);
    isResizingSelectedRef.current = true;
    activeResizeHandleRef.current = handle;
    dragStartCoordsRef.current = { x, y };
    resizeInitialBoxRef.current = {
      x: bounds.x,
      y: bounds.y,
      width_box: bounds.width,
      height_box: bounds.height,
      type: el.type,
      fontSize: el.fontSize || 54
    };
  };

  const currentNum = currentPageIndex + 1;

  // Selected element bounding box
  const selectedElement = (activeTool === 'select' && selectedElementIds.length > 0)
    ? (pages[currentPageIndex]?.elements || []).find(el => el.id === selectedElementIds[0])
    : null;

  let selectedBounds = null;
  if (selectedElement) {
    if (selectedElement.type === 'image' || selectedElement.type === 'shape' || selectedElement.type === 'line' || selectedElement.type === 'text' || selectedElement.type === 'emoji') {
      selectedBounds = {
        x: selectedElement.x ?? 0,
        y: selectedElement.y ?? 0,
        width: selectedElement.width_box !== undefined ? selectedElement.width_box : (selectedElement.type === 'emoji' ? 64 : (selectedElement.type === 'text' ? 140 : 100)),
        height: selectedElement.height_box !== undefined ? selectedElement.height_box : (selectedElement.type === 'emoji' ? 64 : (selectedElement.type === 'text' ? 40 : 100))
      };
    } else if (selectedElement.points && selectedElement.points.length > 0) {
      selectedBounds = getBoundingBox(selectedElement.points);
      selectedBounds.x -= 6;
      selectedBounds.y -= 6;
      selectedBounds.width += 12;
      selectedBounds.height += 12;
    } else if (selectedElement.x !== undefined && selectedElement.y !== undefined) {
      selectedBounds = {
        x: selectedElement.x,
        y: selectedElement.y,
        width: selectedElement.width_box || 100,
        height: selectedElement.height_box || 100
      };
    }
  }

  const isEraserActive = activeTool === 'eraser';

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
      onPointerEnter={() => setEraserCursorPos(prev => ({ ...prev, isOver: true }))}
      onPointerLeave={() => setEraserCursorPos(prev => ({ ...prev, isOver: false }))}
      style={{ touchAction: 'none' }}
      className={`relative flex-1 w-full h-full overflow-hidden select-none touch-none bg-[#141517] ${
        isSpacePressedRef.current || isPanning
          ? 'cursor-panning'
          : isEraserActive
          ? 'cursor-none'
          : `cursor-${activeTool}`
      }`}
    >
      {/* Continuous Multi-Page Vertical Stack Wrapper */}
      <div
        ref={stackWrapperRef}
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: `translate(calc(-50% + ${panOffset.x}px), ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: 'top center',
          width: `${maxPageWidth}px`,
          minHeight: `${totalHeight}px`,
          padding: 0,
          margin: 0,
          gap: `${PAGE_GAP}px`,
          touchAction: 'none'
        }}
        className="flex flex-col items-center touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onLostPointerCapture={handleLostPointerCapture}
      >
        {/* Render each page in the vertical sequence */}
        {pages.map((page, idx) => (
          <SinglePageCanvas
            key={page._id || page.id || idx}
            page={page}
            pageIndex={idx}
            isActive={idx === currentPageIndex}
            isDarkMode={isDarkMode}
            dpr={dpr}
          />
        ))}

        {/* Global Live Active In-Flight Scratch Layer */}
        <canvas
          ref={inFlightCanvasRef}
          style={{ touchAction: 'none' }}
          className="absolute inset-0 pointer-events-none rounded-sm z-20 touch-none"
        />

        {/* Laser Pointer Animation Layer */}
        <LaserLayer width={maxPageWidth} height={totalHeight} />

        {/* Interactive Selection Transformer Box with Resize Handles */}
        {activeTool === 'select' && selectedBounds && selectedElement && (
          <div
            style={{
              position: 'absolute',
              top: `${(getPageOffsets().offsets[currentPageIndex]?.top || 0) + selectedBounds.y}px`,
              left: `${selectedBounds.x}px`,
              width: `${selectedBounds.width}px`,
              height: `${selectedBounds.height}px`,
              pointerEvents: 'none',
              zIndex: 35
            }}
            className="border-2 border-[#2F6BFF] border-dashed rounded-sm"
          >
            {/* Quick Action Badge (Delete & Edit) */}
            <div className="absolute -top-9 right-0 flex items-center gap-1 pointer-events-auto bg-[#1e2025]/95 border border-neutral-700/80 rounded-lg p-1 shadow-floating">
              {selectedElement.type === 'text' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingText({
                      pageIndex: currentPageIndex,
                      x: selectedElement.x,
                      y: selectedElement.y,
                      initialText: selectedElement.text,
                      id: selectedElement.id
                    });
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 transition-colors"
                >
                  Edit
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSelected();
                }}
                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-600/30 text-rose-300 hover:bg-rose-600/50 transition-colors"
              >
                Delete
              </button>
            </div>

            {/* 8 Resize Handles */}
            {[
              { id: 'nw', style: 'top-[-5px] left-[-5px] cursor-nwse-resize' },
              { id: 'n',  style: 'top-[-5px] left-1/2 -translate-x-1/2 cursor-ns-resize' },
              { id: 'ne', style: 'top-[-5px] right-[-5px] cursor-nesw-resize' },
              { id: 'e',  style: 'top-1/2 -translate-y-1/2 right-[-5px] cursor-ew-resize' },
              { id: 'se', style: 'bottom-[-5px] right-[-5px] cursor-nwse-resize' },
              { id: 's',  style: 'bottom-[-5px] left-1/2 -translate-x-1/2 cursor-ns-resize' },
              { id: 'sw', style: 'bottom-[-5px] left-[-5px] cursor-nesw-resize' },
              { id: 'w',  style: 'top-1/2 -translate-y-1/2 left-[-5px] cursor-ew-resize' }
            ].map(h => (
              <div
                key={h.id}
                onPointerDown={(e) => handleResizeStart(e, h.id, selectedElement, selectedBounds)}
                className={`absolute w-3 h-3 bg-white border-2 border-[#2F6BFF] rounded-sm pointer-events-auto shadow-sm hover:scale-125 transition-transform ${h.style}`}
              />
            ))}
          </div>
        )}

        {/* Force-Down / Add Next Page Bottom Section */}
        <div className="w-full flex flex-col items-center justify-center py-6 gap-2 text-white/70">
          {pullDownAmount > 40 ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-600/30 border border-blue-500/50 rounded-full text-blue-300 text-xs font-semibold animate-pulse">
              <ArrowDown className="w-4 h-4 animate-bounce" />
              <span>{pullDownAmount > 120 ? 'Release / Pull firmly to create new page' : 'Pull down firmly to add page'}</span>
            </div>
          ) : (
            <button
              onClick={handleManualAddPage}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#204272] hover:bg-[#285594] text-white text-xs font-bold rounded-full shadow-lg border border-white/10 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 text-blue-300" />
              <span>Add Next Page</span>
            </button>
          )}
        </div>

        {/* Inline Text Overlay Editor */}
        {editingText && (
          <div
            style={{
              position: 'absolute',
              top: `${(getPageOffsets().offsets[editingText.pageIndex]?.top || 0) + editingText.y}px`,
              left: `${editingText.x}px`
            }}
          >
            <TextOverlayEditor
              textState={editingText}
              onComplete={handleCompleteText}
              onCancel={() => setEditingText(null)}
            />
          </div>
        )}
      </div>

      {/* Floating Circular Eraser Cursor (Exact Size & Transparent View) */}
      {isEraserActive && eraserCursorPos.isOver && (
        <div
          style={{
            position: 'fixed',
            top: `${eraserCursorPos.y}px`,
            left: `${eraserCursorPos.x}px`,
            width: `${eraserRadius * zoomLevel * 2}px`,
            height: `${eraserRadius * zoomLevel * 2}px`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            borderRadius: '50%',
            border: '1.5px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.65), inset 0 0 0 1px rgba(0, 0, 0, 0.25)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            zIndex: 9999
          }}
        />
      )}

      {/* Page Indicator Pill (Bottom-Left: 1 of N) */}
      <div className="absolute bottom-5 left-5 z-30 flex items-center gap-1.5 px-3.5 py-1 bg-[#1c1d20]/90 backdrop-blur-md border border-white/10 rounded-full shadow-floating text-xs font-semibold text-white/90">
        <span>{currentNum}</span>
        <span className="text-white/50 font-normal">of</span>
        <span>{totalPages}</span>
      </div>

      {/* Floating Bottom-Right Zoom Controls */}
      <div className="absolute bottom-5 right-5 z-30 flex items-center gap-1 p-1 bg-[#1c1d20]/90 backdrop-blur-md border border-white/10 rounded-xl shadow-floating text-xs font-semibold text-white/90">
        <button
          onClick={() => setZoomLevel(Math.max(0.2, zoomLevel - 0.15))}
          className="p-1.5 rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Zoom percentage with dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowZoomPresets(!showZoomPresets)}
            className="flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-white/15 text-white transition-colors font-mono text-xs"
            title="Zoom Presets"
          >
            <span>{Math.round(zoomLevel * 100)}%</span>
            <ChevronDown className="w-3 h-3 text-white/60" />
          </button>

          {showZoomPresets && (
            <div className="absolute bottom-9 right-0 w-24 bg-[#25262B] border border-white/15 rounded-xl shadow-floating p-1 flex flex-col gap-0.5 text-xs z-50">
              {ZOOM_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setZoomLevel(p);
                    setShowZoomPresets(false);
                  }}
                  className={`py-1 px-2 rounded-lg text-left font-mono transition-colors ${
                    Math.abs(zoomLevel - p) < 0.05
                      ? 'bg-[#2F6BFF] text-white font-bold'
                      : 'text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  {Math.round(p * 100)}%
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setZoomLevel(Math.min(3.0, zoomLevel + 0.15))}
          className="p-1.5 rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
