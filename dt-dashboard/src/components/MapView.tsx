interface MapViewProps {
  width: number; // meters
  height: number; // meters
  scale: number; // pixels per meter
  children?: React.ReactNode;
  withWarehouseLayout?: boolean;
}

export function MapView({ width, height, scale, children, withWarehouseLayout = true }: MapViewProps) {
  const pixelWidth = width * scale;
  const pixelHeight = height * scale;
  const gridSize = scale; // 1 meter grid

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg overflow-hidden relative">
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
              stroke="#374151" // Slightly lighter for grid lines
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
        
        {/* Warehouse layout elements - only if enabled */}
        {withWarehouseLayout && (
          <>
            {/* Storage zones - A section (top) */}
            <g>
              <text x={pixelWidth * 0.05} y={pixelHeight * 0.1} 
                    fill="#6ee7b7" fontSize={scale} className="font-bold">
                STORAGE ZONE A
              </text>
              
              {/* Storage racks in zone A */}
              <rect x={pixelWidth * 0.1} y={pixelHeight * 0.15} width={pixelWidth * 0.12} height={pixelHeight * 0.25} fill="#1e40af" stroke="#60a5fa" strokeWidth="2" />
              <rect x={pixelWidth * 0.25} y={pixelHeight * 0.15} width={pixelWidth * 0.12} height={pixelHeight * 0.25} fill="#1e40af" stroke="#60a5fa" strokeWidth="2" />
              <rect x={pixelWidth * 0.4} y={pixelHeight * 0.15} width={pixelWidth * 0.12} height={pixelHeight * 0.25} fill="#1e40af" stroke="#60a5fa" strokeWidth="2" />
              <rect x={pixelWidth * 0.55} y={pixelHeight * 0.15} width={pixelWidth * 0.12} height={pixelHeight * 0.25} fill="#1e40af" stroke="#60a5fa" strokeWidth="2" />
              <rect x={pixelWidth * 0.7} y={pixelHeight * 0.15} width={pixelWidth * 0.12} height={pixelHeight * 0.25} fill="#1e40af" stroke="#60a5fa" strokeWidth="2" />
            </g>

            {/* Storage zones - B section (bottom) */}
            <g>
              <text x={pixelWidth * 0.05} y={pixelHeight * 0.6} 
                    fill="#6ee7b7" fontSize={scale} className="font-bold">
                STORAGE ZONE B
              </text>
              
              {/* Storage racks in zone B */}
              <rect x={pixelWidth * 0.1} y={pixelHeight * 0.65} width={pixelWidth * 0.12} height={pixelHeight * 0.25} fill="#1e40af" stroke="#60a5fa" strokeWidth="2" />
              <rect x={pixelWidth * 0.25} y={pixelHeight * 0.65} width={pixelWidth * 0.12} height={pixelHeight * 0.25} fill="#1e40af" stroke="#60a5fa" strokeWidth="2" />
              <rect x={pixelWidth * 0.4} y={pixelHeight * 0.65} width={pixelWidth * 0.12} height={pixelHeight * 0.25} fill="#1e40af" stroke="#60a5fa" strokeWidth="2" />
              <rect x={pixelWidth * 0.55} y={pixelHeight * 0.65} width={pixelWidth * 0.12} height={pixelHeight * 0.25} fill="#1e40af" stroke="#60a5fa" strokeWidth="2" />
              <rect x={pixelWidth * 0.7} y={pixelHeight * 0.65} width={pixelWidth * 0.12} height={pixelHeight * 0.25} fill="#1e40af" stroke="#60a5fa" strokeWidth="2" />
            </g>

            {/* Loading docks (right side) */}
            <g>
              <text x={pixelWidth * 0.88} y={pixelHeight * 0.2} 
                    fill="#f87171" fontSize={scale * 0.8} className="font-bold"
                    transform={`rotate(90, ${pixelWidth * 0.88}, ${pixelHeight * 0.2})`}>
                LOADING
              </text>
              <rect x={pixelWidth * 0.9} y={pixelHeight * 0.1} width={pixelWidth * 0.08} height={pixelHeight * 0.2} fill="#7f1d1d" stroke="#f87171" strokeWidth="2" />
            </g>

            {/* Unloading docks (right side) */}
            <g>
              <text x={pixelWidth * 0.88} y={pixelHeight * 0.7} 
                    fill="#f87171" fontSize={scale * 0.8} className="font-bold"
                    transform={`rotate(90, ${pixelWidth * 0.88}, ${pixelHeight * 0.7})`}>
                UNLOADING
              </text>
              <rect x={pixelWidth * 0.9} y={pixelHeight * 0.6} width={pixelWidth * 0.08} height={pixelHeight * 0.2} fill="#7f1d1d" stroke="#f87171" strokeWidth="2" />
            </g>
            
            {/* Main aisle paths */}
            <line x1={pixelWidth * 0.5} y1={0} x2={pixelWidth * 0.5} y2={pixelHeight} 
                  stroke="#6ee7b7" strokeWidth="2" strokeDasharray="10,5" opacity="0.6" />
            <line x1={0} y1={pixelHeight * 0.5} x2={pixelWidth} y2={pixelHeight * 0.5} 
                  stroke="#6ee7b7" strokeWidth="2" strokeDasharray="10,5" opacity="0.6" />
          </>
        )}
        
        {/* Border */}
        <rect
          x="0"
          y="0"
          width={pixelWidth}
          height={pixelHeight}
          fill="none"
          stroke="#60a5fa"
          strokeWidth="2"
        />
        
        {/* Render children (entities, etc.) */}
        {children}
      </svg>
    </div>
  );
}
