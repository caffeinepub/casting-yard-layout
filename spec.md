# Casting Yard Pro

## Current State
I-Girders, Formwork, and Reinforcement-Cages are placed on Bays in a single-axis stacking pattern:
- Girders stack **only vertically** within a column until the Bay height is exhausted
- After the column fills, the next column starts to the right (+girderLength + 2m gap)
- The Bay does NOT auto-resize; girders just pack into whatever Bay size was set at placement time

## Requested Changes (Diff)

### Add
- Bay auto-sizing logic: when I-Girders (and Formwork/Reinforcement-Cage) are placed, the Bay should automatically resize to accommodate them in a **grid arrangement** that grows in BOTH horizontal and vertical directions
- Grid layout calculation: `cols = ceil(sqrt(N))`, `rows = ceil(N / cols)` — so 1→1×1, 4→2×2, 9→3×3, etc.
- Bay auto-resize formula:
  - New bay length = leftMargin(10m) + cols × (girderLength + colGap) − colGap + rightPadding(10m)
  - New bay height = topMargin(2m) + rows × (girderWidth + vertGap) − vertGap + bottomPadding(2m)
- All roads and grouped elements on the Bay should update their positions after Bay resize

### Modify
- I-Girder placement in `handlePlaceIGirders`: instead of filling one column then overflowing right, use the square-grid arrangement. Place `cols` columns × `rows` rows, starting from left margin of bay, spacing girderWidth + 0.5m vertically, girderLength + 2m horizontally
- The Bay element placed first should auto-resize when girders are placed on it (resize the bay element in the elements array to the computed dimensions, keeping its center position)
- Same grid logic applied to Formwork and Reinforcement-Cage placement
- When the Bay resizes, roads between/above/below bays should be recalculated/moved accordingly

### Remove
- Nothing removed

## Implementation Plan
1. In `LeftSidebar.tsx`, create a helper `computeGridLayout(N, itemW, itemH, leftMargin, topMargin, colGap, vertGap)` that returns `{ cols, rows, bayLength, bayWidth, positions[] }`
2. In `handlePlaceIGirders`: call `computeGridLayout`, then call `onResizeBay(bayId, newLength, newWidth)` to resize each Bay before adding girder elements. Place girders at the computed grid positions.
3. In `handlePlaceFormwork` and `handlePlaceReinforcementCage`: apply the same grid layout and Bay resize logic
4. In `App.tsx` (or wherever Bay elements live), implement `onResizeBay(id, newWidth, newHeight)` that updates the bay element dimensions and repositions it (keeping center), then re-triggers road recalculation
5. When the Bay resizes, grouped child elements (I-Girders, Formwork etc.) that are already on the bay should be re-positioned relative to the new bay left edge (keep 10m left margin from the new bay x)
