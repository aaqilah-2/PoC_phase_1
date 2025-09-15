import { useState } from 'react';
import { TaskAssignment } from './TaskAssignment';
import { TaskManagement } from './TaskManagement';
import type { Task, EntityType } from '../../data/entities';

interface TaskDashboardProps {
  tasks: Task[];
  entities: { id: string; type: EntityType; currentTaskId?: string }[];
  onCreateTask?: (task: Partial<Task>) => void;
  onAssignTask?: (taskId: string, entityId: string) => void;
  onUpdateTaskStatus?: (taskId: string, status: string) => void;
  onSelectTask?: (taskId: string | null) => void;
  selectedTaskId?: string | null;
  viewMode?: 'SUPERVISOR' | 'OPERATOR';
  operatorEntityId?: string;
}

export function TaskDashboard({
  tasks,
  entities,
  onCreateTask,
  onAssignTask,
  onUpdateTaskStatus,
  onSelectTask,
  selectedTaskId,
  viewMode = 'SUPERVISOR',
  operatorEntityId
}: TaskDashboardProps) {
  const [tab, setTab] = useState<'management' | 'assignment'>(
    viewMode === 'OPERATOR' ? 'management' : 'assignment'
  );
  
  return (
    <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-800">
      {/* Header with tabs - only show tabs in supervisor mode */}
      {viewMode === 'SUPERVISOR' && (
        <div className="border-b border-gray-800 flex">
          <button
            onClick={() => setTab('management')}
            className={`flex-1 py-2 text-sm font-medium ${
              tab === 'management'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Task Management
          </button>
          <button
            onClick={() => setTab('assignment')}
            className={`flex-1 py-2 text-sm font-medium ${
              tab === 'assignment'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Task Assignment
          </button>
        </div>
      )}
      
      {/* Content */}
      <div className="p-4">
        {/* Show TaskManagement in 'management' tab or if in operator mode */}
        {(tab === 'management' || viewMode === "OPERATOR") && (
          <TaskManagement
            tasks={tasks}
            onSelectTask={onSelectTask}
            onAssignTask={onAssignTask}
            onUpdateStatus={onUpdateTaskStatus}
            selectedTaskId={selectedTaskId}
            availableEntities={entities.map(e => ({ id: e.id, type: e.type }))}
            viewMode={viewMode}
            operatorEntityId={operatorEntityId}
          />
        )}
        
        {/* Show TaskAssignment in 'assignment' tab and only in supervisor mode */}
        {tab === 'assignment' && viewMode === 'SUPERVISOR' && (
          <TaskAssignment
            tasks={tasks}
            entities={entities}
            onCreateTask={onCreateTask}
            onAssignTask={onAssignTask}
          />
        )}
      </div>
    </div>
  );
}
