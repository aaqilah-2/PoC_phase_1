# Component Architecture

This document outlines the component architecture of the UWB Digital Twin Dashboard.

## Overview

The dashboard follows a modular component architecture organized by functional domains:

```
WarehouseDashboard (Main Container)
│
├─┬ Map Visualization
│ ├── WarehouseMap
│ ├── EntitiesLayer
│ ├── TaskRoutes
│ ├── HeatmapLayer
│ └── ZonesLayer
│
├─┬ Task Management
│ ├── TaskDashboard
│ ├── TaskManagement
│ └── TaskAssignment
│
├─┬ Analytics
│ ├── KPIDashboard
│ └── AlertsPanel
│
├─┬ Timeline
│ └── TimelineScrubber
│
└─┬ UI Components
  ├── ViewModeSwitcher
  ├── DataModeSwitcher
  └── DialogComponents
```

## Component Relationships

### Data Flow

1. The `App` component initializes the data sources and main state
2. Data flows down to the `WarehouseDashboard` component
3. The `WarehouseDashboard` distributes data to child components
4. User interactions in child components trigger callbacks that flow back up
5. State updates trigger re-renders with updated data

### State Management

The dashboard uses React's state management to handle:

- Entity positions and states
- Task creation, assignment, and status
- Alert generation and handling
- KPI calculations
- Timeline events and playback

## Component Responsibilities

### WarehouseDashboard

- Main container component
- Layout management
- Routing user interactions to appropriate handlers
- View mode coordination
- Data source management

### Map Components

- **WarehouseMap**: Container for all map layers
- **EntitiesLayer**: Rendering entity positions and states
- **TaskRoutes**: Visualizing task paths and waypoints
- **HeatmapLayer**: Generating density/congestion visualization
- **ZonesLayer**: Displaying warehouse zones and structures

### Task Components

- **TaskDashboard**: Container for task-related interfaces
- **TaskManagement**: Task filtering, sorting, and status management
- **TaskAssignment**: Entity selection and task assignment

### Analytics Components

- **KPIDashboard**: Displaying performance metrics
- **AlertsPanel**: Showing and managing system alerts

### Timeline Components

- **TimelineScrubber**: Timeline visualization and playback control

### UI Components

- **ViewModeSwitcher**: Toggle between supervisor and operator views
- **DataModeSwitcher**: Switch between mock and sensor data
- **DialogComponents**: Reusable UI dialog components

## Implementation Details

### Rendering Strategy

- Map visualization uses SVG for vector graphics
- Heatmap uses Canvas for performance optimization
- Components use React functional style with hooks
- Memoization is used to optimize re-renders

### Responsive Design

- The dashboard is designed to work on:
  - Desktop monitors (primary)
  - Large touchscreens
  - Tablets (limited functionality)

### Accessibility

- Color schemes are chosen for visibility
- Interactive elements have appropriate ARIA roles
- Keyboard navigation is supported

### Performance Considerations

- Entity positions are updated efficiently
- Heatmap calculations are optimized
- Large datasets are virtualized when possible
- Animation frames are used for smooth visualization
