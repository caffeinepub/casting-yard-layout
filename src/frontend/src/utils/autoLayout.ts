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
 *
 * When a polygon boundary is drawn, each bay uses the MAXIMUM available width
 * at its Y position (starting from the polygon left edge), not centered or
 * capped by the user-specified bay length. This ensures bays fill the polygon
 * horizontally as much as possible.
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

  // When a polygon boundary is present, scan all valid Y start positions and
  // pick the one that maximises the TOTAL horizontal span across all bays.
  // This ensures bays are placed where the polygon is widest (upper or lower
  // part of the yard), not always at the centre.
  let clampedStartY: number;

  if (
    boundaryPoints &&
    boundaryPoints.length >= 3 &&
    totalHeight <= safeHeight
  ) {
    const SCAN_STEP = 1; // 1m resolution
    let bestY = safeMinY;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (
      let candidateY = safeMinY;
      candidateY <= safeMaxY - totalHeight;
      candidateY += SCAN_STEP
    ) {
      let totalSpan = 0;
      let valid = true;

      for (let b = 0; b < bayCount; b++) {
        const bayTop = candidateY + b * (bayWidth + spacing);
        const extent = getHorizontalExtentForRect(
          boundaryPoints,
          bayTop,
          bayWidth,
          INSET,
        );
        if (!extent) {
          valid = false;
          break;
        }
        totalSpan += extent.right - extent.left;
      }

      if (valid && totalSpan > bestScore) {
        bestScore = totalSpan;
        bestY = candidateY;
      }
    }

    clampedStartY = bestY;
  } else {
    // No polygon (dimension mode): centre the bays vertically
    const startY = safeMinY + Math.max(0, (safeHeight - totalHeight) / 2);
    clampedStartY = Math.max(
      safeMinY,
      Math.min(startY, safeMaxY - totalHeight),
    );
  }

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
  //
  // When a polygon is drawn: use the FULL available width (left → right) at
  // each bay's Y position, so the bay spans the maximum polygon width there.
  // When no polygon: use user-specified bayLength, centered in safe area.
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
        // Bay doesn't fit inside boundary at this Y — fall back to safe box
        left = safeMinX;
        right = safeMaxX;
      }
    } else {
      left = safeMinX;
      right = safeMaxX;
    }

    const available = right - left;

    let thisLen: number;
    let thisStartX: number;

    if (boundaryPoints && boundaryPoints.length >= 3) {
      // Polygon mode: use full available width, bay starts at polygon left edge
      thisLen = available;
      thisStartX = left;
    } else {
      // Dimension mode: cap to user-specified length, centered in safe area
      thisLen = Math.min(config.bayLength, available);
      thisStartX = left + (available - thisLen) / 2;
    }

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

  // ── Barricade blocks ──
  // Blue barricade blocks placed ONLY outside the polygon boundary roads.
  // They appear on the outer side of each Road-Boundary element (away from polygon centroid).
  // Specs: 10m length, 0.2m thickness, 5m height (3D), blue (#1e40af), 0.5m spacing.
  if (boundaryPoints && boundaryPoints.length >= 3) {
    const BARRICADE_LENGTH = 10;
    const BARRICADE_THICKNESS = 0.2;
    const BARRICADE_HEIGHT_3D = 5;
    const BARRICADE_SPACING = 0.5;
    const BARRICADE_STEP = BARRICADE_LENGTH + BARRICADE_SPACING;
    const BARRICADE_COLOR = "#1e40af";

    // Compute polygon centroid to determine which side of each boundary road is "outside"
    const centroidX =
      boundaryPoints.reduce((s, p) => s + p.x, 0) / boundaryPoints.length;
    const centroidY =
      boundaryPoints.reduce((s, p) => s + p.y, 0) / boundaryPoints.length;

    const boundaryRoads = allElements.filter(
      (el) => el.name === "Road-Boundary",
    );
    for (const road of boundaryRoads) {
      const angleRad = (road.rotationAngle * Math.PI) / 180;
      const edgeLen = road.width; // width = edge length before rotation
      const roadH = road.height; // = ROAD_WIDTH = 10

      // Road center
      const cx = road.xPosition + edgeLen / 2;
      const cy = road.yPosition + roadH / 2;

      // Perpendicular direction: angle + 90°
      const perpX = -Math.sin(angleRad);
      const perpY = Math.cos(angleRad);

      // Offset from road center to barricade row center (flush at road outer edge)
      const offset = roadH / 2;

      // Determine which sign is "outward" (away from centroid)
      // Test both candidate row centers and pick the one further from centroid
      const rowCx_pos = cx + offset * perpX;
      const rowCy_pos = cy + offset * perpY;
      const rowCx_neg = cx - offset * perpX;
      const rowCy_neg = cy - offset * perpY;

      const dist_pos = Math.hypot(rowCx_pos - centroidX, rowCy_pos - centroidY);
      const dist_neg = Math.hypot(rowCx_neg - centroidX, rowCy_neg - centroidY);

      // Use the side further from centroid (i.e., outside the polygon)
      const outSign = dist_pos >= dist_neg ? 1 : -1;
      const rowCx = cx + outSign * offset * perpX;
      const rowCy = cy + outSign * offset * perpY;

      // Place barricade blocks along this outer row
      let blockOffset = 0;
      while (blockOffset + BARRICADE_LENGTH <= edgeLen + 0.01) {
        const blockLen = Math.min(BARRICADE_LENGTH, edgeLen - blockOffset);
        if (blockLen < 0.5) break;

        const blockCenterLocal = blockOffset + blockLen / 2 - edgeLen / 2;
        const localX = blockCenterLocal - blockLen / 2;
        const localY = -BARRICADE_THICKNESS / 2;

        const rotatedX =
          localX * Math.cos(angleRad) - localY * Math.sin(angleRad);
        const rotatedY =
          localX * Math.sin(angleRad) + localY * Math.cos(angleRad);

        allElements.push({
          id: makeId(),
          name: "Barricade",
          elementType: "custom",
          width: blockLen,
          height: BARRICADE_THICKNESS,
          xPosition: rowCx + rotatedX,
          yPosition: rowCy + rotatedY,
          rotationAngle: road.rotationAngle,
          color: BARRICADE_COLOR,
          status: "planned",
          height3d: BARRICADE_HEIGHT_3D,
          shape: "rectangle",
        });
        blockOffset += BARRICADE_STEP;
      }
    }
  }

  // ── READY TO OCCUPY blocks ──
  // Fill empty space inside the polygon (or yard bounds) that is not occupied
  // by bays or roads. Red blocks, 0.3m height (3D), named "READY TO OCCUPY".
  {
    const GRID = 10; // 10m grid cell size
    const RTO_COLOR = "#ef4444";
    const RTO_HEIGHT_3D = 0.3;
    const RTO_MARGIN = 1; // 1m inset from boundary roads

    // Determine scan area
    let scanMinX: number;
    let scanMinY: number;
    let scanMaxX: number;
    let scanMaxY: number;

    if (boundaryPoints && boundaryPoints.length >= 3) {
      const bb = getBoundingBox(boundaryPoints);
      // Inset by road width + margin so we stay inside the barricade/road ring
      const roadInset = ROAD_WIDTH + RTO_MARGIN;
      scanMinX = bb.minX + roadInset;
      scanMinY = bb.minY + roadInset;
      scanMaxX = bb.maxX - roadInset;
      scanMaxY = bb.maxY - roadInset;
    } else {
      // No polygon: use yard bounds inset by one road width
      const roadInset = ROAD_WIDTH + RTO_MARGIN;
      scanMinX = roadInset;
      scanMinY = roadInset;
      scanMaxX = yardLength - roadInset;
      scanMaxY = yardWidth - roadInset;
    }

    if (scanMaxX > scanMinX + GRID && scanMaxY > scanMinY + GRID) {
      // Collect axis-aligned occupied rectangles (bays + non-rotated roads)
      // We ignore rotated boundary roads since they sit on the perimeter.
      type Rect = { x1: number; y1: number; x2: number; y2: number };
      const occupied: Rect[] = [];
      for (const el of allElements) {
        if (
          el.name === "Bay" ||
          el.name === "Road" ||
          el.name === "Road-Boundary"
        ) {
          // Expand by 1m padding for breathing room
          const pad = 1;
          occupied.push({
            x1: el.xPosition - pad,
            y1: el.yPosition - pad,
            x2: el.xPosition + el.width + pad,
            y2: el.yPosition + el.height + pad,
          });
        }
      }

      // Point-in-polygon test (ray casting)
      const isInsidePolygon = (px: number, py: number): boolean => {
        if (!boundaryPoints || boundaryPoints.length < 3) return true;
        const n = boundaryPoints.length;
        let inside = false;
        for (let i = 0, j = n - 1; i < n; j = i++) {
          const xi = boundaryPoints[i].x;
          const yi = boundaryPoints[i].y;
          const xj = boundaryPoints[j].x;
          const yj = boundaryPoints[j].y;
          const intersect =
            yi > py !== yj > py &&
            px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
          if (intersect) inside = !inside;
        }
        return inside;
      };

      // Grid scan
      const cols = Math.ceil((scanMaxX - scanMinX) / GRID);
      const rows = Math.ceil((scanMaxY - scanMinY) / GRID);
      // free[row][col] = true means this cell is free
      const free: boolean[][] = Array.from({ length: rows }, () =>
        new Array(cols).fill(true),
      );

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cellX = scanMinX + c * GRID;
          const cellY = scanMinY + r * GRID;
          const cellCX = cellX + GRID / 2;
          const cellCY = cellY + GRID / 2;

          // Check if center is inside polygon
          if (!isInsidePolygon(cellCX, cellCY)) {
            free[r][c] = false;
            continue;
          }

          // Check against occupied rectangles
          for (const occ of occupied) {
            if (
              cellCX >= occ.x1 &&
              cellCX <= occ.x2 &&
              cellCY >= occ.y1 &&
              cellCY <= occ.y2
            ) {
              free[r][c] = false;
              break;
            }
          }
        }
      }

      // Merge free cells into maximal horizontal strips per row, then merge
      // vertically adjacent identical strips into larger rectangles.
      // Simple approach: for each row, collect contiguous free runs.
      // Then group runs with same col extents across consecutive rows.
      interface Strip {
        colStart: number;
        colEnd: number; // exclusive
        rowStart: number;
        rowEnd: number; // exclusive
      }

      // Row strips: for each row, list of [colStart, colEnd)
      const rowStrips: Array<Array<[number, number]>> = [];
      for (let r = 0; r < rows; r++) {
        const strips: Array<[number, number]> = [];
        let start = -1;
        for (let c = 0; c <= cols; c++) {
          const isFree = c < cols && free[r][c];
          if (isFree && start === -1) {
            start = c;
          } else if (!isFree && start !== -1) {
            strips.push([start, c]);
            start = -1;
          }
        }
        rowStrips.push(strips);
      }

      // Merge identical strips vertically
      const mergedRects: Strip[] = [];
      // active: map from "colStart,colEnd" -> { rowStart, rowEnd }
      const active = new Map<string, { rowStart: number; rowEnd: number }>();

      for (let r = 0; r <= rows; r++) {
        const currentStrips = r < rows ? rowStrips[r] : [];
        const currentKeys = new Set(currentStrips.map(([s, e]) => `${s},${e}`));

        // Close any active strips not in current row
        for (const [key, val] of active.entries()) {
          if (!currentKeys.has(key)) {
            const [colStart, colEnd] = key.split(",").map(Number);
            mergedRects.push({
              colStart,
              colEnd,
              rowStart: val.rowStart,
              rowEnd: r,
            });
            active.delete(key);
          }
        }

        // Open new strips
        for (const [s, e] of currentStrips) {
          const key = `${s},${e}`;
          if (!active.has(key)) {
            active.set(key, { rowStart: r, rowEnd: r + 1 });
          } else {
            active.get(key)!.rowEnd = r + 1;
          }
        }
      }

      // Emit READY TO OCCUPY elements for each merged rect.
      // Priority: place the biggest blocks (50×50m) first, then fill remaining
      // space with progressively smaller blocks down to the 10×10m minimum.
      const RTO_MAX_BLOCK = 50;

      /**
       * Greedily pack RTO blocks into a rectangle (rectX, rectY, rectW, rectH).
       * Strategy: largest blocks first (50→40→30→20→10m squares).
       * Uses a boolean occupancy grid of GRID-sized cells to track placed areas.
       */
      const packRTOBlocks = (
        rectX: number,
        rectY: number,
        rectW: number,
        rectH: number,
      ) => {
        const gridCols = Math.floor(rectW / GRID);
        const gridRows = Math.floor(rectH / GRID);
        if (gridCols < 1 || gridRows < 1) return;

        // occupancy grid: used[row][col]
        const used: boolean[][] = Array.from({ length: gridRows }, () =>
          new Array(gridCols).fill(false),
        );

        // Block sizes from largest to smallest (multiples of GRID, capped at RTO_MAX_BLOCK)
        const maxCells = Math.min(
          Math.floor(RTO_MAX_BLOCK / GRID),
          Math.min(gridCols, gridRows),
        );
        const blockSizes: number[] = [];
        for (let s = maxCells; s >= 1; s--) {
          blockSizes.push(s);
        }

        for (const sizeInCells of blockSizes) {
          // Scan in row-major order for blocks of this size
          let found = true;
          while (found) {
            found = false;
            outer: for (let r = 0; r <= gridRows - sizeInCells; r++) {
              for (let c = 0; c <= gridCols - sizeInCells; c++) {
                // Check if all cells in sizeInCells×sizeInCells block are free
                let allFree = true;
                checkLoop: for (let dr = 0; dr < sizeInCells; dr++) {
                  for (let dc = 0; dc < sizeInCells; dc++) {
                    if (used[r + dr][c + dc]) {
                      allFree = false;
                      break checkLoop;
                    }
                  }
                }
                if (!allFree) continue;

                // Place block: mark cells used
                for (let dr = 0; dr < sizeInCells; dr++) {
                  for (let dc = 0; dc < sizeInCells; dc++) {
                    used[r + dr][c + dc] = true;
                  }
                }

                // Emit element
                const blockW = sizeInCells * GRID;
                const blockH = sizeInCells * GRID;
                allElements.push({
                  id: makeId(),
                  name: "READY TO OCCUPY",
                  elementType: "custom",
                  width: blockW,
                  height: blockH,
                  xPosition: rectX + c * GRID,
                  yPosition: rectY + r * GRID,
                  rotationAngle: 0,
                  color: RTO_COLOR,
                  status: "planned",
                  height3d: RTO_HEIGHT_3D,
                  shape: "rectangle",
                });

                found = true;
                break outer;
              }
            }
          }
        }
      };

      for (const rect of mergedRects) {
        const x = scanMinX + rect.colStart * GRID;
        const y = scanMinY + rect.rowStart * GRID;
        const w = (rect.colEnd - rect.colStart) * GRID;
        const h = (rect.rowEnd - rect.rowStart) * GRID;

        // Skip rects smaller than one grid cell (10×10m minimum)
        if (w < GRID || h < GRID) continue;

        packRTOBlocks(x, y, w, h);
      }
    }
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
