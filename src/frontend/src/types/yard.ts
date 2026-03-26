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
