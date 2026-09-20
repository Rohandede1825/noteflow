import React, { useRef } from 'react';
import { useLaserPointer } from '../../hooks/useLaserPointer';

export function LaserLayer({ width = 720, height = 960 }) {
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
