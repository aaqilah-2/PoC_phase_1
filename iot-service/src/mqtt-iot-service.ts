import { WebSocketServer } from 'ws';
import { LaneNavigator } from './lane-navigator';
import { WarehouseSimulator } from './warehouse-simulator';
import { PositionTick, DTEvent, SimulatorConfig } from './types';
import * as fs from 'fs';
import * as path from 'path';
import * as mqtt from 'mqtt';
import express from 'express';
import cors from 'cors';

const WS_PORT = 8084;
const HTTP_PORT = 3001;
const MQTT_BROKER = 'mqtt://broker.hivemq.com:1883';
const MQTT_TOPIC = 'aqilah/dev/01';

// Operation mode
type OperationMode = 'simulation' | 'mqtt';
let currentMode: OperationMode = 'simulation';

// Data storage
const telemetryBuffer: PositionTick[] = [];
const MAX_BUFFER_SIZE = 1000;

// Load lane configuration
const lanesPath = path.join(__dirname, '../config/lanes.json');
const laneConfig = JSON.parse(fs.readFileSync(lanesPath, 'utf8'));

// Create lane navigator
const laneNavigator = new LaneNavigator(laneConfig);

// Simulator configuration
const simulatorConfig: SimulatorConfig = {
  wsPort: WS_PORT,
  useSimulation: true,
  forkliftCount: 2,
  palletCount: 0,  // Focus on forklifts for testing
  workerCount: 0,  // Focus on forklifts for testing
  forkliftSpeedRange: [1.0, 2.5],      // m/s
  palletSpeedRange: [0.5, 1.8],        // m/s  
  workerSpeedRange: [0.3, 1.5],        // m/s
  tickMs: 200,                          // 5Hz updates (200ms)
  simSpeed: 1.0,                        // real-time
  eventProbability: 0.001,              // per tick per entity
  collisionRadius: 1.5,                 // meters
  congestionThreshold: 3                // entities per lane
};

// Create simulator
const simulator = new WarehouseSimulator(simulatorConfig, laneNavigator);

// MQTT Client
let mqttClient: mqtt.MqttClient | null = null;

// Initialize MQTT client
function initializeMQTT() {
  if (mqttClient) {
    mqttClient.end();
  }

  console.log(`📡 Connecting to MQTT broker: ${MQTT_BROKER}`);
  mqttClient = mqtt.connect(MQTT_BROKER, {
    clientId: `warehouse-iot-${Date.now()}`,
    keepalive: 60,
    reconnectPeriod: 5000,
    connectTimeout: 30000
  });

  mqttClient.on('connect', () => {
    console.log(`✅ Connected to MQTT broker`);
    mqttClient!.subscribe(MQTT_TOPIC, { qos: 1 }, (err) => {
      if (err) {
        console.error(`❌ Failed to subscribe to ${MQTT_TOPIC}:`, err);
      } else {
        console.log(`📥 Subscribed to topic: ${MQTT_TOPIC}`);
      }
    });
  });

  mqttClient.on('message', (topic, message) => {
    try {
      if (currentMode !== 'mqtt') return; // Ignore if not in MQTT mode

      const payload = message.toString();
      console.log(`📨 MQTT message on ${topic}: ${payload}`);

      let positionData: PositionTick;

      // Try to parse as JSON first
      try {
        const jsonData = JSON.parse(payload);
        positionData = {
          id: jsonData.deviceId || `device-${Date.now()}`,
          type: jsonData.type || 'forklift',
          x: parseFloat(jsonData.x),
          y: parseFloat(jsonData.y),
          speed: jsonData.speed || 0,
          heading: jsonData.heading || 0,
          zoneId: jsonData.zoneId,
          confidence: jsonData.confidence || 0.9,
          t: jsonData.ts || Date.now()
        };
      } catch {
        // Try to parse as CSV "x,y,speed,heading"
        const parts = payload.split(',');
        if (parts.length >= 2 && parts[0] && parts[1]) {
          positionData = {
            id: 'mqtt-device-1',
            type: 'forklift',
            x: parseFloat(parts[0].trim()),
            y: parseFloat(parts[1].trim()),
            speed: parts[2] ? parseFloat(parts[2].trim()) : 0,
            heading: parts[3] ? parseFloat(parts[3].trim()) : 0,
            confidence: 0.85,
            t: Date.now()
          };
        } else {
          throw new Error('Invalid CSV format');
        }
      }

      // Validate data
      if (isNaN(positionData.x) || isNaN(positionData.y)) {
        console.warn(`⚠️  Invalid position data: x=${positionData.x}, y=${positionData.y}`);
        return;
      }

      // Add to telemetry buffer
      telemetryBuffer.push(positionData);
      if (telemetryBuffer.length > MAX_BUFFER_SIZE) {
        telemetryBuffer.shift(); // Remove oldest
      }

      // Broadcast to WebSocket clients
      broadcastPositions([positionData]);
      console.log(`📍 Broadcasted MQTT position: ${positionData.id} at (${positionData.x}, ${positionData.y})`);

    } catch (error) {
      console.error(`❌ Error processing MQTT message: ${error}`);
    }
  });

  mqttClient.on('error', (error) => {
    console.error(`❌ MQTT connection error:`, error);
  });

  mqttClient.on('close', () => {
    console.log(`📡 MQTT connection closed`);
  });
}

// WebSocket Server
const wss = new WebSocketServer({ 
  port: WS_PORT,
  perMessageDeflate: false
});

console.log(`IoT Service WebSocket server starting on port ${WS_PORT}...`);

// Track connected clients
const clients = new Set<any>();

wss.on('connection', function connection(ws: any, request: any) {
  const clientInfo = `${request.socket.remoteAddress}:${request.socket.remotePort}`;
  console.log(`Client connected: ${clientInfo}`);
  
  clients.add(ws);

  // Send initial connection message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to Warehouse IoT Service',
    mode: currentMode,
    timestamp: Date.now(),
    entities: currentMode === 'simulation' 
      ? simulatorConfig.forkliftCount + simulatorConfig.palletCount + simulatorConfig.workerCount
      : telemetryBuffer.length
  }));

  // Handle client messages
  ws.on('message', function message(data: any) {
    try {
      const message = JSON.parse(data.toString());
      
      // Handle different message types
      switch (message.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
        case 'config':
          ws.send(JSON.stringify({ 
            type: 'config', 
            config: simulatorConfig,
            mode: currentMode,
            topic: MQTT_TOPIC,
            timestamp: Date.now() 
          }));
          break;
        case 'mode':
          if (message.mode && ['simulation', 'mqtt'].includes(message.mode)) {
            switchMode(message.mode as OperationMode);
            ws.send(JSON.stringify({
              type: 'mode_changed',
              mode: currentMode,
              timestamp: Date.now()
            }));
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid mode. Use "simulation" or "mqtt"',
              timestamp: Date.now()
            }));
          }
          break;
        default:
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: `Unknown message type: ${message.type}`,
            timestamp: Date.now() 
          }));
      }
    } catch (error) {
      console.warn(`Invalid message from ${clientInfo}:`, data.toString());
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Invalid JSON message',
        timestamp: Date.now() 
      }));
    }
  });

  ws.on('close', function close() {
    console.log(`Client disconnected: ${clientInfo}`);
    clients.delete(ws);
  });

  ws.on('error', function error(err: any) {
    console.error(`WebSocket error from ${clientInfo}:`, err);
    clients.delete(ws);
  });
});

// Broadcast position updates to all connected clients
function broadcastPositions(positions: PositionTick[]) {
  if (clients.size === 0) return;

  const message = JSON.stringify({
    type: 'positions',
    data: positions,
    mode: currentMode,
    timestamp: Date.now()
  });

  for (const client of clients) {
    if (client.readyState === 1) { // WebSocket.OPEN
      try {
        client.send(message);
      } catch (error) {
        console.error('Error sending positions to client:', error);
        clients.delete(client);
      }
    } else {
      clients.delete(client);
    }
  }
}

// Broadcast events to all connected clients
function broadcastEvent(event: DTEvent) {
  if (clients.size === 0) return;

  const message = JSON.stringify({
    type: 'event',
    data: event,
    mode: currentMode,
    timestamp: Date.now()
  });

  for (const client of clients) {
    if (client.readyState === 1) { // WebSocket.OPEN
      try {
        client.send(message);
      } catch (error) {
        console.error('Error sending event to client:', error);
        clients.delete(client);
      }
    } else {
      clients.delete(client);
    }
  }
}

// Mode switching function
function switchMode(newMode: OperationMode) {
  if (currentMode === newMode) return;
  
  console.log(`🔄 Switching from ${currentMode} to ${newMode} mode`);
  
  if (currentMode === 'simulation') {
    simulator.stop();
  }
  
  currentMode = newMode;
  
  if (newMode === 'simulation') {
    simulator.start(broadcastPositions, broadcastEvent);
    console.log(`🤖 Simulation mode started`);
  } else {
    console.log(`📡 MQTT mode started - listening to ${MQTT_TOPIC}`);
  }
}

// Express REST API
const app = express();
app.use(cors());
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    mode: currentMode,
    topic: MQTT_TOPIC,
    broker: MQTT_BROKER,
    telemetryCount: telemetryBuffer.length,
    connectedClients: clients.size,
    mqttConnected: mqttClient?.connected || false,
    timestamp: Date.now()
  });
});

// History endpoint
app.get('/history', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const recent = telemetryBuffer.slice(-limit);
  
  res.json({
    mode: currentMode,
    count: recent.length,
    data: recent,
    timestamp: Date.now()
  });
});

// Mode switch endpoint
app.post('/mode', (req, res) => {
  const { mode } = req.body;
  
  if (!mode || !['simulation', 'mqtt'].includes(mode)) {
    return res.status(400).json({
      error: 'Invalid mode. Use "simulation" or "mqtt"',
      timestamp: Date.now()
    });
  }
  
  switchMode(mode as OperationMode);
  
  return res.json({
    success: true,
    mode: currentMode,
    timestamp: Date.now()
  });
});

// Start REST API server
app.listen(HTTP_PORT, () => {
  console.log(`REST API server running on port ${HTTP_PORT}`);
});

// Initialize MQTT connection
initializeMQTT();

// Start in simulation mode
switchMode('simulation');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  
  simulator.stop();
  
  if (mqttClient) {
    mqttClient.end();
  }
  
  // Close all client connections
  for (const client of clients) {
    client.close(1000, 'Server shutting down');
  }
  
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

console.log(`IoT Service ready! 🚀`);
console.log(`WebSocket endpoint: ws://localhost:${WS_PORT}`);
console.log(`REST API endpoint: http://localhost:${HTTP_PORT}`);
console.log(`MQTT Topic: ${MQTT_TOPIC}`);
console.log(`Current mode: ${currentMode}`);
console.log('Press Ctrl+C to stop');
