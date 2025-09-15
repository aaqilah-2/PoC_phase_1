import { useState, useEffect, useCallback } from 'react';
import { WarehouseDashboard } from './components/WarehouseDashboard';
import { MockStream } from './data/mockStream';
import { snapToNearestPath, isOnValidPath } from './utils/pathValidation';
import type { Pose, Alert, Task, KPIMetrics, TimelineEvent } from './data/entities';
import { generateMockAlerts, generateMockTasks, generateMockKPIMetrics, generateMockTimelineEvents } from './data/mock/mockData';

// Constants for warehouse dimensions
const WAREHOUSE_WIDTH = 40;  // meters
const WAREHOUSE_HEIGHT = 20; // meters

// Create a pose history buffer for heatmap generation
class PoseHistory {
  private buffer: Pose[] = [];
  private readonly maxAge = 60000; // 1 minute

  add(poses: Pose[]): void {
    const now = Date.now();
    this.buffer.push(...poses);
    // Remove old poses
    this.buffer = this.buffer.filter(pose => now - pose.t < this.maxAge);
  }

  getAll(): Pose[] {
    return [...this.buffer];
  }

  clear(): void {
    this.buffer = [];
  }
}

export default function App() {
  // State management - with error handling
  const [currentPoses, setCurrentPoses] = useState<Pose[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetrics>(() => {
    try {
      return generateMockKPIMetrics();
    } catch (error) {
      console.error('Error generating mock KPI metrics:', error);
      return {
        routeCompletionTime: 320,
        travelDistance: 1250,
        congestionEvents: 3,
        dwellTime: { 'zone-A': 120, 'zone-B': 180, 'zone-C': 90, 'zone-D': 150 },
        systemLatency: 120,
        reroutingEffectiveness: 85,
        complianceIncidents: 2,
        operatorSatisfaction: 78,
        throughput: 42,
        efficiency: 82
      };
    }
  });
  const [mockStream] = useState(() => {
    try {
      return new MockStream(WAREHOUSE_WIDTH, WAREHOUSE_HEIGHT);
    } catch (error) {
      console.error('Error creating MockStream:', error);
      return null;
    }
  });
  const [poseHistory] = useState(() => new PoseHistory());

  // Handle incoming poses from mock stream with path validation
  const handlePoses = useCallback((poses: Pose[]) => {
    // Apply path validation for forklift entities
    const validatedPoses = poses.map(pose => {
      if (pose.entityId.startsWith('forklift')) {
        // Check if forklift is on a valid path
        if (!isOnValidPath({ x: pose.x, y: pose.y }, 0.5)) {
          // Snap to nearest valid path
          const snappedPos = snapToNearestPath({ x: pose.x, y: pose.y }, 2.0);
          return {
            ...pose,
            x: snappedPos.x,
            y: snappedPos.y
          };
        }
      }
      return pose;
    });

    setCurrentPoses(validatedPoses);
    poseHistory.add(validatedPoses);
  }, [poseHistory]);

  // Handle alerts from mock stream
  const handleAlert = useCallback((alert: Alert) => {
    setAlerts(prev => [alert, ...prev].slice(0, 10)); // Keep last 10 alerts
  }, []);

  // Initialize mock data and setup mock stream
  useEffect(() => {
    try {
      // Generate initial mock data
      setTasks(generateMockTasks());
      setAlerts(generateMockAlerts());
      setTimelineEvents(generateMockTimelineEvents());
      
      // Setup mock stream event handlers if available
      if (mockStream) {
        mockStream.onPoses(handlePoses);
        mockStream.onAlert(handleAlert);
        mockStream.start();
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    }

    // Cleanup on unmount
    return () => {
      if (mockStream) {
        mockStream.stop();
      }
    };
  }, [mockStream, handlePoses, handleAlert]);

  // Update KPI metrics periodically
  useEffect(() => {
    const timer = setInterval(() => {
      setKpiMetrics(prevMetrics => {
        // Update a few metrics to simulate real-time changes
        return {
          ...prevMetrics,
          routeCompletionTime: prevMetrics.routeCompletionTime + (Math.random() * 2 - 1),
          throughput: Math.max(30, Math.min(60, prevMetrics.throughput + (Math.random() * 2 - 1))),
          efficiency: Math.max(75, Math.min(95, prevMetrics.efficiency + (Math.random() * 0.5 - 0.25)))
        };
      });
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  // Handle task status updates
  const handleTaskUpdate = useCallback((taskId: string, status: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: status as Task['status'] } : task
    ));
  }, []);

  // Handle task assignment
  const handleTaskAssign = useCallback((taskId: string, entityId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, assignedEntityId: entityId, status: 'ASSIGNED', assignedAt: Date.now() } : task
    ));
  }, []);

  // Handle alert acknowledgment
  const handleAlertAcknowledge = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  }, []);

  // Handle alert resolution
  const handleAlertResolve = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true, resolvedAt: Date.now() } : alert
    ));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 overflow-hidden">
      <div className="error-boundary">
        <WarehouseDashboard
          poses={currentPoses}
          alerts={alerts}
          tasks={tasks}
          events={timelineEvents}
          kpiMetrics={kpiMetrics}
          onAlertAcknowledge={handleAlertAcknowledge}
          onAlertResolve={handleAlertResolve}
          onTaskUpdate={handleTaskUpdate}
          onTaskAssign={handleTaskAssign}
        />
      </div>
    </div>
  );
}
