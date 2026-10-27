# WebGIS Data Flow & Performance Architecture

WebGIS applications manipulate spatial vectors (GeoJSON) and raster tiles. Managing memory, rendering cycles, and caching is essential for smooth 60fps interaction.

## 1. GeoJSON Optimization & Lifecycle

- **Vector Simplification**: High-detail regional polygons can contain millions of coordinates. Use pre-simplified GeoJSON (via Mapshaper or GDAL) with appropriate tolerance for web rendering to keep payload sizes `< 2-3MB`.
- **Key-based React Leaflet Rendering**:
  - React Leaflet `<GeoJSON />` does not dynamically update when internal styling changes unless given a unique key or using layer reference methods:
  ```jsx
  <GeoJSON
    key={`${layerId}-${selectedYear}`}
    data={geoData}
    style={getFeatureStyle}
    onEachFeature={onEachFeatureHandler}
  />
  ```

## 2. Raster Tile Pipeline & Earth Engine Caching

When integrating Google Earth Engine or remote XYZ raster tiles:
1. **Dynamic URL Resolution**:
   - Don't block UI initialization waiting for tile URLs.
   - Fetch the tile URL template asynchronously:
     ```javascript
     const tileUrl = `https://earthengine.googleapis.com/v1alpha/${mapId}/tiles/{z}/{x}/{y}`;
     ```
2. **Tile Layer Cleanup**:
   - When a user changes the year or toggles off a layer, unmount or set opacity to `0` cleanly so previous tile requests are aborted by the browser.

## 3. Asynchronous Error Boundaries

Spatial data queries are prone to network timeouts or rate limits.
- Wrap map layers in resilient error boundary guards so that a failure in one dataset (e.g. rainfall raster) does not crash the entire map canvas or navigation bar.
