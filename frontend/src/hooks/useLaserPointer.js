import { useEffect, useRef } from 'react';
import { useToolStore } from '../store/useToolStore';
import { getMidPoint } from '../utils/smoothStroke';

function hexToRgb(hex) {
  if (!hex) return { r: 239, g: 68, b: 68 };
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(char => char + char).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return { r: 239, g: 68, b: 68 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

/**
 * Ultra-Smooth Laser Pointer Engine
 * Uses continuous cubic Bezier spline interpolation and exponential decay for a glowing, silky multi-color laser trail.
 */
export function useLaserPointer(laserCanvasRef, width = 720, height = 960) {
  const animFrameRef = useRef(null);

  useEffect(() => {
    const canvas = laserCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const TRAIL_LIFETIME_MS = 1000; // 1s smooth fading trail

    const renderLaser = () => {
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const state = useToolStore.getState();
      const points = state.laserTrail;
      const laserColor = state.laserColor || '#EF4444';
      const laserWidth = state.laserWidth || 8;
      const laserScale = laserWidth / 8;
      const rgb = hexToRgb(laserColor);
      const now = Date.now();

      if (points.length >= 2) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // 1. Outer vivid neon glow
        for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i];
          const p2 = points[i + 1];
          const age = now - p2.timestamp;
          const life = Math.max(0, 1 - age / TRAIL_LIFETIME_MS);
          if (life <= 0) continue;

          const mid = getMidPoint(p1, p2);
          const prevMid = i === 0 ? p1 : getMidPoint(points[i - 1], p1);

          ctx.beginPath();
          ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${life * 0.45})`;
          ctx.lineWidth = Math.max(2, 14 * life * laserScale);
          ctx.shadowColor = laserColor;
          ctx.shadowBlur = 12 * life * laserScale;
          ctx.moveTo(prevMid.x, prevMid.y);
          ctx.quadraticCurveTo(p1.x, p1.y, mid.x, mid.y);
          ctx.stroke();
        }

        // 2. Focused core beam
        for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i];
          const p2 = points[i + 1];
          const age = now - p2.timestamp;
          const life = Math.max(0, 1 - age / TRAIL_LIFETIME_MS);
          if (life <= 0) continue;

          const mid = getMidPoint(p1, p2);
          const prevMid = i === 0 ? p1 : getMidPoint(points[i - 1], p1);

          ctx.beginPath();
          ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${life * 0.95})`;
          ctx.lineWidth = Math.max(1.5, 5 * life * laserScale);
          ctx.shadowColor = laserColor;
          ctx.shadowBlur = 6 * life * laserScale;
          ctx.moveTo(prevMid.x, prevMid.y);
          ctx.quadraticCurveTo(p1.x, p1.y, mid.x, mid.y);
          ctx.stroke();
        }

        // 3. Crisp white-hot center
        for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i];
          const p2 = points[i + 1];
          const age = now - p2.timestamp;
          const life = Math.max(0, 1 - age / TRAIL_LIFETIME_MS);
          if (life <= 0) continue;

          const mid = getMidPoint(p1, p2);
          const prevMid = i === 0 ? p1 : getMidPoint(points[i - 1], p1);

          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 255, 255, ${life * 0.95})`;
          ctx.lineWidth = Math.max(1, 2.2 * life * laserScale);
          ctx.shadowBlur = 0;
          ctx.moveTo(prevMid.x, prevMid.y);
          ctx.quadraticCurveTo(p1.x, p1.y, mid.x, mid.y);
          ctx.stroke();
        }

        // Head glowing pointer dot (only for active points)
        const latest = points[points.length - 1];
        if (latest && now - latest.timestamp < TRAIL_LIFETIME_MS) {
          const headLife = Math.max(0, 1 - (now - latest.timestamp) / TRAIL_LIFETIME_MS);

          ctx.beginPath();
          ctx.arc(latest.x, latest.y, 7 * headLife, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.5 * headLife})`;
          ctx.shadowColor = laserColor;
          ctx.shadowBlur = 10;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(latest.x, latest.y, 3.5 * headLife, 0, Math.PI * 2);
          ctx.fillStyle = laserColor;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(latest.x, latest.y, 1.5 * headLife, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 0;
          ctx.fill();
        }
      }

      ctx.restore();

      // Decay points
      useToolStore.getState().decayLaserTrail();
      animFrameRef.current = requestAnimationFrame(renderLaser);
    };

    animFrameRef.current = requestAnimationFrame(renderLaser);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [laserCanvasRef, width, height]);
}
