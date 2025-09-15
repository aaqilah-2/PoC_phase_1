import { LaneNetwork, Lane, LanePoint, EntityState } from './types';

export class LaneNavigator {
  private laneNetwork: LaneNetwork;
  private laneConnections: Map<string, string[]> = new Map();

  constructor(laneNetwork: LaneNetwork) {
    this.laneNetwork = laneNetwork;
    this.buildLaneConnections();
  }

  /**
   * Build connections between lanes based on proximity of endpoints
   */
  private buildLaneConnections(): void {
    const connectionRadius = 3.0; // meters
    
    for (const lane of this.laneNetwork.lanes) {
      const connections: string[] = [];
      const laneStart = lane.points[0];
      const laneEnd = lane.points[lane.points.length - 1];
      
      if (!laneStart || !laneEnd) continue;
      
      for (const otherLane of this.laneNetwork.lanes) {
        if (lane.id === otherLane.id) continue;
        
        const otherStart = otherLane.points[0];
        const otherEnd = otherLane.points[otherLane.points.length - 1];
        
        if (!otherStart || !otherEnd) continue;
        
        // Check if any endpoints are close enough to connect
        if (this.distance(laneStart, otherStart) < connectionRadius ||
            this.distance(laneStart, otherEnd) < connectionRadius ||
            this.distance(laneEnd, otherStart) < connectionRadius ||
            this.distance(laneEnd, otherEnd) < connectionRadius) {
          connections.push(otherLane.id);
        }
      }
      
      this.laneConnections.set(lane.id, connections);
    }
  }

  /**
   * Find the nearest point on any lane to the given position
   */
  public nearestPointOnLane(position: LanePoint): {
    laneId: string;
    point: LanePoint;
    progress: number;
    distance: number;
  } | null {
    let bestResult: {
      laneId: string;
      point: LanePoint;
      progress: number;
      distance: number;
    } | null = null;

    for (const lane of this.laneNetwork.lanes) {
      const result = this.nearestPointOnSpecificLane(position, lane);
      if (!bestResult || result.distance < bestResult.distance) {
        bestResult = {
          laneId: lane.id,
          point: result.point,
          progress: result.progress,
          distance: result.distance
        };
      }
    }

    return bestResult;
  }

  /**
   * Find nearest point on a specific lane
   */
  private nearestPointOnSpecificLane(position: LanePoint, lane: Lane): {
    point: LanePoint;
    progress: number;
    distance: number;
  } {
    let bestDistance = Infinity;
    let bestPoint = lane.points[0]!;
    let bestProgress = 0;

    // For each segment in the lane
    for (let i = 0; i < lane.points.length - 1; i++) {
      const segmentStart = lane.points[i];
      const segmentEnd = lane.points[i + 1];
      
      if (!segmentStart || !segmentEnd) continue;
      
      const segmentLength = this.distance(segmentStart, segmentEnd);
      
      if (segmentLength === 0) continue;

      // Find closest point on this segment
      const t = Math.max(0, Math.min(1, 
        ((position.x - segmentStart.x) * (segmentEnd.x - segmentStart.x) + 
         (position.y - segmentStart.y) * (segmentEnd.y - segmentStart.y)) / 
        (segmentLength * segmentLength)
      ));

      const closestPoint = {
        x: segmentStart.x + t * (segmentEnd.x - segmentStart.x),
        y: segmentStart.y + t * (segmentEnd.y - segmentStart.y)
      };

      const distance = this.distance(position, closestPoint);
      
      if (distance < bestDistance) {
        bestDistance = distance;
        bestPoint = closestPoint;
        // Calculate progress along entire lane
        bestProgress = (i + t) / (lane.points.length - 1);
      }
    }

    return {
      point: bestPoint,
      progress: bestProgress,
      distance: bestDistance
    };
  }

  /**
   * Advance an entity along its current lane
   */
  public advanceAlongLane(entity: EntityState, deltaTime: number): {
    position: LanePoint;
    heading: number;
    reachedEnd: boolean;
  } {
    const lane = this.laneNetwork.lanes.find(l => l.id === entity.currentLaneId);
    if (!lane) {
      throw new Error(`Lane not found: ${entity.currentLaneId}`);
    }

    const distanceToTravel = entity.speed * deltaTime;
    const laneLength = this.calculateLaneLength(lane);
    const progressIncrement = distanceToTravel / laneLength;
    
    const newProgress = Math.min(1.0, entity.laneProgress + progressIncrement);
    const position = this.getPositionAtProgress(lane, newProgress);
    const heading = this.getHeadingAtProgress(lane, newProgress);

    return {
      position,
      heading,
      reachedEnd: newProgress >= 1.0
    };
  }

  /**
   * Choose next lane at intersection
   */
  public chooseNextLane(currentLaneId: string, entity: EntityState): string | null {
    const connections = this.laneConnections.get(currentLaneId) || [];
    
    if (connections.length === 0) {
      // Dead end - turn around by finding a lane that connects back
      return this.findReturnLane(currentLaneId);
    }

    // Prefer continuing in same direction or following route
    if (entity.route.length > entity.routeIndex + 1) {
      const plannedNext = entity.route[entity.routeIndex + 1];
      if (plannedNext && connections.includes(plannedNext)) {
        return plannedNext;
      }
    }

    // Random valid choice
    if (connections.length > 0) {
      return connections[Math.floor(Math.random() * connections.length)] || null;
    }
    
    return null;
  }

  /**
   * Generate a random route for an entity
   */
  public generateRandomRoute(startLaneId: string, length: number = 5): string[] {
    const route = [startLaneId];
    let currentLane = startLaneId;

    for (let i = 0; i < length - 1; i++) {
      const connections = this.laneConnections.get(currentLane) || [];
      if (connections.length === 0) break;
      
      // Avoid immediate backtracking
      const validConnections = connections.filter(
        conn => route.length < 2 || conn !== route[route.length - 2]
      );
      
      const nextLane = validConnections.length > 0 
        ? validConnections[Math.floor(Math.random() * validConnections.length)]
        : connections[Math.floor(Math.random() * connections.length)];
      
      if (!nextLane) break;
      
      route.push(nextLane);
      currentLane = nextLane;
    }

    return route;
  }

  /**
   * Get all lanes in the network
   */
  public getAllLanes(): Lane[] {
    return this.laneNetwork.lanes;
  }

  /**
   * Get lane by ID
   */
  public getLane(laneId: string): Lane | undefined {
    return this.laneNetwork.lanes.find(l => l.id === laneId);
  }

  // Helper methods
  private distance(p1: LanePoint, p2: LanePoint): number {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  }

  private calculateLaneLength(lane: Lane): number {
    let length = 0;
    for (let i = 0; i < lane.points.length - 1; i++) {
      const point1 = lane.points[i];
      const point2 = lane.points[i + 1];
      if (point1 && point2) {
        length += this.distance(point1, point2);
      }
    }
    return length;
  }

  private getPositionAtProgress(lane: Lane, progress: number): LanePoint {
    const firstPoint = lane.points[0];
    const lastPoint = lane.points[lane.points.length - 1];
    
    if (!firstPoint || !lastPoint) {
      throw new Error(`Invalid lane: ${lane.id}`);
    }
    
    if (progress <= 0) return firstPoint;
    if (progress >= 1) return lastPoint;

    const segmentIndex = Math.floor(progress * (lane.points.length - 1));
    const segmentProgress = (progress * (lane.points.length - 1)) - segmentIndex;
    
    if (segmentIndex >= lane.points.length - 1) {
      return lastPoint;
    }

    const start = lane.points[segmentIndex];
    const end = lane.points[segmentIndex + 1];
    
    if (!start || !end) {
      return lastPoint;
    }

    return {
      x: start.x + segmentProgress * (end.x - start.x),
      y: start.y + segmentProgress * (end.y - start.y)
    };
  }

  private getHeadingAtProgress(lane: Lane, progress: number): number {
    if (lane.points.length < 2) return 0;

    const segmentIndex = Math.floor(progress * (lane.points.length - 1));
    const clampedIndex = Math.min(segmentIndex, lane.points.length - 2);
    
    const start = lane.points[clampedIndex];
    const end = lane.points[clampedIndex + 1];

    if (!start || !end) return 0;

    return Math.atan2(end.y - start.y, end.x - start.x);
  }

  private findReturnLane(currentLaneId: string): string | null {
    // Find any lane that connects to this one
    for (const [laneId, connections] of this.laneConnections.entries()) {
      if (connections.includes(currentLaneId) && laneId !== currentLaneId) {
        return laneId;
      }
    }
    return null;
  }
}
