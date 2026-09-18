/**
 * Geometry helpers for shapes, lines, arrows, and stars
 */

export function drawShape(ctx, shape) {
  const {
    shapeType = 'rectangle',
    x = 0,
    y = 0,
    width_box = 100,
    height_box = 100,
    color = '#ffffff',
    fillColor = 'transparent',
    width = 2,
    opacity = 1,
    isDashed = false,
    points = []
  } = shape;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.fillStyle = fillColor;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (isDashed) {
    ctx.setLineDash([8, 6]);
  } else {
    ctx.setLineDash([]);
  }

  ctx.beginPath();

  if (shapeType === 'rectangle') {
    ctx.rect(x, y, width_box, height_box);
  } else if (shapeType === 'roundedRect') {
    const r = Math.min(16, Math.abs(width_box) / 4, Math.abs(height_box) / 4);
    if (ctx.roundRect) {
      ctx.roundRect(x, y, width_box, height_box, r);
    } else {
      ctx.rect(x, y, width_box, height_box);
    }
  } else if (shapeType === 'circle') {
    const rx = Math.abs(width_box) / 2;
    const ry = Math.abs(height_box) / 2;
    const cx = x + width_box / 2;
    const cy = y + height_box / 2;
    const r = Math.min(rx, ry);
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  } else if (shapeType === 'ellipse') {
    const rx = Math.abs(width_box) / 2;
    const ry = Math.abs(height_box) / 2;
    const cx = x + width_box / 2;
    const cy = y + height_box / 2;
    ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
  } else if (shapeType === 'diamond') {
    ctx.moveTo(x + width_box / 2, y);
    ctx.lineTo(x + width_box, y + height_box / 2);
    ctx.lineTo(x + width_box / 2, y + height_box);
    ctx.lineTo(x, y + height_box / 2);
    ctx.closePath();
  } else if (shapeType === 'triangle') {
    ctx.moveTo(x + width_box / 2, y);
    ctx.lineTo(x + width_box, y + height_box);
    ctx.lineTo(x, y + height_box);
    ctx.closePath();
  } else if (shapeType === 'star') {
    const spikes = 5;
    const outerRadius = Math.min(Math.abs(width_box), Math.abs(height_box)) / 2;
    const innerRadius = outerRadius * 0.45;
    const cx = x + width_box / 2;
    const cy = y + height_box / 2;
    let rot = (Math.PI / 2) * 3;
    let step = Math.PI / spikes;

    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      let px = cx + Math.cos(rot) * outerRadius;
      let py = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(px, py);
      rot += step;

      px = cx + Math.cos(rot) * innerRadius;
      py = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(px, py);
      rot += step;
    }
    ctx.closePath();
  } else if (shapeType === 'line' || shapeType === 'arrow' || shapeType === 'doubleArrow') {
    if (points && points.length >= 2) {
      const p1 = points[0];
      const p2 = points[points.length - 1];
      drawLineOrArrow(ctx, p1.x, p1.y, p2.x, p2.y, shapeType, width);
      ctx.restore();
      return;
    } else {
      drawLineOrArrow(ctx, x, y, x + width_box, y + height_box, shapeType, width);
      ctx.restore();
      return;
    }
  }

  if (fillColor && fillColor !== 'transparent') {
    ctx.fill();
  }
  ctx.stroke();
  ctx.restore();
}

function drawLineOrArrow(ctx, fromX, fromY, toX, toY, type = 'line', lineWidth = 2) {
  const headlen = Math.max(12, lineWidth * 3.5);
  const angle = Math.atan2(toY - fromY, toX - fromX);

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Forward arrow head
  if (type === 'arrow' || type === 'doubleArrow') {
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headlen * Math.cos(angle - Math.PI / 6),
      toY - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headlen * Math.cos(angle + Math.PI / 6),
      toY - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  }

  // Reverse arrow head
  if (type === 'doubleArrow') {
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(
      fromX + headlen * Math.cos(angle - Math.PI / 6),
      fromY + headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      fromX + headlen * Math.cos(angle + Math.PI / 6),
      fromY + headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  }
}
