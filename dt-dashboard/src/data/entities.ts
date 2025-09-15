// Entity Types
export type EntityType = "FORKLIFT" | "PALLET" | "WORKER";
export type ZoneType = "STORAGE" | "COLD_STORAGE" | "LOADING" | "UNLOADING" | "AISLE" | "RESTRICTED";
export type TaskType = "PICK" | "REPLENISH" | "TRANSFER" | "IDLE";
export type TaskPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type TaskStatus = "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
export type AlertKind = "CONGESTION" | "BLOCKED_AISLE" | "SPEEDING" | "NEAR_COLLISION" | "ZONE_BREACH" | "DWELL_EXCEEDED";
export type EventType = "CONGESTION" | "BLOCKED" | "NEAR_COLLISION" | "DWELL_EXCEEDED" | "ZONE_BREACH" | "REROUTE";
export type HeatmapType = "DENSITY" | "CONGESTION" | "DWELL";
export type ViewMode = "SUPERVISOR" | "OPERATOR";
export type DataMode = "MOCK" | "SENSOR";

// Base Entities
export interface Entity {
  id: string;
  type: EntityType;
  label?: string;
  operatorId?: string;
  battery?: number; // percentage 0-100
  currentTaskId?: string;
  lastSeen?: number; // timestamp
}

// Position Information (UWB Pose)
export interface Pose {
  entityId: string;
  t: number;
  x: number;
  y: number;
  heading?: number;
  speed?: number;
  zone?: string;
  confidence?: number; // For UWB accuracy tracking (0-1)
}

// Position Tick (as per requirements schema)
export interface PositionTick {
  id: string;
  type: "FORKLIFT" | "PALLET" | "WORKER";
  x: number;
  y: number;
  t: number;
  speed: number;
  heading: number;
  zoneId?: string;
  confidence?: number;
}

// Alerts & Events
export interface Alert {
  id: string;
  t: number;
  kind: AlertKind;
  x: number;
  y: number;
  meta?: Record<string, unknown>;
  acknowledged?: boolean;
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: number;
}

// Event (as per requirements schema)
export interface Event {
  id: string;
  t: number;
  type: EventType;
  assetIds?: string[];
  zoneId?: string;
  x: number;
  y: number;
  payload?: Record<string, unknown>;
  acknowledged?: boolean;
}

// Tasks
export interface Task {
  id: string;
  type: TaskType;
  priority: TaskPriority;
  sourceLocation: { x: number, y: number, zone?: string };
  targetLocation: { x: number, y: number, zone?: string };
  assignedEntityId?: string;
  status: TaskStatus;
  createdAt: number;
  expiresAt?: number; // For perishable items
  completedAt?: number;
  sla?: number; // Service Level Agreement in minutes
  route?: { x: number, y: number }[]; // Waypoints for routing
  reasonCodes?: string[]; // For routing/rerouting explanations
}

// Warehouse Layout
export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  bounds: { x: number, y: number, width: number, height: number }[];
  restricted?: boolean;
  temperature?: number; // For cold storage
}

export interface Aisle {
  id: string;
  points: { x: number, y: number }[];
  direction?: 'oneway' | 'twoway';
  width: number;
  congested?: boolean;
  blocked?: boolean;
}

export interface Rack {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  name?: string;
}

export interface Dock {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'INBOUND' | 'OUTBOUND';
  name: string;
}

export interface Polygon {
  id: string;
  points: { x: number, y: number }[];
  type: 'NO_GO' | 'RESTRICTED' | 'OTHER';
}

export interface Layout {
  zones: Zone[];
  aisles: Aisle[];
  racks: Rack[];
  docks: Dock[];
  noGo: Polygon[];
}

// KPI & Analytics
export interface KPIMetrics {
  routeCompletionTime: number; // average seconds per task
  travelDistance: number; // total meters
  congestionEvents: number;
  dwellTime: { [zone: string]: number }; // average seconds by zone
  systemLatency: number; // milliseconds
  reroutingEffectiveness: number; // percentage of successful reroutes
  complianceIncidents: number; // zone breaches, etc.
  operatorSatisfaction?: number; // 0-100 scale
  throughput: number; // units/hour
  efficiency: number; // 0-100 scale
}

// Heatmap data
export interface HeatmapCell {
  x: number;
  y: number;
  value: number;
  count: number;
  details?: {
    entities: string[];
    avgSpeed: number;
    dwellTime: number;
    lastSeen: number;
  };
}

export interface HeatmapData {
  type: HeatmapType;
  timeWindow: 5 | 10 | 30; // minutes
  cells: HeatmapCell[];
  max: number;
  min: number;
}

// Timeline data
export interface TimelineEvent {
  id: string;
  t: number;
  type: EventType;
  label: string;
  x?: number;
  y?: number;
  details?: string;
}
