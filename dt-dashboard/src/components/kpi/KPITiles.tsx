import type { KPIMetrics } from '../../data/entities';

interface KPITilesProps {
  metrics: KPIMetrics;
  onExport?: () => void;
}

export function KPITiles({ metrics, onExport }: KPITilesProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const renderTooltip = (title: string, description: string) => {
    return (
      <div className="group relative cursor-help">
        <span className="text-gray-500 ml-1">ⓘ</span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-50 w-48">
          <div className="font-bold mb-1">{title}</div>
          <div>{description}</div>
          <div className="absolute left-1/2 transform -translate-x-1/2 top-full w-2 h-2 rotate-45 bg-gray-900"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-blue-300 uppercase tracking-wider">
          KPI Metrics
        </h3>
        <button
          onClick={onExport}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-md flex items-center gap-1"
        >
          <span>Export</span>
          <span className="text-xs">↓</span>
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Efficiency */}
        <div className="bg-gray-700 rounded-md p-3">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center">
              <span className="text-sm text-emerald-400 font-medium">Efficiency</span>
              {renderTooltip("Efficiency", "Higher = shorter routes, fewer jams, effective reroutes")}
            </div>
            <span className="text-2xl font-bold text-white">{metrics.efficiency.toFixed(2)}%</span>
          </div>
          <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500" 
              style={{ width: `${metrics.efficiency.toFixed(2)}%` }}
            />
          </div>
        </div>
        
        {/* Throughput */}
        <div className="bg-gray-700 rounded-md p-3">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center">
              <span className="text-sm text-blue-400 font-medium">Throughput</span>
              {renderTooltip("Throughput", "Units completed per hour (tasks/pallets)")}
            </div>
            <span className="text-2xl font-bold text-white">{metrics.throughput}</span>
          </div>
          <div className="text-xs text-gray-400 text-right">units/hr</div>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* Route Completion Time */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center">
              <span className="text-sm text-gray-300">Route Completion Time</span>
              {renderTooltip("Route Completion Time", "Average time to complete a task route")}
            </div>
            <span className="text-base font-bold text-blue-300">{formatTime(metrics.routeCompletionTime)}</span>
          </div>
          <div className="h-1.5 bg-gray-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500" 
              style={{ width: `${Math.min(100, metrics.routeCompletionTime / 3)}%` }}
            />
          </div>
        </div>
        
        {/* Travel Distance */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center">
              <span className="text-sm text-gray-300">Travel Distance</span>
              {renderTooltip("Travel Distance", "Total distance traveled by all entities")}
            </div>
            <span className="text-base font-bold text-blue-300">{Math.round(metrics.travelDistance)} m</span>
          </div>
        </div>
        
        {/* Congestion Events */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center">
              <span className="text-sm text-gray-300">Congestion Events</span>
              {renderTooltip("Congestion Events", "Number of detected congestion events")}
            </div>
            <span className="text-base font-bold text-amber-300">{metrics.congestionEvents}</span>
          </div>
        </div>
        
        {/* System Latency */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center">
              <span className="text-sm text-gray-300">System Latency</span>
              {renderTooltip("System Latency", "Event→UI time. Target < 5s (p95)")}
            </div>
            <span className={`text-base font-bold ${metrics.systemLatency > 5000 ? 'text-red-300' : 'text-green-300'}`}>
              {Math.round(metrics.systemLatency)} ms
            </span>
          </div>
          <div className="h-1.5 bg-gray-600 rounded-full overflow-hidden">
            <div 
              className={`h-full ${metrics.systemLatency > 5000 ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(100, metrics.systemLatency / 50)}%` }}
            />
          </div>
        </div>
        
        {/* Rerouting Effectiveness */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center">
              <span className="text-sm text-gray-300">Rerouting Effectiveness</span>
              {renderTooltip("Rerouting Effectiveness", "% of blockages successfully avoided")}
            </div>
            <span className="text-base font-bold text-blue-300">{Math.round(metrics.reroutingEffectiveness)}%</span>
          </div>
          <div className="h-1.5 bg-gray-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500" 
              style={{ width: `${metrics.reroutingEffectiveness}%` }}
            />
          </div>
        </div>
        
        {/* Compliance Incidents */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center">
              <span className="text-sm text-gray-300">Compliance Incidents</span>
              {renderTooltip("Compliance Incidents", "Zone breaches and other compliance violations")}
            </div>
            <span className={`text-base font-bold ${metrics.complianceIncidents > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
              {metrics.complianceIncidents}
            </span>
          </div>
        </div>
        
        {/* Dwell Time by Zone */}
        <div>
          <div className="mb-1">
            <div className="flex items-center">
              <span className="text-sm text-gray-300">Dwell Time by Zone</span>
              {renderTooltip("Dwell Time", "Average time spent in each zone")}
            </div>
          </div>
          <div className="space-y-1 text-xs">
            {Object.entries(metrics.dwellTime).map(([zone, time]) => (
              <div key={zone} className="flex justify-between items-center">
                <span className="text-gray-400">{zone}</span>
                <span className="text-gray-300">{Math.round(time)} sec</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Success criteria card */}
      <div className="mt-5 bg-gray-900 border border-gray-700 rounded-md p-3">
        <h4 className="text-sm font-semibold text-blue-300 mb-2">Success Targets</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Latency</span>
            <span className={metrics.systemLatency < 5000 ? 'text-emerald-400' : 'text-red-400'}>
              {metrics.systemLatency < 5000 ? '✓' : '✗'} &lt; 5s
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">UWB Accuracy</span>
            <span className="text-blue-400">10-30 cm in Sensor Mode</span>
          </div>
        </div>
      </div>
    </div>
  );
}
