import { PositionTick, DTEvent, EntityState, SimulatorConfig } from './types';
import { LaneNavigator } from './lane-navigator';
import { v4 as uuidv4 } from 'uuid';

export class WarehouseSimulator {
  private config: SimulatorConfig;
  private laneNavigator: LaneNavigator;
  private entities: Map<string, EntityState> = new Map();
  private running = false;
  private intervalId?: NodeJS.Timeout;
  private logCounter = 0;

  constructor(config: SimulatorConfig, laneNavigator: LaneNavigator) {
    this.config = config;
    this.laneNavigator = laneNavigator;
    this.initializeEntities();
  }

  /**
   * Initialize all entities with starting positions on lanes
   */
  private initializeEntities(): void {
    const allLanes = this.laneNavigator.getAllLanes();
    const mainLanes = allLanes.filter(lane => 
      lane.id.startsWith('H') || lane.id.includes('main') || lane.id.includes('center')
    );

    let entityCounter = 1;

    // Create forklifts positioned on valid grid points (mainly on the middle horizontal line)
    for (let i = 0; i < this.config.forkliftCount; i++) {
      // Define grid positions for forklifts to start on - ONLY on the middle horizontal line and vertical connectors
      const gridStartPositions = [
        // Middle horizontal line (main forklift route)
        { x: 12.5, y: 11.2 },
        { x: 18.9, y: 11.2 },
        { x: 25.3, y: 11.2 },
        { x: 31.7, y: 11.2 },
        { x: 38.1, y: 11.2 },
        // Some vertical positions for variety (intersections)
        { x: 12.5, y: 8.6 },
        { x: 25.3, y: 13.8 },
        { x: 31.7, y: 9.4 },
        { x: 18.9, y: 14.2 }
      ];
      
      // Choose a starting position for this forklift (with safe index)
      const posIndex = i % gridStartPositions.length;
      const startingPoint = gridStartPositions[posIndex];
      const speed = this.randomSpeed(this.config.forkliftSpeedRange);
      
      // Safety check (should never happen with the fixed array above)
      if (!startingPoint) {
        console.error(`Failed to get starting position for forklift ${i}`);
        continue;
      }
      
      // Get heading based on position - horizontal line goes left/right, vertical lines go up/down
      let heading = 0;
      if (Math.abs(startingPoint.y - 11.2) < 0.1) {
        // On horizontal line, alternate left/right
        heading = i % 2 === 0 ? 0 : 180;
      } else {
        // On vertical line, alternate up/down
        heading = i % 2 === 0 ? 90 : 270;
      }

      const entity: EntityState = {
        id: `forklift-${entityCounter++}`,
        type: 'forklift',
        x: startingPoint.x,
        y: startingPoint.y,
        speed: speed,
        heading: heading,
        targetSpeed: speed,
        currentLaneId: 'grid', // Special marker for grid-based movement
        laneProgress: 0,
        route: [], // Not using lane-based routes for forklifts
        routeIndex: 0,
        lastEventTime: Date.now() - (i * 2000), // Stagger start times
        zoneId: this.getZoneFromPosition(startingPoint.x, startingPoint.y) || 'unknown'
      };

      this.entities.set(entity.id, entity);
    }

    // Create pallets
    for (let i = 0; i < this.config.palletCount; i++) {
      const lane = allLanes[Math.floor(Math.random() * allLanes.length)];
      if (!lane) continue;

      const entity: EntityState = {
        id: `pallet-${entityCounter++}`,
        type: 'pallet',
        x: lane.points[0]?.x || 0,
        y: lane.points[0]?.y || 0,
        speed: this.randomSpeed(this.config.palletSpeedRange),
        heading: 0,
        targetSpeed: this.randomSpeed(this.config.palletSpeedRange),
        currentLaneId: lane.id,
        laneProgress: Math.random() * 0.5, // Start partway along lane
        route: this.laneNavigator.generateRandomRoute(lane.id, 3),
        routeIndex: 0,
        lastEventTime: Date.now(),
        zoneId: this.getZoneFromPosition(lane.points[0]?.x || 0, lane.points[0]?.y || 0) || 'unknown'
      };

      this.entities.set(entity.id, entity);
    }

    // Create workers
    for (let i = 0; i < this.config.workerCount; i++) {
      const lane = allLanes[Math.floor(Math.random() * allLanes.length)];
      if (!lane) continue;

      const entity: EntityState = {
        id: `worker-${entityCounter++}`,
        type: 'worker',
        x: lane.points[0]?.x || 0,
        y: lane.points[0]?.y || 0,
        speed: this.randomSpeed(this.config.workerSpeedRange),
        heading: 0,
        targetSpeed: this.randomSpeed(this.config.workerSpeedRange),
        currentLaneId: lane.id,
        laneProgress: Math.random() * 0.3,
        route: this.laneNavigator.generateRandomRoute(lane.id, 4),
        routeIndex: 0,
        lastEventTime: Date.now(),
        zoneId: this.getZoneFromPosition(lane.points[0]?.x || 0, lane.points[0]?.y || 0) || 'unknown'
      };

      this.entities.set(entity.id, entity);
    }

    console.log(`Initialized ${this.entities.size} entities`);
  }

  /**
   * Start the simulation
   */
  public start(
    onPositionUpdate: (positions: PositionTick[]) => void,
    onEvent: (event: DTEvent) => void
  ): void {
    if (this.running) return;

    this.running = true;
    console.log('Starting warehouse simulation...');

    this.intervalId = setInterval(() => {
      const deltaTime = (this.config.tickMs / 1000) * this.config.simSpeed;
      
      // Update all entities
      const positions: PositionTick[] = [];
      const events: DTEvent[] = [];

      for (const entity of this.entities.values()) {
        this.updateEntity(entity, deltaTime);
        
        // Create position tick
        positions.push({
          id: entity.id,
          type: entity.type,
          x: entity.x,
          y: entity.y,
          speed: entity.speed,
          heading: entity.heading,
          zoneId: entity.zoneId || 'unknown',
          confidence: 0.90 + Math.random() * 0.1, // Simulate UWB accuracy
          t: Date.now()
        });

        // Generate events occasionally
        if (Math.random() < this.config.eventProbability) {
          const event = this.generateRandomEvent(entity);
          if (event) {
            events.push(event);
          }
        }
      }

      // Check for proximity-based events
      events.push(...this.checkProximityEvents());

      // Send updates
      onPositionUpdate(positions);
      events.forEach(event => onEvent(event));
      
      // Debug logging every 50 ticks (5 seconds at 10Hz)
      this.logCounter = (this.logCounter || 0) + 1;
      if (this.logCounter % 50 === 0) {
        console.log(`📍 Broadcasting ${positions.length} positions, ${events.length} events`);
        if (positions.length > 0) {
          const sample = positions[0];
          console.log(`   Sample: ${sample?.id} at (${sample?.x.toFixed(2)}, ${sample?.y.toFixed(2)})`);
        }
      }

    }, this.config.tickMs);
  }

  /**
   * Stop the simulation
   */
  public stop(): void {
    if (!this.running) return;

    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    console.log('Stopped warehouse simulation');
  }

  /**
   * Update a single entity's position and state
   */
  private updateEntity(entity: EntityState, deltaTime: number): void {
    try {
      // For forklifts, use grid-based movement like in the user's image
      if (entity.type === 'forklift') {
        this.updateForkliftGridMovement(entity, deltaTime);
      } else {
        // Use lane-based movement for other entities
        this.updateLaneBasedMovement(entity, deltaTime);
      }

      // Update zone based on position
      entity.zoneId = this.getZoneFromPosition(entity.x, entity.y) || 'unknown';

    } catch (error) {
      console.warn(`Error updating entity ${entity.id}:`, error);
      this.resetEntityToValidLane(entity);
    }
  }

  /**
   * Grid-based movement for forklifts following STRICT path lines only - SMOOTH CONTINUOUS MOVEMENT
   */
  private updateForkliftGridMovement(entity: EntityState, deltaTime: number): void {
    const speed = entity.speed;
    const distance = speed * deltaTime;

    // Define STRICT path lines - forklifts can ONLY move on these exact lines
    const pathLines = [
      // ONLY one horizontal line in the middle - matches the new layout
      { type: 'horizontal', y: 11.2, xStart: 4, xEnd: 44 },
      
      // Vertical lines - connecting between aisles (same as before)
      { type: 'vertical', x: 4, yStart: 3.2, yEnd: 19.2 },
      { type: 'vertical', x: 12.5, yStart: 3.2, yEnd: 19.2 },
      { type: 'vertical', x: 18.9, yStart: 3.2, yEnd: 19.2 },
      { type: 'vertical', x: 25.3, yStart: 3.2, yEnd: 19.2 },
      { type: 'vertical', x: 31.7, yStart: 3.2, yEnd: 19.2 },
      { type: 'vertical', x: 38.1, yStart: 3.2, yEnd: 19.2 },
      { type: 'vertical', x: 44, yStart: 3.2, yEnd: 19.2 }
    ];

    // Ensure forklift stays on valid path lines
    if (!this.isOnStrictPath(entity, pathLines)) {
      this.snapToNearestPath(entity, pathLines);
      this.setPathLineTarget(entity, pathLines);
      return;
    }

    // Continuous movement - always have a target to move toward
    if (!entity.targetPosition || this.hasReachedTarget(entity, entity.targetPosition)) {
      this.setPathLineTarget(entity, pathLines);
    }

    // Smooth movement towards target STRICTLY along the path
    if (entity.targetPosition) {
      const dx = entity.targetPosition.x - entity.x;
      const dy = entity.targetPosition.y - entity.y;
      const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

      if (distanceToTarget > 0.05) { // Reduced threshold for smoother movement
        // Move towards target while maintaining path alignment
        const moveX = (dx / distanceToTarget) * distance;
        const moveY = (dy / distanceToTarget) * distance;
        
        entity.x += moveX;
        entity.y += moveY;
        
        // Update heading smoothly
        const targetHeading = Math.atan2(dy, dx) * (180 / Math.PI);
        entity.heading = this.lerpAngle(entity.heading, targetHeading, 0.1);
        
        // Maintain strict path alignment with tighter tolerance
        this.snapToNearestPath(entity, pathLines);
      }
    }

    // Smooth speed variations for natural movement
    const speedVariation = 0.1 * Math.sin(Date.now() * 0.001); // Gentle sine wave variation
    entity.speed = this.lerp(
      entity.speed, 
      entity.targetSpeed + speedVariation, 
      0.02
    );
  }

  /**
   * Check if entity is exactly on a strict path line
   */
  private isOnStrictPath(entity: EntityState, pathLines: any[]): boolean {
    const tolerance = 0.1; // Very tight tolerance
    
    for (const line of pathLines) {
      if (line.type === 'horizontal') {
        if (Math.abs(entity.y - line.y) < tolerance && 
            entity.x >= line.xStart && entity.x <= line.xEnd) {
          return true;
        }
      } else if (line.type === 'vertical') {
        if (Math.abs(entity.x - line.x) < tolerance && 
            entity.y >= line.yStart && entity.y <= line.yEnd) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Snap entity to the nearest path line
   */
  private snapToNearestPath(entity: EntityState, pathLines: any[]): void {
    let minDistance = Infinity;
    let snapPoint = { x: entity.x, y: entity.y };
    
    for (const line of pathLines) {
      let distance: number;
      let point: { x: number, y: number };
      
      if (line.type === 'horizontal') {
        // Snap to horizontal line
        const clampedX = Math.max(line.xStart, Math.min(line.xEnd, entity.x));
        point = { x: clampedX, y: line.y };
        distance = Math.abs(entity.y - line.y) + Math.abs(entity.x - clampedX);
      } else {
        // Snap to vertical line
        const clampedY = Math.max(line.yStart, Math.min(line.yEnd, entity.y));
        point = { x: line.x, y: clampedY };
        distance = Math.abs(entity.x - line.x) + Math.abs(entity.y - clampedY);
      }
      
      if (distance < minDistance) {
        minDistance = distance;
        snapPoint = point;
      }
    }
    
    entity.x = snapPoint.x;
    entity.y = snapPoint.y;
  }

  /**
   * Set target position along current path line
   */
  private setPathLineTarget(entity: EntityState, pathLines: any[]): void {
    // Find which path line the entity is currently on
    const currentLine = this.getCurrentPathLine(entity, pathLines);
    if (!currentLine) return;

    let targetPosition: { x: number, y: number };
    
    if (currentLine.type === 'horizontal') {
      // Move left or right along horizontal line
      const direction = Math.random() > 0.5 ? 1 : -1;
      const targetX = entity.x + (direction * (5 + Math.random() * 10));
      targetPosition = {
        x: Math.max(currentLine.xStart, Math.min(currentLine.xEnd, targetX)),
        y: currentLine.y
      };
    } else {
      // Move up or down along vertical line
      const direction = Math.random() > 0.5 ? 1 : -1;
      const targetY = entity.y + (direction * (3 + Math.random() * 6));
      targetPosition = {
        x: currentLine.x,
        y: Math.max(currentLine.yStart, Math.min(currentLine.yEnd, targetY))
      };
    }
    
    entity.targetPosition = targetPosition;
  }

  /**
   * Find which path line the entity is currently on
   */
  private getCurrentPathLine(entity: EntityState, pathLines: any[]): any {
    const tolerance = 0.2;
    
    for (const line of pathLines) {
      if (line.type === 'horizontal') {
        if (Math.abs(entity.y - line.y) < tolerance && 
            entity.x >= line.xStart - tolerance && entity.x <= line.xEnd + tolerance) {
          return line;
        }
      } else if (line.type === 'vertical') {
        if (Math.abs(entity.x - line.x) < tolerance && 
            entity.y >= line.yStart - tolerance && entity.y <= line.yEnd + tolerance) {
          return line;
        }
      }
    }
    return null;
  }

  /**
   * Check if entity has reached its target
   */
  private hasReachedTarget(entity: EntityState, target: { x: number, y: number }): boolean {
    const distance = Math.sqrt(
      (entity.x - target.x) ** 2 + (entity.y - target.y) ** 2
    );
    return distance < 0.5;
  }

  /**
   * Lane-based movement for non-forklift entities
   */
  private updateLaneBasedMovement(entity: EntityState, deltaTime: number): void {
    if (!entity.currentLaneId) return;

    // Advance along current lane
    const advancement = this.laneNavigator.advanceAlongLane(entity, deltaTime);
    
    entity.x = advancement.position.x;
    entity.y = advancement.position.y;
    entity.heading = advancement.heading;

    // Update lane progress
    const distanceToTravel = entity.speed * deltaTime;
    const currentLane = this.laneNavigator.getLane(entity.currentLaneId);
    if (currentLane) {
      const laneLength = this.calculateLaneLength(currentLane);
      entity.laneProgress += distanceToTravel / laneLength;
    }

    // Check if reached end of lane
    if (advancement.reachedEnd || entity.laneProgress >= 1.0) {
      this.transitionToNextLane(entity);
    }

    // Vary speed slightly for natural movement
    entity.speed = this.lerp(
      entity.speed, 
      entity.targetSpeed + (Math.random() - 0.5) * 0.2, 
      0.1
    );
  }

  /**
   * Transition entity to next lane in route
   */
  private transitionToNextLane(entity: EntityState): void {
    if (!entity.currentLaneId) return;

    // Try to follow planned route
    let nextLaneId: string | null = null;
    
    if (entity.routeIndex < entity.route.length - 1) {
      entity.routeIndex++;
      nextLaneId = entity.route[entity.routeIndex] || null;
    }

    // If no planned route or invalid, choose random next lane
    if (!nextLaneId || !this.laneNavigator.getLane(nextLaneId)) {
      nextLaneId = this.laneNavigator.chooseNextLane(entity.currentLaneId, entity);
    }

    // If still no valid lane, generate new route
    if (!nextLaneId) {
      entity.route = this.laneNavigator.generateRandomRoute(entity.currentLaneId, 5);
      entity.routeIndex = 0;
      nextLaneId = entity.route[1] || entity.currentLaneId;
    }

    entity.currentLaneId = nextLaneId;
    entity.laneProgress = 0;

    // Update target speed occasionally
    if (Math.random() < 0.3) {
      const speedRange = entity.type === 'forklift' 
        ? this.config.forkliftSpeedRange
        : entity.type === 'worker'
        ? this.config.workerSpeedRange  
        : this.config.palletSpeedRange;
      entity.targetSpeed = this.randomSpeed(speedRange);
    }
  }

  /**
   * Generate random events based on entity state
   */
  private generateRandomEvent(entity: EntityState): DTEvent | null {
    const now = Date.now();
    if (now - entity.lastEventTime < 30000) return null; // Min 30s between events

    const eventTypes = ['blocked', 'dwellExceeded', 'zoneBreach'];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)] as DTEvent['type'];

    entity.lastEventTime = now;

    return {
      id: uuidv4(),
      t: now,
      type: eventType,
      assetIds: [entity.id],
      zoneId: entity.zoneId || 'unknown',
      payload: {
        reason: this.generateEventReason(eventType),
        severity: Math.random() > 0.7 ? 'high' : 'medium'
      }
    };
  }

  /**
   * Check for proximity-based events (collisions, congestion)
   */
  private checkProximityEvents(): DTEvent[] {
    const events: DTEvent[] = [];
    const entityArray = Array.from(this.entities.values());

    // Check for near collisions
    for (let i = 0; i < entityArray.length; i++) {
      for (let j = i + 1; j < entityArray.length; j++) {
        const entity1 = entityArray[i];
        const entity2 = entityArray[j];
        
        if (!entity1 || !entity2) continue;

        const distance = Math.sqrt(
          (entity1.x - entity2.x) ** 2 + (entity1.y - entity2.y) ** 2
        );

        if (distance < this.config.collisionRadius && 
            (entity1.speed > 0.1 || entity2.speed > 0.1)) {
          
          events.push({
            id: uuidv4(),
            t: Date.now(),
            type: 'nearCollision',
            assetIds: [entity1.id, entity2.id],
            zoneId: entity1.zoneId || entity2.zoneId || 'unknown',
            payload: {
              distance: Math.round(distance * 100) / 100,
              closingSpeed: Math.abs(entity1.speed - entity2.speed)
            }
          });
          
          // Slow down both entities
          entity1.targetSpeed *= 0.5;
          entity2.targetSpeed *= 0.5;
        }
      }
    }

    // Check for lane congestion
    const laneOccupancy = new Map<string, string[]>();
    for (const entity of this.entities.values()) {
      if (entity.currentLaneId) {
        if (!laneOccupancy.has(entity.currentLaneId)) {
          laneOccupancy.set(entity.currentLaneId, []);
        }
        laneOccupancy.get(entity.currentLaneId)?.push(entity.id);
      }
    }

    for (const [laneId, entityIds] of laneOccupancy.entries()) {
      if (entityIds.length >= this.config.congestionThreshold) {
        events.push({
          id: uuidv4(),
          t: Date.now(),
          type: 'congestion',
          assetIds: entityIds,
          zoneId: laneId,
          payload: {
            occupancy: entityIds.length,
            threshold: this.config.congestionThreshold
          }
        });
      }
    }

    return events;
  }

  // Helper methods
  private randomSpeed(range: [number, number]): number {
    return range[0] + Math.random() * (range[1] - range[0]);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private lerpAngle(a: number, b: number, t: number): number {
    // Handle angle wrapping for smooth rotation
    let diff = b - a;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return a + diff * t;
  }

  private getZoneFromPosition(x: number, y: number): string | undefined {
    // Map position to storage zones based on warehouse layout
    if (y < 8.8) {
      // Storage Zone A
      if (x >= 6.4 && x < 14.4) return 'A1';
      if (x >= 14.4 && x < 22.4) return 'A2';
      if (x >= 22.4 && x < 30.4) return 'A3';
      if (x >= 30.4 && x < 38.4) return 'A4';
      if (x >= 38.4 && x < 46.4) return 'A5';
      if (x >= 46.4) return 'A6';
    } else if (y >= 13.6 && y < 20.8) {
      // Storage Zone B
      if (x >= 6.4 && x < 14.4) return 'B1';
      if (x >= 14.4 && x < 22.4) return 'B2';
      if (x >= 22.4 && x < 30.4) return 'B3';
      if (x >= 30.4 && x < 38.4) return 'B4';
      if (x >= 38.4 && x < 46.4) return 'B5';
      if (x >= 46.4) return 'B6';
    } else if (y >= 20.8) {
      // Personnel zones
      if (x >= 6.4 && x < 14.4) return 'P1';
      if (x >= 14.4 && x < 22.4) return 'P2';
      if (x >= 22.4 && x < 30.4) return 'P3';
      if (x >= 30.4 && x < 38.4) return 'P4';
      if (x >= 38.4 && x < 46.4) return 'P5';
      if (x >= 46.4) return 'P6';
    }
    
    return 'main-aisle';
  }

  private generateEventReason(eventType: DTEvent['type']): string {
    const reasons = {
      blocked: ['fallen pallet', 'maintenance work', 'temporary obstruction'],
      dwellExceeded: ['extended pick operation', 'manual intervention required', 'system delay'],
      zoneBreach: ['unauthorized access', 'navigation error', 'emergency override'],
      congestion: ['high traffic volume', 'intersection bottleneck', 'multiple operations'],
      nearCollision: ['path convergence', 'emergency stop', 'communication delay'],
      reroute: ['planned maintenance', 'traffic optimization', 'priority route']
    };

    const typeReasons = reasons[eventType] || ['unknown'];
    return typeReasons[Math.floor(Math.random() * typeReasons.length)] || 'unknown';
  }

  /**
   * Check if a position is on a valid path (horizontal lines and vertical lines)
   */
  private isOnValidPath(x: number, y: number): boolean {
    const tolerance = 0.5; // Distance tolerance

    // Check if on any of the three horizontal lines
    const horizontalLines = [6.0, 11.2, 16.4]; // Storage A, Middle, Storage B
    for (const lineY of horizontalLines) {
      if (Math.abs(y - lineY) < tolerance && x >= 4 && x <= 44) {
        return true;
      }
    }

    // Check if on vertical lines - UPDATED to BETWEEN aisles positions
    const verticalLines = [4, 12.5, 18.9, 25.3, 31.7, 38.1, 44]; // x-coordinates of vertical lines
    for (const lineX of verticalLines) {
      if (Math.abs(x - lineX) < tolerance && y >= 3.2 && y <= 19.2) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a position is valid in the grid
   */
  private isValidPosition(pos: {x: number, y: number}): boolean {
    if (!pos) return false;
    return this.isOnValidPath(pos.x, pos.y);
  }

  /**
   * Find the nearest grid point to a given position
   */
  private findNearestGridPoint(x: number, y: number, gridPositions: Array<{x: number, y: number}>): {x: number, y: number} {
    let nearestPoint = gridPositions[0] || {x: 4, y: 11.2}; // Default fallback
    let minDistance = Infinity;

    for (const point of gridPositions) {
      const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    }

    return nearestPoint;
  }

  /**
   * Find grid points that are connected to the given point
   */
  private findConnectedPoints(point: {x: number, y: number}, gridPositions: Array<{x: number, y: number}>): Array<{x: number, y: number}> {
    if (!point) return [];
    
    const connectedPoints = [];
    const horizontalLines = [6.0, 11.2, 16.4]; // Storage A, Middle, Storage B
    
    // Check if point is on any horizontal line
    const isOnHorizontal = horizontalLines.some(lineY => Math.abs(point.y - lineY) < 0.1);
    
    if (isOnHorizontal) {
      // Find points on same horizontal line or on intersecting vertical lines
      for (const gridPoint of gridPositions) {
        // Same horizontal line (left/right movement)
        if (horizontalLines.some(lineY => Math.abs(gridPoint.y - lineY) < 0.1) && 
            Math.abs(gridPoint.y - point.y) < 0.1 && // Same horizontal line
            Math.abs(gridPoint.x - point.x) < 7 && // Not too far away
            gridPoint.x !== point.x) { // Not the same point
          connectedPoints.push(gridPoint);
        }
        
        // Connected vertical points at intersection (up/down movement)
        if (Math.abs(gridPoint.x - point.x) < 0.1 && // Same x-coordinate (vertical line)
            Math.abs(gridPoint.y - point.y) < 7 && // Not too far away
            gridPoint.y !== point.y) { // Not the same point
          connectedPoints.push(gridPoint);
        }
      }
    } 
    // Check if point is on a vertical line
    else {
      // Vertical lines x-coordinates
      const verticalLines = [4, 12.5, 18.9, 25.3, 31.7, 38.1, 44];
      
      if (verticalLines.some(lineX => Math.abs(point.x - lineX) < 0.1)) {
        // Find points on same vertical line or on horizontal lines at intersections
        for (const gridPoint of gridPositions) {
          // Same vertical line (up/down movement)
          if (Math.abs(gridPoint.x - point.x) < 0.1 && // Same x (vertical line)
              Math.abs(gridPoint.y - point.y) < 7 && // Not too far away
              gridPoint.y !== point.y) { // Not the same point
            connectedPoints.push(gridPoint);
          }
          
          // Horizontal lines at intersection (left/right movement)
          if (horizontalLines.some(lineY => Math.abs(gridPoint.y - lineY) < 0.1) && // On horizontal line
              Math.abs(gridPoint.x - point.x) < 0.1 && // Same x-coordinate (intersection)
              gridPoint.y !== point.y) { // Not the same point
            connectedPoints.push(gridPoint);
          }
        }
      }
    }
    
    return connectedPoints;
  }

  private resetEntityToValidLane(entity: EntityState): void {
    // For forklifts, reset to a valid grid position
    if (entity.type === 'forklift') {
      // Define valid grid positions
      const gridPositions = [
        // Middle horizontal line
        { x: 15.2, y: 11.2 }, { x: 21.6, y: 11.2 }, { x: 28.0, y: 11.2 }, { x: 34.4, y: 11.2 }
      ];
      
      // Use a hard-coded safe position based on new coordinates
      const safePosition = { x: 12.5, y: 11.2 };
      
      try {
        if (gridPositions && gridPositions.length > 0) {
          // Safe access with bounds checking
          const randomIndex = Math.floor(Math.random() * gridPositions.length);
          if (randomIndex >= 0 && randomIndex < gridPositions.length && gridPositions[randomIndex]) {
            const position = gridPositions[randomIndex];
            entity.x = position.x;
            entity.y = position.y;
            console.log(`Reset forklift ${entity.id} to grid position (${position.x}, ${position.y})`);
          } else {
            // Use safe position
            entity.x = safePosition.x;
            entity.y = safePosition.y;
            console.log(`Reset forklift ${entity.id} to safe position (${safePosition.x}, ${safePosition.y})`);
          }
        } else {
          // No grid positions, use safe position
          entity.x = safePosition.x;
          entity.y = safePosition.y;
          console.log(`Reset forklift ${entity.id} to safe position (${safePosition.x}, ${safePosition.y})`);
        }
        
        // Reset common properties
        entity.targetPosition = undefined; // Reset target so a new one will be chosen
        entity.speed = entity.targetSpeed;
      } catch (error) {
        // Ultimate fallback
        entity.x = safePosition.x;
        entity.y = safePosition.y;
        entity.targetPosition = undefined;
        entity.speed = entity.targetSpeed;
        console.log(`Reset forklift ${entity.id} to failsafe position after error`);
      }
    } else {
      // For other entities, use lane-based reset
      const allLanes = this.laneNavigator.getAllLanes();
      const randomLane = allLanes[Math.floor(Math.random() * allLanes.length)];
      
      if (randomLane && randomLane.points[0]) {
        entity.currentLaneId = randomLane.id;
        entity.x = randomLane.points[0].x;
        entity.y = randomLane.points[0].y;
        entity.laneProgress = 0;
        entity.route = this.laneNavigator.generateRandomRoute(randomLane.id, 5);
        entity.routeIndex = 0;
      }
    }
  }

  private calculateLaneLength(lane: { points: Array<{ x: number; y: number }> }): number {
    let length = 0;
    for (let i = 0; i < lane.points.length - 1; i++) {
      const p1 = lane.points[i];
      const p2 = lane.points[i + 1];
      if (p1 && p2) {
        length += Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
      }
    }
    return Math.max(length, 1); // Avoid division by zero
  }
}
