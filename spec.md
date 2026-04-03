# Casting Yard Pro

## Current State
Auto-layout generates Roads (horizontal, between/above/below bays) and Road-Boundary elements (along polygon edges, rotated). Both types render in Canvas2D with a tiled road image.

## Requested Changes (Diff)

### Add
- Blue barricade blocks placed outside each road along its length, on both sides (top and bottom for horizontal roads; offset perpendicular for rotated boundary roads)
- Barricade specs: 10m length, 0.2m thickness (width), 5m height (3D), blue color (#1e40af)
- 0.5m spacing between consecutive barricade blocks along the road length
- Blocks connect along the full road length, repeated every 10.5m (10m block + 0.5m gap)
- Barricade elements named "Barricade" — rendered as solid blue rectangles in 2D
- Placed outside the road: for a horizontal Road, barricades go above (yPosition = road.yPosition - 0.2) and below (yPosition = road.yPosition + road.height)
- For Road-Boundary (rotated), barricades are placed offset perpendicular to the road edge on the outside

### Modify
- `autoLayout.ts`: after placing all roads, generate barricade elements for each Road and Road-Boundary
- `Canvas2D.tsx`: render "Barricade" elements as solid blue rectangles (no image, no special shape logic needed — uses default rectangle rendering with blue color)
- `LeftSidebar.tsx`: add "Barricade" to BAY_TYPES exclusion list so it is not considered a placeable sidebar element

### Remove
- Nothing removed

## Implementation Plan
1. In `autoLayout.ts`, after placing all roads and boundary roads, add a `generateBarricades()` helper that:
   - For each `Road` element: places barricade blocks along the full width (length) on both sides (top and bottom edges). Each block is 10m × 0.2m, spaced every 10.5m starting at xPosition, ending at xPosition + road.width.
   - For each `Road-Boundary` element: places barricade blocks along the edge on both perpendicular sides. The barricades inherit the same rotationAngle as the road, offset ±(ROAD_WIDTH/2 + 0.1) in the perpendicular direction.
2. Each barricade is a YardElement: name="Barricade", color="#1e40af", height=0.2, width=10, height3d=5, shape="rectangle", rotationAngle matches road angle.
3. Add "Barricade" to BAY_TYPES skip list in LeftSidebar.tsx.
4. No special Canvas2D rendering needed — default rectangle fill with color works.
