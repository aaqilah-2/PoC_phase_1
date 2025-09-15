interface StructuredAisle {
  id: string;
  points: Array<{ x: number; y: number }>;
  type: 'main-aisle' | 'rack-connector' | 'loading-zone';
  width: number;
}

interface WarehouseAislesProps {
  cellSize: number;
}

export function WarehouseLanes({ cellSize }: WarehouseAislesProps) {
  // COMPLETELY REDONE to match EXACTLY what the user wants:
  // 1. ONE horizontal line in the middle (no others)
  // 2. Vertical lines EXACTLY BETWEEN aisles (not aligned with them)
  // 3. No horizontal lines between aisles
  
  const structuredAisles: StructuredAisle[] = [
    // HORIZONTAL LINES - Top and bottom of each storage zone row (like in image)
    {
      id: 'top-horizontal-line',
      points: [{ x: 2, y: 7.8 }, { x: 46, y: 7.8 }],
      type: 'main-aisle',
      width: 0.3
    },
    {
      id: 'middle-horizontal-line',
      points: [{ x: 2, y: 11.2 }, { x: 46, y: 11.2 }],
      type: 'main-aisle',
      width: 0.3
    },
    {
      id: 'bottom-horizontal-line',
      points: [{ x: 2, y: 14.6 }, { x: 46, y: 14.6 }],
      type: 'main-aisle',
      width: 0.3
    },

    // VERTICAL LINES - Between storage zones (exactly like in image)
    {
      id: 'vertical-line-1',
      points: [{ x: 9.5, y: 2.5 }, { x: 9.5, y: 19.5 }],
      type: 'rack-connector',
      width: 0.3
    },
    {
      id: 'vertical-line-2',
      points: [{ x: 16.5, y: 2.5 }, { x: 16.5, y: 19.5 }],
      type: 'rack-connector',
      width: 0.3
    },
    {
      id: 'vertical-line-3',
      points: [{ x: 23.5, y: 2.5 }, { x: 23.5, y: 19.5 }],
      type: 'rack-connector',
      width: 0.3
    },
    {
      id: 'vertical-line-4',
      points: [{ x: 30.5, y: 2.5 }, { x: 30.5, y: 19.5 }],
      type: 'rack-connector',
      width: 0.3
    },
    {
      id: 'vertical-line-5',
      points: [{ x: 37.5, y: 2.5 }, { x: 37.5, y: 19.5 }],
      type: 'rack-connector',
      width: 0.3
    },

    // BOUNDARY LINES
    {
      id: 'left-boundary',
      points: [{ x: 2, y: 2.5 }, { x: 2, y: 19.5 }],
      type: 'main-aisle',
      width: 0.3
    },
    {
      id: 'right-boundary', 
      points: [{ x: 44.5, y: 2.5 }, { x: 44.5, y: 19.5 }],
      type: 'main-aisle',
      width: 0.3
    }
  ];

  const getAisleColor = (type: StructuredAisle['type']) => {
    switch (type) {
      case 'main-aisle':
        return '#10B981'; // Bright green for main aisles
      case 'rack-connector':
        return '#22C55E'; // Medium green for rack connections
      case 'loading-zone':
        return '#34D399'; // Light green for loading areas
      default:
        return '#22C55E';
    }
  };

  return (
    <g className="warehouse-aisles" style={{ pointerEvents: 'none' }}>
      {structuredAisles.map(aisle => {
        if (aisle.points.length < 2) return null;
        
        const color = getAisleColor(aisle.type);
        
        // Create path for straight lines
        const pathData = aisle.points.map((point, index) => 
          `${index === 0 ? 'M' : 'L'} ${point.x * cellSize} ${point.y * cellSize}`
        ).join(' ');
        
        return (
          <g key={aisle.id}>
            {/* Thin aisle line - like loading zone style */}
            <path
              d={pathData}
              stroke={color}
              strokeWidth={aisle.type === 'loading-zone' ? 3 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={0.9}
            />
            
            {/* Directional indicators for main aisles */}
            {aisle.type === 'main-aisle' && aisle.points.length >= 2 && (
              <>
                {Array.from({ length: Math.floor(aisle.points.length > 2 ? 8 : 6) }).map((_, index) => {
                  const totalLength = aisle.points.length - 1;
                  const segmentProgress = (index + 1) / (totalLength > 0 ? 8 : 6);
                  
                  const startPoint = aisle.points[0];
                  const endPoint = aisle.points[aisle.points.length - 1];
                  
                  const markerX = startPoint.x + (endPoint.x - startPoint.x) * segmentProgress;
                  const markerY = startPoint.y + (endPoint.y - startPoint.y) * segmentProgress;
                  
                  // Calculate direction
                  const dx = endPoint.x - startPoint.x;
                  const dy = endPoint.y - startPoint.y;
                  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                  
                  return (
                    <g key={`${aisle.id}-marker-${index}`}>
                      <polygon
                        points="0,-2 4,0 0,2"
                        fill={color}
                        opacity={0.6}
                        transform={`translate(${markerX * cellSize}, ${markerY * cellSize}) rotate(${angle})`}
                      />
                    </g>
                  );
                })}
              </>
            )}
          </g>
        );
      })}
    </g>
  );
}
