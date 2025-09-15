import { useEffect, useRef } from 'react';
import type { Pose } from '../../data/entities';

interface HeatmapLayerProps {
  poses: Pose[];
  width: number;  // in meters
  height: number; // in meters
  scale: number;  // pixels per meter
  opacity?: number; // 0-1
}

export function HeatmapLayer({
  poses,
  width,
  height,
  scale,
  opacity = 0.6
}: HeatmapLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate simple heatmap based on pose density
  const generateHeatmap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create density map with smaller grid for smoother heatmap
    const gridSize = Math.max(1, scale * 0.5); // Half meter grid
    const densityMap: Record<string, number> = {};
    
    // Count poses in each grid cell
    poses.forEach(pose => {
      const gridX = Math.floor(pose.x * scale / gridSize);
      const gridY = Math.floor(pose.y * scale / gridSize);
      const cellKey = `${gridX},${gridY}`;
      
      densityMap[cellKey] = (densityMap[cellKey] || 0) + 1;
    });

    // Find max density for normalization
    const maxDensity = Math.max(...Object.values(densityMap), 1);
    
    // Draw heatmap
    ctx.save();
    ctx.globalAlpha = opacity;
    
    Object.entries(densityMap).forEach(([cellKey, density]) => {
      const [gridX, gridY] = cellKey.split(',').map(Number);
      const x = gridX * gridSize;
      const y = gridY * gridSize;
      
      // Normalize density (0-1)
      const intensity = Math.min(density / maxDensity, 1);
      
      // Create heat colors: blue (low) -> green -> yellow -> red (high)
      const hue = (1 - intensity) * 240; // 240 = blue, 0 = red
      const saturation = 70 + (intensity * 30); // 70-100%
      const lightness = 40 + (intensity * 20); // 40-60%
      
      ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${intensity * 0.8})`;
      ctx.fillRect(x, y, gridSize, gridSize);
    });
    
    ctx.restore();
  };

  useEffect(() => {
    generateHeatmap();
  }, [poses, width, height, scale, opacity]);

  return (
    <canvas
      ref={canvasRef}
      width={width * scale}
      height={height * scale}
      className="absolute top-0 left-0 pointer-events-none"
      style={{ zIndex: 5 }}
    />
  );
}
