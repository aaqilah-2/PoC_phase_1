import { useState, useEffect } from 'react';

interface MQTTModeSwitcherProps {
  isConnected?: boolean;
  onModeChange?: (mode: OperationMode) => void;
}

export type OperationMode = 'simulation' | 'mqtt';

export function MQTTModeSwitcher({ isConnected = false, onModeChange }: MQTTModeSwitcherProps) {
  const [currentMode, setCurrentMode] = useState<OperationMode>('simulation');
  const [mqttConnected, setMqttConnected] = useState(false);
  const [serviceConnected, setServiceConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check IoT service status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/health');
        if (response.ok) {
          const data = await response.json();
          setCurrentMode(data.mode || 'simulation');
          setMqttConnected(data.mqttConnected || false);
          setServiceConnected(true);
        }
      } catch (error) {
        console.warn('Could not connect to IoT service:', error);
        setMqttConnected(false);
        setServiceConnected(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Handle mode change
  const handleModeChange = async (newMode: OperationMode) => {
    if (newMode === currentMode || isLoading) return;

    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const isSimulationActive = currentMode === 'simulation';
  const isMqttActive = currentMode === 'mqtt';
  const canUseMqtt = serviceConnected && (mqttConnected || isConnected);

  return (
    <div className="flex flex-col gap-2">
      {/* Mode Toggle Buttons */}
      <div className="bg-gray-800 rounded-lg p-1 flex">
        <button
          onClick={() => handleModeChange('simulation')}
          disabled={isLoading}
          className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
            isSimulationActive
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span>🤖</span>
          Simulation
          {isLoading && currentMode !== 'simulation' && (
            <div className="w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin" />
          )}
        </button>
        
        <button
          onClick={() => handleModeChange('mqtt')}
          disabled={!canUseMqtt || isLoading}
          className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
            isMqttActive
              ? 'bg-emerald-600 text-white shadow-md'
              : canUseMqtt
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 cursor-not-allowed opacity-50'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span>📡</span>
          MQTT Live
          <div className={`w-2 h-2 rounded-full ml-1 ${
            canUseMqtt ? 'bg-emerald-400' : 'bg-red-500'
          }`} />
          {isLoading && currentMode !== 'mqtt' && (
            <div className="w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin" />
          )}
        </button>
      </div>

      {/* Status Information */}
      <div className="bg-gray-800/50 rounded-lg p-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Mode:</span>
          <span className={`font-medium ${
            isSimulationActive ? 'text-blue-400' : 'text-emerald-400'
          }`}>
            {currentMode === 'simulation' ? 'Simulation' : 'MQTT Live'}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Service:</span>
          <span className={`font-medium ${
            serviceConnected ? 'text-green-400' : 'text-red-400'
          }`}>
            {serviceConnected ? 'Connected' : 'Offline'}
          </span>
        </div>
        
        {isMqttActive && (
          <div className="mt-1 pt-1 border-t border-gray-700">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Topic:</span>
              <span className="text-purple-300">aqilah/dev/01</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Broker:</span>
              <span className="text-blue-300">broker.hivemq.com</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}