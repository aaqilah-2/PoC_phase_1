import type { Zone, Aisle } from '../entities';

// Sample warehouse layout for food distribution facility
export const warehouseZones: Zone[] = [
  // Storage zones
  {
    id: 'storage-a',
    name: 'Storage Zone A',
    type: 'STORAGE',
    bounds: [{ x: 5, y: 2, width: 15, height: 5 }],
    restricted: false,
  },
  {
    id: 'storage-b',
    name: 'Storage Zone B',
    type: 'STORAGE',
    bounds: [{ x: 5, y: 13, width: 15, height: 5 }],
    restricted: false,
  },
  
  // Cold storage zones
  {
    id: 'cold-storage-1',
    name: 'Cold Storage (Chiller)',
    type: 'COLD_STORAGE',
    bounds: [{ x: 22, y: 2, width: 8, height: 5 }],
    restricted: false,
    temperature: 4, // 4°C for refrigerated items
  },
  {
    id: 'cold-storage-2',
    name: 'Cold Storage (Freezer)',
    type: 'COLD_STORAGE',
    bounds: [{ x: 22, y: 13, width: 8, height: 5 }],
    restricted: false,
    temperature: -18, // -18°C for frozen items
  },
  
  // Loading/unloading zones
  {
    id: 'loading-zone',
    name: 'Loading Docks',
    type: 'LOADING',
    bounds: [{ x: 36, y: 2, width: 3, height: 7 }],
    restricted: false,
  },
  {
    id: 'unloading-zone',
    name: 'Unloading Area',
    type: 'UNLOADING',
    bounds: [{ x: 36, y: 11, width: 3, height: 7 }],
    restricted: false,
  },
  
  // Restricted zones
  {
    id: 'hygiene-zone',
    name: 'Hygiene Control',
    type: 'RESTRICTED',
    bounds: [{ x: 32, y: 7, width: 3, height: 6 }],
    restricted: true,
  }
];

// Main aisles for navigation
export const warehouseAisles: Aisle[] = [
  // Main horizontal aisles
  {
    id: 'aisle-h1',
    points: [
      { x: 2, y: 10 },
      { x: 38, y: 10 },
    ],
    direction: 'twoway',
    width: 2,
  },
  
  // Vertical aisles
  {
    id: 'aisle-v1',
    points: [
      { x: 20, y: 1 },
      { x: 20, y: 19 },
    ],
    direction: 'twoway',
    width: 1.5,
  },
  {
    id: 'aisle-v2',
    points: [
      { x: 32, y: 1 },
      { x: 32, y: 19 },
    ],
    direction: 'twoway',
    width: 1.5,
  },
  
  // Storage zone aisles
  {
    id: 'aisle-s1',
    points: [
      { x: 5, y: 4.5 },
      { x: 20, y: 4.5 },
    ],
    direction: 'oneway',
    width: 1,
  },
  {
    id: 'aisle-s2',
    points: [
      { x: 5, y: 15.5 },
      { x: 20, y: 15.5 },
    ],
    direction: 'oneway',
    width: 1,
  },
  {
    id: 'aisle-c1',
    points: [
      { x: 22, y: 4.5 },
      { x: 32, y: 4.5 },
    ],
    direction: 'oneway',
    width: 1,
  },
  {
    id: 'aisle-c2',
    points: [
      { x: 22, y: 15.5 },
      { x: 32, y: 15.5 },
    ],
    direction: 'oneway',
    width: 1,
  },
];

// Function to determine which zone contains a point
export function pointInZone(x: number, y: number): string | undefined {
  for (const zone of warehouseZones) {
    for (const bound of zone.bounds) {
      if (
        x >= bound.x && 
        x <= bound.x + bound.width && 
        y >= bound.y && 
        y <= bound.y + bound.height
      ) {
        return zone.id;
      }
    }
  }
  return undefined;
}

// Function to check if a point is near an aisle
export function pointNearAisle(x: number, y: number, distanceThreshold: number = 1): boolean {
  for (const aisle of warehouseAisles) {
    if (aisle.points.length < 2) continue;
    
    // Simple line segment distance calculation
    for (let i = 0; i < aisle.points.length - 1; i++) {
      const p1 = aisle.points[i];
      const p2 = aisle.points[i + 1];
      
      // Calculate distance from point to line segment
      const lineLength = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      const dot = (((x - p1.x) * (p2.x - p1.x)) + ((y - p1.y) * (p2.y - p1.y))) / Math.pow(lineLength, 2);
      
      if (dot < 0) {
        // Point is before start of line segment
        const distance = Math.sqrt(Math.pow(x - p1.x, 2) + Math.pow(y - p1.y, 2));
        if (distance <= distanceThreshold) return true;
      } 
      else if (dot > 1) {
        // Point is after end of line segment
        const distance = Math.sqrt(Math.pow(x - p2.x, 2) + Math.pow(y - p2.y, 2));
        if (distance <= distanceThreshold) return true;
      }
      else {
        // Point is within line segment
        const perpDist = Math.abs((p2.y - p1.y) * x - (p2.x - p1.x) * y + p2.x * p1.y - p2.y * p1.x) / lineLength;
        if (perpDist <= distanceThreshold) return true;
      }
    }
  }
  
  return false;
}
