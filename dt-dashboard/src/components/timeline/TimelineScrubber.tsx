import { useEffect, useRef, useState } from 'react';
import type { Event, TimelineEvent } from '../../data/entities';

// Extended interface that includes assetIds property
interface ExtendedTimelineEvent extends TimelineEvent {
  assetIds?: string[];
}

interface TimelineScrubberProps {
  events: Event[] | TimelineEvent[];
  width: number;
  height?: number;
  startTime: number; // timestamp in ms
  endTime: number;   // timestamp in ms
  currentTime: number; // timestamp in ms
  onTimeChange?: (time: number) => void;
  onEventClick?: (eventId: string) => void;
  playing?: boolean;
  playbackSpeed?: number; // 0.5, 1, 2
}

export function TimelineScrubber({
  events,
  width,
  height = 60,
  startTime,
  endTime,
  currentTime,
  onTimeChange,
  onEventClick,
  playing = false,
  playbackSpeed = 1
}: TimelineScrubberProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverEvent, setHoverEvent] = useState<ExtendedTimelineEvent | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  
  // Convert timestamp to x position
  const timeToX = (time: number): number => {
    const timeRange = endTime - startTime;
    if (timeRange <= 0) return 0;
    
    const percentage = (time - startTime) / timeRange;
    return Math.max(0, Math.min(width, percentage * width));
  };
  
  // Convert x position to timestamp
  const xToTime = (x: number): number => {
    const percentage = Math.max(0, Math.min(1, x / width));
    return startTime + percentage * (endTime - startTime);
  };
  
  // Get event color based on type
  const getEventColor = (eventType: string): string => {
    switch (eventType.toUpperCase()) {
      case 'CONGESTION': return '#f59e0b'; // amber
      case 'BLOCKED': return '#ef4444'; // red
      case 'NEAR_COLLISION': return '#f43f5e'; // rose
      case 'DWELL_EXCEEDED': return '#8b5cf6'; // purple
      case 'ZONE_BREACH': return '#ec4899'; // pink
      case 'REROUTE': return '#3b82f6'; // blue
      default: return '#6b7280'; // gray
    }
  };
  
  // Get event icon based on type
  const getEventIcon = (eventType: string): string => {
    switch (eventType.toUpperCase()) {
      case 'CONGESTION': return '🚧';
      case 'BLOCKED': return '🚫';
      case 'NEAR_COLLISION': return '⚠️';
      case 'DWELL_EXCEEDED': return '⏱️';
      case 'ZONE_BREACH': return '🚷';
      case 'REROUTE': return '↪️';
      default: return '📍';
    }
  };
  
  // Format time as HH:MM:SS
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };
  
  // Handle timeline click/drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    if (onTimeChange) {
      const newTime = xToTime(x);
      onTimeChange(newTime);
    }
    
    setIsDragging(true);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // If dragging, update time
    if (isDragging && onTimeChange) {
      const newTime = xToTime(x);
      onTimeChange(newTime);
    }
    
    // Show hover time
    setHoverTime(xToTime(x));
    
    // Check if hovering over an event
    const hoveringEvent = events.find(event => {
      const eventX = timeToX(event.t);
      return Math.abs(eventX - x) < 10;
    });
    
    setHoverEvent(hoveringEvent as TimelineEvent || null);
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoverEvent(null);
    setHoverTime(null);
  };
  
  const handleEventClick = (eventId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEventClick) {
      onEventClick(eventId);
    }
  };
  
  // Add global mouse up handler
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  return (
    <div className="timeline-scrubber relative select-none">
      {/* Main timeline container */}
      <div 
        ref={containerRef}
        className="bg-gray-800 rounded-lg p-2 border border-gray-700"
        style={{ width, height }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Time markers */}
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{formatTime(startTime)}</span>
          <span>{formatTime(Math.floor((startTime + endTime) / 2))}</span>
          <span>{formatTime(endTime)}</span>
        </div>
        
        {/* Timeline track */}
        <div className="h-6 bg-gray-700 rounded relative">
          {/* Events */}
          {events.map(event => {
            const x = timeToX(event.t);
            const eventColor = getEventColor(
              'type' in event ? event.type : (event as any).kind
            );
            const isHovered = hoverEvent && event.id === hoverEvent.id;
            
            return (
              <div
                key={event.id}
                className={`absolute w-3 h-3 transform -translate-x-1/2 -translate-y-1/2 rounded-full border cursor-pointer ${isHovered ? 'z-20' : 'z-10'}`}
                style={{ 
                  left: x,
                  top: '50%',
                  backgroundColor: eventColor,
                  borderColor: 'white',
                  transform: `translate(-50%, -50%) scale(${isHovered ? 1.5 : 1})`,
                  transition: 'transform 0.1s ease-out'
                }}
                onClick={handleEventClick(event.id)}
              />
            );
          })}
          
          {/* Current time indicator */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-white z-30"
            style={{ left: timeToX(currentTime) }}
          >
            <div className="w-3 h-3 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 absolute top-0"></div>
            <div className="w-3 h-3 bg-white rounded-full transform -translate-x-1/2 translate-y-1/2 absolute bottom-0"></div>
          </div>
          
          {/* Hover time indicator */}
          {hoverTime !== null && !isDragging && (
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-20 opacity-50"
              style={{ left: timeToX(hoverTime) }}
            />
          )}
        </div>
        
        {/* Current time display */}
        <div className="text-xs text-gray-300 mt-1">
          Current: {formatTime(currentTime)}
        </div>
      </div>
      
      {/* Event tooltip */}
      {hoverEvent && (
        <div 
          className="absolute bg-gray-900 border border-gray-600 rounded-md p-2 text-sm text-white z-50 shadow-lg"
          style={{ 
            left: timeToX(hoverEvent.t),
            bottom: '100%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            maxWidth: '200px'
          }}
        >
          <div className="flex items-center gap-2">
            <span role="img" aria-label="Event icon">
              {getEventIcon('type' in hoverEvent ? hoverEvent.type : (hoverEvent as any).kind)}
            </span>
            <span className="font-bold">
              {'type' in hoverEvent ? hoverEvent.type : (hoverEvent as any).kind}
            </span>
          </div>
          
          <div className="text-xs text-gray-300 mt-1">
            {formatTime(hoverEvent.t)}
          </div>
          
          {'label' in hoverEvent && hoverEvent.label && (
            <div className="text-xs mt-1">{hoverEvent.label}</div>
          )}
          
          {'details' in hoverEvent && hoverEvent.details && (
            <div className="text-xs text-gray-400 mt-1">{hoverEvent.details}</div>
          )}
          
          {'assetIds' in hoverEvent && hoverEvent.assetIds && Array.isArray(hoverEvent.assetIds) && (
            <div className="text-xs text-gray-400 mt-1">
              Assets: {(hoverEvent.assetIds as string[]).join(', ')}
            </div>
          )}
        </div>
      )}
      
      {/* Playback controls */}
      <div className="flex items-center justify-center gap-3 mt-2">
        <button 
          className={`w-8 h-8 rounded-full flex items-center justify-center ${playing ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          onClick={() => onTimeChange && onTimeChange(Math.max(startTime, currentTime - 10000))}
          title="Back 10 seconds"
        >
          ⏪
        </button>
        
        <button 
          className={`w-10 h-10 rounded-full flex items-center justify-center ${playing ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'}`}
          onClick={() => onTimeChange && onTimeChange(currentTime)}
          title={playing ? 'Pause' : 'Play'}
        >
          {playing ? '⏸️' : '▶️'}
        </button>
        
        <button 
          className={`w-8 h-8 rounded-full flex items-center justify-center ${playing ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          onClick={() => onTimeChange && onTimeChange(Math.min(endTime, currentTime + 10000))}
          title="Forward 10 seconds"
        >
          ⏩
        </button>
        
        <div className="flex items-center gap-2 ml-4">
          <span className="text-xs text-gray-400">Speed:</span>
          <button 
            className={`px-2 py-1 rounded text-xs ${playbackSpeed === 0.5 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            title="0.5x speed"
          >
            0.5×
          </button>
          <button 
            className={`px-2 py-1 rounded text-xs ${playbackSpeed === 1 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            title="1x speed"
          >
            1×
          </button>
          <button 
            className={`px-2 py-1 rounded text-xs ${playbackSpeed === 2 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            title="2x speed"
          >
            2×
          </button>
        </div>
      </div>
    </div>
  );
}
