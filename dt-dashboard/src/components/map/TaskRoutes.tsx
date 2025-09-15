import { useMemo } from 'react';
import type { Task } from '../../data/entities';

interface TaskRoutesProps {
  tasks: Task[];
  selectedTaskId?: string | null;
  cellSize: number;
}

export function TaskRoutes({ 
  tasks, 
  selectedTaskId,
  cellSize 
}: TaskRoutesProps) {
  // Filter to tasks that have routes defined and are not completed/failed
  const activeTasks = useMemo(() => {
    return tasks.filter(task => {
      return (
        task.route && 
        task.route.length > 0 && 
        !['COMPLETED', 'FAILED'].includes(task.status)
      );
    });
  }, [tasks]);

  // Get active task by ID for highlighted route
  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find(task => task.id === selectedTaskId);
  }, [tasks, selectedTaskId]);
  
  // Calculate route paths for visualization
  const getPathFromRoute = (route: Array<{ x: number, y: number }>): string => {
    if (!route || route.length < 2) return '';
    
    // Create SVG path from route points
    const pathCommands = route.map((point, index) => {
      const x = point.x * cellSize + cellSize / 2;
      const y = point.y * cellSize + cellSize / 2;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    });
    
    return pathCommands.join(' ');
  };

  // Get color for task route based on task type and priority
  const getRouteColor = (task: Task): string => {
    // Priority colors
    if (task.priority === 'URGENT') return '#ef4444'; // red
    if (task.priority === 'HIGH') return '#f59e0b'; // amber
    
    // Task type colors
    switch (task.type) {
      case 'PICK': return '#3b82f6'; // blue
      case 'REPLENISH': return '#10b981'; // green
      case 'TRANSFER': return '#8b5cf6'; // purple
      case 'IDLE': return '#6366f1'; // indigo
      default: return '#64748b'; // slate
    }
  };
  
  // Calculate markers for start and end points
  const RouteEndpoints = ({ task }: { task: Task }) => {
    if (!task.route || task.route.length < 2) return null;
    
    const startPoint = task.route[0];
    const endPoint = task.route[task.route.length - 1];
    const color = getRouteColor(task);
    
    return (
      <>
        {/* Start marker (hollow circle) */}
        <circle
          cx={startPoint.x * cellSize + cellSize / 2}
          cy={startPoint.y * cellSize + cellSize / 2}
          r={cellSize / 4}
          stroke={color}
          strokeWidth={2}
          fill="none"
        />
        
        {/* End marker (filled triangle) */}
        <polygon
          points={`
            ${endPoint.x * cellSize + cellSize / 2},${endPoint.y * cellSize + cellSize / 4}
            ${endPoint.x * cellSize + cellSize / 4},${endPoint.y * cellSize + 3 * cellSize / 4}
            ${endPoint.x * cellSize + 3 * cellSize / 4},${endPoint.y * cellSize + 3 * cellSize / 4}
          `}
          fill={color}
        />
      </>
    );
  };
  
  return (
    <g className="task-routes">
      {/* Background routes for all active tasks */}
      {activeTasks.map(task => {
        if (!task.route) return null;
        const path = getPathFromRoute(task.route);
        const color = getRouteColor(task);
        
        return (
          <g key={task.id} className={`route ${task.id === selectedTaskId ? 'selected-route' : ''}`}>
            <path
              d={path}
              stroke={color}
              strokeWidth={cellSize / 10}
              strokeOpacity={task.id === selectedTaskId ? 0.7 : 0.3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={task.status === 'IN_PROGRESS' ? '' : '5,5'}
            />
            
            <RouteEndpoints task={task} />
          </g>
        );
      })}
      
      {/* Highlight selected task route */}
      {selectedTask && selectedTask.route && (
        <g className="selected-route-highlight">
          <path
            d={getPathFromRoute(selectedTask.route)}
            stroke={getRouteColor(selectedTask)}
            strokeWidth={cellSize / 8}
            strokeOpacity={0.9}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Add direction arrows for selected route */}
          {selectedTask.route.map((point, index) => {
            // Skip the last point and show arrows every other segment
            if (index === 0 || index === selectedTask.route!.length - 1 || index % 3 !== 0) {
              return null;
            }
            
            // Get direction to next point
            const nextPoint = selectedTask.route![index + 1];
            
            // Calculate angle for the arrow
            let angle = 0;
            if (nextPoint.x > point.x) angle = 0;
            else if (nextPoint.x < point.x) angle = 180;
            else if (nextPoint.y > point.y) angle = 90;
            else if (nextPoint.y < point.y) angle = 270;
            
            return (
              <polygon
                key={`arrow-${index}`}
                points="0,-3 0,3 6,0"
                fill={getRouteColor(selectedTask)}
                transform={`translate(${point.x * cellSize + cellSize / 2}, ${point.y * cellSize + cellSize / 2}) rotate(${angle})`}
              />
            );
          })}
        </g>
      )}
    </g>
  );
}
