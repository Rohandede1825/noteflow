/**
 * NoteFlow Goodnotes-Grade Digital Inking Engine
 * Provides smooth continuous handwriting, non-linear pressure curves,
 * dynamic strength modulation, and zero-dot continuous stroke rendering.
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
    // Fountain Pen: Expressive calligraphic line variation
    return Math.max(0.5, baseWidth * (0.35 + pressureCurve * 1.3) * str);
  }
  if (penType === 'brush') {
    // Brush Pen: Wide dynamic range for artistic lettering
    return Math.max(0.8, baseWidth * (0.2 + pressureCurve * 1.8) * str);
  }
  if (penType === 'pencil') {
    // Pencil: Soft, organic texture with subtle pressure response
    return Math.max(0.5, baseWidth * (0.7 + pressureCurve * 0.5) * str);
  }
  if (penType === 'highlighter') {
    // Highlighter: Fixed broad stroke width
    return baseWidth;
  }
  // Ball Pen (Standard Goodnotes pen): Crisp, predictable, clean handwriting
  return Math.max(0.5, baseWidth * (0.8 + pressureCurve * 0.4) * str);
}

/**
 * Draw ultra-smooth natural handwriting stroke on canvas.
 * Seamless continuous midpoint quadratic curves with zero dot artifacts.
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

  ctx.save();
  ctx.globalAlpha = penType === 'pencil' ? opacity * 0.85 : opacity;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 1. Single Tap / Dot
  if (count === 1) {
    const p = rawPoints[0];
    const w = calculateWidth(baseWidth, p.pressure ?? 0.5, penType, strength);
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(w / 2, 0.6), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // 2. 2-Point Line Segment
  if (count === 2) {
    const p0 = rawPoints[0];
    const p1 = rawPoints[1];
    const avgP = ((p0.pressure ?? 0.5) + (p1.pressure ?? 0.5)) / 2;
    ctx.lineWidth = calculateWidth(baseWidth, avgP, penType, strength);
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // 3. Variable-Width Dynamic Inking for Fountain and Brush Pens
  if (penType === 'fountain' || penType === 'brush') {
    let p0 = rawPoints[0];
    let p1 = rawPoints[1];
    let mid0 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };

    ctx.lineWidth = calculateWidth(baseWidth, p0.pressure ?? 0.5, penType, strength);
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(mid0.x, mid0.y);
    ctx.stroke();

    for (let i = 1; i < count - 1; i++) {
      const pCurrent = rawPoints[i];
      const pNext = rawPoints[i + 1];
      const midNext = { x: (pCurrent.x + pNext.x) / 2, y: (pCurrent.y + pNext.y) / 2 };

      ctx.lineWidth = calculateWidth(baseWidth, pCurrent.pressure ?? 0.5, penType, strength);
      ctx.beginPath();
      ctx.moveTo(mid0.x, mid0.y);
      ctx.quadraticCurveTo(pCurrent.x, pCurrent.y, midNext.x, midNext.y);
      ctx.stroke();

      mid0 = midNext;
    }

    const lastPt = rawPoints[count - 1];
    ctx.lineWidth = calculateWidth(baseWidth, lastPt.pressure ?? 0.5, penType, strength);
    ctx.beginPath();
    ctx.moveTo(mid0.x, mid0.y);
    ctx.lineTo(lastPt.x, lastPt.y);
    ctx.stroke();
  } else {
    // 4. Standard Ball Pen, Pencil, and Highlighter: Continuous Midpoint Spline
    const avgP = rawPoints.reduce((acc, pt) => acc + (pt.pressure ?? 0.5), 0) / count;
    ctx.lineWidth = calculateWidth(baseWidth, avgP, penType, strength);

    ctx.beginPath();
    ctx.moveTo(rawPoints[0].x, rawPoints[0].y);

    for (let i = 0; i < count - 1; i++) {
      const p0 = rawPoints[i];
      const p1 = rawPoints[i + 1];
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;
      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
    }

    ctx.lineTo(rawPoints[count - 1].x, rawPoints[count - 1].y);
    ctx.stroke();
  }

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
