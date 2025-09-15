import { useState, useEffect, useRef } from 'react';
import type { Pose, Task } from '../../data/entities';
import type { DataSourceMode } from '../ui/DataSourceSwitcher';
import { EntitiesLayer } from './EntitiesLayer';
import { TaskRoutes } from './TaskRoutes';
import { HeatmapLayer } from './HeatmapLayer';
import { WarehouseLanes } from './WarehouseLanes';
import { useIoTWebSocket } from '../../hooks/useIoTWebSocket';
import { snapToNearestPath, isOnValidPath } from '../../utils/pathValidation';

interface WarehouseMapProps {
  width: number;
  height: number;
  cellSize: number;
  tasks: Task[];
  selectedTaskId?: string | null;
  showHeatmap?: boolean;
  showRoutes?: boolean;
  dataSourceMode?: DataSourceMode;
  onSelectEntity?: (entityId: string | null) => void;
}

export function WarehouseMap({
  cellSize,
  tasks,
  selectedTaskId = null,
  showHeatmap = false,
  showRoutes = true,
  dataSourceMode = 'simulation',
  onSelectEntity
}: WarehouseMapProps) {
  // WebSocket connection to IoT service for real-time data
  const { poses: liveEntities } = useIoTWebSocket();
  
  // Convert WebSocket poses to dashboard format and apply path validation
  const entities: Pose[] = liveEntities.length > 0 ? liveEntities.map(wsEntity => {
    let x = wsEntity.x;
    let y = wsEntity.y;
    
    // For MQTT mode, snap positions to valid paths
    if (dataSourceMode === 'mqtt' && wsEntity.entityType === 'forklift') {
      if (!isOnValidPath({ x, y }, 0.5)) {
        const snappedPos = snapToNearestPath({ x, y }, 2.0);
        x = snappedPos.x;
        y = snappedPos.y;
      }
    }
    
    return {
      entityId: wsEntity.entityId,
      t: wsEntity.timestamp,
      x,
      y,
      heading: wsEntity.heading,
      speed: wsEntity.speed,
      zone: wsEntity.zoneId || 'unknown',
      confidence: wsEntity.confidence || 0.9
    };
  }) : [
    // Fallback entities if WebSocket not connected - positioned on valid paths
    {
      entityId: 'forklift-1',
      t: Date.now(),
      x: 12.5, // On vertical line 1
      y: 6.0,  // On storage A horizontal line
      heading: 0,
      speed: 0.5,
      zone: 'main-aisle',
      confidence: 0.95
    },
    {
      entityId: 'forklift-2',
      t: Date.now(),
      x: 25.3, // On vertical line 3
      y: 11.2, // On middle horizontal line
      heading: 180,
      speed: 0.8,
      zone: 'main-aisle',
      confidence: 0.95
    }
  ];

  // Use live alerts or empty array as fallback
  // const alerts = liveAlerts; // TODO: Implement alert display after adding coordinate mapping
  
  const mapRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Calculate map dimensions
  const mapWidth = 1320;
  const mapHeight = 600;

  // Define warehouse layout matching the second image exactly
  const warehouseLayout = {
    // Main storage zones - STORAGE ZONE A and B
    storageZones: {
      // STORAGE ZONE A (top section with 6 racks)
      A1: { x: 160, y: 80, width: 140, height: 120, efficiency: 90, label: 'A1' },
      A2: { x: 320, y: 80, width: 140, height: 120, efficiency: 66, label: 'A2' },
      A3: { x: 480, y: 80, width: 140, height: 120, efficiency: 75, label: 'A3' },
      A4: { x: 640, y: 80, width: 140, height: 120, efficiency: 88, label: 'A4' },
      A5: { x: 800, y: 80, width: 140, height: 120, efficiency: 70, label: 'A5' },
      A6: { x: 960, y: 80, width: 140, height: 120, efficiency: 82, label: 'A6' },
      
      // STORAGE ZONE B (bottom section with 6 racks)
      B1: { x: 160, y: 340, width: 140, height: 120, efficiency: 82, label: 'B1' },
      B2: { x: 320, y: 340, width: 140, height: 120, efficiency: 76, label: 'B2' },
      B3: { x: 480, y: 340, width: 140, height: 120, efficiency: 91, label: 'B3' },
      B4: { x: 640, y: 340, width: 140, height: 120, efficiency: 68, label: 'B4' },
      B5: { x: 800, y: 340, width: 140, height: 120, efficiency: 85, label: 'B5' },
      B6: { x: 960, y: 340, width: 140, height: 120, efficiency: 79, label: 'B6' },
      
      // Personnel zones at bottom - smaller and cleaner design
      P1: { x: 160, y: 480, width: 140, height: 30, efficiency: 45, label: 'P1', isPersonnel: true },
      P2: { x: 320, y: 480, width: 140, height: 30, efficiency: 72, label: 'P2', isPersonnel: true },
      P3: { x: 480, y: 480, width: 140, height: 30, efficiency: 58, label: 'P3', isPersonnel: true },
      P4: { x: 640, y: 480, width: 140, height: 30, efficiency: 83, label: 'P4', isPersonnel: true },
      P5: { x: 800, y: 480, width: 140, height: 30, efficiency: 67, label: 'P5', isPersonnel: true },
      P6: { x: 960, y: 480, width: 140, height: 30, efficiency: 74, label: 'P6', isPersonnel: true }
    },
    
    // Define minimal track lines - REMOVED unwanted horizontal lines, only keep essential boundaries
    trackLines: [
      // Only keep essential boundary tracks 
      { 
        id: 'vertical-left',
        points: [{ x: 80, y: 60 }, { x: 80, y: 580 }],
        type: 'vertical'
      },
      { 
        id: 'vertical-right',
        points: [{ x: 1200, y: 60 }, { x: 1200, y: 580 }],
        type: 'vertical'
      }
    ],
    
    // Loading/Unloading docks on the right - made thicker as requested
    loadingDocks: {
      loading: { x: 1220, y: 120, width: 100, height: 120, label: 'LOADING' },
      unloading: { x: 1220, y: 280, width: 100, height: 120, label: 'UNLOADING' }
    }
  };

  // Handle mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    try {
      e.preventDefault();
      e.stopPropagation();
    } catch (err) {
      // Ignore preventDefault errors on passive listeners
    }
    
    const delta = e.deltaY;
    const scaleChange = delta > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(3, transform.scale * scaleChange));
    
    // Calculate zoom centered on cursor position
    const rect = mapRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const newX = transform.x - ((mouseX - transform.x) * (scaleChange - 1));
      const newY = transform.y - ((mouseY - transform.y) * (scaleChange - 1));
      
      setTransform({
        x: newX,
        y: newY,
        scale: newScale
      });
    }
  };

  // Handle mouse drag for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    try {
      e.preventDefault();
      e.stopPropagation();
    } catch (err) {
      // Ignore preventDefault errors on passive listeners
    }
    setDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    
    setTransform({
      ...transform,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  // Clean up event listeners
  useEffect(() => {
    const handleMouseMoveGlobal = (e: MouseEvent) => {
      if (!dragging) return;
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    };

    const handleMouseUpGlobal = () => {
      setDragging(false);
    };

    if (dragging) {
      document.addEventListener('mousemove', handleMouseMoveGlobal);
      document.addEventListener('mouseup', handleMouseUpGlobal);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMoveGlobal);
      document.removeEventListener('mouseup', handleMouseUpGlobal);
    };
  }, [dragging, dragStart]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#0D1426] rounded-lg border border-[#1E2747]"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <svg
        ref={mapRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${mapWidth} ${mapHeight}`}
        className="cursor-grab active:cursor-grabbing"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`
        }}
      >
        {/* Background */}
        <rect 
          width={mapWidth} 
          height={mapHeight} 
          fill="#0D1426"
          stroke="#1E2747"
          strokeWidth="2"
        />

        {/* STORAGE ZONE A Header */}
        <text
          x="80"
          y="35"
          fill="#36BA7C"
          fontSize="20"
          fontWeight="bold"
        >
          STORAGE ZONE A
        </text>

        {/* STORAGE ZONE B Header */}
        <text
          x="80"
          y="325"
          fill="#36BA7C"
          fontSize="20"
          fontWeight="bold"
        >
          STORAGE ZONE B
        </text>

        {/* Warehouse structured aisles for forklift movement */}
        <WarehouseLanes cellSize={cellSize} />

        {/* Draw thin track lines (like train tracks) */}
        {warehouseLayout.trackLines.map(track => (
          <g key={track.id}>
            <line
              x1={track.points[0].x}
              y1={track.points[0].y}
              x2={track.points[1].x}
              y2={track.points[1].y}
              stroke="#36BA7C"
              strokeWidth="3"
              strokeDasharray="none"
              opacity="0.8"
            />
          </g>
        ))}

        {/* Storage zones */}
        {Object.values(warehouseLayout.storageZones).map((zone) => {
          const isPersonnelZone = zone.label.startsWith('P');
          
          return (
            <g key={zone.label}>
              {/* Zone background - subtle design for personnel zones */}
              <rect
                x={zone.x}
                y={zone.y}
                width={zone.width}
                height={zone.height}
                fill={isPersonnelZone ? "#1A2235" : "#1A2235"}
                stroke={isPersonnelZone ? "#36BA7C" : "#36BA7C"}
                strokeWidth={isPersonnelZone ? "1" : "2"}
                strokeDasharray={isPersonnelZone ? "5,5" : "none"}
                rx="4"
                ry="4"
                className="cursor-pointer hover:fill-[#1E2747] transition-colors"
                opacity={isPersonnelZone ? "0.6" : "0.8"}
              >
                <title>
                  {isPersonnelZone ? 'Personnel Zone' : 'Storage Zone'} {zone.label}
                  {!isPersonnelZone && ` - ${zone.efficiency}% Efficiency`}
                  {isPersonnelZone && ' - Personnel working area'}
                </title>
              </rect>
              
              {/* Zone label - smaller and cleaner for personnel zones */}
              <text
                x={zone.x + (isPersonnelZone ? 10 : 15)}
                y={zone.y + (isPersonnelZone ? 20 : 25)}
                fill="#FFFFFF"
                fontSize={isPersonnelZone ? "12" : "16"}
                fontWeight="bold"
              >
                {zone.label}
              </text>
              
              {/* Zone efficiency percentage - positioned better for personnel zones */}
              <text
                x={zone.x + zone.width - (isPersonnelZone ? 10 : 15)}
                y={zone.y + (isPersonnelZone ? 20 : 25)}
                textAnchor="end"
                fill="#FFFFFF"
                fontSize={isPersonnelZone ? "11" : "14"}
              >
                {zone.efficiency}%
              </text>
              
              {/* Grid pattern for storage areas (not personnel zones) - STATIC, no animation */}
              {!isPersonnelZone && (
                <g>
                  {Array.from({ length: Math.floor(zone.width / 12) }).map((_, col) => (
                    Array.from({ length: Math.floor((zone.height - 35) / 10) }).map((_, row) => {
                      // Create a static grid pattern with some random gaps - NO BLINKING
                      const shouldShow = Math.random() > 0.15;
                      if (!shouldShow) return null;
                      
                      return (
                        <rect
                          key={`${zone.label}-cell-${row}-${col}`}
                          x={zone.x + 8 + col * 12}
                          y={zone.y + 35 + row * 10}
                          width={10}
                          height={8}
                          fill="#36BA7C"
                          fillOpacity="0.5"
                          rx="1"
                          ry="1"
                        />
                      );
                    })
                  ))}
                </g>
              )}
              
              {/* Personnel zone indicator - simpler clean design */}
              {isPersonnelZone && (
                <g>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <circle
                      key={`person-${i}`}
                      cx={zone.x + 45 + i * 25}
                      cy={zone.y + zone.height / 2}
                      r="3"
                      fill="#36BA7C"
                      opacity="0.8"
                    />
                  ))}
                </g>
              )}
            </g>
          );
        })}

        {/* Loading/Unloading docks */}
        {Object.values(warehouseLayout.loadingDocks).map((dock) => (
          <g key={dock.label}>
            <rect
              x={dock.x}
              y={dock.y}
              width={dock.width}
              height={dock.height}
              fill="#7B2D26"
              stroke="#FF4444"
              strokeWidth="2"
              rx="4"
              ry="4"
            />
            
            {/* Dock label positioned above the dock */}
            <text
              x={dock.x + dock.width / 2}
              y={dock.y - 10}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="14"
              fontWeight="bold"
            >
              {dock.label}
            </text>

            {/* Dock indicator lines - thicker and more prominent */}
            {Array.from({ length: 4 }).map((_, i) => (
              <rect
                key={`dock-line-${i}`}
                x={dock.x + 20}
                y={dock.y + 20 + i * 22}
                width={60}
                height={6}
                fill="#FF4444"
                rx="2"
              />
            ))}
          </g>
        ))}

        {/* Heatmap layer */}
        {showHeatmap && (
          <foreignObject x="0" y="0" width={mapWidth} height={mapHeight}>
            <HeatmapLayer 
              width={52}
              height={25}
              scale={25}
              poses={entities}
              opacity={0.6}
            />
          </foreignObject>
        )}

        {/* Task routes */}
        {showRoutes && <TaskRoutes 
          tasks={tasks} 
          cellSize={cellSize}
          selectedTaskId={selectedTaskId}
        />}

        {/* Entity positions - show only the two predefined forklifts */}
        <EntitiesLayer 
          poses={entities} 
          cellSize={cellSize}
          onSelect={onSelectEntity}
          selectedTask={tasks.find(t => t.id === selectedTaskId)}
        />

        {/* Alert markers */}
        {/* Alert markers - WebSocket alerts are zone-based, need coordinate mapping */}
        {/* TODO: Implement zone-to-coordinate mapping for alert display */}
      </svg>
      
      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <button
          onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
          className="bg-[#1E2747] hover:bg-[#2D3B5F] text-white px-3 py-2 rounded text-sm border border-[#36454F]"
        >
          Reset View
        </button>
        <button
          onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale * 1.2) }))}
          className="bg-[#1E2747] hover:bg-[#2D3B5F] text-white px-3 py-2 rounded text-sm border border-[#36454F]"
        >
          Zoom In
        </button>
        <button
          onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(0.5, prev.scale / 1.2) }))}
          className="bg-[#1E2747] hover:bg-[#2D3B5F] text-white px-3 py-2 rounded text-sm border border-[#36454F]"
        >
          Zoom Out
        </button>
      </div>

      {/* Status indicator */}
      <div className="absolute top-4 left-4 text-sm">
        <div className="bg-[#1E2747]/90 px-3 py-2 rounded border border-[#36454F]">
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-blue-400 font-semibold">Live Warehouse Floor</span>
          </div>
          <div className="text-xs text-gray-400">
            2 active entities • 12 active areas • 25px/m
          </div>
        </div>
      </div>
    </div>
  );
}
