import { useState } from 'react';
import type { Alert, AlertKind } from '../../data/entities';

interface AlertsPanelProps {
  alerts: Alert[];
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  onFilter?: (filter: AlertFilter) => void;
}

interface AlertFilter {
  types: AlertKind[];
  zones: string[];
  assets: string[];
  onlyUnacknowledged: boolean;
  onlyUnresolved: boolean;
}

export function AlertsPanel({ alerts, onAcknowledge, onResolve, onFilter }: AlertsPanelProps) {
  const [filter, setFilter] = useState<AlertFilter>({
    types: [],
    zones: [],
    assets: [],
    onlyUnacknowledged: false,
    onlyUnresolved: true
  });
  
  const [showFilters, setShowFilters] = useState(false);
  
  // Format timestamp to readable time
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };
  
  // Get unique zones from alerts
  const uniqueZones = Array.from(new Set(
    alerts.map(alert => alert.meta?.zone as string).filter(Boolean)
  ));
  
  // Get unique asset IDs from alerts
  const uniqueAssets = Array.from(new Set(
    alerts.map(alert => alert.meta?.entityId as string).filter(Boolean)
  ));
  
  // Get unique alert types
  const uniqueTypes = Array.from(new Set(
    alerts.map(alert => alert.kind)
  )) as AlertKind[];
  
  // Get icon for alert type
  const getAlertIcon = (kind: Alert['kind']): string => {
    switch (kind) {
      case 'CONGESTION': return '🚧';
      case 'BLOCKED_AISLE': return '🚫';
      case 'SPEEDING': return '⚡';
      case 'NEAR_COLLISION': return '⚠️';
      case 'ZONE_BREACH': return '🚷';
      case 'DWELL_EXCEEDED': return '⏱️';
      default: return '⚠️';
    }
  };
  
  // Apply filters to alerts
  const filteredAlerts = alerts.filter(alert => {
    // Filter by type
    if (filter.types.length > 0 && !filter.types.includes(alert.kind)) {
      return false;
    }
    
    // Filter by zone
    if (filter.zones.length > 0 && !filter.zones.includes(alert.meta?.zone as string)) {
      return false;
    }
    
    // Filter by asset
    if (filter.assets.length > 0 && !filter.assets.includes(alert.meta?.entityId as string)) {
      return false;
    }
    
    // Filter by acknowledgement status
    if (filter.onlyUnacknowledged && alert.acknowledged) {
      return false;
    }
    
    // Filter by resolution status
    if (filter.onlyUnresolved && alert.resolved) {
      return false;
    }
    
    return true;
  });
  
  // Handle filter change
  const handleFilterChange = (newFilter: Partial<AlertFilter>) => {
    const updatedFilter = { ...filter, ...newFilter };
    setFilter(updatedFilter);
    
    if (onFilter) {
      onFilter(updatedFilter);
    }
  };
  
  // Toggle filter for a specific value
  const toggleFilter = (key: keyof AlertFilter, value: any) => {
    if (key === 'onlyUnacknowledged' || key === 'onlyUnresolved') {
      handleFilterChange({ [key]: !filter[key] });
      return;
    }
    
    const currentValues = filter[key] as any[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
      
    handleFilterChange({ [key]: newValues });
  };
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-amber-300 uppercase tracking-wider">
          Alerts
        </h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-md flex items-center gap-1"
        >
          <span>Filter</span>
          <span className="text-xs">{showFilters ? '▲' : '▼'}</span>
        </button>
      </div>
      
      {/* Filter panel */}
      {showFilters && (
        <div className="mb-4 bg-gray-700 rounded-md p-3 text-sm">
          <h4 className="font-medium text-gray-300 mb-2">Filter Alerts</h4>
          
          {/* Alert types filter */}
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">Alert Types</div>
            <div className="flex flex-wrap gap-2">
              {uniqueTypes.map(type => (
                <button
                  key={type}
                  className={`px-2 py-1 rounded-md text-xs ${
                    filter.types.includes(type) 
                      ? 'bg-amber-700 text-amber-100' 
                      : 'bg-gray-600 text-gray-300'
                  }`}
                  onClick={() => toggleFilter('types', type)}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          
          {/* Zones filter */}
          {uniqueZones.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-gray-400 mb-1">Zones</div>
              <div className="flex flex-wrap gap-2">
                {uniqueZones.map(zone => (
                  <button
                    key={zone}
                    className={`px-2 py-1 rounded-md text-xs ${
                      filter.zones.includes(zone) 
                        ? 'bg-blue-700 text-blue-100' 
                        : 'bg-gray-600 text-gray-300'
                    }`}
                    onClick={() => toggleFilter('zones', zone)}
                  >
                    {zone}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Assets filter */}
          {uniqueAssets.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-gray-400 mb-1">Assets</div>
              <div className="flex flex-wrap gap-2">
                {uniqueAssets.map(asset => (
                  <button
                    key={asset}
                    className={`px-2 py-1 rounded-md text-xs ${
                      filter.assets.includes(asset) 
                        ? 'bg-emerald-700 text-emerald-100' 
                        : 'bg-gray-600 text-gray-300'
                    }`}
                    onClick={() => toggleFilter('assets', asset)}
                  >
                    {asset}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Status filters */}
          <div className="flex gap-3 mt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filter.onlyUnacknowledged}
                onChange={() => toggleFilter('onlyUnacknowledged', null)}
                className="rounded text-amber-500 focus:ring-amber-500"
              />
              <span className="text-xs text-gray-300">Unacknowledged only</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filter.onlyUnresolved}
                onChange={() => toggleFilter('onlyUnresolved', null)}
                className="rounded text-amber-500 focus:ring-amber-500"
              />
              <span className="text-xs text-gray-300">Unresolved only</span>
            </label>
          </div>
          
          {/* Clear filters */}
          <div className="flex justify-end mt-3">
            <button
              className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-xs text-gray-300 rounded"
              onClick={() => handleFilterChange({
                types: [],
                zones: [],
                assets: [],
                onlyUnacknowledged: false,
                onlyUnresolved: true
              })}
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
      
      {/* Alerts list */}
      {filteredAlerts.length === 0 ? (
        <div className="text-gray-500 text-sm italic p-4 text-center">
          No alerts matching the current filters
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`border ${
                alert.acknowledged ? 'border-gray-700 bg-gray-800' : 'border-amber-900 bg-amber-950'
              } rounded-md p-3 ${alert.resolved ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg" role="img" aria-label={alert.kind}>
                  {getAlertIcon(alert.kind)}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-amber-400">
                      {alert.kind.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatTime(alert.t)}
                    </div>
                  </div>
                  
                  <div className="text-xs text-amber-300 mt-1">
                    Location: ({alert.x.toFixed(1)}, {alert.y.toFixed(1)})m
                  </div>
                  
                  {typeof alert.meta?.entityId === 'string' && (
                    <div className="text-xs text-gray-400">
                      Entity: {alert.meta.entityId}
                    </div>
                  )}
                  
                  {typeof alert.meta?.zone === 'string' && (
                    <div className="text-xs text-gray-400">
                      Zone: {alert.meta.zone}
                    </div>
                  )}
                  
                  {typeof alert.meta?.severity === 'string' && (
                    <div className="text-xs text-gray-400">
                      Severity: {alert.meta.severity}
                    </div>
                  )}
                  
                  {/* Alert actions */}
                  {!alert.resolved && (
                    <div className="flex justify-end gap-2 mt-2">
                      {!alert.acknowledged && onAcknowledge && (
                        <button
                          onClick={() => onAcknowledge(alert.id)}
                          className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-xs text-gray-300 rounded"
                        >
                          Acknowledge
                        </button>
                      )}
                      
                      {onResolve && (
                        <button
                          onClick={() => onResolve(alert.id)}
                          className="px-2 py-1 bg-amber-700 hover:bg-amber-600 text-xs text-amber-100 rounded"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Resolution details */}
                  {alert.resolved && (
                    <div className="text-xs text-gray-500 mt-1 italic">
                      Resolved by {alert.resolvedBy || 'System'} at {formatTime(alert.resolvedAt || 0)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Summary stats */}
      <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400 flex justify-between">
        <div>Total: {alerts.length}</div>
        <div>Unacknowledged: {alerts.filter(a => !a.acknowledged).length}</div>
        <div>Unresolved: {alerts.filter(a => !a.resolved).length}</div>
      </div>
    </div>
  );
}
