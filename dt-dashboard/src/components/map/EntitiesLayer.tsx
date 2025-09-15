// Entities layer component
import type { Pose, Task } from '../../data/entities';

interface EntitiesLayerProps {
  poses: Pose[];
  cellSize: number;
  onSelect?: (entityId: string | null) => void;
  selectedTask?: Task | null;
}

export function EntitiesLayer({
  poses,
  cellSize,
  onSelect,
  selectedTask
}: EntitiesLayerProps) {
  const handleClick = (entityId: string) => {
    if (onSelect) {
      onSelect(entityId);
    }
  };
  
  return (
    <g className="entities-layer">
      {poses.map(pose => {
        const isSelected = selectedTask?.assignedEntityId === pose.entityId;
        const isOnTask = !!selectedTask?.assignedEntityId && selectedTask.assignedEntityId === pose.entityId;
        
        const entityColor = pose.entityId.startsWith('forklift-')
          ? '#36BA7C' // Green for forklifts
          : pose.entityId.startsWith('worker-')
            ? '#3B82F6' // Blue for workers
            : '#F59E0B'; // Amber for pallets
        
        const rotation = pose.heading ? `rotate(${pose.heading} ${pose.x * cellSize} ${pose.y * cellSize})` : '';
        
        // Draw different shapes based on entity type
        if (pose.entityId.startsWith('forklift-')) {
          // Forklift icon
          return (
            <g 
              key={pose.entityId}
              transform={`translate(${pose.x * cellSize}, ${pose.y * cellSize}) ${rotation}`}
              onClick={() => handleClick(pose.entityId)}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              data-entity-id={pose.entityId}
            >
              <title>
                Forklift {pose.entityId.split('-')[1]}
                {pose.speed !== undefined && ` - Speed: ${pose.speed.toFixed(1)} m/s`}
                {pose.zone && ` - Zone: ${pose.zone}`}
                {pose.confidence !== undefined && ` - Confidence: ${(pose.confidence * 100).toFixed(0)}%`}
              </title>
              {/* Forklift body - Made smaller */}
              <rect 
                x={-cellSize * 0.3} 
                y={-cellSize * 0.4} 
                width={cellSize * 0.6} 
                height={cellSize * 0.8}
                rx={cellSize * 0.1}
                fill={entityColor}
                stroke={isSelected ? "#FFFFFF" : "#2D3748"}
                strokeWidth={isSelected ? 2 : 1}
                opacity={0.9}
              />
              
              {/* Forklift forks - Made smaller */}
              <rect 
                x={-cellSize * 0.25} 
                y={-cellSize * 0.6} 
                width={cellSize * 0.5} 
                height={cellSize * 0.2}
                fill={entityColor}
                stroke="#2D3748"
                strokeWidth={1}
                opacity={0.8}
              />
              
              {/* Wheels - Made smaller */}
              <circle 
                cx={-cellSize * 0.15} 
                cy={cellSize * 0.25} 
                r={cellSize * 0.12}
                fill="#2D3748"
                stroke="#1A202C"
                strokeWidth={1}
              />
              <circle 
                cx={cellSize * 0.15} 
                cy={cellSize * 0.25} 
                r={cellSize * 0.12}
                fill="#2D3748"
                stroke="#1A202C"
                strokeWidth={1}
              />
              
              {/* Entity ID label */}
              <text
                y={cellSize * 0}
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize={cellSize * 0.5}
                fontWeight="bold"
                pointerEvents="none"
              >
                {pose.entityId.split('-')[1]}
              </text>
              
              {/* Status indicator */}
              <circle 
                cx={cellSize * 0.5} 
                cy={-cellSize * 0.6} 
                r={cellSize * 0.2}
                fill={isOnTask ? "#F59E0B" : "#10B981"}
              />
              
              {/* Selected indicator - STATIC, no animation */}
              {isSelected && (
                <circle 
                  r={cellSize * 1.2}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  opacity="0.7"
                />
              )}
            </g>
          );
        } else if (pose.entityId.startsWith('worker-')) {
          // Worker icon
          return (
            <g 
              key={pose.entityId}
              transform={`translate(${pose.x * cellSize}, ${pose.y * cellSize}) ${rotation}`}
              onClick={() => handleClick(pose.entityId)}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <circle 
                r={cellSize * 0.4}
                fill={entityColor}
                stroke={isSelected ? "#FFFFFF" : "#2D3748"}
                strokeWidth={isSelected ? 2 : 1}
              />
              
              {/* Person shape */}
              <path 
                d={`M 0,${-cellSize * 0.15} 
                    L ${cellSize * 0.15},${cellSize * 0.2} 
                    L ${-cellSize * 0.15},${cellSize * 0.2} Z`}
                fill="#FFFFFF"
                stroke="none"
              />
              
              <text
                y={cellSize * 0.15}
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize={cellSize * 0.4}
                fontWeight="bold"
                pointerEvents="none"
              >
                {pose.entityId.split('-')[1]}
              </text>
              
              {/* Selected indicator - STATIC, no animation */}
              {isSelected && (
                <circle 
                  r={cellSize * 0.8}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  opacity="0.7"
                />
              )}
            </g>
          );
        } else {
          // Pallet icon (square)
          return (
            <g 
              key={pose.entityId}
              transform={`translate(${pose.x * cellSize}, ${pose.y * cellSize}) ${rotation}`}
              onClick={() => handleClick(pose.entityId)}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <rect 
                x={-cellSize * 0.4} 
                y={-cellSize * 0.4} 
                width={cellSize * 0.8} 
                height={cellSize * 0.8}
                fill={entityColor}
                stroke={isSelected ? "#FFFFFF" : "#2D3748"}
                strokeWidth={isSelected ? 2 : 1}
              />
              
              {/* Pallet lines */}
              <line 
                x1={-cellSize * 0.3} 
                y1={-cellSize * 0.2} 
                x2={cellSize * 0.3} 
                y2={-cellSize * 0.2} 
                stroke="#2D3748" 
                strokeWidth="1" 
              />
              <line 
                x1={-cellSize * 0.3} 
                y1={0} 
                x2={cellSize * 0.3} 
                y2={0} 
                stroke="#2D3748" 
                strokeWidth="1" 
              />
              <line 
                x1={-cellSize * 0.3} 
                y1={cellSize * 0.2} 
                x2={cellSize * 0.3} 
                y2={cellSize * 0.2} 
                stroke="#2D3748" 
                strokeWidth="1" 
              />
              
              <text
                y={cellSize * 0.1}
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize={cellSize * 0.3}
                fontWeight="bold"
                pointerEvents="none"
              >
                {pose.entityId.split('-')[1]}
              </text>
              
              {/* Selected indicator */}
              {isSelected && (
                <rect 
                  x={-cellSize * 0.6} 
                  y={-cellSize * 0.6} 
                  width={cellSize * 1.2} 
                  height={cellSize * 1.2}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  opacity="0.7"
                />
              )}
            </g>
          );
        }
      })}
    </g>
  );
}
