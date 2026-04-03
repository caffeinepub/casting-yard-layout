import type { SpacingSettings, YardElement } from "../types/yard";
import { DEFAULT_SPACING_SETTINGS } from "../types/yard";

export interface BoundaryPoint {
  x: number;
  y: number;
}

export interface NewYardConfig {
  yardLength: number;
  yardWidth: number;
  bayCount: number;
  bayLength: number;
  bayWidth: number;
  boundaryPoints?: BoundaryPoint[];
}

const ROAD_IMAGE =
  "/assets/uploads/raod-019d2e6f-b1b6-7075-ab34-f341729a23a7-1.png";
const RC_IMAGE =
  "/assets/uploads/image-019d33a4-4648-744f-86c1-eb304b8f6e32-1.png";
const SHED_IMAGE =
  "/assets/uploads/shedsquzre-019d3535-7bc3-7280-b6a1-111f64005e90-1.png";

const ROAD_WIDTH = 10;

/**
 * Calculate how many items fit within a section:
 * - Fill vertically (full bay height), then add columns up to 30% of bay length.
 */
export function sectionCount(
  bayLength: number,
  bayWidth: number,
  itemLength: number,
  itemWidth: number,
  verticalGap: number,
  bayMargin: number,
  columnGap: number,
): number {
  const sectionMaxWidth = bayLength * 0.3;
  const usableHeight = bayWidth - bayMargin * 2;
  const verticalStep = itemWidth + verticalGap;
  const maxPerColumn =
    usableHeight >= itemWidth
      ? Math.floor((usableHeight + verticalGap) / verticalStep)
      : 1;
  const maxColumns = Math.max(
    1,
    Math.floor((sectionMaxWidth + columnGap) / (itemLength + columnGap)),
  );
  return maxPerColumn * maxColumns;
}

/**
 * Get bounding box of a polygon.
 */
function getBoundingBox(points: BoundaryPoint[]) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

/**
 * Compute the x-range [minX, maxX] of a polygon at a given horizontal scan-line y.
 * Returns null if the scanline does not intersect the polygon.
 */
function polygonXRangeAtY(
  points: BoundaryPoint[],
  y: number,
): { minX: number; maxX: number } | null {
  const n = points.length;
  const intersections: number[] = [];

  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];

    const ay = a.y;
    const by = b.y;

    if (Math.abs(ay - by) < 1e-10) continue;

    const minEdgeY = Math.min(ay, by);
    const maxEdgeY = Math.max(ay, by);

    if (y < minEdgeY || y > maxEdgeY) continue;

    const t = (y - ay) / (by - ay);
    const x = a.x + t * (b.x - a.x);
    intersections.push(x);
  }

  if (intersections.length === 0) return null;

  return {
    minX: Math.min(...intersections),
    maxX: Math.max(...intersections),
  };
}

/**
 * Find the tightest x-extent that fits a rectangle of height `rectHeight`
 * starting at `rectTop` inside the polygon, sampled at multiple scanlines.
 *
 * Key insight: each bay is scanned INDEPENDENTLY at its own Y range.
 * This means Bay 1 can have a different length and start X than Bay 2,
 * depending on where the polygon boundary is at each bay's vertical position.
 *
 * Returns { left, right } or null if the rect doesn't fit.
 */
function getHorizontalExtentForRect(
  points: BoundaryPoint[],
  rectTop: number,
  rectHeight: number,
  inset: number,
): { left: number; right: number } | null {
  const SAMPLES = 20;
  let globalLeft = Number.NEGATIVE_INFINITY;
  let globalRight = Number.POSITIVE_INFINITY;

  for (let s = 0; s <= SAMPLES; s++) {
    const y = rectTop + (s / SAMPLES) * rectHeight;
    const range = polygonXRangeAtY(points, y);
    if (range === null) return null;
    globalLeft = Math.max(globalLeft, range.minX + inset);
    globalRight = Math.min(globalRight, range.maxX - inset);
  }

  if (globalLeft >= globalRight) return null;
  return { left: globalLeft, right: globalRight };
}

/**
 * Exported helper: compute the maximum bay length that fits inside a boundary
 * polygon (with inset), for a bay of the given height starting at rectTop.
 * Used by the wizard to display/enforce the max bay length.
 */
export function maxBayLengthForBoundary(
  points: BoundaryPoint[],
  rectTop: number,
  rectHeight: number,
  inset = 2,
): number {
  if (points.length < 3) return 0;
  const extent = getHorizontalExtentForRect(points, rectTop, rectHeight, inset);
  if (!extent) return 0;
  return Math.max(0, extent.right - extent.left);
}

/**
 * Build all YardElement[] for an auto-layout from config.
 * Returns a flat array ready to be passed to onAddRawElements.
 *
 * Per-bay length: each bay is fitted independently at its own Y position
 * inside the polygon, so bays in wider parts of the polygon are longer
 * and bays in narrower parts are shorter. All bays are parallel (same Y rows)
 * but can have different lengths and start X positions.
 */
export function buildAutoLayoutElements(
  config: NewYardConfig,
  spacingSettings: SpacingSettings = DEFAULT_SPACING_SETTINGS,
): YardElement[] {
  const { yardLength, yardWidth, bayCount, bayWidth, boundaryPoints } = config;
  const spacing = spacingSettings.bayVerticalSpacing;
  const INSET = 2;

  // ── Determine safe area for bay placement ──
  let safeMinX: number;
  let safeMinY: number;
  let safeMaxX: number;
  let safeMaxY: number;

  if (boundaryPoints && boundaryPoints.length >= 3) {
    const bb = getBoundingBox(boundaryPoints);
    safeMinX = bb.minX + INSET;
    safeMinY = bb.minY + INSET;
    safeMaxX = bb.maxX - INSET;
    safeMaxY = bb.maxY - INSET;
  } else {
    safeMinX = 0;
    safeMinY = 0;
    safeMaxX = yardLength;
    safeMaxY = yardWidth;
  }

  const safeHeight = safeMaxY - safeMinY;

  // ── Determine bay vertical stacking layout ──
  const totalHeight = bayCount * bayWidth + (bayCount - 1) * spacing;
  const startY = safeMinY + Math.max(0, (safeHeight - totalHeight) / 2);
  const clampedStartY = Math.max(
    safeMinY,
    Math.min(startY, safeMaxY - totalHeight),
  );

  const allElements: YardElement[] = [];
  let idSeq = 0;

  const makeId = (): bigint => {
    idSeq++;
    return BigInt(Date.now()) * 100000n + BigInt(idSeq);
  };

  // ── 1. Build Bays ──
  // Each bay gets its OWN horizontal extent by scanning the polygon
  // independently at that bay's Y range. Bays are parallel but can differ
  // in length and start X based on where the boundary is at their Y position.
  const bayRefs: YardElement[] = [];
  let curY = clampedStartY;

  // Compute per-bay extents
  const bayExtents: Array<{
    bayY: number;
    left: number;
    right: number;
    bayLength: number;
    startX: number;
  }> = [];

  for (let i = 0; i < bayCount; i++) {
    const bayTop = curY;
    // bayBottom unused, scanlines handled by getHorizontalExtentForRect

    let left: number;
    let right: number;

    if (boundaryPoints && boundaryPoints.length >= 3) {
      // Scan polygon at THIS bay's Y range only
      const extent = getHorizontalExtentForRect(
        boundaryPoints,
        bayTop,
        bayWidth,
        INSET,
      );

      if (extent) {
        left = extent.left;
        right = extent.right;
      } else {
        // Bay doesn't fit inside boundary at this Y — skip or use safe box
        left = safeMinX;
        right = safeMaxX;
      }
    } else {
      left = safeMinX;
      right = safeMaxX;
    }

    // Cap bay length to user-requested value, positioned centered in available space
    const available = right - left;
    const thisLen = Math.min(config.bayLength, available);
    const thisStartX = left + (available - thisLen) / 2;

    bayExtents.push({
      bayY: bayTop,
      left,
      right,
      bayLength: thisLen,
      startX: thisStartX,
    });

    curY += bayWidth;
    if (i < bayCount - 1) curY += spacing;
  }

  // Reset curY for building elements
  curY = clampedStartY;

  for (let i = 0; i < bayCount; i++) {
    const { bayY, bayLength, startX } = bayExtents[i];

    const bay: YardElement = {
      id: makeId(),
      name: "Bay",
      elementType: "custom",
      width: bayLength,
      height: bayWidth,
      xPosition: startX,
      yPosition: bayY,
      rotationAngle: 0,
      color: "#1a6b2a",
      status: "planned",
      height3d: 0.15,
      shape: "rectangle",
    };
    bayRefs.push(bay);
    allElements.push(bay);

    // Road between this bay and next
    if (i < bayCount - 1) {
      const roadY = bayY + bayWidth + (spacing - ROAD_WIDTH) / 2;

      // Road spans from the leftmost left to rightmost right of adjacent bays
      const nextExt = bayExtents[i + 1];
      const roadLeft = Math.min(startX, nextExt.startX);
      const roadRight = Math.max(
        startX + bayLength,
        nextExt.startX + nextExt.bayLength,
      );

      allElements.push({
        id: makeId(),
        name: "Road",
        elementType: "custom",
        width: roadRight - roadLeft,
        height: ROAD_WIDTH,
        xPosition: roadLeft,
        yPosition: roadY,
        rotationAngle: 0,
        color: "#888888",
        status: "planned",
        height3d: 0.1,
        shape: "rectangle",
        imageUrl: ROAD_IMAGE,
      });
    }
  }

  // ── Top road (0.5m above first bay) ──
  const firstExt = bayExtents[0];
  const lastExt = bayExtents[bayCount - 1];

  allElements.unshift({
    id: makeId(),
    name: "Road",
    elementType: "custom",
    width: firstExt.bayLength,
    height: ROAD_WIDTH,
    xPosition: firstExt.startX,
    yPosition: firstExt.bayY - ROAD_WIDTH - 0.5,
    rotationAngle: 0,
    color: "#888888",
    status: "planned",
    height3d: 0.1,
    shape: "rectangle",
    imageUrl: ROAD_IMAGE,
  });

  // ── Bottom road (0.5m below last bay) ──
  const lastBayEndY = lastExt.bayY + bayWidth;
  allElements.push({
    id: makeId(),
    name: "Road",
    elementType: "custom",
    width: lastExt.bayLength,
    height: ROAD_WIDTH,
    xPosition: lastExt.startX,
    yPosition: lastBayEndY + 0.5,
    rotationAngle: 0,
    color: "#888888",
    status: "planned",
    height3d: 0.1,
    shape: "rectangle",
    imageUrl: ROAD_IMAGE,
  });

  // ── Polygon boundary roads ──
  // When a polygon boundary is drawn, place 10m-wide road segments along each edge,
  // rotated to match the angle of that edge. Roads are placed offset outward by ROAD_WIDTH/2
  // so they sit just outside (or along) the polygon perimeter.
  if (boundaryPoints && boundaryPoints.length >= 3) {
    const n = boundaryPoints.length;
    for (let i = 0; i < n; i++) {
      const a = boundaryPoints[i];
      const b = boundaryPoints[(i + 1) % n];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const edgeLength = Math.sqrt(dx * dx + dy * dy);
      if (edgeLength < 1) continue;

      // Angle in degrees (SVG rotate)
      const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);

      // Center of the edge segment
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;

      // The road rect: width = edgeLength, height = ROAD_WIDTH
      // xPosition/yPosition = top-left before rotation, centered on edge midpoint
      allElements.push({
        id: makeId(),
        name: "Road-Boundary",
        elementType: "custom",
        width: edgeLength,
        height: ROAD_WIDTH,
        xPosition: cx - edgeLength / 2,
        yPosition: cy - ROAD_WIDTH / 2,
        rotationAngle: angleDeg,
        color: "#888888",
        status: "planned",
        height3d: 0.1,
        shape: "rectangle",
        imageUrl: ROAD_IMAGE,
      });
    }
  }

  // ── 2. Place elements ON each bay ──
  const iGirderLength = 30;
  const iGirderWidth = 0.8;
  const iGirderHeight3d = 2;

  const fwLength = 30;
  const fwWidth = 4;
  const fwHeight3d = 6;

  const rcLength = 30;
  const rcWidth = 0.8;
  const rcHeight3d = 2;

  for (const bay of bayRefs) {
    const sectionMaxWidth = bay.width * 0.3;

    // ── Section 1: I-Girders (left third) ──
    const iGirderStartX = bay.xPosition + spacingSettings.iGirderLeftMargin;
    placeColumnStack({
      bay,
      itemLength: iGirderLength,
      itemWidth: iGirderWidth,
      startX: iGirderStartX,
      maxSectionWidth: sectionMaxWidth,
      verticalGap: spacingSettings.iGirderVerticalGap,
      bayMargin: spacingSettings.iGirderBayMargin,
      columnGap: spacingSettings.iGirderColumnGap,
      name: "I-Girder",
      color: "#c8c8c8",
      height3d: iGirderHeight3d,
      allElements,
      makeId,
    });

    const iGirderSectionRightEdge = iGirderStartX + sectionMaxWidth;

    // ── Section 2: Formwork + Shed (middle third) ──
    const fwStartX = iGirderSectionRightEdge + 2;
    placeColumnStack({
      bay,
      itemLength: fwLength,
      itemWidth: fwWidth,
      startX: fwStartX,
      maxSectionWidth: sectionMaxWidth,
      verticalGap: spacingSettings.formworkVerticalGap,
      bayMargin: spacingSettings.formworkBayMargin,
      columnGap: spacingSettings.formworkColumnGap,
      name: "Box-I-Girder-Formwork",
      color: "#FF6B00",
      height3d: fwHeight3d,
      allElements,
      makeId,
    });

    const fwSectionRightEdge = fwStartX + sectionMaxWidth;

    // Factory-Shed over formwork
    allElements.push({
      id: makeId(),
      name: "Factory-Shed",
      elementType: "custom",
      width: sectionMaxWidth,
      height: bay.height,
      xPosition: fwStartX,
      yPosition: bay.yPosition,
      rotationAngle: 0,
      color: "#b0b0b0",
      status: "planned",
      height3d: 20,
      shape: "open",
      imageUrl: SHED_IMAGE,
    });

    // ── Section 3: Reinforcement-Cage (right third) ──
    const rcStartX = fwSectionRightEdge + 2;
    placeColumnStack({
      bay,
      itemLength: rcLength,
      itemWidth: rcWidth,
      startX: rcStartX,
      maxSectionWidth: sectionMaxWidth,
      verticalGap: spacingSettings.rcVerticalGap,
      bayMargin: spacingSettings.rcBayMargin,
      columnGap: spacingSettings.rcColumnGap,
      name: "Reinforcement-Cage",
      color: "#555555",
      height3d: rcHeight3d,
      imageUrl: RC_IMAGE,
      allElements,
      makeId,
    });
  }

  return allElements;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface StackParams {
  bay: YardElement;
  itemLength: number;
  itemWidth: number;
  startX: number;
  maxSectionWidth: number;
  verticalGap: number;
  bayMargin: number;
  columnGap: number;
  name: string;
  color: string;
  height3d: number;
  imageUrl?: string;
  allElements: YardElement[];
  makeId: () => bigint;
}

/**
 * Place items in a column-first stack:
 * - Fill as many items vertically as the bay height allows.
 * - Add columns rightward until maxSectionWidth is exhausted.
 * - Never places beyond startX + maxSectionWidth.
 */
function placeColumnStack(params: StackParams) {
  const {
    bay,
    itemLength,
    itemWidth,
    startX,
    maxSectionWidth,
    verticalGap,
    bayMargin,
    columnGap,
    name,
    color,
    height3d,
    imageUrl,
    allElements,
    makeId,
  } = params;

  const verticalStep = itemWidth + verticalGap;
  const usableHeight = bay.height - bayMargin * 2;
  const maxPerColumn =
    usableHeight >= itemWidth
      ? Math.floor((usableHeight + verticalGap) / verticalStep)
      : 1;

  const maxColumns = Math.max(
    1,
    Math.floor((maxSectionWidth + columnGap) / (itemLength + columnGap)),
  );

  const totalCount = maxPerColumn * maxColumns;

  let placed = 0;
  let colIndex = 0;

  while (placed < totalCount && colIndex < maxColumns) {
    const inThisCol = Math.min(maxPerColumn, totalCount - placed);
    const colX = startX + colIndex * (itemLength + columnGap);

    if (colX + itemLength > startX + maxSectionWidth + 0.01) break;

    const colHeight = inThisCol * itemWidth + (inThisCol - 1) * verticalGap;
    const colStartY =
      bay.yPosition + bayMargin + (usableHeight - colHeight) / 2;

    for (let i = 0; i < inThisCol; i++) {
      allElements.push({
        id: makeId(),
        name,
        elementType: "custom",
        width: itemLength,
        height: itemWidth,
        xPosition: colX,
        yPosition: colStartY + i * verticalStep,
        rotationAngle: 0,
        color,
        status: "planned",
        height3d,
        shape: "rectangle",
        imageUrl,
      });
    }

    placed += inThisCol;
    colIndex++;
  }
}
