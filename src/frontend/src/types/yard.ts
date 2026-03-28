export type ElementType =
  | "beam"
  | "slab"
  | "column"
  | "wall"
  | "girder"
  | "custom";
export type ElementStatus = "planned" | "inProgress" | "complete";
export type ViewMode = "2d" | "3d";
export type ToolMode =
  | "select"
  | "move"
  | "rotate"
  | "measure"
  | "clear"
  | "text";
export type ScaleOption = "1:100" | "1:200" | "1:500";
export type ShapeType =
  | "rectangle"
  | "l-shape"
  | "t-shape"
  | "i-shape"
  | "circle";

export interface YardElement {
  id: bigint;
  name: string;
  elementType: ElementType;
  width: number; // meters (physical width in plan view)
  height: number; // meters (physical length in plan view)
  xPosition: number; // meters from origin
  yPosition: number; // meters from origin
  rotationAngle: number; // degrees
  color: string;
  status: ElementStatus;
  height3d: number; // meters vertical in 3D view
  shape: ShapeType;
  imageUrl?: string; // if set, renders as image on canvas
}

export interface TextLabel {
  id: bigint;
  text: string;
  x: number; // meters
  y: number; // meters
  fontSize: number; // px, default 14
}

export interface LibraryItem {
  name: string;
  elementType: ElementType;
  width: number; // physical width
  height: number; // physical length
  height3d?: number; // optional 3D height override
  color: string;
  defaultStatus: ElementStatus;
  imageUrl?: string; // if set, renders as image on canvas
}

export interface SpacingSettings {
  // Bay
  bayVerticalSpacing: number; // default 30
  // I-Girder
  iGirderVerticalGap: number; // default 0.5 (gap between girder edges)
  iGirderLeftMargin: number; // default 10 (from left edge of bay)
  iGirderBayMargin: number; // default 2 (from top/bottom of bay)
  iGirderColumnGap: number; // default 2 (gap between columns)
  // Formwork
  formworkVerticalGap: number; // default 0.5
  formworkLeftMargin: number; // default 10
  formworkBayMargin: number; // default 2
  formworkColumnGap: number; // default 2
  // Reinforcement-Cage
  rcVerticalGap: number; // default 0.5
  rcLeftMargin: number; // default 10
  rcBayMargin: number; // default 2
  rcColumnGap: number; // default 2
}

export const DEFAULT_SPACING_SETTINGS: SpacingSettings = {
  bayVerticalSpacing: 30,
  iGirderVerticalGap: 0.5,
  iGirderLeftMargin: 10,
  iGirderBayMargin: 2,
  iGirderColumnGap: 2,
  formworkVerticalGap: 0.5,
  formworkLeftMargin: 10,
  formworkBayMargin: 2,
  formworkColumnGap: 2,
  rcVerticalGap: 0.5,
  rcLeftMargin: 10,
  rcBayMargin: 2,
  rcColumnGap: 2,
};

export const ELEMENT_COLORS: Record<ElementType, string> = {
  beam: "#F2D64B",
  slab: "#F28C28",
  column: "#2F7DE1",
  wall: "#8DA3A6",
  girder: "#5FAE4E",
  custom: "#9b59b6",
};

export const ELEMENT_3D_HEIGHT: Record<ElementType, number> = {
  beam: 0.6,
  slab: 0.3,
  column: 3.0,
  wall: 3.0,
  girder: 0.8,
  custom: 2.0,
};

export const LIBRARY_ITEMS: Record<ElementType, LibraryItem[]> = {
  beam: [],
  slab: [],
  column: [],
  wall: [],
  girder: [],
  custom: [],
};

export const SAMPLE_ELEMENTS: YardElement[] = [];
