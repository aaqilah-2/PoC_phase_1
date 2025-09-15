import { useState } from 'react';
import type { Task, EntityType } from '../../data/entities';

interface TaskAssignmentProps {
  tasks: Task[];
  entities: { id: string; type: EntityType; currentTaskId?: string }[];
  onCreateTask?: (task: Partial<Task>) => void;
  onAssignTask?: (taskId: string, entityId: string) => void;
}

export function TaskAssignment({ 
  tasks, 
  entities,
  onCreateTask,
  onAssignTask
}: TaskAssignmentProps) {
  const [showAssignmentPanel, setShowAssignmentPanel] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  
  // Get unassigned tasks
  const unassignedTasks = tasks.filter(task => 
    !task.assignedEntityId && 
    task.status === 'PENDING'
  );
  
  // Get available entities (forklifts that don't have a current task)
  const availableEntities = entities.filter(entity => 
    entity.type === 'FORKLIFT' && 
    !entity.currentTaskId
  );
  
  // Handle task assignment
  const handleAssign = () => {
    if (selectedTaskId && selectedEntityId && onAssignTask) {
      onAssignTask(selectedTaskId, selectedEntityId);
      setShowAssignmentPanel(false);
      setSelectedTaskId(null);
      setSelectedEntityId(null);
    }
  };
  
  const handleCreateTask = () => {
    if (onCreateTask) {
      // In a real app, this would open a modal with a form
      // For now, we'll just create a sample task
      onCreateTask({
        type: 'PICK',
        priority: 'NORMAL',
        sourceLocation: { x: 5, y: 10 },
        targetLocation: { x: 15, y: 20 },
        status: 'PENDING',
        createdAt: Date.now()
      });
    }
  };
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-blue-300 uppercase tracking-wider">
          Task Assignment
        </h3>
        
        <div className="flex gap-2">
          <button
            onClick={handleCreateTask}
            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-sm rounded-md"
          >
            Create Task
          </button>
          
          <button
            onClick={() => setShowAssignmentPanel(!showAssignmentPanel)}
            className="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white text-sm rounded-md flex items-center gap-1"
          >
            <span>Assign Task</span>
            <span className="text-xs">{showAssignmentPanel ? '▲' : '▼'}</span>
          </button>
        </div>
      </div>
      
      {showAssignmentPanel && (
        <div className="mb-4 bg-gray-700 rounded-md p-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Select Task</h4>
              {unassignedTasks.length === 0 ? (
                <div className="text-xs text-gray-400 italic">No unassigned tasks</div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {unassignedTasks.map(task => (
                    <div
                      key={task.id}
                      className={`p-2 rounded text-xs cursor-pointer ${
                        selectedTaskId === task.id
                          ? 'bg-blue-900 text-blue-200'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-600'
                      }`}
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <div className="flex justify-between">
                        <span>{task.type} {task.id.split('-')[1]}</span>
                        <span className={`px-1.5 rounded ${
                          task.priority === 'URGENT' ? 'bg-red-900 text-red-200' :
                          task.priority === 'HIGH' ? 'bg-amber-900 text-amber-200' :
                          'bg-gray-700 text-gray-300'
                        }`}>{task.priority}</span>
                      </div>
                      <div className="text-gray-400 mt-1">
                        From: {task.sourceLocation.zone?.replace('zone-', '') || 'Unknown'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Select Forklift</h4>
              {availableEntities.length === 0 ? (
                <div className="text-xs text-gray-400 italic">No available forklifts</div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {availableEntities.map(entity => (
                    <div
                      key={entity.id}
                      className={`p-2 rounded text-xs cursor-pointer ${
                        selectedEntityId === entity.id
                          ? 'bg-blue-900 text-blue-200'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-600'
                      }`}
                      onClick={() => setSelectedEntityId(entity.id)}
                    >
                      <div>{entity.id}</div>
                      <div className="text-gray-400 mt-1">
                        Status: Available
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <button
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-xs text-gray-300 rounded mr-2"
              onClick={() => {
                setShowAssignmentPanel(false);
                setSelectedTaskId(null);
                setSelectedEntityId(null);
              }}
            >
              Cancel
            </button>
            
            <button
              className={`px-3 py-1 text-xs text-white rounded ${
                selectedTaskId && selectedEntityId
                  ? 'bg-blue-700 hover:bg-blue-600'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!selectedTaskId || !selectedEntityId}
              onClick={handleAssign}
            >
              Assign
            </button>
          </div>
        </div>
      )}
      
      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-gray-700 rounded p-2">
          <div className="text-xs text-gray-400">Unassigned</div>
          <div className="text-lg font-semibold text-blue-300">
            {tasks.filter(t => !t.assignedEntityId && t.status === 'PENDING').length}
          </div>
        </div>
        
        <div className="bg-gray-700 rounded p-2">
          <div className="text-xs text-gray-400">In Progress</div>
          <div className="text-lg font-semibold text-emerald-300">
            {tasks.filter(t => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS').length}
          </div>
        </div>
        
        <div className="bg-gray-700 rounded p-2">
          <div className="text-xs text-gray-400">Completed Today</div>
          <div className="text-lg font-semibold text-purple-300">
            {tasks.filter(t => {
              if (t.status !== 'COMPLETED') return false;
              // Check if task was completed today
              if (!t.completedAt) return false;
              const today = new Date();
              const completedDate = new Date(t.completedAt);
              return (
                completedDate.getDate() === today.getDate() &&
                completedDate.getMonth() === today.getMonth() &&
                completedDate.getFullYear() === today.getFullYear()
              );
            }).length}
          </div>
        </div>
      </div>
      
      {/* Auto-Assignment Settings */}
      <div className="mt-4 border-t border-gray-700 pt-3">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Auto-Assignment Settings</h4>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="auto-assign" 
              className="mr-2 bg-gray-700 border-gray-600 rounded text-blue-500 focus:ring-blue-500"
            />
            <label htmlFor="auto-assign" className="text-gray-300">Enable Auto-Assignment</label>
          </div>
          
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="optimize-routes" 
              className="mr-2 bg-gray-700 border-gray-600 rounded text-blue-500 focus:ring-blue-500"
            />
            <label htmlFor="optimize-routes" className="text-gray-300">Optimize Routes</label>
          </div>
          
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="prioritize-perishable" 
              className="mr-2 bg-gray-700 border-gray-600 rounded text-blue-500 focus:ring-blue-500"
            />
            <label htmlFor="prioritize-perishable" className="text-gray-300">Prioritize Perishable Goods</label>
          </div>
          
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="load-balance" 
              className="mr-2 bg-gray-700 border-gray-600 rounded text-blue-500 focus:ring-blue-500"
            />
            <label htmlFor="load-balance" className="text-gray-300">Enable Load Balancing</label>
          </div>
        </div>
        
        <div className="flex justify-end mt-3">
          <button
            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-xs text-white rounded"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
}
