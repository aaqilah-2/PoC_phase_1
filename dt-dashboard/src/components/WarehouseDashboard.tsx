import { useState, useCallback, useEffect } from 'react';
import { WarehouseMap } from './map/WarehouseMap';
import { TaskDashboard } from './tasks/TaskDashboard';
import { DataSourceSwitcher } from './ui/DataSourceSwitcher';
import { HeatmapToggle } from './ui/HeatmapToggle';
import HistoryDashboard from './HistoryDashboard';
import AlertSystem from './AlertSystem';
import type { Pose, Alert, Task, KPIMetrics, TimelineEvent } from '../data/entities';
import type { DataSourceMode } from './ui/DataSourceSwitcher';

// Dashboard layout constants
const WAREHOUSE_WIDTH = 40;  // meters
const WAREHOUSE_HEIGHT = 20; // meters
const CELL_SIZE = 25;       // pixels per meter

interface WarehouseDashboardProps {
  poses?: Pose[];
  alerts?: Alert[];
  tasks?: Task[];
  events?: TimelineEvent[];
  kpiMetrics?: KPIMetrics;
  onAlertAcknowledge?: (alertId: string) => void;
  onAlertResolve?: (alertId: string) => void;
  onTaskUpdate?: (taskId: string, status: string) => void;
  onTaskAssign?: (taskId: string, entityId: string) => void;
}

export function WarehouseDashboard({
  poses = [], // Default to empty array
  alerts = [], // Default to empty array
  tasks = [], // Default to empty array
  kpiMetrics = { // Default KPI metrics
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
  },
  onTaskUpdate,
  onTaskAssign
}: WarehouseDashboardProps) {
  // Debug logging
  console.log('WarehouseDashboard rendering with:', { poses: poses?.length, alerts: alerts?.length, tasks: tasks?.length });
  
  // Dashboard state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showRoutes] = useState(true);
  const [showTaskPanel] = useState(false);
  const [showHistoryDashboard, setShowHistoryDashboard] = useState(false);
  const [showAlertSystem, setShowAlertSystem] = useState(false);
  
  // Live metrics calculation
  const [taskCompletionCount, setTaskCompletionCount] = useState(0);

  // Handle data source mode change
  const handleDataSourceModeChange = useCallback((mode: DataSourceMode) => {
    console.log(`Data source switched to: ${mode}`);
  }, []);

  // Handle entity selection
  const handleEntitySelect = useCallback((entityId: string | null) => {
    console.log('Selected entity:', entityId);
  }, []);
  
  // Update task completion count when entities move (simulate task completion) with null safety
  useEffect(() => {
    const interval = setInterval(() => {
      if (poses && poses.length > 0) {
        // Simulate task completion based on forklift activity
        const activeForklifts = poses.filter(p => p.entityId.startsWith('forklift') && (p.speed || 0) > 0.1);
        if (activeForklifts.length > 0 && Math.random() < 0.25) { // 25% chance every 3 seconds
          setTaskCompletionCount(prev => prev + 1);
        }
      }
    }, 3000); // Check every 3 seconds
    
    return () => clearInterval(interval);
  }, [poses]);
  
  // Calculate dynamic efficiency based on forklift movement with null safety
  const calculateDynamicEfficiency = () => {
    try {
      if (!poses || poses.length === 0) return kpiMetrics?.efficiency || 80;
      
      const forklifts = poses.filter(p => p?.entityId?.startsWith('forklift'));
      if (forklifts.length === 0) return kpiMetrics?.efficiency || 80;
      
      // Base efficiency on speed and activity
      const avgSpeed = forklifts.reduce((sum, f) => sum + (f?.speed || 0), 0) / forklifts.length;
      const speedFactor = Math.min(avgSpeed * 10, 1); // normalize to 0-1
      const baseEfficiency = 45 + (speedFactor * 40); // 45-85% range
      
      return Math.round(baseEfficiency);
    } catch (error) {
      console.error('Error calculating dynamic efficiency:', error);
      return kpiMetrics?.efficiency || 80;
    }
  };
  
  const dynamicEfficiency = calculateDynamicEfficiency();
  
  // Count entities by type for sidebar stats - kept for future use
  
  // Calculate congestion percentage with null safety
  const congestionZones = new Set(
    (alerts || [])
      .filter(a => a.kind === 'CONGESTION' && !a.resolved)
      .map(a => a.meta?.zoneId as string)
  );
  const totalZones = 12; // A1-A6, B1-B6
  const congestionPct = Math.round((congestionZones.size / totalZones) * 100);
  
  // Calculate completed tasks (use dynamic count + base tasks) with null safety
  const completedTasks = (tasks || []).filter(t => t.status === 'COMPLETED').length + taskCompletionCount;
  
  // Calculate average battery level with null safety
  const batteriesWithData = (poses || [])
    .filter(p => p.entityId.startsWith('forklift-'))
    .map(p => {
      // Mock battery data based on entity
      const entityNum = parseInt(p.entityId.split('-')[1]);
      return 85 - (entityNum * 7); // FL-001: 78%, FL-002: 71%
    });
  const avgBattery = batteriesWithData.length > 0 
    ? Math.round(batteriesWithData.reduce((a, b) => a + b, 0) / batteriesWithData.length)
    : 67;

  return (
    <div className="h-screen w-full flex bg-[#0D1426] text-white">
      {/* Left Sidebar */}
      <div className="w-80 bg-[#111726] border-r border-[#1E2747] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#1E2747]">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h1 className="text-xl font-bold text-blue-400">Warehouse Digital Twin</h1>
          </div>
        </div>
        
        <div className="p-4 border-b border-[#1E2747]">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">SYSTEM OVERVIEW</h2>
          
          {/* Efficiency KPI Tile */}
          <div className="bg-[#1A2035] rounded-lg p-4 mb-4">
            <div className="flex items-center mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-400 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-xs font-medium text-green-400">Efficiency</span>
            </div>
            <div className="text-3xl font-bold">{dynamicEfficiency}%</div>
          </div>
          
          {/* Battery KPI Tile */}
          <div className="bg-[#1A2035] rounded-lg p-4 mb-4">
            <div className="flex items-center mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-400 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7h-3V5a1 1 0 00-1-1H8a1 1 0 00-1 1v2H4a1 1 0 00-1 1v11a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1zm-3 2v2a1 1 0 001 1h1v3h-1a1 1 0 00-1 1v2H7v-2a1 1 0 00-1-1H5v-3h1a1 1 0 001-1V9h10z" />
              </svg>
              <span className="text-xs font-medium text-blue-400">Avg Battery</span>
            </div>
            <div className="text-3xl font-bold">{avgBattery}%</div>
          </div>
          
          {/* Tasks Done KPI Tile */}
          <div className="bg-[#1A2035] rounded-lg p-4 mb-4">
            <div className="flex items-center mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-yellow-500 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="text-xs font-medium text-yellow-500">Tasks Done</span>
            </div>
            <div className="text-3xl font-bold">{completedTasks}</div>
          </div>
          
          {/* Congestion KPI Tile */}
          <div className="bg-[#1A2035] rounded-lg p-4">
            <div className="flex items-center mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-xs font-medium text-red-500">Congestion</span>
            </div>
            <div className="text-3xl font-bold">{congestionPct}%</div>
          </div>
        </div>
        
        {/* Fleet Status Section */}
        <div className="p-4 overflow-y-auto">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">FLEET STATUS</h2>
          
          {/* Forklift status items - show exactly 2 as per requirements */}
          {Array.from({ length: 2 }).map((_, idx) => (
            <div key={`forklift-${idx}`} className="mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-green-500 text-xs px-2 py-0.5 rounded mr-2">OPERATIONAL</div>
                  <span className="font-semibold">FL-00{idx + 1}</span>
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-1">Storage Operations</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div className="bg-green-500 rounded-full h-2" style={{ width: `${85 - (idx * 7)}%` }}></div>
              </div>
              <div className="text-xs text-right text-gray-400 mt-1">{85 - (idx * 7)}%</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header bar */}
        <div className="bg-[#111726] border-b border-[#1E2747] p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-blue-400">Warehouse Operations Dashboard</h1>
              <p className="text-sm text-gray-400">Real-time monitoring and digital twin visualization</p>
            </div>
            <div className="flex space-x-3">
              {/* Data Source Control */}
              <div className="flex flex-col items-end">
                <div className="text-xs text-gray-400 mb-1">Data Source</div>
                <DataSourceSwitcher 
                  isConnected={poses.length > 0} 
                  onModeChange={handleDataSourceModeChange}
                />
              </div>

              {/* Heatmap Control */}
              <div className="flex flex-col items-end">
                <div className="text-xs text-gray-400 mb-1">Activity Heatmap</div>
                <HeatmapToggle 
                  showHeatmap={showHeatmap}
                  onToggle={setShowHeatmap}
                  activityCount={poses.filter(p => p.entityId.startsWith('forklift')).length}
                />
              </div>
              
              {/* Control Buttons - same height as other components */}
              <div className="flex space-x-2">
                <button 
                  onClick={() => setShowHistoryDashboard(true)}
                  className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <span>📊</span>
                  History
                </button>
                
                <button 
                  onClick={() => setShowAlertSystem(true)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 relative ${
                    alerts.filter(a => !a.resolved).length > 0 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  }`}
                >
                  <span>🚨</span>
                  Alerts
                  {alerts.filter(a => !a.resolved).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-yellow-500 text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {alerts.filter(a => !a.resolved).length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Map container */}
        <div className="flex-1 p-4">
                    <WarehouseMap
            width={WAREHOUSE_WIDTH}
            height={WAREHOUSE_HEIGHT}
            cellSize={CELL_SIZE}
            tasks={tasks || []}
            selectedTaskId={selectedTaskId}
            showHeatmap={showHeatmap}
            showRoutes={showRoutes}
            onSelectEntity={handleEntitySelect}
          />
        </div>

        {/* Task panel overlay */}
        {showTaskPanel && (
          <div className="absolute right-4 top-20 bottom-4 w-96 bg-[#111726] border border-[#1E2747] rounded-lg overflow-hidden">
            <TaskDashboard
              tasks={tasks || []}
              entities={(poses || []).map(p => ({ id: p.entityId, type: 'FORKLIFT' as const }))}
              onAssignTask={onTaskAssign}
              onUpdateTaskStatus={onTaskUpdate}
              onSelectTask={setSelectedTaskId}
              selectedTaskId={selectedTaskId}
            />
          </div>
        )}
      </div>

      {/* History Dashboard Modal */}
      <HistoryDashboard
        isVisible={showHistoryDashboard}
        onClose={() => setShowHistoryDashboard(false)}
      />

      {/* Alert System Modal */}
      <AlertSystem
        isVisible={showAlertSystem}
        onClose={() => setShowAlertSystem(false)}
      />
    </div>
  );
}
