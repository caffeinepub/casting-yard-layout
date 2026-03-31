# Casting Yard Pro

## Current State
When placing a Batching-Plant, the config panel lets the user enter I-girder count. Each girder = 20×20m space. A single element of size (count×20m) × 20m is added to the canvas at a default position. There is no automatic positioning relative to roads.

## Requested Changes (Diff)

### Add
- When the user clicks Place in the Batching-Plant config:
  - Find all horizontal `Road` elements from `placedElements`
  - Determine the topmost road (smallest yPosition) and bottommost road (largest yPosition + height)
  - Auto-place 2 rows of Batching-Plant units:
    - **Top row**: above the topmost road. Each unit height = available vertical space above the top road (topRoadY). Multiple units tile horizontally (one per girder count unit), each 20m wide.
    - **Bottom row**: below the bottommost road. Each unit height = available vertical space below (yardWidth - bottomRoadBottom). Multiple units tile horizontally.
  - If available vertical space <= 5m, fall back to 20m height per unit.
  - If no roads exist on canvas, fall back to placing a single unit at origin.

### Modify
- `handlePlaceBatchingPlant` in `LeftSidebar.tsx`: replace the single `onAddElement` call with `onAddRawElements` call that places 2 rows of N unit elements (N = girderCount) using the logic above.

### Remove
- Nothing removed.

## Implementation Plan
1. In `handlePlaceBatchingPlant`, filter `placedElements` for `Road` (not `Road-Vertical`) elements.
2. Find `topRoad` (min yPosition) and `bottomRoad` (max yPosition + height).
3. Compute `topHeight = topRoad.yPosition` (clamped to ≥ 20m if < 5m), `bottomHeight = yardWidth - (bottomRoad.yPosition + bottomRoad.height)` (same clamp).
4. Build `allElements` array with N top units + N bottom units, each 20m wide, tiling from the road's xPosition.
5. Call `onAddRawElements(allElements)` instead of `onAddElement`.
