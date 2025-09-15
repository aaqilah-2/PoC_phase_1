import { useState } from 'react';
import { Tooltip, ConfirmDialog } from './DialogComponents';
import type { DataMode } from '../../data/entities';

interface DataModeSwitcherProps {
  currentMode: DataMode;
  onModeChange: (mode: DataMode) => void;
  isConnected?: boolean;
}

export function DataModeSwitcher({
  currentMode,
  onModeChange,
  isConnected = false
}: DataModeSwitcherProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [targetMode, setTargetMode] = useState<DataMode>(currentMode);
  
  // Handle mode change request
  const handleModeChangeRequest = (newMode: DataMode) => {
    if (newMode === currentMode) return;
    
    // Set the target mode and show confirmation dialog
    setTargetMode(newMode);
    setShowConfirm(true);
  };
  
  // Handle mode change confirmation
  const handleConfirm = () => {
    onModeChange(targetMode);
  };
  
  return (
    <>
      <div className="bg-gray-800 rounded-md p-1 flex">
        <Tooltip 
          content="Use simulated data for demonstration"
          position="bottom"
        >
          <button
            onClick={() => handleModeChangeRequest('MOCK')}
            className={`px-3 py-1 rounded text-sm ${
              currentMode === 'MOCK'
                ? 'bg-blue-700 text-white'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
            }`}
          >
            Mock Data
          </button>
        </Tooltip>
        
        <Tooltip 
          content={isConnected 
            ? "Use real-time sensor data" 
            : "Sensor connection not available"
          }
          position="bottom"
        >
          <button
            onClick={() => handleModeChangeRequest('SENSOR')}
            className={`px-3 py-1 rounded text-sm flex items-center gap-2 ${
              currentMode === 'SENSOR'
                ? 'bg-emerald-700 text-white'
                : isConnected
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 cursor-not-allowed'
            }`}
            disabled={!isConnected}
          >
            <span>Sensor Data</span>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-500'}`}></span>
          </button>
        </Tooltip>
      </div>
      
      {/* Confirmation dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        title={`Switch to ${targetMode === 'MOCK' ? 'Mock' : 'Sensor'} Data?`}
        message={
          <div>
            <p>
              {targetMode === 'MOCK'
                ? "You are about to switch to mock data mode. This will disconnect from live sensors and use simulated data instead."
                : "You are about to connect to live UWB sensor data. This will replace the mock data with real-time tracking information."}
            </p>
            <p className="mt-2 text-xs">
              {targetMode === 'MOCK'
                ? "Note: All historical data will still be available."
                : "Note: Ensure all sensors are online and properly calibrated."}
            </p>
          </div>
        }
        confirmLabel={targetMode === 'MOCK' ? "Use Mock Data" : "Use Sensor Data"}
        type={targetMode === 'MOCK' ? "info" : "warning"}
      />
    </>
  );
}
