# Casting Yard Pro

## Current State
`YardBoundaryDrawer.tsx` is a full-screen SVG drawing canvas with a grid, pan/zoom, and click-to-place polygon boundary drawing. After closing the polygon, a Bay Config modal appears. There is no map integration.

## Requested Changes (Diff)

### Add
- Integrate OpenStreetMap (via Leaflet.js) into the `YardBoundaryDrawer` as the background layer instead of the plain grid.
- Search bar at the top of the drawer using the Nominatim geocoding API (free, no key required) to search for locations and pan/zoom the map.
- A "Lock Map" button in the toolbar that, once clicked, locks the map position (disables map panning/zooming), and switches the cursor to crosshair draw mode so the user can draw the polygon boundary on top of the map.
- When map is unlocked, drawing is disabled. When locked, drawing is enabled (current behavior preserved).
- Visual indicator showing lock state (locked = green icon, unlocked = blue icon).
- After boundary is drawn (closed polygon), the "Configure Bays" flow continues exactly as before.

### Modify
- Replace the plain SVG grid background in `YardBoundaryDrawer` with a Leaflet map container.
- SVG overlay is placed on top of the Leaflet map to handle polygon drawing (points in screen pixels, converted to meter offsets based on map scale at lock time).
- The hint bar message updates to reflect the new 3-step flow: (1) Search/pan map, (2) Lock map, (3) Draw boundary.
- Top toolbar: add search input + search button on the left, add Lock button in the middle.

### Remove
- The plain SVG grid lines (replaced by Leaflet map tiles).
- The static grid coordinate labels.

## Implementation Plan
1. Install `leaflet` and `@types/leaflet` npm packages.
2. Create a new `MapBoundaryDrawer` flow inside `YardBoundaryDrawer.tsx`:
   - Add Leaflet map container div (full-screen).
   - Initialize Leaflet map with OpenStreetMap tiles (no API key needed).
   - Add search bar using Nominatim API (`https://nominatim.openstreetmap.org/search`).
   - Add Lock button that freezes the map (disables dragging/zoom) and enables polygon drawing.
   - SVG overlay (position: absolute, full size) handles click-to-place points on top of the frozen map.
   - On lock, record the map's current view transform (center + zoom) to convert pixel offsets to meters using Leaflet's `latLngToContainerPoint` for coordinates.
   - When boundary is closed, pass points translated to meter units (using map scale at lock time: meters per pixel = `40075016.686 * cos(lat) / (256 * 2^zoom)`) to the existing `BayConfigModal` flow.
3. All existing logic (BayConfigModal, onConfirm, bay config) remains unchanged.
