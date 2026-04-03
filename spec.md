# Casting Yard Pro

## Current State

The 'Create New' button on the Dashboard fires a zero-argument `onCreateNew()` callback that immediately opens the 2D editor with a blank 500×300m yard. No dimensions are asked. The user must then:
1. Click 'Bay' in the sidebar, manually enter bay count/length/width, and click Place
2. Separately click I-Girder, enter config, click Place
3. Separately click Formwork, enter config, click Place
4. Separately click Factory-Shed to auto-place
5. Separately click Reinforcement-Cage, enter config, click Place

## Requested Changes (Diff)

### Add
- A multi-step **Create New Wizard** modal/dialog that intercepts the 'Create New' button click, BEFORE opening the editor.
- **Step 1 – Yard Dimensions:** Ask for yard length (m) and yard width (m). Pre-filled with defaults (500 × 300).
- **Step 2 – Bay Configuration:** Ask for number of bays, bay length (m), and bay width (m). Bay width defaults to something reasonable (e.g., 30m). Bay length defaults to 150m.
- **Step 3 – Auto-Placement Preview / Confirm:** Show a summary of what will be created and a 'Create Layout' button.
- On confirm, open the editor with the entered yard dimensions AND immediately auto-place all elements using calculated counts derived from bay length:
  - **Bay division rule:** Each bay is divided into 3 equal sections based on bay length.
    - Section 1 (left third): I-Girders — count = floor(bayLength / 3 / girderLength) where girder default is 30m. Minimum 1.
    - Section 2 (middle third): Formwork + Factory-Shed — formwork count = floor(bayLength / 3 / formworkLength) where formwork default is 30m. Minimum 1.
    - Section 3 (right third): Reinforcement-Cage — count = floor(bayLength / 3 / rcLength) where RC default is 30m. Minimum 1.
  - All elements use their existing defaults (I-Girder: 30m×0.8m×2m, Formwork: 30m×4m×6m, RC: 30m×0.8m×2m).
  - The three sections are placed horizontally within each bay, starting from 10m left margin:
    - I-Girders start at bay.xPosition + 10m, placed left-to-right, filling section 1 width (bayLength/3)
    - Formwork starts right after I-Girder section ends + 2m, filling section 2 width (bayLength/3)
    - Factory-Shed auto-placed over formwork immediately after formwork placement
    - Reinforcement-Cages start right after Formwork section ends + 2m, filling section 3 width (bayLength/3)
  - Roads auto-placed as normal (already handled by handlePlaceBays).

### Modify
- `Dashboard.tsx`: Change `onCreateNew` prop from `() => void` to accept a callback that receives yard dimensions — OR keep the prop as `() => void` but add a new `onCreateNewWithConfig` prop of type `(config: NewYardConfig) => void`. Simplest approach: show the wizard inside Dashboard before calling the parent.
- `App.tsx`: Update the handler that receives `onCreateNew` to accept yard dimensions and pass them when creating the new editor state.
- `LeftSidebar.tsx`: Extract the placement logic for Bay, I-Girder, Formwork, Factory-Shed, and Reinforcement-Cage into callable functions that accept parameters directly (not just reading from dialog state), so they can be invoked programmatically from App.tsx or Dashboard after the wizard completes.

### Remove
- Nothing removed.

## Implementation Plan

1. Create a `NewYardWizard` component (modal dialog with 2–3 steps):
   - Step 1: Yard Length, Yard Width inputs
   - Step 2: Number of Bays, Bay Length, Bay Width inputs
   - Step 3: Summary card showing the computed element counts (I-Girders, Formwork, RC per bay and total), with a 'Create Layout' confirm button
   - Cancel goes back to dashboard without opening editor

2. In `App.tsx`, change `onCreateNew` handler to accept a `NewYardConfig` object `{ yardLength, yardWidth, bayCount, bayLength, bayWidth }` and:
   - Set the yard dimensions from config
   - Open the editor view
   - Immediately call the auto-placement logic with the config parameters

3. Add a programmatic placement function (or trigger via useEffect + a `pendingAutoPlacement` state) that:
   a. Places N bays (centered, with roads auto-placed) using the config
   b. For each bay, places I-Girders in section 1
   c. For each bay, places Formwork in section 2
   d. For each bay, auto-places Factory-Shed over formwork
   e. For each bay, places Reinforcement-Cages in section 3

4. The calculation for element count per section:
   - sectionLength = bayLength / 3
   - iGirderCount per bay = max(1, floor(sectionLength / 30))
   - formworkCount per bay = max(1, floor(sectionLength / 30))
   - rcCount per bay = max(1, floor(sectionLength / 30))
   - All applied across all bays

5. The wizard shows a summary on Step 3:
   - Yard size: X m × Y m
   - Bays: N bays of L m × W m
   - I-Girders per bay: N (section 1)
   - Formwork per bay: N (section 2)
   - Reinforcement-Cages per bay: N (section 3)
   - Factory-Shed: auto-placed over formwork (1 per bay)
