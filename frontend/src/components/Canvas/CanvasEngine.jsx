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
  getPointDistance
} from '../../utils/smoothStroke';
import { drawShape } from '../../utils/geometry';
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

  // Dragging selected elements state
  const isDraggingSelectedRef = useRef(false);
  const dragStartCoordsRef = useRef(null);

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
      const h = pages[i]?.height || 1600;
      const w = pages[i]?.width || 1200;
      offsets.push({ top: currentY, height: h, width: w });
      currentY += h + PAGE_GAP;
    }
    const totalHeight = currentY > 0 ? currentY - PAGE_GAP : 1600;
    return { offsets, totalHeight };
  }, [pages]);

  // Convert screen coordinates to specific page index and page-relative (x, y) with 100% exact pixel precision
  const screenToPageCoordinates = useCallback((clientX, clientY) => {
    const stackWrapper = stackWrapperRef.current;
    if (!stackWrapper) return { pageIndex: 0, x: 0, y: 0, globalDocY: 0, docX: 0 };

    const rect = stackWrapper.getBoundingClientRect();
    const docX = (clientX - rect.left) / zoomLevel;
    const docY = (clientY - rect.top) / zoomLevel;

    const { offsets } = getPageOffsets();
    let targetIdx = 0;

    for (let i = 0; i < offsets.length; i++) {
      const p = offsets[i];
      if (docY >= p.top && docY <= p.top + p.height + PAGE_GAP) {
        targetIdx = i;
        break;
      }
      if (docY > p.top + p.height) {
        targetIdx = i;
      }
    }

    targetIdx = Math.max(0, Math.min(pages.length - 1, targetIdx));
    const pageOffset = offsets[targetIdx] || { top: 0, height: 1600, width: 1200 };
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
    const { offsets } = getPageOffsets();
    const target = offsets[index];
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
    const maxPageWidth = Math.max(...pages.map(p => p.width || 1200), 1200);

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
              isHl ? 'highlighter' : penType
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
  // Standard Precision Pixel Eraser with Continuous Stroke Splitting
  // -------------------------------------------------------------
  const handleEraserAction = (pageIndex, p1, p2) => {
    const targetPage = pages[pageIndex];
    if (!targetPage) return;
    const elements = targetPage.elements || [];
    if (elements.length === 0) return;

    if (eraserMode === 'object') {
      const remaining = elements.filter(el => {
        if (el.points && el.points.length > 0) {
          if (doesStrokeIntersectEraser(el.points, p1, p2, eraserRadius)) {
            return false;
          }
        } else if (el.x !== undefined && el.width_box !== undefined) {
          const center = { x: el.x + el.width_box / 2, y: el.y + el.height_box / 2 };
          if (isPointInEraserSweep(center, p1, p2, eraserRadius + Math.max(el.width_box, el.height_box) / 2)) {
            return false;
          }
        }
        return true;
      });

      if (remaining.length !== elements.length) {
        setPageElements(pageIndex, remaining, true);
      }
    } else {
      let hasMutated = false;
      const updatedElements = [];

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (el.points && (el.type === 'pen' || el.type === 'pencil' || el.type === 'highlighter')) {
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
        } else {
          updatedElements.push(el);
        }
      }

      if (hasMutated) {
        setPageElements(pageIndex, updatedElements, false);
      }
    }
  };

  // -------------------------------------------------------------
  // Pointer Down Handler (Captures genuine Pentab/Stylus pressure)
  // -------------------------------------------------------------
  const handlePointerDown = (e) => {
    if (e.button === 2) return;

    if (isSpacePressedRef.current || e.button === 1 || activeTool === 'pan') {
      setIsPanning(true);
      isMiddleClickPanningRef.current = true;
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }

    try {
      e.target.setPointerCapture?.(e.pointerId);
    } catch (_) {}

    const { pageIndex, x, y, globalDocY, docX } = screenToPageCoordinates(e.clientX, e.clientY);
    const pressure = (e.pressure !== undefined && e.pressure > 0) ? e.pressure : 0.5;
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

    if (activeTool === 'text') {
      setEditingText({
        pageIndex,
        x,
        y,
        initialText: ''
      });
      isDrawingRef.current = false;
      return;
    }

    if (activeTool === 'select') {
      const targetPage = pages[pageIndex];
      const elements = targetPage?.elements || [];
      const hit = elements.slice().reverse().find(el => {
        if (el.points) {
          return isPointNearStroke(pageCoords, el.points, 14);
        }
        if (el.x !== undefined && el.width_box !== undefined) {
          return (
            x >= el.x &&
            x <= el.x + (el.width_box || 100) &&
            y >= el.y &&
            y <= el.y + (el.height_box || 60)
          );
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
      // Instant synchronous 0ms pen tap rendering
      const canvas = inFlightCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const { offsets } = getPageOffsets();
        const pageTop = offsets[pageIndex]?.top || 0;
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawSmoothStroke(
          ctx,
          [{ ...pageCoords, y: pageCoords.y + pageTop }],
          activeTool === 'highlighter' ? highlighterColor : penColor,
          activeTool === 'highlighter' ? highlighterWidth : penWidth,
          activeTool === 'highlighter' ? highlighterOpacity : penOpacity,
          activeTool === 'highlighter' ? 'highlighter' : penType,
          strokeStrength
        );
        ctx.restore();
      }
    }
  };

  // -------------------------------------------------------------
  // Pointer Move Handler (Instant 0ms latency hardware stylus sampling)
  // -------------------------------------------------------------
  const handlePointerMove = (e) => {
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

    if (!isDrawingRef.current) return;

    const rawEvents = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];

    for (let evIdx = 0; evIdx < rawEvents.length; evIdx++) {
      const ev = rawEvents[evIdx];
      const { x, y } = screenToPageCoordinates(ev.clientX, ev.clientY);
      const pressure = (ev.pressure !== undefined && ev.pressure > 0) ? ev.pressure : 0.5;
      const coords = { x, y, pressure };
      const pageIdx = activePageIndexRef.current;

      if (isDraggingSelectedRef.current && dragStartCoordsRef.current) {
        const dx = coords.x - dragStartCoordsRef.current.x;
        const dy = coords.y - dragStartCoordsRef.current.y;
        dragStartCoordsRef.current = coords;

        setPageElements(pageIdx, prev => prev.map(el => {
          if (selectedElementIds.includes(el.id)) {
            if (el.points) {
              return {
                ...el,
                points: el.points.map(p => ({ ...p, x: p.x + dx, y: p.y + dy }))
              };
            }
            return { ...el, x: (el.x || 0) + dx, y: (el.y || 0) + dy };
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
        if (!lastPt || getPointDistance(lastPt, coords) > 0.3) {
          pts.push(coords);

          // Direct real-pen rendering (0ms latency, authentic Goodnotes handwriting)
          const canvas = inFlightCanvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            const { offsets } = getPageOffsets();
            const pageTop = offsets[pageIdx]?.top || 0;
            const shiftedPts = pts.map(p => ({ ...p, y: p.y + pageTop }));

            ctx.save();
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, maxPageWidth, totalHeight);
            drawSmoothStroke(
              ctx,
              shiftedPts,
              activeTool === 'highlighter' ? highlighterColor : penColor,
              activeTool === 'highlighter' ? highlighterWidth : penWidth,
              activeTool === 'highlighter' ? highlighterOpacity : penOpacity,
              activeTool === 'highlighter' ? 'highlighter' : penType,
              strokeStrength
            );
            ctx.restore();
          }
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

    try {
      e.target.releasePointerCapture?.(e.pointerId);
    } catch (_) {}

    lastLaserCoordsRef.current = null;

    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    isDraggingSelectedRef.current = false;
    prevEraserCoordsRef.current = null;

    // Clear active in-flight scratch canvas
    const canvas = inFlightCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const { totalHeight } = getPageOffsets();
      const maxPageWidth = Math.max(...pages.map(p => p.width || 1200), 1200);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, maxPageWidth, totalHeight);
    }

    const pageIdx = activePageIndexRef.current;
    const { x, y } = screenToPageCoordinates(e.clientX, e.clientY);
    const pressure = (e.pressure !== undefined && e.pressure > 0) ? e.pressure : 0.5;
    const coords = { x, y, pressure };

    if (activeTool === 'pen' || activeTool === 'pencil' || activeTool === 'highlighter') {
      const points = activeStrokePointsRef.current;
      if (points && points.length > 0) {
        const isHl = activeTool === 'highlighter';
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
      const maxPageWidth = Math.max(...pages.map(p => p.width || 1200), 1200);
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
    const { x, y } = screenToPageCoordinates(e.clientX, e.clientY);
    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      canvasX: x,
      canvasY: y
    });
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat && e.target.tagName.toLowerCase() !== 'textarea' && e.target.tagName.toLowerCase() !== 'input') {
        isSpacePressedRef.current = true;
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
  }, [setIsPanning]);

  const handleCompleteText = (textValue) => {
    if (textValue && textValue.trim() && editingText) {
      const newTextElement = {
        id: 'elem-text-' + Date.now(),
        type: 'text',
        x: editingText.x,
        y: editingText.y,
        text: textValue.trim(),
        ...useToolStore.getState().textSettings
      };
      setPageElements(editingText.pageIndex, prev => [...prev, newTextElement], true);
    }
    setEditingText(null);
  };

  const currentNum = currentPageIndex + 1;
  const { totalHeight } = getPageOffsets();
  const maxPageWidth = Math.max(...pages.map(p => p.width || 1200), 1200);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
      className={`relative flex-1 w-full h-full overflow-hidden select-none bg-[#141517] ${
        isSpacePressedRef.current || isPanning ? 'cursor-panning' : `cursor-${activeTool}`
      }`}
    >
      {/* Continuous Multi-Page Vertical Stack Wrapper (Exact 0-Padding 1:1 Pixel Alignment) */}
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
          gap: `${PAGE_GAP}px`
        }}
        className="flex flex-col items-center"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Render each page in the vertical sequence */}
        {pages.map((page, idx) => (
          <SinglePageCanvas
            key={page._id || page.id || idx}
            page={page}
            pageIndex={idx}
            isActive={idx === currentPageIndex}
            isDarkMode={isDarkMode}
            selectedElementIds={idx === currentPageIndex ? selectedElementIds : []}
            dpr={dpr}
          />
        ))}

        {/* Global Live Active In-Flight Scratch Layer (100% exact 1:1 pixel alignment) */}
        <canvas
          ref={inFlightCanvasRef}
          className="absolute inset-0 pointer-events-none rounded-sm z-20"
        />

        {/* Laser Pointer Animation Layer across the document stack */}
        <LaserLayer width={maxPageWidth} height={totalHeight} />

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
