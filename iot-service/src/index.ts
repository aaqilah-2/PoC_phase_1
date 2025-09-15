import { WebSocketServer } from 'ws';
import { LaneNavigator } from './lane-navigator';
import { WarehouseSimulator } from './warehouse-simulator';
import { PositionTick, DTEvent, SimulatorConfig } from './types';
import * as fs from 'fs';
import * as path from 'path';

const PORT = 8084;

// Load lane configuration
const lanesPath = path.join(__dirname, '../config/lanes.json');
const laneConfig = JSON.parse(fs.readFileSync(lanesPath, 'utf8'));

// Create lane navigator
const laneNavigator = new LaneNavigator(laneConfig);

// Simulator configuration
const simulatorConfig: SimulatorConfig = {
  wsPort: PORT,
  useSimulation: true,
  forkliftCount: 2,
  palletCount: 4,
  workerCount: 3,
  forkliftSpeedRange: [0.8, 2.2],      // m/s
  palletSpeedRange: [0.5, 1.8],        // m/s  
  workerSpeedRange: [0.3, 1.5],        // m/s
  tickMs: 100,                          // 10Hz updates
  simSpeed: 1.0,                        // real-time
  eventProbability: 0.001,              // per tick per entity
  collisionRadius: 1.5,                 // meters
  congestionThreshold: 3                // entities per lane
};

// Create simulator
const simulator = new WarehouseSimulator(simulatorConfig, laneNavigator);

// Create WebSocket server
const wss = new WebSocketServer({ 
  port: PORT,
  perMessageDeflate: false
});

console.log(`IoT Service WebSocket server starting on port ${PORT}...`);

// Track connected clients
const clients = new Set<any>();

wss.on('connection', function connection(ws, request) {
  const clientInfo = `${request.socket.remoteAddress}:${request.socket.remotePort}`;
  console.log(`Client connected: ${clientInfo}`);
  
  clients.add(ws);

  // Send initial connection message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to Warehouse IoT Service',
    timestamp: Date.now(),
    entities: simulatorConfig.forkliftCount + simulatorConfig.palletCount + simulatorConfig.workerCount
  }));

  // Handle client messages
  ws.on('message', function message(data) {
    try {
      const message = JSON.parse(data.toString());
      console.log(`Message from ${clientInfo}:`, message);
      
      // Handle different message types
      switch (message.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
        case 'config':
          ws.send(JSON.stringify({ 
            type: 'config', 
            config: simulatorConfig,
            timestamp: Date.now() 
          }));
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

  ws.on('error', function error(err) {
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

// Start the simulation
simulator.start(
  broadcastPositions,
  broadcastEvent
);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  
  simulator.stop();
  
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
console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
console.log(`Simulating ${simulatorConfig.forkliftCount} forklifts, ${simulatorConfig.palletCount} pallets, ${simulatorConfig.workerCount} workers`);
console.log('Press Ctrl+C to stop');
