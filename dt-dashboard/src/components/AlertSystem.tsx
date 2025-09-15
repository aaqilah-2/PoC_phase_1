import React, { useState, useEffect } from 'react';

interface Alert {
  id: string;
  timestamp: Date;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  zone?: string;
  forkliftId?: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface AlertSystemProps {
  isVisible: boolean;
  onClose: () => void;
}

const AlertSystem: React.FC<AlertSystemProps> = ({ isVisible, onClose }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'error' | 'warning' | 'info' | 'success'>('all');

  // Mock alert generation - in real app this would come from WebSocket/backend
  useEffect(() => {
    const generateMockAlert = () => {
      const alertTypes: Array<{ type: Alert['type'], priority: Alert['priority'], templates: Array<{ title: string, message: string }> }> = [
        {
          type: 'error',
          priority: 'critical',
          templates: [
            { title: 'Forklift Collision Risk', message: 'Proximity sensor detected potential collision path' },
            { title: 'System Connection Lost', message: 'Lost connection to forklift tracking system' },
            { title: 'Zone Access Denied', message: 'Unauthorized entry attempt detected' }
          ]
        },
        {
          type: 'warning',
          priority: 'high',
          templates: [
            { title: 'Low Battery Level', message: 'Forklift battery level below 20%' },
            { title: 'Efficiency Drop', message: 'Zone efficiency below expected threshold' },
            { title: 'Traffic Congestion', message: 'High traffic density detected in loading zone' }
          ]
        },
        {
          type: 'info',
          priority: 'medium',
          templates: [
            { title: 'Task Completed', message: 'Loading operation completed successfully' },
            { title: 'Route Optimized', message: 'New optimal path calculated for improved efficiency' },
            { title: 'Shift Change', message: 'Personnel shift change detected' }
          ]
        },
        {
          type: 'success',
          priority: 'low',
          templates: [
            { title: 'Performance Goal Met', message: 'Daily efficiency target achieved' },
            { title: 'Maintenance Complete', message: 'Scheduled maintenance completed on time' },
            { title: 'System Update', message: 'Software update installed successfully' }
          ]
        }
      ];

      const zones = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'P1', 'P2', 'LOADING', 'UNLOADING'];
      const forklifts = ['Forklift-001', 'Forklift-002'];

      const alertTypeData = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const template = alertTypeData.templates[Math.floor(Math.random() * alertTypeData.templates.length)];

      const newAlert: Alert = {
        id: `alert-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        type: alertTypeData.type,
        priority: alertTypeData.priority,
        title: template.title,
        message: template.message,
        zone: Math.random() > 0.3 ? zones[Math.floor(Math.random() * zones.length)] : undefined,
        forkliftId: Math.random() > 0.5 ? forklifts[Math.floor(Math.random() * forklifts.length)] : undefined,
        isRead: false
      };

      setAlerts(prev => [newAlert, ...prev].slice(0, 50)); // Keep only last 50 alerts
    };

    // Generate initial alerts
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        generateMockAlert();
      }, i * 100);
    }

    // Generate new alerts periodically
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance every 5 seconds
        generateMockAlert();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Filter alerts based on selected filters
  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread' && alert.isRead) return false;
    if (filter === 'critical' && alert.priority !== 'critical') return false;
    if (typeFilter !== 'all' && alert.type !== typeFilter) return false;
    return true;
  });

  // Mark alert as read
  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  };

  // Mark all alerts as read
  const markAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
  };

  // Delete alert
  const deleteAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  // Clear all alerts
  const clearAllAlerts = () => {
    setAlerts([]);
  };

  // Get alert icon
  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      default: // info
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  // Get alert color classes
  const getAlertColors = (type: Alert['type'], priority: Alert['priority']) => {
    const baseColors = {
      error: 'bg-red-500/10 border-red-500/30 text-red-400',
      warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
      success: 'bg-green-500/10 border-green-500/30 text-green-400',
      info: 'bg-blue-500/10 border-blue-500/30 text-blue-400'
    };

    return priority === 'critical' ? 
      baseColors[type].replace('/10', '/20').replace('/30', '/50') : 
      baseColors[type];
  };

  const unreadCount = alerts.filter(alert => !alert.isRead).length;
  const criticalCount = alerts.filter(alert => alert.priority === 'critical').length;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A2235] rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden border border-[#36454F]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#36454F]">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
              <span>Alert System</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
              {criticalCount > 0 && (
                <span className="bg-orange-500 text-white text-sm px-2 py-1 rounded-full animate-pulse">
                  {criticalCount} Critical
                </span>
              )}
            </h2>
            <p className="text-gray-400 mt-1">Real-time system alerts and notifications</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Filters */}
            <div className="flex bg-[#2D3B5F] rounded-lg p-1">
              {(['all', 'unread', 'critical'] as const).map(filterType => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === filterType
                      ? 'bg-[#36BA7C] text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </button>
              ))}
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-[#2D3B5F] border border-[#36454F] rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-[#36BA7C]"
            >
              <option value="all">All Types</option>
              <option value="error">Errors</option>
              <option value="warning">Warnings</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
            </select>

            {/* Actions */}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="bg-[#36BA7C] hover:bg-[#2E9F65] text-white px-3 py-2 rounded text-sm font-medium transition-colors"
              >
                Mark All Read
              </button>
            )}
            
            <button
              onClick={clearAllAlerts}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
            >
              Clear All
            </button>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="p-6 h-full overflow-auto">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xl font-medium">No alerts found</p>
              <p className="text-sm">All systems are running smoothly</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 transition-all hover:shadow-lg ${getAlertColors(alert.type, alert.priority)} ${
                    !alert.isRead ? 'border-l-4' : 'opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {/* Alert Icon */}
                      <div className={`flex-shrink-0 p-2 rounded-full ${
                        alert.type === 'error' ? 'bg-red-500/20' :
                        alert.type === 'warning' ? 'bg-yellow-500/20' :
                        alert.type === 'success' ? 'bg-green-500/20' :
                        'bg-blue-500/20'
                      }`}>
                        {getAlertIcon(alert.type)}
                      </div>

                      {/* Alert Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-white truncate">
                            {alert.title}
                          </h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            alert.priority === 'critical' ? 'bg-red-600 text-white' :
                            alert.priority === 'high' ? 'bg-orange-500 text-white' :
                            alert.priority === 'medium' ? 'bg-yellow-500 text-black' :
                            'bg-gray-500 text-white'
                          }`}>
                            {alert.priority.toUpperCase()}
                          </span>
                          {!alert.isRead && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        
                        <p className="text-gray-300 text-sm mb-2">
                          {alert.message}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                          <span>
                            {alert.timestamp.toLocaleTimeString()}
                          </span>
                          {alert.zone && (
                            <span className="bg-[#36BA7C]/20 text-[#36BA7C] px-2 py-1 rounded">
                              Zone: {alert.zone}
                            </span>
                          )}
                          {alert.forkliftId && (
                            <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                              {alert.forkliftId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {!alert.isRead && (
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="text-gray-400 hover:text-green-400 p-1"
                          title="Mark as read"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="text-gray-400 hover:text-red-400 p-1"
                        title="Delete alert"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertSystem;
