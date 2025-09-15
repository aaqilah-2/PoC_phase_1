import { useState, useRef, useEffect } from 'react';
import type { Zone, Aisle, Rack, Dock, Polygon } from '../../data/entities';

interface MapCanvasProps {
  width: number; // meters
  height: number; // meters
  scale: number; // pixels per meter
  children?: React.ReactNode;
  zones: Zone[];
  aisles: Aisle[];
  racks?: Rack[];
  docks?: Dock[];
  noGo?: Polygon[];
  onCellClick?: (x: number, y: number) => void;
  showGrid?: boolean;
}

export function MapCanvas({ 
  width, 
  height, 
  scale, 
  children, 
  zones, 
  aisles,
  racks = [],
  docks = [],
  noGo = [],
  onCellClick,
  showGrid = true
}: MapCanvasProps) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const pixelWidth = width * scale * zoom;
  const pixelHeight = height * scale * zoom;
  const gridSize = scale * zoom; // 1 meter grid

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    setPan(prevPan => ({
      x: prevPan.x + dx,
      y: prevPan.y + dy
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(3, zoom * scaleFactor));
    setZoom(newZoom);
  };
  
  const handleCellClick = (e: React.MouseEvent) => {
    if (!onCellClick || isDragging) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Get click position relative to the SVG
    const x = (e.clientX - rect.left - pan.x) / (scale * zoom);
    const y = (e.clientY - rect.top - pan.y) / (scale * zoom);
    
    // Convert to grid cell
    const cellX = Math.floor(x);
    const cellY = Math.floor(y);
    
    onCellClick(cellX, cellY);
  };

  useEffect(() => {
    const handleMouseUpGlobal = () => {
      setIsDragging(false);
    };

    document.addEventListener('mouseup', handleMouseUpGlobal);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUpGlobal);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden bg-gray-900 border border-gray-700 rounded-lg"
      style={{ width: '100%', height: '600px' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleCellClick}
    >
      <div 
        className="absolute"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        <svg
          width={pixelWidth}
          height={pixelHeight}
          viewBox={`0 0 ${pixelWidth} ${pixelHeight}`}
          className="block"
        >
          {/* Grid pattern definition */}
          <defs>
            <pattern
              id="grid"
              width={gridSize}
              height={gridSize}
              patternUnits="userSpaceOnUse"
            >
              <rect
                width={gridSize}
                height={gridSize}
                fill="#1f2937" // Dark blue-gray for warehouse floor
                stroke={showGrid ? "#374151" : "transparent"} // Slightly lighter for grid lines
                strokeWidth="1"
              />
            </pattern>
          </defs>
          
          {/* Background with grid */}
          <rect
            width={pixelWidth}
            height={pixelHeight}
            fill="url(#grid)"
          />
          
          {/* Zones */}
          {zones.map(zone => (
            <g key={zone.id}>
              {zone.bounds.map((bound, idx) => {
                const color = zone.type === 'COLD_STORAGE' ? '#3b82f6' :
                            zone.type === 'RESTRICTED' ? '#ef4444' :
                            zone.type === 'LOADING' || zone.type === 'UNLOADING' ? '#f59e0b' : 
                            '#10b981';
                
                return (
                  <rect 
                    key={`${zone.id}-${idx}`}
                    x={bound.x * scale * zoom}
                    y={bound.y * scale * zoom}
                    width={bound.width * scale * zoom}
                    height={bound.height * scale * zoom}
                    fill={color}
                    fillOpacity={0.15}
                    stroke={color}
                    strokeWidth={2 * zoom}
                    strokeOpacity={0.6}
                    data-zone={zone.id}
                    className="zone-rect"
                  />
                );
              })}
              
              {/* Zone labels */}
              <text 
                x={(zone.bounds[0].x + zone.bounds[0].width/2) * scale * zoom}
                y={(zone.bounds[0].y + zone.bounds[0].height/2) * scale * zoom}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize={12 * zoom}
                fontWeight="bold"
                opacity={0.8}
                pointerEvents="none"
              >
                {zone.name}
                {zone.temperature !== undefined && (
                  <tspan x={(zone.bounds[0].x + zone.bounds[0].width/2) * scale * zoom} dy={14 * zoom}>
                    {zone.temperature}°C
                  </tspan>
                )}
              </text>
            </g>
          ))}
          
          {/* Aisles */}
          {aisles.map(aisle => (
            <g key={aisle.id}>
              <polyline
                points={aisle.points.map(p => `${p.x * scale * zoom},${p.y * scale * zoom}`).join(' ')}
                fill="none"
                stroke={aisle.blocked ? '#ef4444' : aisle.congested ? '#f59e0b' : aisle.direction === 'oneway' ? '#f59e0b' : '#10b981'}
                strokeWidth={aisle.width * scale * zoom}
                strokeOpacity={aisle.blocked ? 0.7 : 0.3}
                strokeLinecap="round"
                strokeDasharray={aisle.direction === 'oneway' ? `${10 * zoom},${5 * zoom}` : '0'}
                data-aisle={aisle.id}
                className="aisle-path"
              />
            </g>
          ))}
          
          {/* Racks */}
          {racks.map(rack => (
            <g key={rack.id}>
              <rect
                x={rack.x * scale * zoom}
                y={rack.y * scale * zoom}
                width={rack.width * scale * zoom}
                height={rack.height * scale * zoom}
                fill="#1e40af"
                stroke="#60a5fa"
                strokeWidth={1 * zoom}
                data-rack={rack.id}
                className="rack-rect"
              />
              {rack.name && (
                <text
                  x={(rack.x + rack.width/2) * scale * zoom}
                  y={(rack.y + rack.height/2) * scale * zoom}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#60a5fa"
                  fontSize={10 * zoom}
                  fontWeight="bold"
                  opacity={0.9}
                  pointerEvents="none"
                >
                  {rack.name}
                </text>
              )}
            </g>
          ))}
          
          {/* Docks */}
          {docks.map(dock => (
            <g key={dock.id}>
              <rect
                x={dock.x * scale * zoom}
                y={dock.y * scale * zoom}
                width={dock.width * scale * zoom}
                height={dock.height * scale * zoom}
                fill={dock.type === 'INBOUND' ? '#7f1d1d' : '#65a30d'}
                stroke={dock.type === 'INBOUND' ? '#f87171' : '#a3e635'}
                strokeWidth={2 * zoom}
                data-dock={dock.id}
                className="dock-rect"
              />
              <text
                x={(dock.x + dock.width/2) * scale * zoom}
                y={(dock.y + dock.height/2) * scale * zoom}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize={12 * zoom}
                fontWeight="bold"
                opacity={0.9}
                pointerEvents="none"
              >
                {dock.name}
                <tspan x={(dock.x + dock.width/2) * scale * zoom} dy={16 * zoom} fontSize={10 * zoom}>
                  {dock.type === 'INBOUND' ? 'Truck → WH' : 'WH → Truck'}
                </tspan>
              </text>
            </g>
          ))}
          
          {/* No-Go Zones */}
          {noGo.map(polygon => (
            <g key={polygon.id}>
              <polygon
                points={polygon.points.map(p => `${p.x * scale * zoom},${p.y * scale * zoom}`).join(' ')}
                fill="#ef4444"
                fillOpacity={0.2}
                stroke="#ef4444"
                strokeWidth={1 * zoom}
                strokeOpacity={0.8}
                data-no-go={polygon.id}
                className="no-go-polygon"
              />
            </g>
          ))}
          
          {/* Border */}
          <rect
            x="0"
            y="0"
            width={pixelWidth}
            height={pixelHeight}
            fill="none"
            stroke="#60a5fa"
            strokeWidth={2 * zoom}
          />
          
          {/* Render children (entities, etc.) */}
          {children}
          
          {/* Scale bar */}
          <g transform={`translate(20, ${pixelHeight - 30})`}>
            <rect x="0" y="0" width={scale * zoom} height={5} fill="white" />
            <text x={scale * zoom / 2} y="20" fill="white" textAnchor="middle" fontSize={12 * zoom}>1m</text>
          </g>
        </svg>
      </div>
      
      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 bg-gray-800 rounded-lg p-2 shadow-lg flex flex-col gap-2">
        <button 
          className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-md text-white"
          onClick={() => setZoom(prev => Math.min(3, prev * 1.2))}
        >
          +
        </button>
        <button 
          className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-md text-white"
          onClick={() => setZoom(prev => Math.max(0.5, prev / 1.2))}
        >
          -
        </button>
        <button 
          className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-md text-white"
          onClick={() => {
            setPan({ x: 0, y: 0 });
            setZoom(1);
          }}
          title="Reset View"
        >
          ⟲
        </button>
      </div>
      
      {/* Scale display */}
      <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-75 rounded-md px-2 py-1 text-xs text-gray-300">
        {Math.round(scale * zoom)}px/m • Zoom: {zoom.toFixed(1)}x
      </div>
    </div>
  );
}
