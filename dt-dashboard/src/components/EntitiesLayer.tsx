import type { Pose } from '../data/entities';

interface EntitiesLayerProps {
  poses: Pose[];
  scale: number; // pixels per meter
}

export function EntitiesLayer({ poses, scale }: EntitiesLayerProps) {
  const getEntityColor = (entityId: string): string => {
    if (entityId.startsWith('forklift')) return '#3b82f6'; // blue
    if (entityId.startsWith('pallet')) return '#f59e0b'; // amber
    if (entityId.startsWith('worker')) return '#10b981'; // emerald
    return '#6b7280'; // gray
  };

  const getEntityRadius = (entityId: string): number => {
    if (entityId.startsWith('forklift')) return 0.8; // meters
    if (entityId.startsWith('pallet')) return 0.5; // meters
    if (entityId.startsWith('worker')) return 0.3; // meters
    return 0.4;
  };

  const getEntityLabel = (entityId: string): string => {
    if (entityId.startsWith('forklift')) return entityId.replace('forklift-', 'FL-');
    if (entityId.startsWith('pallet')) return entityId.replace('pallet-', 'P-');
    if (entityId.startsWith('worker')) return entityId.replace('worker-', 'W-');
    return entityId;
  };

  return (
    <g>
      {poses.map((pose) => {
        const x = pose.x * scale;
        const y = pose.y * scale;
        const radius = getEntityRadius(pose.entityId) * scale;
        const color = getEntityColor(pose.entityId);
        const label = getEntityLabel(pose.entityId);

        return (
          <g key={pose.entityId}>
            {/* Entity circle */}
            <circle
              cx={x}
              cy={y}
              r={radius}
              fill={color}
              stroke="white"
              strokeWidth="2"
              opacity={0.8}
            />
            
            {/* Direction indicator (if heading is available) */}
            {pose.heading !== undefined && (
              <line
                x1={x}
                y1={y}
                x2={x + Math.cos((pose.heading * Math.PI) / 180) * radius * 1.5}
                y2={y + Math.sin((pose.heading * Math.PI) / 180) * radius * 1.5}
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}
            
            {/* Label */}
            <text
              x={x}
              y={y - radius - 8}
              textAnchor="middle"
              fontSize="12"
              fontWeight="bold"
              fill="#374151"
              className="pointer-events-none select-none"
            >
              {label}
            </text>
            
            {/* Speed indicator (if available) */}
            {pose.speed !== undefined && pose.speed > 0.1 && (
              <text
                x={x}
                y={y + radius + 16}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
                className="pointer-events-none select-none"
              >
                {pose.speed.toFixed(1)}m/s
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
