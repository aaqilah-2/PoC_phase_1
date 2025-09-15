// mockData.ts - Functions to generate mock data for the Digital Twin Dashboard

import type {
  Entity,
  Pose,
  Task,
  Alert,
  Layout,
  KPIMetrics,
  HeatmapData,
  TimelineEvent
} from '../entities';

// Generate mock entities (forklifts, workers, pallets)
export function generateMockEntities(): Entity[] {
  return [
    { id: 'forklift-1', type: 'FORKLIFT', operatorId: 'operator-1', battery: 78 },
    { id: 'forklift-2', type: 'FORKLIFT', operatorId: 'operator-2', battery: 92 },
    { id: 'worker-1', type: 'WORKER', label: 'John Smith' },
    { id: 'worker-2', type: 'WORKER', label: 'Emma Johnson' },
    { id: 'pallet-1', type: 'PALLET' },
    { id: 'pallet-2', type: 'PALLET' }
  ];
}

// Generate mock poses (current positions)
export function generateMockPoses(): Pose[] {
  const now = Date.now();
  return [
    { entityId: 'forklift-1', t: now, x: 5, y: 10, heading: 90, speed: 1.2, zone: 'zone-A', confidence: 0.95 },
    { entityId: 'forklift-2', t: now, x: 15, y: 7, heading: 180, speed: 0, zone: 'zone-B', confidence: 0.9 },
    { entityId: 'worker-1', t: now, x: 8, y: 12, heading: 270, speed: 0.8, zone: 'zone-A', confidence: 0.85 },
    { entityId: 'worker-2', t: now, x: 20, y: 18, heading: 0, speed: 0.5, zone: 'zone-C', confidence: 0.8 },
    { entityId: 'pallet-1', t: now, x: 6, y: 9, heading: 0, speed: 0, zone: 'zone-A', confidence: 0.95 },
    { entityId: 'pallet-2', t: now, x: 16, y: 20, heading: 0, speed: 0, zone: 'zone-D', confidence: 0.9 }
  ];
}

// Generate mock warehouse layout
export function generateMockLayout(): Layout {
  return {
    zones: [
      { 
        id: 'zone-A', 
        name: 'Storage Zone A', 
        type: 'STORAGE', 
        bounds: [{ x: 0, y: 0, width: 10, height: 15 }] 
      },
      { 
        id: 'zone-B', 
        name: 'Cold Storage', 
        type: 'COLD_STORAGE', 
        bounds: [{ x: 10, y: 0, width: 10, height: 10 }],
        temperature: -5
      },
      { 
        id: 'zone-C', 
        name: 'Loading Zone', 
        type: 'LOADING', 
        bounds: [{ x: 20, y: 0, width: 10, height: 10 }] 
      },
      { 
        id: 'zone-D', 
        name: 'Unloading Zone', 
        type: 'UNLOADING', 
        bounds: [{ x: 10, y: 10, width: 20, height: 10 }] 
      },
      { 
        id: 'zone-restricted', 
        name: 'Restricted Area', 
        type: 'RESTRICTED', 
        bounds: [{ x: 0, y: 15, width: 10, height: 5 }],
        restricted: true
      }
    ],
    aisles: [
      { 
        id: 'aisle-1', 
        points: [
          { x: 5, y: 0 }, 
          { x: 5, y: 20 }
        ],
        direction: 'twoway',
        width: 2
      },
      { 
        id: 'aisle-2', 
        points: [
          { x: 15, y: 0 }, 
          { x: 15, y: 20 }
        ],
        direction: 'oneway',
        width: 2,
        congested: true
      },
      { 
        id: 'aisle-3', 
        points: [
          { x: 0, y: 10 }, 
          { x: 30, y: 10 }
        ],
        direction: 'twoway',
        width: 2
      }
    ],
    racks: [
      { id: 'rack-1', x: 2, y: 2, width: 6, height: 1, name: 'Rack A1' },
      { id: 'rack-2', x: 2, y: 4, width: 6, height: 1, name: 'Rack A2' },
      { id: 'rack-3', x: 2, y: 6, width: 6, height: 1, name: 'Rack A3' },
      { id: 'rack-4', x: 12, y: 2, width: 6, height: 1, name: 'Cold Rack B1' },
      { id: 'rack-5', x: 12, y: 4, width: 6, height: 1, name: 'Cold Rack B2' }
    ],
    docks: [
      { id: 'dock-1', x: 22, y: 2, width: 4, height: 2, type: 'INBOUND', name: 'Inbound Dock 1' },
      { id: 'dock-2', x: 22, y: 5, width: 4, height: 2, type: 'INBOUND', name: 'Inbound Dock 2' },
      { id: 'dock-3', x: 12, y: 12, width: 4, height: 2, type: 'OUTBOUND', name: 'Outbound Dock 1' },
      { id: 'dock-4', x: 17, y: 12, width: 4, height: 2, type: 'OUTBOUND', name: 'Outbound Dock 2' }
    ],
    noGo: [
      {
        id: 'nogo-1',
        type: 'NO_GO',
        points: [
          { x: 25, y: 15 },
          { x: 30, y: 15 },
          { x: 30, y: 20 },
          { x: 25, y: 20 }
        ]
      }
    ]
  };
}

// Generate mock tasks
export function generateMockTasks(): Task[] {
  const now = Date.now();
  return [
    {
      id: 'task-1',
      type: 'PICK',
      priority: 'HIGH',
      sourceLocation: { x: 3, y: 3, zone: 'zone-A' },
      targetLocation: { x: 13, y: 13, zone: 'zone-D' },
      assignedEntityId: 'forklift-1',
      status: 'IN_PROGRESS',
      createdAt: now - 3600000, // 1 hour ago
      route: [
        { x: 3, y: 3 },
        { x: 5, y: 3 },
        { x: 5, y: 10 },
        { x: 13, y: 10 },
        { x: 13, y: 13 }
      ]
    },
    {
      id: 'task-2',
      type: 'REPLENISH',
      priority: 'NORMAL',
      sourceLocation: { x: 23, y: 3, zone: 'zone-C' },
      targetLocation: { x: 13, y: 3, zone: 'zone-B' },
      status: 'PENDING',
      createdAt: now - 1800000 // 30 min ago
    },
    {
      id: 'task-3',
      type: 'TRANSFER',
      priority: 'URGENT',
      sourceLocation: { x: 13, y: 3, zone: 'zone-B' },
      targetLocation: { x: 18, y: 13, zone: 'zone-D' },
      status: 'PENDING',
      createdAt: now - 900000, // 15 min ago
      expiresAt: now + 1800000 // Expires in 30 min
    },
    {
      id: 'task-4',
      type: 'PICK',
      priority: 'LOW',
      sourceLocation: { x: 3, y: 5, zone: 'zone-A' },
      targetLocation: { x: 14, y: 13, zone: 'zone-D' },
      assignedEntityId: 'forklift-2',
      status: 'ASSIGNED',
      createdAt: now - 600000, // 10 min ago
      route: [
        { x: 3, y: 5 },
        { x: 5, y: 5 },
        { x: 5, y: 10 },
        { x: 14, y: 10 },
        { x: 14, y: 13 }
      ]
    }
  ];
}

// Generate mock alerts
export function generateMockAlerts(): Alert[] {
  const now = Date.now();
  return [
    {
      id: 'alert-1',
      t: now - 300000, // 5 min ago
      kind: 'CONGESTION',
      x: 15,
      y: 5,
      meta: { duration: 180 } // 3 minutes
    },
    {
      id: 'alert-2',
      t: now - 600000, // 10 min ago
      kind: 'NEAR_COLLISION',
      x: 8,
      y: 10,
      meta: { entities: ['forklift-1', 'worker-1'] },
      acknowledged: true
    },
    {
      id: 'alert-3',
      t: now - 1200000, // 20 min ago
      kind: 'ZONE_BREACH',
      x: 2,
      y: 17,
      meta: { entityId: 'worker-2', zone: 'zone-restricted' }
    }
  ];
}

// Generate mock timeline events
export function generateMockTimelineEvents(): TimelineEvent[] {
  const now = Date.now();
  return [
    {
      id: 'event-1',
      t: now - 300000, // 5 min ago
      type: 'CONGESTION',
      label: 'Aisle Congestion',
      x: 15,
      y: 5,
      details: 'High traffic detected in aisle-2'
    },
    {
      id: 'event-2',
      t: now - 600000, // 10 min ago
      type: 'NEAR_COLLISION',
      label: 'Near Miss',
      x: 8,
      y: 10,
      details: 'Near collision between forklift-1 and worker-1'
    },
    {
      id: 'event-3',
      t: now - 1200000, // 20 min ago
      type: 'ZONE_BREACH',
      label: 'Restricted Zone Entry',
      x: 2,
      y: 17,
      details: 'worker-2 entered restricted zone'
    },
    {
      id: 'event-4',
      t: now - 1800000, // 30 min ago
      type: 'REROUTE',
      label: 'Route Changed',
      x: 10,
      y: 10,
      details: 'forklift-1 route changed due to congestion'
    }
  ];
}

// Generate mock KPI metrics
export function generateMockKPIMetrics(): KPIMetrics {
  return {
    routeCompletionTime: 320, // seconds
    travelDistance: 1250, // meters
    congestionEvents: 3,
    dwellTime: { 
      'zone-A': 120, 
      'zone-B': 180, 
      'zone-C': 90, 
      'zone-D': 150 
    },
    systemLatency: 120, // milliseconds
    reroutingEffectiveness: 85, // percent
    complianceIncidents: 2,
    operatorSatisfaction: 78, // out of 100
    throughput: 42, // units/hour
    efficiency: 82 // percent
  };
}

// Generate mock heatmap data
export function generateMockHeatmapData(type: 'DENSITY' | 'CONGESTION' | 'DWELL', timeWindow: 5 | 10 | 30): HeatmapData {
  return {
    type,
    timeWindow,
    cells: [
      { x: 5, y: 5, value: 0.8, count: 12 },
      { x: 5, y: 6, value: 0.6, count: 9 },
      { x: 5, y: 7, value: 0.4, count: 6 },
      { x: 6, y: 5, value: 0.5, count: 8 },
      { x: 15, y: 5, value: 0.9, count: 14 },
      { x: 15, y: 6, value: 0.7, count: 10 },
      { x: 15, y: 7, value: 0.5, count: 7 },
      { x: 16, y: 5, value: 0.6, count: 9 },
      { x: 7, y: 9, value: 0.3, count: 4 },
      { x: 8, y: 9, value: 0.4, count: 6 },
      { x: 12, y: 12, value: 0.7, count: 11 },
      { x: 13, y: 12, value: 0.8, count: 12 },
      { x: 14, y: 12, value: 0.6, count: 9 },
      { x: 22, y: 3, value: 0.5, count: 8 },
      { x: 23, y: 3, value: 0.4, count: 6 },
      { x: 17, y: 13, value: 0.7, count: 10 }
    ],
    max: 0.9,
    min: 0.1
  };
}
