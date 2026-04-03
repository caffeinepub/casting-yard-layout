# Casting Yard Pro

## Current State
Roads are auto-placed between bays (horizontal), above the top bay, below the bottom bay, and as two vertical roads on the left and right edges spanning the full height. These vertical roads are axis-aligned rectangles named "Road-Vertical". When a polygon boundary is drawn, these vertical roads don't follow the polygon edges.

## Requested Changes (Diff)

### Add
- Polygon boundary roads: when a `boundaryPoints` polygon is defined, place 10m-wide road segments along each edge of the polygon, rotated to match the angle of each edge. These are named "Road-Boundary" and use the road tile image.

### Modify
- Remove the left/right vertical roads (`Road-Vertical`) from both `autoLayout.ts` (wizard path) and `LeftSidebar.tsx` (manual bay placement path).
- Update `Canvas2D.tsx` rendering to support rotated road rendering for "Road-Boundary" elements (using SVG transform with rotation).

### Remove
- Left vertical road (Road-Vertical, left side)
- Right vertical road (Road-Vertical, right side)

## Implementation Plan
1. In `autoLayout.ts`: remove the two Road-Vertical push calls. Add a function `buildBoundaryRoads` that iterates over polygon edges, computes angle, and creates a 10m-wide road segment centered on each edge.
2. In `LeftSidebar.tsx` `handlePlaceBays`: remove the two Road-Vertical push calls. If boundary points exist in yard state, also call boundary road generation.
3. In `Canvas2D.tsx`: add rendering case for "Road-Boundary" that applies SVG rotation transform around the element center.
4. Road-Boundary elements store `rotationAngle` in degrees so the existing rotation rendering path can be reused.
