import { useState, useEffect } from 'react';

interface DataSourceSwitcherProps {
  isConnected?: boolean;
  onModeChange?: (mode: DataSourceMode) => void;
}

export type DataSourceMode = 'simulation' | 'mqtt';

export function DataSourceSwitcher({ isConnected = false, onModeChange }: DataSourceSwitcherProps) {
  const [currentMode, setCurrentMode] = useState<DataSourceMode>('simulation');
  const [serviceStatus, setServiceStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [mqttStatus, setMqttStatus] = useState<'connected' | 'disconnected'>('disconnected');

  // Check IoT service and MQTT status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/health');
        if (response.ok) {
          const data = await response.json();
          setCurrentMode(data.mode || 'simulation');
          setServiceStatus('connected');
          setMqttStatus(data.mqttConnected ? 'connected' : 'disconnected');
        } else {
          setServiceStatus('disconnected');
        }
      } catch (error) {
        console.warn('Could not connect to IoT service:', error);
        setServiceStatus('disconnected');
        setMqttStatus('disconnected');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Handle mode change
  const handleModeChange = async (newMode: DataSourceMode) => {
    if (newMode === currentMode) return;

    try {
      const response = await fetch('http://localhost:3001/mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode: newMode }),
      });

      if (response.ok) {
        setCurrentMode(newMode);
        console.log(`✅ Switched to ${newMode} mode`);
        
        // Notify parent component
        if (onModeChange) {
          onModeChange(newMode);
        }
      } else {
        console.error('Failed to change mode');
      }
    } catch (error) {
      console.error('Error changing mode:', error);
    }
  };

  const isSimulationActive = currentMode === 'simulation';
  const isMqttActive = currentMode === 'mqtt';
  const canUseMqtt = serviceStatus === 'connected' && (mqttStatus === 'connected' || isConnected);

  return (
    <div className="flex flex-col gap-2">
      {/* Mode Toggle Buttons */}
      <div className="bg-gray-800 rounded-lg p-1 flex">
        <button
          onClick={() => handleModeChange('simulation')}
          className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
            isSimulationActive
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <span>🤖</span>
          Simulation
        </button>
        
        <button
          onClick={() => handleModeChange('mqtt')}
          disabled={!canUseMqtt}
          className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
            isMqttActive
              ? 'bg-emerald-600 text-white shadow-md'
              : canUseMqtt
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 cursor-not-allowed opacity-50'
          }`}
        >
          <span>📡</span>
          MQTT Live
          <div className={`w-2 h-2 rounded-full ml-1 ${
            canUseMqtt ? 'bg-emerald-400' : 'bg-red-500'
          }`} />
        </button>
      </div>

      {/* Status Information */}
      <div className="bg-gray-800/50 rounded-lg p-3 text-xs">
        <div className="grid grid-cols-2 gap-2 text-gray-400">
          <div>
            <span className="text-gray-500">Mode:</span>
            <span className={`ml-1 font-medium ${
              isSimulationActive ? 'text-blue-400' : 'text-emerald-400'
            }`}>
              {currentMode === 'simulation' ? 'Simulation' : 'MQTT Live'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Service:</span>
            <span className={`ml-1 font-medium ${
              serviceStatus === 'connected' ? 'text-green-400' : 'text-red-400'
            }`}>
              {serviceStatus === 'checking' ? 'Checking...' : 
               serviceStatus === 'connected' ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>
        
        {isMqttActive && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">MQTT Broker:</span>
              <span className="text-xs text-blue-300">broker.hivemq.com</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Topic:</span>
              <span className="text-xs text-purple-300">aqilah/dev/01</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
