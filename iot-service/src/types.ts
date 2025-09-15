// Shared types between IoT Service and Dashboard
// DO NOT change field names without updating both sides

export interface PositionTick {
  id: string;                      // "forklift-1" | "pallet-3" | "worker-2"
  type: "forklift" | "pallet" | "worker";
  x: number;                       // meters (same units dashboard expects)
  y: number;                       // meters
  speed: number;                   // m/s
  heading: number;                 // radians
  zoneId?: string;                 // current zone/area
  confidence?: number;             // 0..1 (UWB accuracy)
  t: number;                       // epoch milliseconds
}

export interface DTEvent {
  id: string;                      // unique event ID
  t: number;                       // epoch milliseconds
  type: "congestion" | "blocked" | "nearCollision" | "dwellExceeded" | "zoneBreach" | "reroute";
  assetIds?: string[];             // entities involved
  zoneId?: string;                 // affected zone
  payload?: Record<string, any>;   // additional event data
}

// Lane network definition
export interface LanePoint {
  x: number;
  y: number;
}

export interface Lane {
  id: string;
  points: LanePoint[];
  width?: number;                  // lane width in meters (default 2.0)
}

export interface LaneNetwork {
  units: "px" | "meters";          // coordinate system
  lanes: Lane[];
}

// Entity state for simulation
export interface EntityState {
  id: string;
  type: "forklift" | "pallet" | "worker";
  x: number;                       // current position
  y: number;
  speed: number;                   // current speed m/s
  heading: number;                 // current heading radians
  targetSpeed: number;             // desired speed
  currentLaneId?: string;          // which lane we're on
  laneProgress: number;            // progress along current lane (0-1)
  nextLaneId?: string;             // next lane in route
  route: string[];                 // planned lane sequence
  routeIndex: number;              // current position in route
  lastEventTime: number;           // when we last emitted an event
  zoneId?: string;
  targetPosition?: LanePoint;      // target position for grid-based movement
}

// Configuration
export interface SimulatorConfig {
  wsPort: number;
  useSimulation: boolean;
  mqttUrl?: string;
  tickMs: number;
  simSpeed: number;
  
  // Entity counts
  forkliftCount: number;
  palletCount: number;
  workerCount: number;
  
  // Speed ranges (m/s)
  forkliftSpeedRange: [number, number];
  palletSpeedRange: [number, number];
  workerSpeedRange: [number, number];
  
  // Event generation
  eventProbability: number;        // chance per tick to generate event
  congestionThreshold: number;     // entities per lane segment
  collisionRadius: number;         // meters
}
