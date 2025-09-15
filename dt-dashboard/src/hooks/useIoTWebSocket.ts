import { useState, useEffect, useRef, useCallback } from 'react';

// WebSocket message types from IoT service
interface PositionTick {
  id: string;
  type: 'forklift' | 'pallet' | 'worker';
  x: number;
  y: number;
  speed: number;
  heading: number;
  zoneId?: string;
  confidence?: number;
  t: number;
}

interface DTEvent {
  id: string;
  t: number;
  type: 'congestion' | 'blocked' | 'nearCollision' | 'dwellExceeded' | 'zoneBreach' | 'reroute';
  assetIds?: string[];
  zoneId?: string;
  payload?: Record<string, any>;
}

interface WebSocketMessage {
  type: 'positions' | 'event' | 'connection' | 'config' | 'pong' | 'error';
  data?: PositionTick[] | DTEvent;
  message?: string;
  timestamp?: number;
}

// Convert WebSocket PositionTick to dashboard Pose format
interface Pose {
  entityId: string;
  entityType: 'forklift' | 'pallet' | 'worker';
  x: number;
  y: number;
  speed: number;
  heading: number;
  zoneId?: string;
  confidence?: number;
  timestamp: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  entityId?: string;
  zoneId?: string;
  timestamp: number;
}

export function useIoTWebSocket(url: string = 'ws://localhost:8084') {
  const [poses, setPoses] = useState<Pose[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;

  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket(url);
      
      ws.current.onopen = () => {
        console.log('Connected to IoT Service');
        setConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        
        // Send ping to verify connection
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: 'ping' }));
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'positions':
              if (Array.isArray(message.data)) {
                const newPoses: Pose[] = message.data.map((tick: PositionTick) => ({
                  entityId: tick.id,
                  entityType: tick.type,
                  x: tick.x,
                  y: tick.y,
                  speed: tick.speed,
                  heading: tick.heading,
                  zoneId: tick.zoneId,
                  confidence: tick.confidence || 0.9,
                  timestamp: tick.t
                }));
                setPoses(newPoses);
                setLastUpdate(Date.now());
              }
              break;
              
            case 'event':
              if (message.data && !Array.isArray(message.data)) {
                const event = message.data as DTEvent;
                const newAlert: Alert = {
                  id: event.id,
                  type: event.type === 'nearCollision' || event.type === 'blocked' ? 'error' : 
                        event.type === 'congestion' || event.type === 'dwellExceeded' ? 'warning' : 'info',
                  title: formatEventTitle(event.type),
                  message: formatEventMessage(event),
                  entityId: event.assetIds?.[0],
                  zoneId: event.zoneId,
                  timestamp: event.t
                };
                
                setAlerts(prev => [newAlert, ...prev.slice(0, 49)]); // Keep last 50 alerts
              }
              break;
              
            case 'connection':
              console.log('IoT Service connection confirmed:', message.message);
              break;
              
            case 'pong':
              console.log('Pong received from IoT Service');
              break;
              
            case 'error':
              console.error('IoT Service error:', message.message);
              setError(message.message || 'Unknown error');
              break;
              
            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.current.onclose = (event) => {
        console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
        setConnected(false);
        
        // Attempt reconnection if not intentional close
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current + 1})`);
          
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error');
      };

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to connect to IoT Service');
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    
    if (ws.current) {
      ws.current.close(1000, 'Intentional disconnect');
      ws.current = null;
    }
    
    setConnected(false);
    setPoses([]);
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Send periodic pings to keep connection alive
  useEffect(() => {
    if (!connected) return;

    const pingInterval = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [connected]);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  return {
    poses,
    alerts,
    connected,
    error,
    lastUpdate,
    reconnect: connect,
    disconnect,
    clearAlerts,
    dismissAlert
  };
}

// Helper functions to format events for display
function formatEventTitle(eventType: string): string {
  const titles: Record<string, string> = {
    'congestion': 'Traffic Congestion',
    'blocked': 'Path Blocked',
    'nearCollision': 'Near Collision',
    'dwellExceeded': 'Dwell Time Exceeded',
    'zoneBreach': 'Zone Breach',
    'reroute': 'Route Changed'
  };
  return titles[eventType] || eventType;
}

function formatEventMessage(event: DTEvent): string {
  const entityCount = event.assetIds?.length || 0;
  const entities = entityCount === 1 ? 'entity' : 'entities';
  
  switch (event.type) {
    case 'congestion':
      return `${entityCount} ${entities} in congested area${event.zoneId ? ` (${event.zoneId})` : ''}`;
    case 'blocked':
      return `Path obstruction detected${event.payload?.reason ? `: ${event.payload.reason}` : ''}`;
    case 'nearCollision':
      return `${entityCount} ${entities} at risk of collision${event.payload?.distance ? ` (${event.payload.distance}m apart)` : ''}`;
    case 'dwellExceeded':
      return `${entities} exceeded expected dwell time${event.payload?.reason ? `: ${event.payload.reason}` : ''}`;
    case 'zoneBreach':
      return `Unauthorized access detected${event.zoneId ? ` in ${event.zoneId}` : ''}`;
    case 'reroute':
      return `Route optimization applied${event.payload?.reason ? `: ${event.payload.reason}` : ''}`;
    default:
      return `${event.type} event detected`;
  }
}
