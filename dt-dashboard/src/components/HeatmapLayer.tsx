import { useEffect, useRef } from 'react';
import type { Pose } from '../data/entities';

interface HeatmapLayerProps {
  poses: Pose[];
  width: number;  // in meters
  height: number; // in meters
  scale: number;  // pixels per meter
  opacity?: number; // 0-1
}

export function HeatmapLayer({ poses, width, height, scale, opacity = 0.7 }: HeatmapLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Group poses by coordinates to create a density map
  const generateHeatmap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create density map
    const gridSize = scale / 2; // Half meter grid for heat calculation
    const densityMap: Record<string, number> = {};
    const maxDensity = 10; // Normalization factor
    
    // Group poses in cells and count
    poses.forEach(pose => {
      const gridX = Math.floor(pose.x * scale / gridSize);
      const gridY = Math.floor(pose.y * scale / gridSize);
      const cellKey = `${gridX},${gridY}`;
      
      if (!densityMap[cellKey]) {
        densityMap[cellKey] = 0;
      }
      densityMap[cellKey]++;
    });

    // Draw heatmap
    ctx.save();
    ctx.globalAlpha = opacity;
    
    Object.entries(densityMap).forEach(([cellKey, density]) => {
      const [gridX, gridY] = cellKey.split(',').map(Number);
      const x = gridX * gridSize;
      const y = gridY * gridSize;
      
      // Normalize density
      const normalizedDensity = Math.min(density / maxDensity, 1);
      
      // Color based on density
      const r = Math.round(255 * normalizedDensity);
      const g = Math.round(100 * (1 - normalizedDensity));
      const b = Math.round(50 * (1 - normalizedDensity));
      
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${normalizedDensity * opacity})`;
      ctx.fillRect(x, y, gridSize, gridSize);
    });
    
    ctx.restore();
  };

  useEffect(() => {
    generateHeatmap();
  }, [poses]);

  return (
    <canvas
      ref={canvasRef}
      width={width * scale}
      height={height * scale}
      className="absolute top-0 left-0 pointer-events-none"
      style={{ zIndex: 10 }}
    />
  );
}
