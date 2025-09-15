// Path validation and snapping utilities for forklift movement
// Ensures forklifts only travel on the defined green path lines

interface Point {
  x: number;
  y: number;
}

interface PathSegment {
  id: string;
  start: Point;
  end: Point;
  type: 'main-aisle' | 'rack-connector' | 'loading-zone';
}

// Define the green path network based on WarehouseLanes structure
export const WAREHOUSE_PATHS: PathSegment[] = [
  // Horizontal lines - Top, middle, and bottom (like in the image)
  {
    id: 'top-horizontal-line',
    start: { x: 2, y: 7.8 },
    end: { x: 46, y: 7.8 },
    type: 'main-aisle'
  },
  {
    id: 'middle-horizontal-line',
    start: { x: 2, y: 11.2 },
    end: { x: 46, y: 11.2 },
    type: 'main-aisle'
  },
  {
    id: 'bottom-horizontal-line',
    start: { x: 2, y: 14.6 },
    end: { x: 46, y: 14.6 },
    type: 'main-aisle'
  },

  // Vertical lines between storage zones
  // Vertical lines between storage zones
  {
    id: 'vertical-line-1',
    start: { x: 9.5, y: 2.5 },
    end: { x: 9.5, y: 19.5 },
    type: 'rack-connector'
  },
  {
    id: 'vertical-line-2',
    start: { x: 16.5, y: 2.5 },
    end: { x: 16.5, y: 19.5 },
    type: 'rack-connector'
  },
  {
    id: 'vertical-line-3',
    start: { x: 23.5, y: 2.5 },
    end: { x: 23.5, y: 19.5 },
    type: 'rack-connector'
  },
  {
    id: 'vertical-line-4',
    start: { x: 30.5, y: 2.5 },
    end: { x: 30.5, y: 19.5 },
    type: 'rack-connector'
  },
  {
    id: 'vertical-line-5',
    start: { x: 37.5, y: 2.5 },
    end: { x: 37.5, y: 19.5 },
    type: 'rack-connector'
  },

  // Boundary lines
  {
    id: 'left-boundary',
    start: { x: 2, y: 2.5 },
    end: { x: 2, y: 19.5 },
    type: 'main-aisle'
  },
  {
    id: 'right-boundary',
    start: { x: 44.5, y: 2.5 },
    end: { x: 44.5, y: 19.5 },
    type: 'main-aisle'
  }
];

// Calculate distance from point to line segment
function distanceToLineSegment(point: Point, lineStart: Point, lineEnd: Point): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    // Line segment is a point
    return Math.sqrt(A * A + B * B);
  }

  let param = dot / lenSq;

  if (param < 0) {
    // Point is before line start
    return Math.sqrt(A * A + B * B);
  } else if (param > 1) {
    // Point is after line end
    const dx = point.x - lineEnd.x;
    const dy = point.y - lineEnd.y;
    return Math.sqrt(dx * dx + dy * dy);
  } else {
    // Point projects onto line segment
    const projX = lineStart.x + param * C;
    const projY = lineStart.y + param * D;
    const dx = point.x - projX;
    const dy = point.y - projY;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

// Find closest point on any path segment
export function snapToNearestPath(point: Point, maxDistance: number = 2.0): Point {
  let closestPoint = point;
  let minDistance = maxDistance;

  for (const segment of WAREHOUSE_PATHS) {
    const A = point.x - segment.start.x;
    const B = point.y - segment.start.y;
    const C = segment.end.x - segment.start.x;
    const D = segment.end.y - segment.start.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) continue; // Skip zero-length segments

    let param = Math.max(0, Math.min(1, dot / lenSq));
    
    const projX = segment.start.x + param * C;
    const projY = segment.start.y + param * D;
    
    const distance = Math.sqrt(
      (point.x - projX) ** 2 + (point.y - projY) ** 2
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = { x: projX, y: projY };
    }
  }

  return closestPoint;
}

// Check if a point is on or near a valid path
export function isOnValidPath(point: Point, tolerance: number = 0.5): boolean {
  for (const segment of WAREHOUSE_PATHS) {
    const distance = distanceToLineSegment(point, segment.start, segment.end);
    if (distance <= tolerance) {
      return true;
    }
  }
  return false;
}

// Get all intersection points (nodes) in the path network
export function getPathIntersections(): Point[] {
  const intersections: Point[] = [];
  const tolerance = 0.1;

  // Find intersections between path segments
  for (let i = 0; i < WAREHOUSE_PATHS.length; i++) {
    for (let j = i + 1; j < WAREHOUSE_PATHS.length; j++) {
      const seg1 = WAREHOUSE_PATHS[i];
      const seg2 = WAREHOUSE_PATHS[j];

      // Check if segments intersect
      const intersection = getLineIntersection(seg1, seg2);
      if (intersection) {
        // Check if intersection already exists
        const exists = intersections.some(p => 
          Math.abs(p.x - intersection.x) < tolerance && 
          Math.abs(p.y - intersection.y) < tolerance
        );
        
        if (!exists) {
          intersections.push(intersection);
        }
      }
    }
  }

  // Add segment endpoints as nodes
  for (const segment of WAREHOUSE_PATHS) {
    [segment.start, segment.end].forEach(endpoint => {
      const exists = intersections.some(p => 
        Math.abs(p.x - endpoint.x) < tolerance && 
        Math.abs(p.y - endpoint.y) < tolerance
      );
      
      if (!exists) {
        intersections.push(endpoint);
      }
    });
  }

  return intersections;
}

// Calculate intersection of two line segments
function getLineIntersection(seg1: PathSegment, seg2: PathSegment): Point | null {
  const x1 = seg1.start.x, y1 = seg1.start.y;
  const x2 = seg1.end.x, y2 = seg1.end.y;
  const x3 = seg2.start.x, y3 = seg2.start.y;
  const x4 = seg2.end.x, y4 = seg2.end.y;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  
  if (Math.abs(denom) < 1e-10) {
    return null; // Lines are parallel
  }

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1)
    };
  }

  return null;
}

// Find valid next positions from current position
export function getValidNextPositions(currentPoint: Point, maxDistance: number = 5.0): Point[] {
  const validPositions: Point[] = [];
  const intersections = getPathIntersections();

  for (const intersection of intersections) {
    const distance = Math.sqrt(
      (intersection.x - currentPoint.x) ** 2 + 
      (intersection.y - currentPoint.y) ** 2
    );

    if (distance <= maxDistance && distance > 0.1) {
      // Check if there's a direct path between current point and intersection
      if (hasDirectPath(currentPoint, intersection)) {
        validPositions.push(intersection);
      }
    }
  }

  return validPositions;
}

// Check if there's a direct path between two points
function hasDirectPath(from: Point, to: Point): boolean {
  const midPoint = {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2
  };

  // Check if the midpoint is on a valid path
  return isOnValidPath(midPoint, 0.5);
}
