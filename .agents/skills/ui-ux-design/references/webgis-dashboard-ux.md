# WebGIS & Dashboard UX Patterns

Geospatial web applications present unique user experience challenges because they combine high-density spatial data, complex layering, and real-time interactive mapping.

## 1. Spatial Layout Architecture

### Full-Bleed Map Canvas with Floating Control HUDs
- The map is the primary hero component. Set it to `width: 100vw; height: 100vh;` or `height: 100%` within the dashboard body.
- Overlay controls using an absolute floating Heads-Up Display (HUD) model:
  - **Top Navigation Bar (Glassmorphic)**: Application title, project scope, quick search / coordinate finder, and system status.
  - **Left Sidebar / Drawer**: Detailed layer controls, filter panels, analysis tools, and dataset switches. Should be collapsible to maximize map visibility.
  - **Top-Center or Bottom-Center Pill Toolbar**: Temporal controls (Year selector: 2021, 2022, 2023, 2024, 2025) and map mode switchers (2D vs. 3D, Satellite vs. Street).
  - **Bottom-Right Float**: Dynamic legend card and scale indicator.
  - **Top-Right Float**: Zoom controls, fullscreen toggle, locate me button, and basemap switcher thumbnail preview.

## 2. Layer Management UX

1. **Categorized Layer Tree**:
   - Don't dump 15 layers in a single flat list.
   - Categorize into accordions:
     - 🌍 *Basemaps* (OpenStreetMap, CartoDB Positron, Esri World Imagery)
     - 🛰️ *Satelit & Penginderaan Jauh* (Sentinel-2 True Color, Sentinel-1 SAR, NDVI)
     - 🏔️ *Topografi & Medan* (DEM SRTM, Slope / Kemiringan Lereng)
     - 🌧️ *Klimatologi* (Curah Hujan CHIRPS Tahunan)
     - 📍 *Batas Administrasi* (Batas Provinsi, Batas Kabupaten/Kota di Jabar)

2. **Layer Card Anatomy**:
   ```
   [Icon] [Layer Name]                [Toggle Switch]
   ├─ [Opacity Slider 0-100%]
   └─ [Metadata Tooltip / Info Icon: Source, Resolution, Year]
   ```

3. **Layer Feedback**:
   - When a raster tile layer or heavy GeoJSON is requested, show an inline subtle spinner or pulse dot next to the layer name until loading completes.

## 3. Map Inspection & Tooltip UX

- **Hover Tooltip**: Lightweight preview (e.g. County name: "Kab. Bandung Barat", Risk level: "Tinggi") with pointer offset so it never obscures the cursor.
- **Click Feature Drawer/Popup**:
  - Clean card design with title, badge tag (e.g. "Kerawanan: Sedang"), and a structured key-value table:
    - Rata-rata Curah Hujan
    - Sudut Kemiringan Lereng
    - Elevasi
    - Sumber Data
- Avoid standard ugly default browser alert dialogs or raw JSON popups.

## 4. Mobile & Tablet Responsiveness

- On screens `< 768px`:
  - Collapse sidebars into a bottom sheet drawer that can be dragged up or dismissed.
  - Hide secondary legends into a bottom sheet modal.
  - Enlarge map tap targets to at least 44x44px.
