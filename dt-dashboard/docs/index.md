# UWB Digital Twin Dashboard Documentation

Welcome to the documentation for the UWB Warehouse Digital Twin Dashboard.

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard Components](#dashboard-components)
4. [Data Model](#data-model)
5. [Configuration](#configuration)

## Introduction

The UWB Digital Twin Dashboard is a comprehensive visualization and management tool for warehouses equipped with Ultra-Wideband (UWB) tracking technology. This dashboard provides real-time insights into warehouse operations, allowing supervisors and operators to monitor entities, manage tasks, analyze efficiency metrics, and respond to alerts.

### Key Features

- Real-time entity tracking with UWB precision
- Interactive map visualization with layers for different data types
- Task management and assignment
- Alert monitoring and response
- KPI visualization and analytics
- Historical data playback and analysis
- Dual view modes for supervisors and operators

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm (v7 or later)

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd uwb-dt-dashboard/dt-dashboard

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Development Workflow

1. The application entry point is `main.tsx`
2. The main application container is `App.tsx`
3. Components are organized in the `src/components/` directory
4. Data types and mock data are in the `src/data/` directory

## Dashboard Components

### Map Visualization

The dashboard uses a layered approach to map visualization:

- **Base Layer**: Warehouse layout with zones, aisles, and fixed structures
- **Task Routes Layer**: Visualization of planned routes for assigned tasks
- **Entities Layer**: Real-time positions of entities (forklifts, workers, pallets)
- **Heatmap Layer**: Density, congestion, or dwell-time heat visualization
- **Alerts Layer**: Visual indicators for active alerts

### Task Management

The task management system provides:

- Task creation with source/target locations
- Task assignment to appropriate entities
- Status tracking and updates
- Route visualization and optimization
- Filtering and sorting capabilities

### KPI Dashboard

The KPI dashboard displays key metrics including:

- Warehouse efficiency
- Throughput rates
- Route completion times
- System latency
- Compliance incidents
- Congestion events

### Timeline and Playback

The timeline component allows:

- Scrubbing through historical data
- Playback at various speeds
- Event marking and selection
- Time-based filtering
- Comparison of metrics over time

## Data Model

### Core Entities

- **Entity**: Represents any trackable object in the warehouse
- **Pose**: Position and orientation data at a specific time
- **Task**: Work item with source/target locations and status
- **Alert**: Notification for events requiring attention
- **Layout**: Warehouse structure description
- **KPI**: Performance metrics

### Data Flow

1. Real-time data comes from UWB sensors (or mock data generators)
2. Entity positions are updated continuously
3. Tasks are created, assigned, and updated
4. Alerts are generated based on defined rules
5. KPIs are calculated from aggregate data

## Configuration

The dashboard supports various configuration options:

### Warehouse Layout

The warehouse layout can be configured in `/src/data/layout/`:

- Zone definitions
- Aisle paths
- Rack positions
- Restricted areas

### Alert Rules

Alert rules can be configured to trigger based on:

- Proximity between entities
- Speed thresholds
- Zone restrictions
- Dwell time limits

### KPI Thresholds

KPI thresholds determine when metrics are highlighted:

- Warning levels
- Critical levels
- Target performance levels

---

For detailed API documentation, please see the [API Reference](api-reference.md).
