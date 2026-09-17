import React, { useRef } from 'react';
import { useLaserPointer } from '../../hooks/useLaserPointer';

export function LaserLayer({ width = 1200, height = 1600 }) {
  const laserCanvasRef = useRef(null);
  useLaserPointer(laserCanvasRef, width, height);

  return (
    <canvas
      ref={laserCanvasRef}
      className="absolute inset-0 pointer-events-none z-30"
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
}
