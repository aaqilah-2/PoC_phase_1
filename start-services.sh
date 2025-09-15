#!/bin/bash

# UWB Digital Twin Dashboard Startup Script
echo "🚀 Starting UWB Digital Twin Dashboard..."

# Check if we're in the right directory
if [ ! -f "dt-dashboard/package.json" ]; then
    echo "❌ Please run this script from the uwb-dt-dashboard root directory"
    exit 1
fi

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "npm.*dev" 2>/dev/null
pkill -f "vite" 2>/dev/null
pkill -f "mqtt-iot-service" 2>/dev/null

sleep 2

# Start IoT service
echo "📡 Starting IoT Service..."
cd iot-service
npm start &
IOT_PID=$!
cd ..

# Wait for IoT service to start
echo "⏳ Waiting for IoT service to initialize..."
sleep 5

# Check if IoT service is responding
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ IoT Service started successfully on ports 8084 and 3001"
else
    echo "❌ IoT Service failed to start"
    kill $IOT_PID 2>/dev/null
    exit 1
fi

# Start Dashboard
echo "🎨 Starting Dashboard..."
cd dt-dashboard
npm run dev &
DASH_PID=$!
cd ..

# Wait for dashboard to start
echo "⏳ Waiting for Dashboard to initialize..."
sleep 5

echo "🎉 Services started successfully!"
echo ""
echo "📊 Dashboard: http://localhost:5173/"
echo "🔌 IoT Service WebSocket: ws://localhost:8084"
echo "🌐 IoT Service REST API: http://localhost:3001"
echo "📡 MQTT Topic: aqilah/dev/01 (HiveMQ broker)"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap 'echo ""; echo "🛑 Stopping services..."; kill $IOT_PID $DASH_PID 2>/dev/null; exit 0' INT

# Keep script running
while true; do
    sleep 1
done
