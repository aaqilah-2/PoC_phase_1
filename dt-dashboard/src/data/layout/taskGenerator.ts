import type { Task, TaskType, TaskPriority } from '../entities';
import { warehouseZones } from './warehouseLayout';

// Generate random pick/replenish tasks for the warehouse
export function generateMockTasks(count: number = 5): Task[] {
  const taskTypes: TaskType[] = ['PICK', 'REPLENISH', 'TRANSFER', 'IDLE'];
  const priorities: TaskPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
  const now = Date.now();
  
  const tasks: Task[] = [];
  
  for (let i = 0; i < count; i++) {
    // Select random zones for source and target
    const sourceZoneIndex = Math.floor(Math.random() * warehouseZones.length);
    let targetZoneIndex = Math.floor(Math.random() * warehouseZones.length);
    
    // Make sure source and target zones are different
    while (targetZoneIndex === sourceZoneIndex) {
      targetZoneIndex = Math.floor(Math.random() * warehouseZones.length);
    }
    
    const sourceZone = warehouseZones[sourceZoneIndex];
    const targetZone = warehouseZones[targetZoneIndex];
    
    // Get random position within each zone
    const sourceX = sourceZone.bounds[0].x + Math.random() * sourceZone.bounds[0].width;
    const sourceY = sourceZone.bounds[0].y + Math.random() * sourceZone.bounds[0].height;
    const targetX = targetZone.bounds[0].x + Math.random() * targetZone.bounds[0].width;
    const targetY = targetZone.bounds[0].y + Math.random() * targetZone.bounds[0].height;
    
    // Select random task type and priority
    const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    
    // Create expiry time for some tasks (especially for cold storage)
    const hasExpiry = Math.random() > 0.7;
    const expiryTime = hasExpiry ? now + (10 + Math.random() * 50) * 60 * 1000 : undefined; // 10-60 minutes from now
    
    tasks.push({
      id: `task-${i + 1}`,
      type: taskType,
      priority: priority,
      sourceLocation: { 
        x: sourceX, 
        y: sourceY, 
        zone: sourceZone.id 
      },
      targetLocation: { 
        x: targetX, 
        y: targetY, 
        zone: targetZone.id 
      },
      status: 'PENDING',
      createdAt: now - Math.floor(Math.random() * 1000 * 60 * 30), // Created in the last 30 min
      expiresAt: expiryTime,
    });
  }
  
  // Set a few tasks as assigned or in progress
  if (tasks.length >= 3) {
    tasks[0].status = 'ASSIGNED';
    tasks[0].assignedEntityId = 'forklift-1';
    
    tasks[1].status = 'IN_PROGRESS';
    tasks[1].assignedEntityId = 'forklift-2';
  }
  
  return tasks;
}
