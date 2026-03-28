# Casting Yard Pro

## Current State
Equipment section has: Gantry-Crane, Batching-Plant, Road, Reinforcement-Cage. Reinforcement-Cage tiles its image horizontally using an SVG pattern. All equipment items are in EQUIPMENT_ITEMS array in LeftSidebar.tsx with imageUrl references.

## Requested Changes (Diff)

### Add
- New Equipment item: **Factory-Shed** in the Equipment section (EQUIPMENT_ITEMS array)
  - Image: `/assets/uploads/shedsquzre-019d3535-7bc3-7280-b6a1-111f64005e90-1.png`
  - Clicking it in the sidebar auto-calculates size from placed girders and bays:
    - **Width** = bay width (the vertical dimension of the Bay element, i.e. `bay.height` in the data model)
    - **Length** = total span of all I-Girders placed on that bay: from the leftmost girder x position to the rightmost girder x + girder width (covering all girder columns)
  - If multiple bays exist, place one shed per bay covering that bay's girders
  - Shed is positioned at bay.xPosition (left edge) and bay.yPosition (top edge)
  - No config panel needed — size is auto-calculated; just a "Place" button or direct click
  - If no girders are placed, show toast: "Please place I-Girders first"
  - The shed element has `tileHorizontal: true` flag (or name === 'Factory-Shed') so Canvas2D tiles image horizontally (along the length/width axis) but NOT vertically

- In Canvas2D.tsx: add rendering branch for `el.name === 'Factory-Shed'` that uses an SVG pattern tiling horizontally:
  - Pattern width = image natural tile width (use eh — the pixel height of the element — as the tile width to make it square-tile like Reinforcement-Cage, but only repeat in X direction)
  - Pattern height = eh (full height, no tiling vertically)
  - This means the image is repeated horizontally but stretched to fill exactly the full height

### Modify
- LeftSidebar: add shedDialogOpen state (or just handle inline click), add Factory-Shed to EQUIPMENT_ITEMS, add handlePlaceFactoryShed function that reads bays and I-Girders from placedElements

### Remove
- Nothing

## Implementation Plan
1. Add Factory-Shed to EQUIPMENT_ITEMS in LeftSidebar.tsx with the shed image URL
2. Add `shedDialogOpen` state and `handlePlaceFactoryShed()` function that:
   - Filters bays from placedElements
   - For each bay, finds all I-Girders placed within it (xPosition >= bay.xPosition && xPosition < bay.xPosition + bay.width)
   - Calculates shed length = max(girder.xPosition + girder.width) - min(girder.xPosition) across all girders in that bay
   - Calculates shed width = bay.height (the vertical extent of the bay)
   - Places shed at xPosition = min(girder.xPosition), yPosition = bay.yPosition
   - If no I-Girders found, show toast error
3. In the Equipment section JSX, add click handler for Factory-Shed that calls handlePlaceFactoryShed directly (no config panel needed)
4. In Canvas2D.tsx, add branch for `el.name === 'Factory-Shed'` using SVG pattern that tiles horizontally only (pattern width = eh to keep square tiles, pattern height = eh, covering full element width)
