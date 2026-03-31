# Casting Yard Pro

## Current State
The Batching-Plant is placed as individual 20×20m image-tiled elements. When N girders are configured, it places N elements per zone (above top road, below bottom road) each showing a tiling image.

## Requested Changes (Diff)

### Add
- `BATCHING_PLANT_AREAS` constant in `Canvas2D.tsx`: an array of 9 sub-area definitions (label + color), based on the uploaded diagram:
  1. QA/QC LAB
  2. RMC STORE
  3. RMC GARAGE
  4. AGGREGATES 10MM
  5. AGGREGATES 20MM
  6. CRUSHED SAND
  7. SEDIMENTATION TANK-3
  8. SEDIMENTATION TANK-2
  9. SEDIMENTATION TANK-1

### Modify
- `Canvas2D.tsx`: Add a special rendering branch for `el.name === "Batching-Plant"`. Instead of showing a tiling image, render the element as 9 equally-wide vertical strips, each with a distinct light background color, a border between them, and the sub-area label rotated 90° inside. Suppress the generic element name text for Batching-Plant.
- `LeftSidebar.tsx` — `handlePlaceBatchingPlant`: Remove `imageUrl` from placed Batching-Plant YardElement objects so the custom Canvas2D renderer takes over.

### Remove
- Nothing removed from existing features.

## Implementation Plan
1. Add `BATCHING_PLANT_AREAS` array constant near the top of `Canvas2D.tsx`.
2. In the Canvas2D elements rendering loop, add a branch: `el.name === 'Batching-Plant'` → render 9 sub-area `<rect>` elements with proportional widths, colored backgrounds, inner borders, and rotated text labels. Show a bold outer border (highlighted if selected).
3. Conditionally skip the generic `{el.name}` text label for Batching-Plant elements.
4. In `LeftSidebar.tsx`, remove `imageUrl` from Batching-Plant YardElements in `handlePlaceBatchingPlant` (both the fallback single-element case and the top/bottom zone loop).
