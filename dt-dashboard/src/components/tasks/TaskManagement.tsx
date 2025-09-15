import { useState } from 'react';
import type { Task, TaskPriority, TaskStatus, TaskType, ViewMode } from '../../data/entities';

interface TaskManagementProps {
  tasks: Task[];
  onSelectTask?: (taskId: string | null) => void;
  onAssignTask?: (taskId: string, entityId: string) => void;
  onUpdateStatus?: (taskId: string, status: TaskStatus) => void;
  selectedTaskId?: string | null;
  availableEntities?: { id: string, type: string }[];
  viewMode?: ViewMode;
  operatorEntityId?: string;
}

interface TaskFilter {
  types: TaskType[];
  priorities: TaskPriority[];
  statuses: TaskStatus[];
  assignedEntityId?: string;
}

export function TaskManagement({
  tasks,
  onSelectTask,
  onAssignTask,
  onUpdateStatus,
  selectedTaskId = null,
  availableEntities = [],
  viewMode = 'SUPERVISOR',
  operatorEntityId
}: TaskManagementProps) {
  const [filter, setFilter] = useState<TaskFilter>({
    types: [],
    priorities: [],
    statuses: [],
    assignedEntityId: (viewMode as ViewMode) === "OPERATOR" ? operatorEntityId : undefined
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [assignMenuTaskId, setAssignMenuTaskId] = useState<string | null>(null);
  
  // Format timestamp to readable time
  const formatTime = (timestamp: number | undefined): string => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString();
  };
  
  // Get unique task types
  const uniqueTypes = Array.from(new Set(
    tasks.map(task => task.type)
  )) as TaskType[];
  
  // Get unique task priorities
  const uniquePriorities = Array.from(new Set(
    tasks.map(task => task.priority)
  )) as TaskPriority[];
  
  // Get unique task statuses
  const uniqueStatuses = Array.from(new Set(
    tasks.map(task => task.status)
  )) as TaskStatus[];
  
  // Get color for task status
  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-900 text-yellow-300';
      case 'ASSIGNED': return 'bg-blue-900 text-blue-300';
      case 'IN_PROGRESS': return 'bg-emerald-900 text-emerald-300';
      case 'COMPLETED': return 'bg-gray-800 text-gray-400';
      case 'FAILED': return 'bg-red-900 text-red-300';
      default: return 'bg-gray-800 text-gray-400';
    }
  };
  
  // Get color for task priority
  const getPriorityColor = (priority: TaskPriority): string => {
    switch (priority) {
      case 'URGENT': return 'bg-red-900 text-red-300';
      case 'HIGH': return 'bg-amber-900 text-amber-300';
      case 'NORMAL': return 'bg-blue-900 text-blue-300';
      case 'LOW': return 'bg-gray-800 text-gray-400';
      default: return 'bg-gray-800 text-gray-400';
    }
  };
  
  // Get ETA string for a task
  const getTaskEta = (task: Task): string => {
    if (task.status === 'COMPLETED') return 'Completed';
    if (task.status === 'FAILED') return 'Failed';
    
    // In a real app, this would be calculated based on distance and current speed
    const etaMinutes = Math.floor(Math.random() * 15) + 1;
    return `~${etaMinutes} min`;
  };
  
  // Apply filters to tasks
  const filteredTasks = tasks.filter(task => {
    // Filter by type
    if (filter.types.length > 0 && !filter.types.includes(task.type)) {
      return false;
    }
    
    // Filter by priority
    if (filter.priorities.length > 0 && !filter.priorities.includes(task.priority)) {
      return false;
    }
    
    // Filter by status
    if (filter.statuses.length > 0 && !filter.statuses.includes(task.status)) {
      return false;
    }
    
    // Filter by assigned entity
    if (filter.assignedEntityId && task.assignedEntityId !== filter.assignedEntityId) {
      return false;
    }
    
    return true;
  });
  
  // Handle filter change
  const handleFilterChange = (newFilter: Partial<TaskFilter>) => {
    const updatedFilter = { ...filter, ...newFilter };
    setFilter(updatedFilter);
  };
  
  // Toggle filter for a specific value
  const toggleFilter = (key: keyof TaskFilter, value: any) => {
    if (key === 'assignedEntityId') {
      handleFilterChange({ assignedEntityId: value });
      return;
    }
    
    const currentValues = filter[key] as any[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
      
    handleFilterChange({ [key]: newValues });
  };
  
  // Handle task selection
  const handleTaskSelect = (taskId: string) => {
    if (onSelectTask) {
      onSelectTask(taskId === selectedTaskId ? null : taskId);
    }
  };
  
  // Handle task assignment
  const handleAssignTask = (taskId: string, entityId: string) => {
    if (onAssignTask) {
      onAssignTask(taskId, entityId);
    }
    setAssignMenuTaskId(null);
  };
  
  // Handle task status update
  const handleUpdateStatus = (taskId: string, status: TaskStatus) => {
    if (onUpdateStatus) {
      onUpdateStatus(taskId, status);
    }
  };
  
  const renderNextStepInfo = (task: Task) => {
    if (task.status === 'COMPLETED') return 'Task completed';
    if (task.status === 'FAILED') return 'Task failed';
    
    // In a real application, this would be more sophisticated
    // based on actual task progress and route information
    switch (task.status) {
      case 'PENDING':
        return 'Waiting for assignment';
      case 'ASSIGNED':
        return 'Proceed to pickup location';
      case 'IN_PROGRESS':
        return 'Transport to destination';
      default:
        return 'Unknown';
    }
  };
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-blue-300 uppercase tracking-wider">
          {(viewMode as ViewMode) === "SUPERVISOR" ? 'Task Management' : 'My Tasks'}
        </h3>
        
        {(viewMode as ViewMode) === "SUPERVISOR" && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-md flex items-center gap-1"
          >
            <span>Filter</span>
            <span className="text-xs">{showFilters ? '▲' : '▼'}</span>
          </button>
        )}
      </div>
      
      {/* Filter panel - only in supervisor view */}
      {showFilters && (viewMode as ViewMode) === "SUPERVISOR" && (
        <div className="mb-4 bg-gray-700 rounded-md p-3 text-sm">
          <h4 className="font-medium text-gray-300 mb-2">Filter Tasks</h4>
          
          {/* Task types filter */}
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">Task Types</div>
            <div className="flex flex-wrap gap-2">
              {uniqueTypes.map(type => (
                <button
                  key={type}
                  className={`px-2 py-1 rounded-md text-xs ${
                    filter.types.includes(type) 
                      ? 'bg-blue-700 text-blue-100' 
                      : 'bg-gray-600 text-gray-300'
                  }`}
                  onClick={() => toggleFilter('types', type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          
          {/* Priority filter */}
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">Priority</div>
            <div className="flex flex-wrap gap-2">
              {uniquePriorities.map(priority => (
                <button
                  key={priority}
                  className={`px-2 py-1 rounded-md text-xs ${
                    filter.priorities.includes(priority) 
                      ? 'bg-amber-700 text-amber-100' 
                      : 'bg-gray-600 text-gray-300'
                  }`}
                  onClick={() => toggleFilter('priorities', priority)}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>
          
          {/* Status filter */}
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">Status</div>
            <div className="flex flex-wrap gap-2">
              {uniqueStatuses.map(status => (
                <button
                  key={status}
                  className={`px-2 py-1 rounded-md text-xs ${
                    filter.statuses.includes(status) 
                      ? 'bg-emerald-700 text-emerald-100' 
                      : 'bg-gray-600 text-gray-300'
                  }`}
                  onClick={() => toggleFilter('statuses', status)}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          
          {/* Entity filter */}
          {availableEntities.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-gray-400 mb-1">Assigned Entity</div>
              <div className="flex flex-wrap gap-2">
                <button
                  className={`px-2 py-1 rounded-md text-xs ${
                    filter.assignedEntityId === undefined
                      ? 'bg-blue-700 text-blue-100' 
                      : 'bg-gray-600 text-gray-300'
                  }`}
                  onClick={() => toggleFilter('assignedEntityId', undefined)}
                >
                  All
                </button>
                
                <button
                  className={`px-2 py-1 rounded-md text-xs ${
                    filter.assignedEntityId === null
                      ? 'bg-blue-700 text-blue-100' 
                      : 'bg-gray-600 text-gray-300'
                  }`}
                  onClick={() => toggleFilter('assignedEntityId', null)}
                >
                  Unassigned
                </button>
                
                {availableEntities.map(entity => (
                  <button
                    key={entity.id}
                    className={`px-2 py-1 rounded-md text-xs ${
                      filter.assignedEntityId === entity.id
                        ? 'bg-blue-700 text-blue-100' 
                        : 'bg-gray-600 text-gray-300'
                    }`}
                    onClick={() => toggleFilter('assignedEntityId', entity.id)}
                  >
                    {entity.id}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Clear filters */}
          <div className="flex justify-end mt-3">
            <button
              className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-xs text-gray-300 rounded"
              onClick={() => handleFilterChange({
                types: [],
                priorities: [],
                statuses: [],
                assignedEntityId: (viewMode as ViewMode) === "OPERATOR" && operatorEntityId ? operatorEntityId : undefined
              })}
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
      
      {/* Tasks list */}
      {filteredTasks.length === 0 ? (
        <div className="text-gray-500 text-sm italic p-4 text-center">
          No tasks matching the current filters
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`border border-gray-700 ${
                task.id === selectedTaskId ? 'bg-gray-700' : 'bg-gray-800'
              } rounded-md p-3 cursor-pointer`}
              onClick={() => handleTaskSelect(task.id)}
            >
              {/* Task header */}
              <div className="flex justify-between items-center mb-1">
                <div className="font-medium text-gray-200">
                  {task.type} {task.id.split('-')[1]}
                </div>
                <div className={`text-xs px-2 py-0.5 rounded ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ')}
                </div>
              </div>
              
              {/* Task details */}
              <div className="flex justify-between items-center text-xs">
                <div className="text-gray-400">
                  From: {task.sourceLocation.zone?.replace('zone-', '') || '?'}
                </div>
                <div className="text-gray-400">
                  To: {task.targetLocation.zone?.replace('zone-', '') || '?'}
                </div>
                <div className={`px-2 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </div>
              </div>
              
              {/* Assignment info */}
              {task.assignedEntityId ? (
                <div className="text-xs text-blue-300 mt-1">
                  Assigned to: {task.assignedEntityId}
                </div>
              ) : (
                <div className="text-xs text-gray-500 italic mt-1">
                  Not assigned
                </div>
              )}
              
              {/* Expiry time */}
              {task.expiresAt && (
                <div className="text-xs text-red-400 mt-1">
                  Expires: {formatTime(task.expiresAt)}
                </div>
              )}
              
              {/* Operator view specific details */}
              {(viewMode as ViewMode) === "OPERATOR" && task.assignedEntityId === operatorEntityId && (
                <div className="mt-3 pt-2 border-t border-gray-700">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">ETA:</span>
                    <span className="text-blue-300">{getTaskEta(task)}</span>
                  </div>
                  
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Next:</span>
                    <span className="text-emerald-300">{renderNextStepInfo(task)}</span>
                  </div>
                  
                  {task.reasonCodes && task.reasonCodes.length > 0 && (
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-gray-400">Info:</span>
                      <span className="text-amber-300">
                        {task.reasonCodes.join(', ')}
                      </span>
                    </div>
                  )}
                  
                  {/* Operator actions */}
                  {task.status !== 'COMPLETED' && task.status !== 'FAILED' && (
                    <div className="flex justify-between gap-2 mt-3">
                      {task.status === 'ASSIGNED' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(task.id, 'IN_PROGRESS');
                          }}
                          className="flex-1 px-2 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-sm text-white rounded"
                        >
                          Start Task
                        </button>
                      )}
                      
                      {task.status === 'IN_PROGRESS' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(task.id, 'COMPLETED');
                          }}
                          className="flex-1 px-2 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-sm text-white rounded"
                        >
                          Complete Task
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // This would open a modal or dialog for reporting a blockage
                          alert('Report blockage dialog would open here');
                        }}
                        className="flex-1 px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-sm text-gray-300 rounded"
                      >
                        Report Blockage
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // This would open a manual override dialog
                          alert('Manual override dialog would open here');
                        }}
                        className="flex-1 px-2 py-1.5 bg-amber-700 hover:bg-amber-600 text-sm text-white rounded"
                      >
                        Override
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Supervisor actions */}
              {(viewMode as ViewMode) === "SUPERVISOR" && (
                <div className="flex justify-end gap-2 mt-2">
                  {!task.assignedEntityId && availableEntities.length > 0 && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAssignMenuTaskId(assignMenuTaskId === task.id ? null : task.id);
                        }}
                        className="px-2 py-1 bg-blue-700 hover:bg-blue-600 text-xs text-blue-100 rounded"
                      >
                        Assign
                      </button>
                      
                      {assignMenuTaskId === task.id && (
                        <div className="absolute right-0 bottom-full mb-1 bg-gray-900 border border-gray-700 rounded shadow-lg z-10">
                          <div className="p-2">
                            <div className="text-xs text-gray-400 mb-1">Assign to:</div>
                            <div className="space-y-1">
                              {availableEntities
                                .filter(entity => entity.type === 'FORKLIFT')
                                .map(entity => (
                                  <button
                                    key={entity.id}
                                    className="w-full px-2 py-1 text-left bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 rounded"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAssignTask(task.id, entity.id);
                                    }}
                                  >
                                    {entity.id}
                                  </button>
                                ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {task.status !== 'COMPLETED' && task.status !== 'FAILED' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(task.id, 'FAILED');
                      }}
                      className="px-2 py-1 bg-red-700 hover:bg-red-600 text-xs text-red-100 rounded"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Summary stats */}
      <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400 flex justify-between">
        <div>Total: {tasks.length}</div>
        <div>Active: {tasks.filter(t => !['COMPLETED', 'FAILED'].includes(t.status)).length}</div>
        <div>Completed: {tasks.filter(t => t.status === 'COMPLETED').length}</div>
      </div>
    </div>
  );
}
