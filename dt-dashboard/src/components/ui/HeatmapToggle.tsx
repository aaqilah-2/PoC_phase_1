import { useState } from 'react';

interface HeatmapToggleProps {
  showHeatmap: boolean;
  onToggle: (show: boolean) => void;
  activityCount?: number;
}

export function HeatmapToggle({ showHeatmap, onToggle, activityCount = 0 }: HeatmapToggleProps) {
  const [intensity, setIntensity] = useState(0.7);

  const handleIntensityChange = (newIntensity: number) => {
    setIntensity(newIntensity);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Toggle Button */}
      <button
        onClick={() => onToggle(!showHeatmap)}
        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
          showHeatmap
            ? 'bg-orange-600 text-white shadow-md'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        <span>🌡️</span>
        Heatmap
        {activityCount > 0 && (
          <span className="bg-gray-900 text-xs px-2 py-0.5 rounded-full">
            {activityCount}
          </span>
        )}
      </button>

      {/* Intensity Control */}
      {showHeatmap && (
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Intensity</span>
            <span className="text-xs text-white">{Math.round(intensity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={intensity}
            onChange={(e) => handleIntensityChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>
      )}
    </div>
  );
}
