/**
 * NoteFlow Smart Shape Recognition Engine
 * Intelligently classifies completed pen strokes into clean geometric shapes
 * with robust discrimination against normal handwriting.
 */

// Distance between two points
function dist(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

// Perpendicular distance from point p to line segment (v, w)
function distToSegment(p, v, w) {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return dist(p, v);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return dist(p, {
    x: v.x + t * (w.x - v.x),
    y: v.y + t * (w.y - v.y)
  });
}

// Calculate total arc length along stroke points
function getArcLength(points) {
  let length = 0;
  for (let i = 0; i < points.length - 1; i++) {
    length += dist(points[i], points[i + 1]);
  }
  return length;
}

// Compute bounding box
function getBounds(points) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2
  };
}

// Compute centroid of stroke points
function getCentroid(points) {
  let sumX = 0, sumY = 0;
  for (let i = 0; i < points.length; i++) {
    sumX += points[i].x;
    sumY += points[i].y;
  }
  return {
    x: sumX / points.length,
    y: sumY / points.length
  };
}

// Compute polygon signed area (Shoelace formula)
function getShoelaceArea(points) {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

// Ramer-Douglas-Peucker (RDP) path simplification
function rdp(points, epsilon) {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let index = 0;
  const pStart = points[0];
  const pEnd = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const d = distToSegment(points[i], pStart, pEnd);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }

  if (maxDist > epsilon) {
    const left = rdp(points.slice(0, index + 1), epsilon);
    const right = rdp(points.slice(index), epsilon);
    return left.slice(0, -1).concat(right);
  } else {
    return [pStart, pEnd];
  }
}

// Angle at vertex b formed by a-b-c (in degrees: 0 to 180)
function getCornerAngle(a, b, c) {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const d1 = Math.hypot(v1.x, v1.y);
  const d2 = Math.hypot(v2.x, v2.y);
  if (d1 === 0 || d2 === 0) return 180;
  const dot = (v1.x * v2.x + v1.y * v2.y) / (d1 * d2);
  const clampedDot = Math.max(-1, Math.min(1, dot));
  return (Math.acos(clampedDot) * 180) / Math.PI;
}

// Extract true distinct corners of a closed stroke
function extractClosedPolygonCorners(rawPoints, maxDim) {
  const epsilon = Math.max(3.5, 0.045 * maxDim);
  let rawV = rdp(rawPoints, epsilon);
  if (rawV.length < 3) return [];

  // If first and last are close (closed loop), merge them
  if (dist(rawV[0], rawV[rawV.length - 1]) < 0.20 * maxDim) {
    rawV = rawV.slice(0, -1);
  }

  // Merge close adjacent vertices
  const merged = [];
  for (let i = 0; i < rawV.length; i++) {
    if (merged.length === 0 || dist(merged[merged.length - 1], rawV[i]) >= 0.10 * maxDim) {
      merged.push(rawV[i]);
    }
  }
  if (merged.length > 3 && dist(merged[0], merged[merged.length - 1]) < 0.10 * maxDim) {
    merged.pop();
  }

  // Filter out collinear vertices (angle > 152 deg)
  const corners = [];
  const n = merged.length;
  for (let i = 0; i < n; i++) {
    const prev = merged[(i - 1 + n) % n];
    const curr = merged[i];
    const next = merged[(i + 1) % n];
    const ang = getCornerAngle(prev, curr, next);
    if (ang < 152) {
      corners.push({ pt: curr, angle: ang });
    }
  }
  return corners;
}

/**
 * Main Smart Shape Recognition function.
 * Returns a clean shape definition object if confidence is high, or null if handwriting/uncertain.
 */
export function recognizeShape(rawPoints) {
  if (!rawPoints || rawPoints.length < 5) return null;

  const totalLength = getArcLength(rawPoints);
  const bounds = getBounds(rawPoints);
  const { width, height, minX, minY, maxX, maxY, cx, cy } = bounds;
  const maxDim = Math.max(width, height);
  const minDim = Math.min(width, height);

  // Safeguard 1: Discard tiny strokes (handwritten dots, accents, punctuation, small letters like 'o')
  if (totalLength < 30 || maxDim < 22) {
    return null;
  }

  const pStart = rawPoints[0];
  const pEnd = rawPoints[rawPoints.length - 1];
  const startEndDist = dist(pStart, pEnd);

  // -------------------------------------------------------------
  // 1. STRAIGHT LINE RECOGNITION
  // -------------------------------------------------------------
  const straightnessRatio = startEndDist / (totalLength || 1);
  if (straightnessRatio >= 0.93 && startEndDist >= 35) {
    // Check maximum perpendicular deviation from start-to-end chord
    let maxDev = 0;
    for (let i = 0; i < rawPoints.length; i++) {
      const d = distToSegment(rawPoints[i], pStart, pEnd);
      if (d > maxDev) maxDev = d;
    }

    if (maxDev / startEndDist <= 0.08) {
      return {
        type: 'line',
        shapeType: 'line',
        x: Math.min(pStart.x, pEnd.x),
        y: Math.min(pStart.y, pEnd.y),
        width_box: Math.abs(pEnd.x - pStart.x),
        height_box: Math.abs(pEnd.y - pStart.y),
        points: [
          { x: pStart.x, y: pStart.y },
          { x: pEnd.x, y: pEnd.y }
        ],
        confidence: 0.95
      };
    }
  }

  // -------------------------------------------------------------
  // 2. ARROW RECOGNITION
  // -------------------------------------------------------------
  // Check if stroke forms a straight shaft with an arrowhead barb near the end
  if (totalLength >= 45 && rawPoints.length >= 8) {
    // Find point furthest from start point
    let maxDistFromStart = 0;
    let tipIndex = 0;
    for (let i = 0; i < rawPoints.length; i++) {
      const d = dist(pStart, rawPoints[i]);
      if (d > maxDistFromStart) {
        maxDistFromStart = d;
        tipIndex = i;
      }
    }

    const tipPoint = rawPoints[tipIndex];
    const shaftArcLength = getArcLength(rawPoints.slice(0, tipIndex + 1));
    const shaftDirectDist = dist(pStart, tipPoint);

    if (
      shaftDirectDist >= 35 &&
      shaftArcLength > 0 &&
      shaftDirectDist / shaftArcLength >= 0.88 &&
      tipIndex >= rawPoints.length * 0.55
    ) {
      const tailPoints = rawPoints.slice(tipIndex);
      const tailLength = getArcLength(tailPoints);
      // Arrow barb should be between 10% and 55% of shaft length
      if (tailLength > 8 && tailLength < shaftDirectDist * 0.65) {
        return {
          type: 'shape',
          shapeType: 'arrow',
          x: Math.min(pStart.x, tipPoint.x),
          y: Math.min(pStart.y, tipPoint.y),
          width_box: Math.abs(tipPoint.x - pStart.x),
          height_box: Math.abs(tipPoint.y - pStart.y),
          points: [
            { x: pStart.x, y: pStart.y },
            { x: tipPoint.x, y: tipPoint.y }
          ],
          confidence: 0.92
        };
      }
    }
  }

  // -------------------------------------------------------------
  // 3. CLOSED SHAPES (Circle, Ellipse, Rectangle, Square, Triangle, Star, Diamond)
  // -------------------------------------------------------------
  // Closed shape requires start and end points to meet near each other
  const closureRatio = startEndDist / (totalLength || 1);
  const closureRelativeMaxDim = startEndDist / (maxDim || 1);

  const isClosed = (closureRatio < 0.28 || closureRelativeMaxDim < 0.32) && minDim >= 18 && maxDim >= 26;
  if (!isClosed) {
    // Not a closed shape and not a line/arrow -> keep as normal handwriting
    return null;
  }

  // Compute closed stroke properties
  const centroid = getCentroid(rawPoints);
  const shoelaceArea = getShoelaceArea(rawPoints);
  const bboxArea = width * height;
  const areaRatio = bboxArea > 0 ? shoelaceArea / bboxArea : 0;
  const aspectRatio = maxDim > 0 ? minDim / maxDim : 1;

  // Compute radial distance statistics from centroid
  let sumDist = 0;
  const radialDists = [];
  for (let i = 0; i < rawPoints.length; i++) {
    const d = dist(rawPoints[i], centroid);
    radialDists.push(d);
    sumDist += d;
  }
  const meanRadius = sumDist / rawPoints.length;
  let variance = 0;
  for (let i = 0; i < radialDists.length; i++) {
    variance += (radialDists[i] - meanRadius) ** 2;
  }
  const stdDevRadius = Math.sqrt(variance / radialDists.length);
  const cvRadius = meanRadius > 0 ? stdDevRadius / meanRadius : 1; // Coefficient of Variation

  // Extract corners and count sharp corners (< 125 degrees)
  const corners = extractClosedPolygonCorners(rawPoints, maxDim);
  const sharpCorners = corners.filter(c => c.angle < 125);
  const sharpCornerCount = sharpCorners.length;

  // -------------------------------------------------------------
  // 3A. CIRCLE RECOGNITION
  // -------------------------------------------------------------
  // Smooth curve (no multi-corner polygon), low radial variation (CV < 0.15), aspect ratio close to 1 (AR >= 0.78),
  // and Shoelace area close to pi/4 * W * H (~0.785)
  if (cvRadius <= 0.15 && aspectRatio >= 0.78 && areaRatio >= 0.55 && areaRatio <= 0.95 && sharpCornerCount <= 2) {
    const radius = (width + height) / 4;
    return {
      type: 'shape',
      shapeType: 'circle',
      x: cx - radius,
      y: cy - radius,
      width_box: radius * 2,
      height_box: radius * 2,
      confidence: 0.96
    };
  }

  // -------------------------------------------------------------
  // 3B. ELLIPSE RECOGNITION
  // -------------------------------------------------------------
  // Elongated oval (AR between 0.28 and 0.78), area ratio ~ 0.785, low normalized algebraic error
  if (aspectRatio >= 0.28 && aspectRatio < 0.78 && areaRatio >= 0.52 && areaRatio <= 0.95 && sharpCornerCount <= 2) {
    const semiA = width / 2;
    const semiB = height / 2;
    if (semiA > 0 && semiB > 0) {
      let ellipseError = 0;
      for (let i = 0; i < rawPoints.length; i++) {
        const p = rawPoints[i];
        const val = ((p.x - cx) ** 2) / (semiA ** 2) + ((p.y - cy) ** 2) / (semiB ** 2);
        ellipseError += Math.abs(val - 1.0);
      }
      const meanEllipseError = ellipseError / rawPoints.length;
      if (meanEllipseError <= 0.22) {
        return {
          type: 'shape',
          shapeType: 'ellipse',
          x: minX,
          y: minY,
          width_box: width,
          height_box: height,
          confidence: 0.92
        };
      }
    }
  }

  // -------------------------------------------------------------
  // 3C. TRIANGLE RECOGNITION
  // -------------------------------------------------------------
  if ((sharpCornerCount === 3 || corners.length === 3) && areaRatio >= 0.28 && areaRatio <= 0.68) {
    const activeCorners = sharpCornerCount === 3 ? sharpCorners : corners.slice(0, 3);
    const angles = activeCorners.map(c => c.angle);
    const angleSum = angles.reduce((a, b) => a + b, 0);
    const allValid = angles.every(a => a >= 20 && a <= 135);

    if (Math.abs(angleSum - 180) <= 45 && allValid) {
      return {
        type: 'shape',
        shapeType: 'triangle',
        x: minX,
        y: minY,
        width_box: width,
        height_box: height,
        confidence: 0.94
      };
    }
  }

  // -------------------------------------------------------------
  // 3D. RECTANGLE / SQUARE / DIAMOND RECOGNITION
  // -------------------------------------------------------------
  if (sharpCornerCount === 4 || corners.length === 4) {
    const activeCorners = sharpCornerCount === 4 ? sharpCorners : corners.slice(0, 4);
    const angles = activeCorners.map(c => c.angle);
    const isRectangular = angles.every(a => a >= 60 && a <= 125);

    if (isRectangular && areaRatio >= 0.68) {
      if (aspectRatio >= 0.82) {
        const side = (width + height) / 2;
        return {
          type: 'shape',
          shapeType: 'rectangle',
          x: cx - side / 2,
          y: cy - side / 2,
          width_box: side,
          height_box: side,
          confidence: 0.95
        };
      } else {
        return {
          type: 'shape',
          shapeType: 'rectangle',
          x: minX,
          y: minY,
          width_box: width,
          height_box: height,
          confidence: 0.94
        };
      }
    } else if (areaRatio >= 0.40 && areaRatio <= 0.68) {
      const isDiamondAngles = angles.every(a => a >= 45 && a <= 135);
      if (isDiamondAngles) {
        return {
          type: 'shape',
          shapeType: 'diamond',
          x: minX,
          y: minY,
          width_box: width,
          height_box: height,
          confidence: 0.90
        };
      }
    }
  }

  // -------------------------------------------------------------
  // 3E. STAR RECOGNITION
  // -------------------------------------------------------------
  if (corners.length >= 8 && corners.length <= 12 && aspectRatio >= 0.70) {
    let peaks = 0;
    for (let i = 0; i < corners.length; i++) {
      const prev = (i - 1 + corners.length) % corners.length;
      const next = (i + 1) % corners.length;
      const dCurrent = dist(corners[i].pt, centroid);
      const dPrev = dist(corners[prev].pt, centroid);
      const dNext = dist(corners[next].pt, centroid);
      if (dCurrent > dPrev && dCurrent > dNext) {
        peaks++;
      }
    }

    if (peaks === 5 || peaks === 4) {
      const side = Math.max(width, height);
      return {
        type: 'shape',
        shapeType: 'star',
        x: cx - side / 2,
        y: cy - side / 2,
        width_box: side,
        height_box: side,
        confidence: 0.91
      };
    }
  }

  // If confidence is low, ambiguous, or handwriting -> return null
  return null;
}
