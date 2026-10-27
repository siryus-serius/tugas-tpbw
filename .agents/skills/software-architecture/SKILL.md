---
name: software-architecture
description: >-
  Expert guide for software engineering and application architecture, clean frontend component structure,
  state management, modular GIS data layer pipelines, service decoupling, and scalable code organization.
  Use this skill whenever the user asks about project structure, refactoring, architectural decisions,
  component patterns, data flow, or system design.
---

# Software & Application Architecture Skill

This skill equips Antigravity with senior software architect capabilities. It guides decisions regarding modularity, directory structure, data flow, layer abstraction, and maintainable application design.

---

## 1. Architectural Principles

1. **Separation of Concerns (SoC)**:
   - **Presentation Layer**: Components strictly responsible for rendering HTML/CSS and capturing user events. They do NOT contain direct fetch logic or raw data transformation algorithms.
   - **Business & Transformation Layer**: Custom hooks and utility functions that process raw satellite/geo data, calculate statistics, format dates, and manage UI state.
   - **Service / Data Access Layer**: Dedicated API clients and service modules responsible for querying remote endpoints (e.g., Earth Engine, Tile servers, GeoJSON static files).

2. **Single Responsibility Principle (SRP)**:
   - Each component, hook, or module must do one thing well. If a component exceeds 250-300 lines of code, decompose it into smaller sub-components or custom hooks.

3. **Single Source of Truth (SSOT)**:
   - Avoid duplicate state. For example, store active layers in a central state manager (or context) rather than duplicating state inside multiple UI buttons.
   - Synchronize shareable state (such as active year, center coordinates, and zoom level) via URL search params or centralized store.

4. **Loose Coupling & Dependency Inversion**:
   - High-level map controllers should depend on abstract layer interfaces (e.g., `{ id, name, type, url, opacity, visible }`) rather than hardcoded vendor-specific implementation details.

---

## 2. Standard WebGIS Project Directory Architecture

For React + Vite WebGIS applications, enforce this battle-tested clean folder architecture:

```text
src/
├── assets/                  # Static assets (logos, icons, base images)
├── components/              # Modular UI components
│   ├── common/              # Reusable atomic UI (Button, Modal, Slider, Switch)
│   ├── layout/              # Header, Navbar, Sidebar, Footer, Drawer
│   ├── map/                 # Map canvas and map controls
│   │   ├── MapContainer.jsx # Main Leaflet wrapper
│   │   ├── LayerController.jsx # GeoJSON and Tile layer renderers
│   │   ├── MapLegend.jsx    # Visual legend component
│   │   └── MapControls.jsx  # Zoom, reset extent, scale bar
│   └── panels/              # Feature panels
│       ├── LayerPanel.jsx   # Layer toggle list & opacity controls
│       ├── TimelineBar.jsx  # Year selector (2021-2025)
│       └── InfoDrawer.jsx   # Data inspection card / attribute table
├── hooks/                   # Custom business logic & lifecycle hooks
│   ├── useMapInstance.js    # Access and control the map instance
│   ├── useLayerState.js     # State & opacity for all visible layers
│   └── useGeoData.js        # Data fetching with loading & error states
├── services/                # API and data fetching clients
│   ├── geeService.js        # Google Earth Engine API or tile endpoint handlers
│   └── geojsonService.js    # Local or remote GeoJSON fetchers with caching
├── constants/               # Immutable configurations
│   ├── layers.config.js     # Definitions of layers, urls, attribution, bounds
│   └── map.config.js        # Initial center [lat, lng], zoom bounds, max bounds
├── utils/                   # Pure helper functions
│   ├── geoFormatters.js     # Coordinate formatting, slope calculation helpers
│   └── colorScales.js       # Color ramp functions for NDVI, slope, rainfall
├── styles/                  # Global CSS tokens and component styles
│   ├── index.css            # Base reset, CSS custom properties (tokens)
│   └── map.css              # Custom overrides for Leaflet / map controls
├── App.jsx                  # Root layout orchestration
└── main.jsx                 # Application entry point
```

---

## 3. Data Flow & State Management Patterns

### Pattern A: Centralized Layer Registry
Define all layers in a structured configuration (`src/constants/layers.config.js`):
```javascript
export const GIS_LAYERS = [
  {
    id: 'sentinel2_rgb',
    name: 'Sentinel-2 Komposit Warna Alami',
    category: 'satelit',
    type: 'tile',
    defaultVisible: true,
    defaultOpacity: 1.0,
    getUrl: (year) => `https://tiles.example.com/s2/${year}/{z}/{x}/{y}.png`,
    attribution: 'ESA Copernicus / GEE',
    legend: { type: 'discrete', items: [] }
  },
  {
    id: 'dem_slope',
    name: 'Kemiringan Lereng (Slope)',
    category: 'topografi',
    type: 'tile',
    defaultVisible: false,
    defaultOpacity: 0.8,
    getUrl: () => `https://tiles.example.com/slope/{z}/{x}/{y}.png`,
    attribution: 'SRTM DEM 30m',
    legend: { type: 'gradient', min: '0°', max: '>45°', colors: ['#10b981', '#f59e0b', '#ef4444'] }
  }
];
```

### Pattern B: Custom Hook for State & Decoupling
Isolate layer toggling and opacity from presentation widgets:
```javascript
// useLayerState.js
export function useLayerState(initialLayers) {
  const [layers, setLayers] = useState(initialLayers);

  const toggleLayer = useCallback((layerId) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l));
  }, []);

  const setLayerOpacity = useCallback((layerId, opacity) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, opacity } : l));
  }, []);

  return { layers, toggleLayer, setLayerOpacity };
}
```

---

## 4. Architectural Quality Checklist

Before completing major code structures or refactors:
- [ ] Are UI components purely presentational, without hardcoded fetch URLs or complex calculations?
- [ ] Is configuration separated from execution code (constants in `constants/`)?
- [ ] Are asynchronous operations guarded with loading states, error handling, and abort controllers?
- [ ] Are memory leaks prevented (cleaning up event listeners, map instances, and timers in `useEffect` cleanup)?
- [ ] Is the module structure intuitive for a new developer or collaborator?

For detailed references, see:
- [Clean Component Architecture](./references/clean-component-architecture.md)
- [WebGIS Data Flow & Performance Architecture](./references/webgis-data-flow.md)
