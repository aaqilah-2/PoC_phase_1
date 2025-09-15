# Warehouse Digital Twin Dashboard

A comprehensive visualization dashboard for UWB-tracked warehouse operations including real-time tracking, heatmaps, task management, and event playback.

## Features

- **Real-time Entity Tracking**: Monitor the positions of forklifts, workers, and pallets with UWB accuracy rings
- **Multiple Visualization Modes**:
  - Interactive warehouse map with zones, aisles, and entity positions
  - Heatmap overlays for density, congestion, and dwell time analysis
  - Task routes and assignments visualization
- **Task Management**:
  - Create, assign, and monitor tasks
  - View task routes and statuses
  - Support for automatic assignment optimization
- **Event Timeline**:
  - Scrub through historical events and position data
  - Playback functionality with variable speed
  - Event filtering and selection
- **Alerts and Monitoring**:
  - Real-time alert generation for congestion, near collisions, zone breaches, etc.
  - Alert acknowledgement and resolution tracking
- **KPI Dashboard**:
  - Key performance metrics for warehouse operations
  - Visual indicators for efficiency, throughput, and compliance
- **Dual View Modes**:
  - Supervisor View: Full access to all dashboard features
  - Operator View: Focused interface for task execution and alerts
- **Data Source Flexibility**:
  - Support for both mock data (for demos) and real UWB sensor data

## Tech Stack

- React
- TypeScript
- TailwindCSS
- Vite
- SVG + Canvas for visualization

## Running the Dashboard

1. Ensure you have Node.js and npm installed
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open browser and navigate to: http://localhost:5173

For convenience, you can also run:

```bash
./run.sh
```

## Project Structure

```
src/
├── components/
│   ├── alerts/      # Alert components
│   ├── kpi/         # KPI visualization components
│   ├── map/         # Map visualization components
│   ├── tasks/       # Task management components 
│   ├── timeline/    # Timeline and playback components
│   └── ui/          # Shared UI components
├── data/
│   ├── entities.ts  # Core data types
│   └── mock/        # Mock data generators
├── App.tsx          # Main application
└── main.tsx         # Entry point
```

## Component Overview

### Map Components
- **WarehouseMap**: Main container for the warehouse visualization
- **EntitiesLayer**: Renders real-time positions of tracked entities (forklifts, workers, pallets)
- **TaskRoutes**: Visualizes paths and waypoints for active tasks
- **HeatmapLayer**: Generates density, congestion, or dwell time heatmaps using canvas rendering

### Task Management
- **TaskDashboard**: Central component for task-related functionality
- **TaskManagement**: Interface for filtering, sorting, and managing tasks
- **TaskAssignment**: UI for creating and assigning tasks to entities

### UI Components
- **ViewModeSwitcher**: Toggle between Supervisor and Operator views
- **DataModeSwitcher**: Switch between Mock and Sensor data modes
- **DialogComponents**: Reusable modal, tooltip, and confirmation dialog components

### KPI & Analytics
- **KPIDashboard**: Displays key performance indicators as interactive tiles
- **AlertsPanel**: Real-time alert monitoring and management
- **TimelineScrubber**: Timeline-based playback and event visualization

## Data Model

The dashboard uses a comprehensive type system defined in `entities.ts`:

- **Entity**: Base type for all trackable entities (forklift, pallet, worker)
- **Pose**: Position and orientation data from UWB tracking system
- **Task**: Work items with source/target locations and assignment metadata
- **Alert**: Notifications for events requiring attention
- **Layout**: Warehouse structure including zones, aisles, racks
- **KPIMetrics**: Performance indicators for operational analytics

## Building for Production

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview production build
npm run preview
```

## Contact

For any questions or feedback about this project, please contact the development team.
```
