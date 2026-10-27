# Clean Component Architecture

In modern React applications, adhering to clean architecture patterns keeps components easy to test, maintain, and scale.

## 1. Container vs. Presentational Pattern

### Presentational Components
- **Responsibility**: Look and feel.
- Receive data and callbacks via props only.
- Have minimal or no internal state (except local UI toggles like open/closed dropdowns).
- Examples: `LayerCard`, `LegendBar`, `YearPicker`, `ModalDialog`.

### Container Components (Smart Components)
- **Responsibility**: How things work.
- Fetch data, manage lifecycle, coordinate side effects, subscribe to stores/hooks.
- Pass clean, formatted props down to Presentational components.
- Examples: `LayerPanelContainer`, `MapViewportContainer`.

## 2. Custom Hooks as the ViewModel

Instead of putting complex logic into components, extract custom hooks:

```javascript
// Example: src/hooks/useJabarBoundary.js
import { useState, useEffect } from 'react';
import { fetchJabarGeoJson } from '../services/geojsonService';

export function useJabarBoundary() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchJabarGeoJson()
      .then((geoData) => {
        if (isMounted) {
          setData(geoData);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Gagal memuat batas wilayah');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { data, isLoading, error };
}
```

## 3. Immutability & Pure Functions

- Place coordinate conversions, calculation of slope percentages, and formatting in `utils/`.
- Keep utilities as pure functions:
  ```javascript
  // src/utils/geoFormatters.js
  export function formatCoordinates(lat, lng) {
    if (lat == null || lng == null) return '-';
    const latDir = lat >= 0 ? 'LU' : 'LS';
    const lngDir = lng >= 0 ? 'BT' : 'BB';
    return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
  }
  ```
