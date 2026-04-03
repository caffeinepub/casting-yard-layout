import type { SpacingSettings, YardElement } from "../types/yard";
import { DEFAULT_SPACING_SETTINGS } from "../types/yard";

export interface NewYardConfig {
  yardLength: number;
  yardWidth: number;
  bayCount: number;
  bayLength: number;
  bayWidth: number;
}

const ROAD_IMAGE =
  "/assets/uploads/raod-019d2e6f-b1b6-7075-ab34-f341729a23a7-1.png";
const RC_IMAGE =
  "/assets/uploads/image-019d33a4-4648-744f-86c1-eb304b8f6e32-1.png";
const SHED_IMAGE =
  "/assets/uploads/shedsquzre-019d3535-7bc3-7280-b6a1-111f64005e90-1.png";

const ROAD_WIDTH = 10;

/** Number of items per section, based on bay length / 3 / 30 (girder default length). */
export function sectionCount(bayLength: number): number {
  return Math.max(1, Math.floor(bayLength / 3 / 30));
}

/**
 * Build all YardElement[] for an auto-layout from config.
 * Returns a flat array ready to be passed to onAddRawElements.
 */
export function buildAutoLayoutElements(
  config: NewYardConfig,
  spacingSettings: SpacingSettings = DEFAULT_SPACING_SETTINGS,
): YardElement[] {
  const { yardLength, yardWidth, bayCount, bayLength, bayWidth } = config;
  const spacing = spacingSettings.bayVerticalSpacing;

  // ── Section element counts ──
  const perBayCount = sectionCount(bayLength);

  // ── Bay layout geometry ──
  const totalHeight = bayCount * bayWidth + (bayCount - 1) * spacing;
  const startX = Math.max(0, (yardLength - bayLength) / 2);
  const startY = Math.max(0, (yardWidth - totalHeight) / 2);

  const allElements: YardElement[] = [];
  let idSeq = 0;

  const makeId = (): bigint => {
    idSeq++;
    return BigInt(Date.now()) * 100000n + BigInt(idSeq);
  };

  // ── 1. Build Bays + between-bay roads ──
  const bayRefs: YardElement[] = [];
  let curY = startY;

  for (let i = 0; i < bayCount; i++) {
    const bay: YardElement = {
      id: makeId(),
      name: "Bay",
      elementType: "custom",
      width: bayLength,
      height: bayWidth,
      xPosition: startX,
      yPosition: curY,
      rotationAngle: 0,
      color: "#1a6b2a",
      status: "planned",
      height3d: 0.15,
      shape: "rectangle",
    };
    bayRefs.push(bay);
    allElements.push(bay);
    curY += bayWidth;

    if (i < bayCount - 1) {
      const roadY = curY + (spacing - ROAD_WIDTH) / 2;
      allElements.push({
        id: makeId(),
        name: "Road",
        elementType: "custom",
        width: bayLength,
        height: ROAD_WIDTH,
        xPosition: startX,
        yPosition: roadY,
        rotationAngle: 0,
        color: "#888888",
        status: "planned",
        height3d: 0.1,
        shape: "rectangle",
        imageUrl: ROAD_IMAGE,
      });
      curY += spacing;
    }
  }

  // Top road (0.5m above first bay)
  const topBayY = startY;
  allElements.unshift({
    id: makeId(),
    name: "Road",
    elementType: "custom",
    width: bayLength,
    height: ROAD_WIDTH,
    xPosition: startX,
    yPosition: topBayY - ROAD_WIDTH - 0.5,
    rotationAngle: 0,
    color: "#888888",
    status: "planned",
    height3d: 0.1,
    shape: "rectangle",
    imageUrl: ROAD_IMAGE,
  });

  // Bottom road (0.5m below last bay)
  const lastBayEndY = startY + totalHeight;
  allElements.push({
    id: makeId(),
    name: "Road",
    elementType: "custom",
    width: bayLength,
    height: ROAD_WIDTH,
    xPosition: startX,
    yPosition: lastBayEndY + 0.5,
    rotationAngle: 0,
    color: "#888888",
    status: "planned",
    height3d: 0.1,
    shape: "rectangle",
    imageUrl: ROAD_IMAGE,
  });

  // Left/right vertical roads
  const topRoadTop = topBayY - ROAD_WIDTH - 0.5;
  const bottomRoadBottom = lastBayEndY + 0.5 + ROAD_WIDTH;
  const vertRoadHeight = bottomRoadBottom - topRoadTop;

  allElements.push({
    id: makeId(),
    name: "Road-Vertical",
    elementType: "custom",
    width: ROAD_WIDTH,
    height: vertRoadHeight,
    xPosition: startX - ROAD_WIDTH,
    yPosition: topRoadTop,
    rotationAngle: 0,
    color: "#888888",
    status: "planned",
    height3d: 0.1,
    shape: "rectangle",
    imageUrl: ROAD_IMAGE,
  });

  allElements.push({
    id: makeId(),
    name: "Road-Vertical",
    elementType: "custom",
    width: ROAD_WIDTH,
    height: vertRoadHeight,
    xPosition: startX + bayLength,
    yPosition: topRoadTop,
    rotationAngle: 0,
    color: "#888888",
    status: "planned",
    height3d: 0.1,
    shape: "rectangle",
    imageUrl: ROAD_IMAGE,
  });

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
    // ── Section 1: I-Girders (left third) ──
    const iGirderStartX = bay.xPosition + spacingSettings.iGirderLeftMargin;
    placeColumnStack({
      bay,
      count: perBayCount,
      itemLength: iGirderLength,
      itemWidth: iGirderWidth,
      startX: iGirderStartX,
      verticalGap: spacingSettings.iGirderVerticalGap,
      bayMargin: spacingSettings.iGirderBayMargin,
      columnGap: spacingSettings.iGirderColumnGap,
      name: "I-Girder",
      color: "#c8c8c8",
      height3d: iGirderHeight3d,
      allElements,
      makeId,
    });

    // Compute right edge of I-Girder section
    const iGirderSectionRightEdge = computeSectionRightEdge({
      startX: iGirderStartX,
      count: perBayCount,
      itemLength: iGirderLength,
      itemWidth: iGirderWidth,
      verticalGap: spacingSettings.iGirderVerticalGap,
      bayMargin: spacingSettings.iGirderBayMargin,
      columnGap: spacingSettings.iGirderColumnGap,
      bay,
    });

    // ── Section 2: Formwork + Shed (middle third) ──
    const fwStartX = iGirderSectionRightEdge + 2;
    placeColumnStack({
      bay,
      count: perBayCount,
      itemLength: fwLength,
      itemWidth: fwWidth,
      startX: fwStartX,
      verticalGap: spacingSettings.formworkVerticalGap,
      bayMargin: spacingSettings.formworkBayMargin,
      columnGap: spacingSettings.formworkColumnGap,
      name: "Box-I-Girder-Formwork",
      color: "#FF6B00",
      height3d: fwHeight3d,
      allElements,
      makeId,
    });

    const fwSectionRightEdge = computeSectionRightEdge({
      startX: fwStartX,
      count: perBayCount,
      itemLength: fwLength,
      itemWidth: fwWidth,
      verticalGap: spacingSettings.formworkVerticalGap,
      bayMargin: spacingSettings.formworkBayMargin,
      columnGap: spacingSettings.formworkColumnGap,
      bay,
    });

    // Factory-Shed over formwork
    // Shed spans from fwStartX to fwSectionRightEdge, full bay height
    allElements.push({
      id: makeId(),
      name: "Factory-Shed",
      elementType: "custom",
      width: fwSectionRightEdge - fwStartX,
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
      count: perBayCount,
      itemLength: rcLength,
      itemWidth: rcWidth,
      startX: rcStartX,
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
  count: number;
  itemLength: number;
  itemWidth: number;
  startX: number;
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

function placeColumnStack(params: StackParams) {
  const {
    bay,
    count,
    itemLength,
    itemWidth,
    startX,
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

  let placed = 0;
  let colIndex = 0;

  while (placed < count) {
    const inThisCol = Math.min(maxPerColumn, count - placed);
    const colX = startX + colIndex * (itemLength + columnGap);
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

interface EdgeParams {
  bay: YardElement;
  startX: number;
  count: number;
  itemLength: number;
  itemWidth: number;
  verticalGap: number;
  bayMargin: number;
  columnGap: number;
}

function computeSectionRightEdge(params: EdgeParams): number {
  const {
    startX,
    count,
    itemLength,
    itemWidth,
    verticalGap,
    bayMargin,
    columnGap,
    bay,
  } = params;

  const verticalStep = itemWidth + verticalGap;
  const usableHeight = bay.height - bayMargin * 2;
  const maxPerColumn =
    usableHeight >= itemWidth
      ? Math.floor((usableHeight + verticalGap) / verticalStep)
      : 1;

  const colCount = Math.ceil(count / maxPerColumn);
  return startX + colCount * itemLength + (colCount - 1) * columnGap;
}
