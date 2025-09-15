import type { KPIMetrics } from '../../data/entities';

interface KPIProps {
  metrics: KPIMetrics;
  showDetailed?: boolean;
}

interface KPITileProps {
  title: string;
  value: string | number;
  trend?: number; // Positive = up, negative = down
  good?: 'up' | 'down'; // Whether up or down is good
  info?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function KPITile({ 
  title, 
  value, 
  trend, 
  good = 'up', 
  info,
  size = 'md'
}: KPITileProps) {
  // Determine trend color - green if trend is in the "good" direction, red if not
  const getTrendColor = () => {
    if (trend === undefined) return 'text-gray-400';
    
    if ((trend > 0 && good === 'up') || (trend < 0 && good === 'down')) {
      return 'text-emerald-400';
    }
    
    return 'text-red-400';
  };
  
  // Get trend icon
  const getTrendIcon = () => {
    if (trend === undefined) return null;
    
    if (trend > 0) {
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }
    
    if (trend < 0) {
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
    }
    
    return null;
  };
  
  // Format trend value as percentage
  const formatTrend = () => {
    if (trend === undefined) return null;
    return `${Math.abs(trend)}%`;
  };
  
  // Determine size classes
  const titleSize = size === 'lg' ? 'text-base' : 'text-sm';
  const valueSize = size === 'lg' ? 'text-3xl' : (size === 'md' ? 'text-2xl' : 'text-xl');
  const padding = size === 'sm' ? 'p-3' : 'p-4';
  
  return (
    <div className={`bg-gray-800 rounded-lg shadow-md border border-gray-700 ${padding}`}>
      <div className="flex justify-between items-start">
        <h3 className={`${titleSize} text-gray-400 font-medium`}>{title}</h3>
        {info && (
          <div className="text-gray-500 hover:text-gray-400 cursor-help" title={info}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
      </div>
      
      <div className="mt-1 mb-2">
        <div className={`${valueSize} font-bold text-white`}>
          {value}
        </div>
      </div>
      
      {trend !== undefined && (
        <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="text-sm font-medium">{formatTrend()}</span>
        </div>
      )}
    </div>
  );
}

export function KPIDashboard({ metrics, showDetailed = false }: KPIProps) {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Efficiency */}
                {/* Efficiency */}
        <KPITile
          title="Efficiency"
          value={`${metrics.efficiency.toFixed(2)}%`}
          trend={1}
          good="up"
          info="Overall warehouse efficiency rating"
        />
        
        {/* Throughput */}
        <KPITile
          title="Throughput"
          value={`${metrics.throughput} units/h`}
          trend={1.8}
          good="up"
          info="Units processed per hour"
          size="lg"
        />
        
        {/* Route Completion */}
        <KPITile
          title="Avg. Route Time"
          value={`${Math.round(metrics.routeCompletionTime / 60)} min`}
          trend={-5.1}
          good="down"
          info="Average task route completion time"
        />
        
        {/* System Latency */}
        <KPITile
          title="System Latency"
          value={`${metrics.systemLatency} ms`}
          trend={2.3}
          good="down"
          info="Average tracking system latency"
        />
        
        {/* If detailed view is enabled, show additional KPIs */}
        {showDetailed && (
          <>
            {/* Congestion Events */}
            <KPITile
              title="Congestion"
              value={metrics.congestionEvents}
              trend={-8.5}
              good="down"
              info="Number of congestion events in the last hour"
              size="sm"
            />
            
            {/* Compliance */}
            <KPITile
              title="Compliance Issues"
              value={metrics.complianceIncidents}
              trend={-12.0}
              good="down"
              info="Zone breaches and other compliance issues"
              size="sm"
            />
            
            {/* Rerouting */}
            <KPITile
              title="Reroute Success"
              value={`${metrics.reroutingEffectiveness}%`}
              trend={4.3}
              good="up"
              info="Percentage of successful rerouting actions"
              size="sm"
            />
            
            {/* Distance */}
            <KPITile
              title="Total Distance"
              value={`${Math.round(metrics.travelDistance)} m`}
              info="Total distance traveled by all entities"
              size="sm"
            />
          </>
        )}
      </div>
    </div>
  );
}
