import type { Entity, Pose, Alert } from './entities';

interface EntityState {
  entity: Entity;
  x: number;
  y: number;
  vx: number;
  vy: number;
  heading: number;
  currentAisle?: string;
  targetPosition?: { x: number; y: number };
  lastIntersection?: { x: number; y: number };
}

export class MockStream {
  private entities: EntityState[] = [];
  private poseCallbacks: ((poses: Pose[]) => void)[] = [];
  private alertCallbacks: ((alert: Alert) => void)[] = [];
  private intervalId: number | null = null;
  private lastAlertTime = 0;
  private width: number;
  private height: number;

  private aisleNetwork = {
    horizontal: [
      { y: 156, x1: 40, x2: 920, id: 'top-horizontal-line' },       // Top horizontal line (Storage Zone A level)
      { y: 224, x1: 40, x2: 920, id: 'middle-horizontal-line' },    // Middle horizontal line 
      { y: 292, x1: 40, x2: 920, id: 'bottom-horizontal-line' },    // Bottom horizontal line (Storage Zone B level)
    ],
    vertical: [
      { x: 40, y1: 50, y2: 390, id: 'left-boundary' },       // Left boundary
      { x: 190, y1: 50, y2: 390, id: 'vertical-line-1' },    // Between first storage zones
      { x: 330, y1: 50, y2: 390, id: 'vertical-line-2' },    // Between second storage zones
      { x: 470, y1: 50, y2: 390, id: 'vertical-line-3' },    // Between third storage zones
      { x: 610, y1: 50, y2: 390, id: 'vertical-line-4' },    // Between fourth storage zones
      { x: 750, y1: 50, y2: 390, id: 'vertical-line-5' },    // Between fifth storage zones
      { x: 890, y1: 50, y2: 390, id: 'right-boundary' },     // Right boundary
    ]
  };

  constructor(width = 1000, height = 500) {
    this.width = width;
    this.height = height;
    this.initializeEntities();
  }

  private initializeEntities(): void {
    const entities: Entity[] = [
      { id: "F001", type: "FORKLIFT", label: "FL-001" },
      { id: "F002", type: "FORKLIFT", label: "FL-002" },
      { id: "F003", type: "FORKLIFT", label: "FL-003" },
      { id: "W001", type: "WORKER", label: "WK-001" },
      { id: "W002", type: "WORKER", label: "WK-002" },
      { id: "P001", type: "PALLET", label: "PL-001" },
      { id: "P002", type: "PALLET", label: "PL-002" },
      { id: "P003", type: "PALLET", label: "PL-003" },
    ];

    this.entities = entities.map((entity, index) => {
      let x, y, vx = 0, vy = 0, currentAisle;
      
      if (entity.type === "FORKLIFT") {
        // Assign specific movement patterns to forklifts for better demonstration
        if (index === 0) {
          // Forklift 1 - primarily vertical movement
          const vAisle = this.aisleNetwork.vertical[1]; // Second vertical aisle
          x = vAisle.x;
          y = vAisle.y1 + Math.random() * (vAisle.y2 - vAisle.y1);
          vy = 40; // Start moving vertically
          currentAisle = 'V1';
        } else if (index === 1) {
          // Forklift 2 - primarily horizontal movement
          const hAisle = this.aisleNetwork.horizontal[1]; // Cross horizontal path (new one)
          x = hAisle.x1 + Math.random() * (hAisle.x2 - hAisle.x1);
          y = hAisle.y;
          vx = 40; // Start moving horizontally
          currentAisle = 'H1';
        } else {
          // Forklift 3 - mixed movement on another path
          const hAisle = this.aisleNetwork.horizontal[2]; // Main horizontal path
          x = hAisle.x1 + Math.random() * (hAisle.x2 - hAisle.x1);
          y = hAisle.y;
          vx = -40; // Start moving horizontally in opposite direction
          currentAisle = 'H2';
        }
      } else {
        // Place other entities randomly but away from main paths
        x = Math.random() * (this.width - 100) + 50;
        y = Math.random() * (this.height - 100) + 50;
      }

      return {
        entity,
        x,
        y,
        vx,
        vy,
        heading: Math.random() * 360,
        currentAisle,
      };
    });
  }

  private findNearestAisle(x: number, y: number): string {
    let nearest = "";
    let minDistance = Infinity;

    // Check horizontal aisles
    this.aisleNetwork.horizontal.forEach((aisle, index) => {
      if (x >= aisle.x1 && x <= aisle.x2) {
        const distance = Math.abs(y - aisle.y);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = `H${index}`;
        }
      }
    });

    // Check vertical aisles
    this.aisleNetwork.vertical.forEach((aisle, index) => {
      if (y >= aisle.y1 && y <= aisle.y2) {
        const distance = Math.abs(x - aisle.x);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = `V${index}`;
        }
      }
    });

    return nearest || "H0";
  }

  private updatePositions(): void {
    const now = Date.now();

    this.entities.forEach(entity => {
      if (entity.entity.type === "FORKLIFT") {
        this.updateForkliftPosition(entity, 0.1);
      } else {
        this.updateRegularEntityPosition(entity, 0.1);
      }
    });

    // Emit pose updates
    const poses: Pose[] = this.entities.map(e => ({
      entityId: e.entity.id,
      t: now,
      x: e.x,
      y: e.y,
      heading: e.heading,
      speed: Math.sqrt(e.vx * e.vx + e.vy * e.vy),
    }));

    this.poseCallbacks.forEach(callback => callback(poses));

    // Occasionally generate alerts
    if (now - this.lastAlertTime > 5000 + Math.random() * 10000) {
      this.generateRandomAlert();
      this.lastAlertTime = now;
    }
  }

  private updateForkliftPosition(entity: EntityState, dt: number): void {
    const currentAisle = entity.currentAisle || this.findNearestAisle(entity.x, entity.y);
    const baseSpeed = 40; // Increased base speed for more continuous movement
    
    // Constrain movement to current aisle with improved continuous logic
    if (currentAisle.startsWith('H')) {
      // Horizontal aisle - move mainly horizontally with continuous movement
      const aisleIndex = parseInt(currentAisle.substring(1));
      const aisle = this.aisleNetwork.horizontal[aisleIndex];
      
      if (aisle) {
        const aisleY = aisle.y;
        
        // Smooth correction towards aisle center
        const yDiff = aisleY - entity.y;
        if (Math.abs(yDiff) > 3) {
          entity.vy = yDiff * 0.4; // Smooth correction
        } else {
          entity.vy = 0; // Stop correcting when very close
          entity.y = aisleY; // Snap to exact aisle position
        }
        
        // Ensure continuous horizontal movement
        if (Math.abs(entity.vx) < baseSpeed * 0.7) {
          entity.vx = entity.vx >= 0 ? baseSpeed : -baseSpeed;
        }
        
        // Check for intersections with vertical aisles (reduced chance to turn for more continuous movement)
        this.aisleNetwork.vertical.forEach((vAisle, vIndex) => {
          const distanceToIntersection = Math.abs(entity.x - vAisle.x);
          if (distanceToIntersection < 20 && Math.abs(entity.y - aisleY) < 10) {
            // Reduced chance to turn - only 2% per frame for more continuous movement
            if (Math.random() < 0.02) { 
              entity.currentAisle = `V${vIndex}`;
              entity.vx = 0;
              entity.vy = Math.random() > 0.5 ? baseSpeed : -baseSpeed;
              entity.x = vAisle.x; // Snap to exact intersection
              return;
            }
          }
        });
        
        // Reverse at aisle boundaries with smoother transitions
        if (entity.x <= aisle.x1 + 15) {
          entity.vx = baseSpeed; // Move right
          entity.x = aisle.x1 + 15; // Prevent going out of bounds
        } else if (entity.x >= aisle.x2 - 15) {
          entity.vx = -baseSpeed; // Move left
          entity.x = aisle.x2 - 15; // Prevent going out of bounds
        }
      }
    } else if (currentAisle.startsWith('V')) {
      // Vertical aisle - move mainly vertically with continuous movement
      const aisleIndex = parseInt(currentAisle.substring(1));
      const aisle = this.aisleNetwork.vertical[aisleIndex];
      
      if (aisle) {
        const aisleX = aisle.x;
        
        // Smooth correction towards aisle center
        const xDiff = aisleX - entity.x;
        if (Math.abs(xDiff) > 3) {
          entity.vx = xDiff * 0.4; // Smooth correction
        } else {
          entity.vx = 0; // Stop correcting when very close
          entity.x = aisleX; // Snap to exact aisle position
        }
        
        // Ensure continuous vertical movement
        if (Math.abs(entity.vy) < baseSpeed * 0.7) {
          entity.vy = entity.vy >= 0 ? baseSpeed : -baseSpeed;
        }
        
        // Check for intersections with horizontal aisles (reduced chance to turn)
        this.aisleNetwork.horizontal.forEach((hAisle, hIndex) => {
          const distanceToIntersection = Math.abs(entity.y - hAisle.y);
          if (distanceToIntersection < 20 && Math.abs(entity.x - aisleX) < 10) {
            // Reduced chance to turn - only 2% per frame for more continuous movement
            if (Math.random() < 0.02) { 
              entity.currentAisle = `H${hIndex}`;
              entity.vy = 0;
              entity.vx = Math.random() > 0.5 ? baseSpeed : -baseSpeed;
              entity.y = hAisle.y; // Snap to exact intersection
              return;
            }
          }
        });
        
        // Reverse at aisle boundaries with smoother transitions
        if (entity.y <= aisle.y1 + 15) {
          entity.vy = baseSpeed; // Move down
          entity.y = aisle.y1 + 15; // Prevent going out of bounds
        } else if (entity.y >= aisle.y2 - 15) {
          entity.vy = -baseSpeed; // Move up
          entity.y = aisle.y2 - 15; // Prevent going out of bounds
        }
      }
    }

    // Apply movement with consistent time scaling
    entity.x += entity.vx * dt * 8; // Consistent movement scaling
    entity.y += entity.vy * dt * 8;

    // Keep within map bounds with margin
    entity.x = Math.max(30, Math.min(this.width - 30, entity.x));
    entity.y = Math.max(30, Math.min(this.height - 30, entity.y));

    // Update heading based on movement direction (more responsive)
    if (Math.abs(entity.vx) > 5) {
      entity.heading = entity.vx > 0 ? 0 : 180; // Right or left
    } else if (Math.abs(entity.vy) > 5) {
      entity.heading = entity.vy > 0 ? 90 : 270; // Down or up
    }

    // Update current aisle
    entity.currentAisle = currentAisle;
  }

  private updateRegularEntityPosition(entity: EntityState, dt: number): void {
    // Update position
    entity.x += entity.vx * dt;
    entity.y += entity.vy * dt;

    // Bounce off walls
    if (entity.x <= 0 || entity.x >= this.width) {
      entity.vx *= -1;
      entity.x = Math.max(0, Math.min(this.width, entity.x));
    }
    if (entity.y <= 0 || entity.y >= this.height) {
      entity.vy *= -1;
      entity.y = Math.max(0, Math.min(this.height, entity.y));
    }

    // Update heading based on velocity
    if (entity.vx !== 0 || entity.vy !== 0) {
      entity.heading = Math.atan2(entity.vy, entity.vx) * (180 / Math.PI);
    }

    // Add some random movement variation
    entity.vx += (Math.random() - 0.5) * 0.1;
    entity.vy += (Math.random() - 0.5) * 0.1;

    // Limit speed based on entity type
    const maxSpeed = entity.entity.type === "WORKER" ? 2 : 1;
    const speed = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
    if (speed > maxSpeed) {
      entity.vx = (entity.vx / speed) * maxSpeed;
      entity.vy = (entity.vy / speed) * maxSpeed;
    }
  }

  private generateRandomAlert(): void {
    const alertTypes: Alert['kind'][] = ["CONGESTION", "BLOCKED_AISLE", "SPEEDING", "NEAR_COLLISION"];
    const kind = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    
    const alert: Alert = {
      id: `alert-${Date.now()}`,
      t: Date.now(),
      kind,
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      meta: {
        severity: Math.random() > 0.5 ? 'HIGH' : 'MEDIUM'
      }
    };

    this.alertCallbacks.forEach(callback => callback(alert));
  }

  onPoses(callback: (poses: Pose[]) => void): void {
    this.poseCallbacks.push(callback);
  }

  onAlert(callback: (alert: Alert) => void): void {
    this.alertCallbacks.push(callback);
  }

  start(): void {
    if (this.intervalId !== null) return;

    this.intervalId = window.setInterval(() => {
      this.updatePositions();
    }, 100); // 10 FPS
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
