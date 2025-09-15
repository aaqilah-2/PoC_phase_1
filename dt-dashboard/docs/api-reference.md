# API Reference

This document provides detailed API reference for the UWB Digital Twin Dashboard components and data models.

## Data Models

### Entity

```typescript
export type EntityType = 'FORKLIFT' | 'PALLET' | 'WORKER' | 'AGV';

export interface Entity {
  id: string;
  type: EntityType;
  label?: string;
  operatorId?: string;
  battery?: number;     // 0-100
  currentTaskId?: string;
  lastSeen?: number;    // timestamp
}
```

### Pose

```typescript
export interface Pose {
  entityId: string;
  t: number;      // timestamp
  x: number;      // meters
  y: number;      // meters
  heading?: number; // degrees
  speed?: number;   // m/s
  zone?: string;    // zone ID
  confidence?: number; // 0-1
}
```

### Task

```typescript
export type TaskType = 'PICK' | 'PLACE' | 'TRANSFER' | 'REPLENISH' | 'RETURN' | 'CHARGE';
export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELED';

export interface Task {
  id: string;
  type: TaskType;
  priority: TaskPriority;
  sourceLocation: { x: number, y: number, zone?: string };
  targetLocation: { x: number, y: number, zone?: string };
  assignedEntityId?: string;
  status: TaskStatus;
  createdAt: number;      // timestamp
  assignedAt?: number;    // timestamp
  startedAt?: number;     // timestamp
  completedAt?: number;   // timestamp
  expiresAt?: number;     // timestamp
  route?: { x: number, y: number }[]; // waypoints
}
```

### Alert

```typescript
export type AlertKind = 'CONGESTION' | 'BLOCKED_AISLE' | 'SPEEDING' | 'NEAR_COLLISION' | 'ZONE_BREACH' | 'DWELL_EXCEEDED';

export interface Alert {
  id: string;
  t: number;        // timestamp
  kind: AlertKind;
  x: number;        // meters
  y: number;        // meters
  meta?: Record<string, unknown>;
  acknowledged?: boolean;
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: number; // timestamp
}
```

## Component Props

### WarehouseMap

```typescript
interface WarehouseMapProps {
  width: number;         // width in meters
  height: number;        // height in meters
  cellSize: number;      // pixels per meter
  entities: Pose[];      // entity positions
  tasks: Task[];         // tasks
  alerts: Alert[];       // active alerts
  selectedTaskId?: string | null;
  showHeatmap?: boolean;
  showRoutes?: boolean;
  showZones?: boolean;
  viewMode: ViewMode;
  onSelectEntity?: (entityId: string | null) => void;
  onSelectTask?: (taskId: string | null) => void;
  onAlertClick?: (alertId: string) => void;
}
```

### TaskDashboard

```typescript
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
```

### AlertsPanel

```typescript
interface AlertsPanelProps {
  alerts: Alert[];
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  onFilter?: (filter: AlertFilter) => void;
}

interface AlertFilter {
  types: AlertKind[];
  zones: string[];
  assets: string[];
  onlyUnacknowledged: boolean;
  onlyUnresolved: boolean;
}
```

### KPIDashboard

```typescript
interface KPIProps {
  metrics: KPIMetrics;
  showDetailed?: boolean;
}

interface KPITileProps {
  title: string;
  value: string | number;
  trend?: number;
  good?: 'up' | 'down';
  info?: string;
  size?: 'sm' | 'md' | 'lg';
}
```

### TimelineScrubber

```typescript
interface TimelineScrubberProps {
  events: Event[] | TimelineEvent[];
  width: number;
  height?: number;
  startTime: number;
  endTime: number;
  currentTime: number;
  onTimeChange?: (time: number) => void;
  onEventClick?: (eventId: string) => void;
  playing?: boolean;
  playbackSpeed?: number;
}
```

## Mock Data API

### MockStream

```typescript
class MockStream {
  constructor(width: number, height: number);
  
  // Start generating mock data
  start(): void;
  
  // Stop generating mock data
  stop(): void;
  
  // Register a callback for pose updates
  onPoses(callback: (poses: Pose[]) => void): void;
  
  // Register a callback for alerts
  onAlert(callback: (alert: Alert) => void): void;
  
  // Set the update frequency
  setUpdateFrequency(ms: number): void;
}
```

### Mock Data Generators

```typescript
// Generate mock entities
generateMockEntities(): Entity[];

// Generate mock poses
generateMockPoses(): Pose[];

// Generate mock tasks
generateMockTasks(): Task[];

// Generate mock alerts
generateMockAlerts(): Alert[];

// Generate mock KPI metrics
generateMockKPIMetrics(): KPIMetrics;

// Generate mock timeline events
generateMockTimelineEvents(): TimelineEvent[];
```
