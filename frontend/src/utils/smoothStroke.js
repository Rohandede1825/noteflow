import { getStroke } from 'perfect-freehand';

/**
 * NoteFlow Goodnotes-Grade Digital Inking Engine
 * Powered by perfect-freehand for Excalidraw/Goodnotes-grade organic ink strokes,
 * non-linear pressure curves, and zero-dot continuous stroke rendering.
 */

export function getPointDistance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.hypot(dx, dy);
}

export function getMidPoint(p1, p2) {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
    pressure: ((p1.pressure ?? 0.5) + (p2.pressure ?? 0.5)) / 2
  };
}

/**
 * Natural pressure response curve mapping hardware pressure and manual strength to stroke width
 */
export function calculateWidth(baseWidth = 2.5, pressure = 0.5, penType = 'ball', strength = 1.0) {
  const p = Math.max(0.05, Math.min(1.0, pressure));
  const str = Math.max(0.2, Math.min(2.0, strength));
  
  // Non-linear power curve for natural stylus response
  const pressureCurve = Math.pow(p, 0.85);

  if (penType === 'fountain') {
    return Math.max(0.5, baseWidth * (0.35 + pressureCurve * 1.3) * str);
  }
  if (penType === 'brush') {
    return Math.max(0.8, baseWidth * (0.2 + pressureCurve * 1.8) * str);
  }
  if (penType === 'pencil') {
    return Math.max(0.5, baseWidth * (0.7 + pressureCurve * 0.5) * str);
  }
  if (penType === 'highlighter') {
    return baseWidth;
  }
  return Math.max(0.5, baseWidth * (0.8 + pressureCurve * 0.4) * str);
}

/**
 * Draw ultra-smooth natural handwriting stroke on canvas.
 * Uses perfect-freehand polygon spline outline for smooth, fluid, natural curves.
 */
export function drawSmoothStroke(
  ctx,
  rawPoints,
  color = '#ffffff',
  baseWidth = 2.5,
  opacity = 1,
  penType = 'ball',
  strength = 1.0
) {
  if (!rawPoints || rawPoints.length === 0) return;

  const count = rawPoints.length;
  const str = Math.max(0.2, Math.min(2.0, strength || 1.0));

  // 1. Single Tap / Dot
  if (count === 1) {
    const p = rawPoints[0];
    const rawP = typeof p.pressure === 'number' && p.pressure > 0 ? p.pressure : 0.45;
    const r = Math.max(0.8, (baseWidth * 0.9 * str * (0.8 + rawP * 0.4)) / 2);
    ctx.save();
    ctx.globalAlpha = penType === 'pencil' ? opacity * 0.85 : opacity;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // Format points with smoothed pressure for perfect-freehand [x, y, pressure]
  let prevP = typeof rawPoints[0].pressure === 'number' && rawPoints[0].pressure > 0 ? rawPoints[0].pressure : 0.45;
  const strokeInput = [];
  
  for (let i = 0; i < count; i++) {
    const pt = rawPoints[i];
    const rawP = typeof pt.pressure === 'number' && pt.pressure > 0 ? pt.pressure : 0.45;
    // Low-pass exponential moving average filter on pressure to avoid micro-jitter
    const smoothP = prevP * 0.6 + rawP * 0.4;
    prevP = smoothP;
    strokeInput.push([pt.x, pt.y, smoothP]);
  }

  // Tailored stroke options per pen instrument
  const size = baseWidth * 1.7 * str;
  let options = {
    size: Math.max(1, size),
    thinning: 0.4,
    smoothing: 0.6,
    streamline: 0.55,
    easing: (t) => Math.sin((t * Math.PI) / 2),
    start: {
      taper: 3,
      easing: (t) => t * t,
      cap: true
    },
    end: {
      taper: 4,
      easing: (t) => t * (2 - t),
      cap: true
    }
  };

  if (penType === 'fountain') {
    options = {
      size: Math.max(1.2, size * 1.15),
      thinning: 0.7,
      smoothing: 0.65,
      streamline: 0.6,
      start: { taper: 6, cap: true },
      end: { taper: 8, cap: true }
    };
  } else if (penType === 'brush') {
    options = {
      size: Math.max(1.5, size * 1.3),
      thinning: 0.85,
      smoothing: 0.6,
      streamline: 0.55,
      start: { taper: 10, cap: true },
      end: { taper: 14, cap: true }
    };
  } else if (penType === 'pencil') {
    options = {
      size: Math.max(0.8, size * 0.85),
      thinning: 0.25,
      smoothing: 0.5,
      streamline: 0.45,
      start: { taper: 2, cap: true },
      end: { taper: 2, cap: true }
    };
  } else if (penType === 'highlighter') {
    options = {
      size: Math.max(6, baseWidth * 1.5),
      thinning: 0,
      smoothing: 0.7,
      streamline: 0.65,
      start: { taper: 0, cap: true },
      end: { taper: 0, cap: true }
    };
  }

  const outline = getStroke(strokeInput, options);
  if (!outline || outline.length === 0) return;

  ctx.save();
  ctx.globalAlpha = penType === 'pencil' ? opacity * 0.85 : opacity;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  const [x0, y0] = outline[0];
  ctx.moveTo(x0, y0);
  for (let i = 1; i < outline.length; i++) {
    const [x1, y1] = outline[i];
    const [x2, y2] = outline[(i + 1) % outline.length];
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    ctx.quadraticCurveTo(x1, y1, midX, midY);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Distance from point p to line segment v-w
 */
export function distToSegment(p, v, w) {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return getPointDistance(p, v);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projection = {
    x: v.x + t * (w.x - v.x),
    y: v.y + t * (w.y - v.y)
  };
  return getPointDistance(p, projection);
}

/**
 * Checks if a point lies in the capsule swept by eraser from p1 to p2
 */
export function isPointInEraserSweep(point, p1, p2, eraserRadius = 20) {
  return distToSegment(point, p1, p2) <= eraserRadius;
}

/**
 * Checks if a line segment (a, b) intersects or touches the capsule swept by eraser (p1, p2)
 */
export function isSegmentInEraserSweep(a, b, p1, p2, eraserRadius = 20) {
  if (distToSegment(a, p1, p2) <= eraserRadius || distToSegment(b, p1, p2) <= eraserRadius) {
    return true;
  }
  if (distToSegment(p1, a, b) <= eraserRadius || distToSegment(p2, a, b) <= eraserRadius) {
    return true;
  }
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  return distToSegment(mid, p1, p2) <= eraserRadius;
}

/**
 * Checks if a stroke intersects with eraser sweep between p1 and p2
 */
export function doesStrokeIntersectEraser(strokePoints, p1, p2, eraserRadius = 20) {
  if (!strokePoints || strokePoints.length === 0) return false;

  for (let i = 0; i < strokePoints.length; i++) {
    if (isPointInEraserSweep(strokePoints[i], p1, p2, eraserRadius)) {
      return true;
    }
  }

  for (let i = 0; i < strokePoints.length - 1; i++) {
    if (isSegmentInEraserSweep(strokePoints[i], strokePoints[i + 1], p1, p2, eraserRadius)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a point is near a stroke (for selection / lasso)
 */
export function isPointNearStroke(point, strokePoints, tolerance = 14) {
  if (!strokePoints || strokePoints.length === 0) return false;

  for (let i = 0; i < strokePoints.length; i++) {
    if (getPointDistance(point, strokePoints[i]) <= tolerance) {
      return true;
    }
  }

  for (let i = 0; i < strokePoints.length - 1; i++) {
    if (distToSegment(point, strokePoints[i], strokePoints[i + 1]) <= tolerance) {
      return true;
    }
  }

  return false;
}

/**
 * Compute bounding box for a set of points
 */
export function getBoundingBox(points) {
  if (!points || points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  return {
    x: minX,
    y: minY,
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY)
  };
}

/**
 * Checks if a bounding box (x, y, width, height) intersects with eraser sweep between p1 and p2
 */
export function isBoxInEraserSweep(box, p1, p2, eraserRadius = 20) {
  const { x = 0, y = 0, width = 100, height = 100 } = box;
  const minX = Math.min(x, x + width);
  const maxX = Math.max(x, x + width);
  const minY = Math.min(y, y + height);
  const maxY = Math.max(y, y + height);

  // Check if either eraser endpoint is inside the expanded box
  const isP1Inside = p1.x >= minX - eraserRadius && p1.x <= maxX + eraserRadius &&
                     p1.y >= minY - eraserRadius && p1.y <= maxY + eraserRadius;
  if (isP1Inside) return true;

  const isP2Inside = p2.x >= minX - eraserRadius && p2.x <= maxX + eraserRadius &&
                     p2.y >= minY - eraserRadius && p2.y <= maxY + eraserRadius;
  if (isP2Inside) return true;

  // Check the 4 box boundary segments
  const tl = { x: minX, y: minY };
  const tr = { x: maxX, y: minY };
  const br = { x: maxX, y: maxY };
  const bl = { x: minX, y: maxY };

  if (isSegmentInEraserSweep(tl, tr, p1, p2, eraserRadius)) return true;
  if (isSegmentInEraserSweep(tr, br, p1, p2, eraserRadius)) return true;
  if (isSegmentInEraserSweep(br, bl, p1, p2, eraserRadius)) return true;
  if (isSegmentInEraserSweep(bl, tl, p1, p2, eraserRadius)) return true;

  return false;
}

/**
 * Checks if ANY page element (stroke, shape, image, text, emoji) intersects with eraser sweep
 */
export function doesElementIntersectEraser(el, p1, p2, eraserRadius = 20) {
  if (!el) return false;

  // 1. Strokes & Lines with points
  if (el.points && el.points.length > 0) {
    if (doesStrokeIntersectEraser(el.points, p1, p2, eraserRadius)) {
      return true;
    }
  }

  // 2. Box elements (Images, Shapes, Text, Emojis)
  if (el.x !== undefined && el.y !== undefined) {
    const box = {
      x: el.x,
      y: el.y,
      width: el.width_box !== undefined ? el.width_box : (el.width || (el.type === 'emoji' ? 60 : (el.type === 'text' ? 140 : 100))),
      height: el.height_box !== undefined ? el.height_box : (el.height || (el.type === 'emoji' ? 60 : (el.type === 'text' ? 40 : 100)))
    };
    return isBoxInEraserSweep(box, p1, p2, eraserRadius);
  }

  return false;
}
