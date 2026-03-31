import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Settings, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { LibraryItem, SpacingSettings, YardElement } from "../types/yard";
import { DEFAULT_SPACING_SETTINGS } from "../types/yard";

const DEFAULT_COLOR = "#4f86c6";

const EQUIPMENT_ITEMS: import("../types/yard").LibraryItem[] = [
  {
    name: "Gantry-Crane",
    elementType: "custom",
    width: 5,
    height: 30,
    color: "#FFD700",
    defaultStatus: "planned",
    imageUrl:
      "/assets/uploads/istockphoto-464854298-1024x1024-019d2b15-f4f1-70fa-aca4-80e5b8dbc76f-1.png",
  },
  {
    name: "Batching-Plant",
    elementType: "custom",
    width: 30,
    height: 30,
    height3d: 12,
    color: "#22c55e",
    defaultStatus: "planned",
    imageUrl:
      "/assets/uploads/image-019d2e26-ba9f-715b-8085-8f4fe41ec417-1.png",
  },
  {
    name: "Road",
    elementType: "custom",
    width: 10,
    height: 10,
    height3d: 0.1,
    color: "#555555",
    defaultStatus: "planned",
    imageUrl: "/assets/uploads/raod-019d2e6f-b1b6-7075-ab34-f341729a23a7-1.png",
  },
  {
    name: "Reinforcement-Cage",
    elementType: "custom",
    width: 0.8,
    height: 30,
    height3d: 2,
    color: "#555555",
    defaultStatus: "planned",
    imageUrl:
      "/assets/uploads/image-019d33a4-4648-744f-86c1-eb304b8f6e32-1.png",
  },
  {
    name: "Factory-Shed",
    elementType: "custom",
    width: 10,
    height: 30,
    height3d: 20,
    color: "#b0b0b0",
    defaultStatus: "planned",
    imageUrl:
      "/assets/uploads/shedsquzre-019d3535-7bc3-7280-b6a1-111f64005e90-1.png",
  },
];

interface LeftSidebarProps {
  onAddElement: (item: LibraryItem) => void;
  onAddMultipleElements: (
    items: LibraryItem[],
    spacing: number,
    direction?: "horizontal" | "vertical",
    centerInYard?: {
      yardLength: number;
      yardWidth: number;
      startX?: number;
      startY?: number;
    },
  ) => void;
  onAddRawElements: (elements: YardElement[]) => void;
  onUpdateElements: (
    updates: (Partial<YardElement> & { id: bigint })[],
  ) => void;
  libraryItems: LibraryItem[];
  onLibraryChange: (items: LibraryItem[]) => void;
  yardLength: number;
  yardWidth: number;
  placedElements: YardElement[];
  spacingSettings?: SpacingSettings;
}

export function LeftSidebar({
  onAddElement,
  onAddMultipleElements: _onAddMultipleElements,
  onAddRawElements,
  onUpdateElements,
  libraryItems,
  onLibraryChange,
  yardLength,
  yardWidth,
  placedElements,
  spacingSettings = DEFAULT_SPACING_SETTINGS,
}: LeftSidebarProps) {
  const [search, setSearch] = useState("");

  // Add element form
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formLength, setFormLength] = useState("");
  const [formWidth, setFormWidth] = useState("");
  const [formHeight3d, setFormHeight3d] = useState("");
  const [formColor, setFormColor] = useState(DEFAULT_COLOR);

  // Batching-Plant girder config
  const [batchingDialogOpen, setBatchingDialogOpen] = useState(false);
  const [batchingGirderCount, setBatchingGirderCount] = useState("1");

  // I-Girder config
  const [iGirderDialogOpen, setIGirderDialogOpen] = useState(false);
  const [iGirderLength, setIGirderLength] = useState("30");
  const [iGirderWidth, setIGirderWidth] = useState("0.8");
  const [iGirderHeight, setIGirderHeight] = useState("2");
  const [iGirderCount, setIGirderCount] = useState("50");

  // Bay config
  const [bayDialogOpen, setBayDialogOpen] = useState(false);
  const [bayLength, setBayLength] = useState("");
  const [bayWidth, setBayWidth] = useState("");
  const [bayCount, setBayCount] = useState("1");

  // Formwork config
  const [formworkDialogOpen, setFormworkDialogOpen] = useState(false);
  const [formworkLength, setFormworkLength] = useState("30");
  const [formworkWidth, setFormworkWidth] = useState("4");
  const [formworkHeight, setFormworkHeight] = useState("6");
  const [formworkCount, setFormworkCount] = useState("30");

  // Reinforcement-Cage config
  const [rcDialogOpen, setRcDialogOpen] = useState(false);
  const [rcLength, setRcLength] = useState("30");
  const [rcWidth, setRcWidth] = useState("0.8");
  const [rcHeight, setRcHeight] = useState("2");
  const [rcCount, setRcCount] = useState("50");

  const handleDragStart = (e: React.DragEvent, item: LibraryItem) => {
    e.dataTransfer.setData("application/yard-element", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "copy";
  };

  const openForm = () => {
    setFormName("");
    setFormLength("");
    setFormWidth("");
    setFormHeight3d("");
    setFormColor(DEFAULT_COLOR);
    setShowForm(true);
  };

  const handleCreateElement = () => {
    const name = formName.trim();
    if (!name) return;
    const length = Number.parseFloat(formLength) || 5;
    const width = Number.parseFloat(formWidth) || 5;
    const height3d = Number.parseFloat(formHeight3d) || undefined;
    const newItem: LibraryItem = {
      name,
      elementType: "custom",
      width: width,
      height: length,
      height3d,
      color: formColor,
      defaultStatus: "planned",
    };
    onLibraryChange([...libraryItems, newItem]);
    setShowForm(false);
  };

  const handleRemoveLibraryItem = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onLibraryChange(libraryItems.filter((_, i) => i !== idx));
  };

  const handlePlaceBatchingPlant = () => {
    const count = Math.max(1, Number.parseInt(batchingGirderCount) || 1);

    // The 9 individually-sized sub-area blocks that make up one batching plant cluster
    const subAreas = [
      { name: "QA-Lab", width: 20, height: 20, color: "#3b82f6" },
      { name: "RMC-Store", width: count * 1, height: 0.5, color: "#22c55e" },
      { name: "RMC-Garage", width: count * 1, height: 0.5, color: "#f59e0b" },
      { name: "Aggregates-10m", width: count * 1, height: 1, color: "#f97316" },
      { name: "Aggregates-20m", width: count * 1, height: 1, color: "#ef4444" },
      { name: "Crushed-Sand", width: count * 1, height: 3, color: "#eab308" },
      {
        name: "Sedimentation-Tank-1",
        width: 20 / 3,
        height: 20,
        color: "#14b8a6",
      },
      {
        name: "Sedimentation-Tank-2",
        width: 20 / 3,
        height: 20,
        color: "#14b8a6",
      },
      {
        name: "Sedimentation-Tank-3",
        width: 20 / 3,
        height: 20,
        color: "#14b8a6",
      },
    ];

    // Row-pack the sub-areas left-to-right within availableWidth.
    // direction "up"   → first row sits immediately above originY, rows grow upward.
    // direction "down" → first row sits immediately below originY, rows grow downward.
    const buildCluster = (
      originX: number,
      originY: number,
      availableWidth: number,
      direction: "up" | "down",
      idCounter: { v: number },
    ): YardElement[] => {
      const elements: YardElement[] = [];

      // Greedy row packing
      const rows: Array<Array<(typeof subAreas)[number]>> = [];
      let currentRow: Array<(typeof subAreas)[number]> = [];
      let currentRowWidth = 0;
      for (const area of subAreas) {
        if (
          currentRow.length > 0 &&
          currentRowWidth + area.width > availableWidth
        ) {
          rows.push(currentRow);
          currentRow = [area];
          currentRowWidth = area.width;
        } else {
          currentRow.push(area);
          currentRowWidth += area.width;
        }
      }
      if (currentRow.length > 0) rows.push(currentRow);

      // Assign Y positions
      let curY = originY;
      const rowList = direction === "up" ? rows : rows;
      for (const row of rowList) {
        const rowHeight = Math.max(...row.map((a) => a.height));
        let rowTop: number;
        if (direction === "up") {
          curY -= rowHeight;
          rowTop = curY;
        } else {
          rowTop = curY;
          curY += rowHeight;
        }

        let curX = originX;
        for (const area of row) {
          elements.push({
            id: BigInt(Date.now()) * 10000n + BigInt(++idCounter.v),
            name: area.name,
            elementType: "custom",
            width: area.width,
            height: area.height,
            xPosition: curX,
            // Vertically centre shorter blocks within the row
            yPosition: rowTop + (rowHeight - area.height) / 2,
            rotationAngle: 0,
            color: area.color,
            status: "planned",
            height3d: 8,
            shape: "rectangle",
          });
          curX += area.width;
        }
      }
      return elements;
    };

    const idCounter = { v: 0 };
    const allElements: YardElement[] = [];

    // Find roads
    const roads = placedElements.filter((el) => el.name === "Road");

    if (roads.length === 0) {
      // Fallback: place all 9 blocks in a single row starting at (0, 0)
      let curX = 0;
      for (const area of subAreas) {
        allElements.push({
          id: BigInt(Date.now()) * 10000n + BigInt(++idCounter.v),
          name: area.name,
          elementType: "custom",
          width: area.width,
          height: area.height,
          xPosition: curX,
          yPosition: 0,
          rotationAngle: 0,
          color: area.color,
          status: "planned",
          height3d: 8,
          shape: "rectangle",
        });
        curX += area.width;
      }
      onAddRawElements(allElements);
      setBatchingDialogOpen(false);
      setBatchingGirderCount("1");
      return;
    }

    // Topmost road (smallest yPosition)
    const topRoad = roads.reduce((prev, curr) =>
      curr.yPosition < prev.yPosition ? curr : prev,
    );
    // Bottommost road (largest yPosition + height)
    const bottomRoad = roads.reduce((prev, curr) =>
      curr.yPosition + curr.height > prev.yPosition + prev.height ? curr : prev,
    );

    const topRoadTop = topRoad.yPosition;
    const bottomRoadBottom = bottomRoad.yPosition + bottomRoad.height;
    const roadX = topRoad.xPosition;
    const availableWidth = topRoad.width;

    // One full cluster above the topmost road
    allElements.push(
      ...buildCluster(roadX, topRoadTop, availableWidth, "up", idCounter),
    );

    // One full cluster below the bottommost road
    allElements.push(
      ...buildCluster(
        roadX,
        bottomRoadBottom,
        availableWidth,
        "down",
        idCounter,
      ),
    );

    onAddRawElements(allElements);
    setBatchingDialogOpen(false);
    setBatchingGirderCount("1");
  };

  // Returns the auto-start X for new elements on a bay.
  // If any non-bay, non-road elements already exist on the bay, start after the
  // rightmost edge of those elements + 2m spacing; otherwise use the default left margin.
  const getAutoStartX = (bay: YardElement, defaultMargin: number): number => {
    const BAY_TYPES = ["Bay", "Road", "Road-Vertical"];
    const existing = placedElements.filter(
      (el) =>
        !BAY_TYPES.includes(el.name) &&
        el.xPosition >= bay.xPosition &&
        el.xPosition < bay.xPosition + bay.width &&
        el.yPosition >= bay.yPosition &&
        el.yPosition < bay.yPosition + bay.height,
    );
    if (existing.length === 0) {
      return bay.xPosition + defaultMargin;
    }
    const maxRight = Math.max(...existing.map((el) => el.xPosition + el.width));
    return maxRight + 2;
  };

  const handlePlaceIGirders = () => {
    // Check if any Bay has been placed on the canvas
    const bays = placedElements.filter((el) => el.name === "Bay");
    if (bays.length === 0) {
      toast.error("Please place the Bay First");
      return;
    }

    const girderLength = Number.parseFloat(iGirderLength) || 30;
    const girderWidth = Number.parseFloat(iGirderWidth) || 0.8;
    const height3d = Number.parseFloat(iGirderHeight) || 2;
    const countPerBay = Math.max(1, Number.parseInt(iGirderCount) || 1);

    const colGap = spacingSettings.iGirderColumnGap;
    const vertGap = spacingSettings.iGirderVerticalGap;
    const leftMargin = spacingSettings.iGirderLeftMargin;
    const bayMargin = spacingSettings.iGirderBayMargin;

    // Square-grid layout: grow cols and rows together
    const cols = Math.ceil(Math.sqrt(countPerBay));
    const rows = Math.ceil(countPerBay / cols);

    const colStep = girderLength + colGap;
    const rowStep = girderWidth + vertGap;

    // Required bay dimensions to fit the grid
    const requiredWidth = leftMargin + cols * colStep - colGap + 10; // 10m right padding
    const requiredHeight = bayMargin + rows * rowStep - vertGap + bayMargin;

    const allElements: YardElement[] = [];
    const bayUpdates: (Partial<YardElement> & { id: bigint })[] = [];

    for (const bay of bays) {
      // Resize bay to fit the grid if needed
      const newBayWidth = Math.max(bay.width, requiredWidth);
      const newBayHeight = Math.max(bay.height, requiredHeight);
      if (newBayWidth !== bay.width || newBayHeight !== bay.height) {
        bayUpdates.push({
          id: bay.id,
          width: newBayWidth,
          height: newBayHeight,
        });
      }

      // Horizontal start: after existing elements or default left margin
      const baseX = getAutoStartX(bay, leftMargin);
      const startY = bay.yPosition + bayMargin;

      let placed = 0;
      for (let row = 0; row < rows && placed < countPerBay; row++) {
        for (let col = 0; col < cols && placed < countPerBay; col++) {
          allElements.push({
            id: BigInt(Date.now()) * 100000n + BigInt(allElements.length),
            name: "I-Girder",
            elementType: "custom",
            width: girderLength,
            height: girderWidth,
            xPosition: baseX + col * colStep,
            yPosition: startY + row * rowStep,
            rotationAngle: 0,
            color: "#c8c8c8",
            status: "planned",
            height3d,
            shape: "rectangle",
          });
          placed++;
        }
      }
    }

    if (bayUpdates.length > 0) {
      onUpdateElements(bayUpdates);
    }
    onAddRawElements(allElements);
    setIGirderDialogOpen(false);
    setIGirderLength("30");
    setIGirderWidth("0.8");
    setIGirderHeight("2");
    setIGirderCount("50");
  };

  const handlePlaceBays = () => {
    const bLength = Number.parseFloat(bayLength) || 20;
    const bWidth = Number.parseFloat(bayWidth) || 10;
    const count = Math.max(1, Number.parseInt(bayCount) || 1);

    // gap between bay edges (edge-to-edge) = 30m
    const spacing = spacingSettings.bayVerticalSpacing;

    // Total layout height: bays + gaps
    const totalHeight = count * bWidth + (count - 1) * spacing;
    const startX = Math.max(0, (yardLength - bLength) / 2);
    const startY = Math.max(0, (yardWidth - totalHeight) / 2);

    const ROAD_WIDTH = 10; // 10m road between bays
    const ROAD_IMAGE =
      "/assets/uploads/raod-019d2e6f-b1b6-7075-ab34-f341729a23a7-1.png";

    const allElements: YardElement[] = [];
    let curY = startY;

    for (let i = 0; i < count; i++) {
      // Bay element
      allElements.push({
        id: BigInt(Date.now()) * 100000n + BigInt(allElements.length),
        name: "Bay",
        elementType: "custom",
        width: bLength,
        height: bWidth,
        xPosition: startX,
        yPosition: curY,
        rotationAngle: 0,
        color: "#e0b84a",
        status: "planned",
        height3d: 0.15,
        shape: "rectangle",
      });

      curY += bWidth;

      // Road between this bay and the next
      if (i < count - 1) {
        // Centre the 10m road in the spacing gap
        const roadY = curY + (spacing - ROAD_WIDTH) / 2;
        allElements.push({
          id: BigInt(Date.now()) * 100000n + BigInt(allElements.length + 1),
          name: "Road",
          elementType: "custom",
          width: bLength,
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

    // Road above the top bay (0.5m gap above first bay)
    const topBayY = startY;
    allElements.unshift({
      id: BigInt(Date.now()) * 100000n + 9999998n,
      name: "Road",
      elementType: "custom",
      width: bLength,
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

    // Road below the bottom bay (0.5m gap below last bay)
    // curY at this point is after the last bay + last spacing (if any), but we want after the last bay
    // The last bay ends at startY + totalHeight (bays only)
    const lastBayEndY = startY + totalHeight;
    allElements.push({
      id: BigInt(Date.now()) * 100000n + 9999999n,
      name: "Road",
      elementType: "custom",
      width: bLength,
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

    // Vertical roads on left and right sides, spanning from top of top road to bottom of bottom road
    const topRoadTop = topBayY - ROAD_WIDTH - 0.5;
    const bottomRoadBottom = lastBayEndY + 0.5 + ROAD_WIDTH;
    const verticalRoadHeight = bottomRoadBottom - topRoadTop;

    // Left vertical road
    allElements.push({
      id: BigInt(Date.now()) * 100000n + 9999996n,
      name: "Road-Vertical",
      elementType: "custom",
      width: ROAD_WIDTH,
      height: verticalRoadHeight,
      xPosition: startX - ROAD_WIDTH,
      yPosition: topRoadTop,
      rotationAngle: 0,
      color: "#888888",
      status: "planned",
      height3d: 0.1,
      shape: "rectangle",
      imageUrl: ROAD_IMAGE,
    });

    // Right vertical road
    allElements.push({
      id: BigInt(Date.now()) * 100000n + 9999997n,
      name: "Road-Vertical",
      elementType: "custom",
      width: ROAD_WIDTH,
      height: verticalRoadHeight,
      xPosition: startX + bLength,
      yPosition: topRoadTop,
      rotationAngle: 0,
      color: "#888888",
      status: "planned",
      height3d: 0.1,
      shape: "rectangle",
      imageUrl: ROAD_IMAGE,
    });

    onAddRawElements(allElements);
    setBayDialogOpen(false);
    setBayLength("");
    setBayWidth("");
    setBayCount("1");
  };

  const handlePlaceReinforcementCages = () => {
    const bays = placedElements.filter((el) => el.name === "Bay");
    if (bays.length === 0) {
      toast.error("Please place the Bay First");
      return;
    }

    const girderLength = Number.parseFloat(rcLength) || 30;
    const girderWidth = Number.parseFloat(rcWidth) || 0.8;
    const height3d = Number.parseFloat(rcHeight) || 2;
    const countPerBay = Math.max(1, Number.parseInt(rcCount) || 1);

    const colGap = spacingSettings.rcColumnGap;
    const vertGap = spacingSettings.rcVerticalGap;
    const leftMargin = spacingSettings.rcLeftMargin;
    const bayMargin = spacingSettings.rcBayMargin;

    // Square-grid layout: grow cols and rows together
    const cols = Math.ceil(Math.sqrt(countPerBay));
    const rows = Math.ceil(countPerBay / cols);

    const colStep = girderLength + colGap;
    const rowStep = girderWidth + vertGap;

    // Required bay dimensions to fit the grid
    const requiredWidth = leftMargin + cols * colStep - colGap + 10;
    const requiredHeight = bayMargin + rows * rowStep - vertGap + bayMargin;

    const allElements: YardElement[] = [];
    const bayUpdates: (Partial<YardElement> & { id: bigint })[] = [];

    for (const bay of bays) {
      const newBayWidth = Math.max(bay.width, requiredWidth);
      const newBayHeight = Math.max(bay.height, requiredHeight);
      if (newBayWidth !== bay.width || newBayHeight !== bay.height) {
        bayUpdates.push({
          id: bay.id,
          width: newBayWidth,
          height: newBayHeight,
        });
      }

      const baseX = getAutoStartX(bay, leftMargin);
      const startY = bay.yPosition + bayMargin;

      let placed = 0;
      for (let row = 0; row < rows && placed < countPerBay; row++) {
        for (let col = 0; col < cols && placed < countPerBay; col++) {
          allElements.push({
            id: BigInt(Date.now()) * 100000n + BigInt(allElements.length),
            name: "Reinforcement-Cage",
            elementType: "custom",
            width: girderLength,
            height: girderWidth,
            xPosition: baseX + col * colStep,
            yPosition: startY + row * rowStep,
            rotationAngle: 0,
            color: "#555555",
            status: "planned",
            height3d,
            shape: "rectangle",
            imageUrl:
              "/assets/uploads/image-019d33a4-4648-744f-86c1-eb304b8f6e32-1.png",
          });
          placed++;
        }
      }
    }

    if (bayUpdates.length > 0) {
      onUpdateElements(bayUpdates);
    }
    onAddRawElements(allElements);
    setRcDialogOpen(false);
    setRcLength("30");
    setRcWidth("0.8");
    setRcHeight("2");
    setRcCount("50");
  };

  const handlePlaceFactoryShed = () => {
    const bays = placedElements.filter((el) => el.name === "Bay");
    if (bays.length === 0) {
      toast.error("Please place the Bay First");
      return;
    }
    const formworks = placedElements.filter(
      (el) => el.name === "Box-I-Girder-Formwork",
    );
    if (formworks.length === 0) {
      toast.error("Please place Formwork first");
      return;
    }

    const allShedElements: YardElement[] = [];

    for (const bay of bays) {
      const fwInBay = formworks.filter(
        (fw) =>
          fw.xPosition >= bay.xPosition &&
          fw.xPosition < bay.xPosition + bay.width,
      );
      if (fwInBay.length === 0) continue;

      const shedX = Math.min(...fwInBay.map((fw) => fw.xPosition));
      const shedRight = Math.max(
        ...fwInBay.map((fw) => fw.xPosition + fw.width),
      );
      const shedLength = shedRight - shedX;
      const shedWidth = bay.height;

      allShedElements.push({
        id: BigInt(Date.now()) * 100000n + BigInt(allShedElements.length),
        name: "Factory-Shed",
        elementType: "custom",
        width: shedLength,
        height: shedWidth,
        xPosition: shedX,
        yPosition: bay.yPosition,
        rotationAngle: 0,
        color: "#b0b0b0",
        status: "planned",
        height3d: 20,
        shape: "open",
        imageUrl:
          "/assets/uploads/shedsquzre-019d3535-7bc3-7280-b6a1-111f64005e90-1.png",
      });
    }

    if (allShedElements.length === 0) {
      toast.error("No Formwork found on any Bay");
      return;
    }

    onAddRawElements(allShedElements);
  };

  const handlePlaceFormwork = () => {
    // Check if any Bay has been placed on the canvas
    const bays = placedElements.filter((el) => el.name === "Bay");
    if (bays.length === 0) {
      toast.error("Please place the Bay First");
      return;
    }

    const fwLength = Number.parseFloat(formworkLength) || 30;
    const fwWidth = Number.parseFloat(formworkWidth) || 4;
    const height3d = Number.parseFloat(formworkHeight) || 6;
    const countPerBay = Math.max(1, Number.parseInt(formworkCount) || 1);

    const colGap = spacingSettings.formworkColumnGap;
    const vertGap = spacingSettings.formworkVerticalGap;
    const leftMargin = spacingSettings.formworkLeftMargin;
    const bayMargin = spacingSettings.formworkBayMargin;

    // Square-grid layout: grow cols and rows together
    const cols = Math.ceil(Math.sqrt(countPerBay));
    const rows = Math.ceil(countPerBay / cols);

    const colStep = fwLength + colGap;
    const rowStep = fwWidth + vertGap;

    // Required bay dimensions to fit the grid
    const requiredWidth = leftMargin + cols * colStep - colGap + 10;
    const requiredHeight = bayMargin + rows * rowStep - vertGap + bayMargin;

    const allElements: YardElement[] = [];
    const bayUpdates: (Partial<YardElement> & { id: bigint })[] = [];

    for (const bay of bays) {
      const newBayWidth = Math.max(bay.width, requiredWidth);
      const newBayHeight = Math.max(bay.height, requiredHeight);
      if (newBayWidth !== bay.width || newBayHeight !== bay.height) {
        bayUpdates.push({
          id: bay.id,
          width: newBayWidth,
          height: newBayHeight,
        });
      }

      const baseX = getAutoStartX(bay, leftMargin);
      const startY = bay.yPosition + bayMargin;

      let placed = 0;
      for (let row = 0; row < rows && placed < countPerBay; row++) {
        for (let col = 0; col < cols && placed < countPerBay; col++) {
          allElements.push({
            id: BigInt(Date.now()) * 100000n + BigInt(allElements.length),
            name: "Box-I-Girder-Formwork",
            elementType: "custom",
            width: fwLength,
            height: fwWidth,
            xPosition: baseX + col * colStep,
            yPosition: startY + row * rowStep,
            rotationAngle: 0,
            color: "#FF6B00",
            status: "planned",
            height3d,
            shape: "rectangle",
          });
          placed++;
        }
      }
    }

    if (bayUpdates.length > 0) {
      onUpdateElements(bayUpdates);
    }
    onAddRawElements(allElements);
    setFormworkDialogOpen(false);
    setFormworkLength("30");
    setFormworkWidth("4");
    setFormworkHeight("6");
    setFormworkCount("30");
  };

  const visibleItems = libraryItems.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()),
  );

  const girderCount = Math.max(1, Number.parseInt(batchingGirderCount) || 1);

  return (
    <aside
      className="w-56 shrink-0 bg-card border-r border-border flex flex-col"
      data-ocid="sidebar.section"
    >
      {/* Search */}
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search elements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 pl-7 text-xs"
            data-ocid="sidebar.search_input"
          />
        </div>
      </div>

      {/* Flat element list */}
      <div className="flex-1 overflow-y-auto py-1 min-h-0">
        {visibleItems.length === 0 && (
          <p className="text-[10px] text-muted-foreground px-4 py-3">
            No elements yet. Add one below.
          </p>
        )}
        {visibleItems.map((item, idx) => (
          <div
            key={`${item.name}-${idx}`}
            className="group flex items-center gap-1 mx-2 rounded hover:bg-muted/60 transition-colors"
          >
            <button
              type="button"
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              onClick={() => onAddElement(item)}
              className="flex-1 flex items-center gap-2 px-2 py-1.5 cursor-pointer min-w-0"
              title="Click or drag to add"
              data-ocid={`sidebar.item.${idx + 1}`}
            >
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="min-w-0 text-left">
                <div className="text-xs font-medium break-words leading-tight">
                  {item.name}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  L:{item.height}m × W:{item.width}m
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={(e) => handleRemoveLibraryItem(idx, e)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all mr-1"
              title="Remove from library"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Permanent Girders Section */}
      <div className="border-t border-border">
        <div className="px-3 py-1.5 flex items-center gap-1">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Girders
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Bay item */}
        <div className="mx-2 mb-1">
          <div className="group flex items-center gap-1 rounded hover:bg-muted/60 transition-colors">
            <button
              type="button"
              onClick={() => {
                setBayDialogOpen((prev) => !prev);
                if (!bayDialogOpen) {
                  setBayLength("");
                  setBayWidth("");
                  setBayCount("1");
                }
              }}
              className="flex-1 flex items-center gap-2 px-2 py-1.5 cursor-pointer min-w-0"
              title="Click to configure and place Bays"
              data-ocid="sidebar.girders.bay"
            >
              {/* Bay icon */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="Bay"
              >
                <rect
                  x="1"
                  y="4"
                  width="16"
                  height="4"
                  rx="0.5"
                  fill="#e0b84a"
                  stroke="#b8922a"
                  strokeWidth="1"
                />
                <rect
                  x="1"
                  y="10"
                  width="16"
                  height="4"
                  rx="0.5"
                  fill="#e0b84a"
                  stroke="#b8922a"
                  strokeWidth="1"
                />
                <line
                  x1="9"
                  y1="8"
                  x2="9"
                  y2="10"
                  stroke="#b8922a"
                  strokeWidth="1"
                  strokeDasharray="1 1"
                />
              </svg>
              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="text-[12px] font-medium text-foreground truncate w-full">
                  Bay
                </span>
                <div className="text-[9px] text-muted-foreground">
                  Click to configure
                </div>
              </div>
              <Settings className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            </button>
          </div>

          {/* Bay inline config panel */}
          {bayDialogOpen && (
            <div className="mt-1 rounded border border-border bg-muted/40 p-2 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-foreground">
                  Bay Config
                </span>
                <button
                  type="button"
                  onClick={() => setBayDialogOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              <div className="flex gap-1.5">
                <div className="flex-1 flex flex-col gap-0.5">
                  <label
                    htmlFor="bay-count"
                    className="text-[10px] text-muted-foreground font-medium"
                  >
                    No. of Bays
                  </label>
                  <Input
                    id="bay-count"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 3"
                    value={bayCount}
                    onChange={(e) => setBayCount(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-1.5">
                <div className="flex-1 flex flex-col gap-0.5">
                  <label
                    htmlFor="bay-length"
                    className="text-[10px] text-muted-foreground font-medium"
                  >
                    Length (m)
                  </label>
                  <Input
                    id="bay-length"
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="e.g. 50"
                    value={bayLength}
                    onChange={(e) => setBayLength(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-0.5">
                  <label
                    htmlFor="bay-width"
                    className="text-[10px] text-muted-foreground font-medium"
                  >
                    Width (m)
                  </label>
                  <Input
                    id="bay-width"
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="e.g. 20"
                    value={bayWidth}
                    onChange={(e) => setBayWidth(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
              </div>

              {/* Preview info */}
              {(bayLength || bayWidth) && (
                <div className="rounded bg-background border border-border p-1.5 flex flex-col gap-0.5">
                  <div className="text-[9px] text-muted-foreground">
                    Horizontal · 30m vertical spacing · centered in yard
                  </div>
                  <div className="text-[10px] font-medium text-foreground">
                    {Math.max(1, Number.parseInt(bayCount) || 1)} bay
                    {(Number.parseInt(bayCount) || 1) > 1 ? "s" : ""} ×{" "}
                    {bayLength || "?"}m long × {bayWidth || "?"}m wide
                  </div>
                </div>
              )}

              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  className="flex-1 h-7 text-[11px]"
                  onClick={handlePlaceBays}
                  disabled={!bayLength || !bayWidth || !bayCount}
                  data-ocid="bay.submit_button"
                >
                  Place
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-7 text-[11px]"
                  onClick={() => setBayDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* I-Girder item */}
      <div className="mx-2 mb-1">
        <div className="group flex items-center gap-1 rounded hover:bg-muted/60 transition-colors">
          <button
            type="button"
            onClick={() => {
              setIGirderDialogOpen((prev) => !prev);
              if (!iGirderDialogOpen) {
                setIGirderLength("30");
                setIGirderWidth("0.8");
                setIGirderHeight("2");
                setIGirderCount("50");
              }
            }}
            className="flex-1 flex items-center gap-2 px-2 py-1.5 cursor-pointer min-w-0"
            title="Click to configure and place I-Girders"
            data-ocid="sidebar.girders.i-girder"
          >
            {/* I-Girder icon — horizontal orientation */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              className="flex-shrink-0"
              fill="none"
              aria-hidden="true"
            >
              <rect x="1" y="1" width="16" height="3" rx="0.5" fill="#c8c8c8" />
              <rect x="7.5" y="4" width="3" height="10" fill="#c8c8c8" />
              <rect
                x="1"
                y="14"
                width="16"
                height="3"
                rx="0.5"
                fill="#c8c8c8"
              />
            </svg>
            <div className="min-w-0 text-left flex-1">
              <div className="text-xs font-medium break-words leading-tight">
                I-Girder
              </div>
              <div className="text-[10px] text-muted-foreground">
                Click to configure
              </div>
            </div>
            <Settings className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          </button>
        </div>

        {/* I-Girder inline config panel */}
        {iGirderDialogOpen && (
          <div className="mt-1 rounded border border-border bg-muted/40 p-2 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground">
                I-Girder Config
              </span>
              <button
                type="button"
                onClick={() => setIGirderDialogOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            <div className="flex gap-1.5">
              <div className="flex-1 flex flex-col gap-0.5">
                <label
                  htmlFor="ig-length"
                  className="text-[10px] text-muted-foreground font-medium"
                >
                  Length (m)
                </label>
                <Input
                  id="ig-length"
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="e.g. 20"
                  value={iGirderLength}
                  onChange={(e) => setIGirderLength(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
              <div className="flex-1 flex flex-col gap-0.5">
                <label
                  htmlFor="ig-width"
                  className="text-[10px] text-muted-foreground font-medium"
                >
                  Width (m)
                </label>
                <Input
                  id="ig-width"
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="e.g. 1.5"
                  value={iGirderWidth}
                  onChange={(e) => setIGirderWidth(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-1.5">
              <div className="flex-1 flex flex-col gap-0.5">
                <label
                  htmlFor="ig-height"
                  className="text-[10px] text-muted-foreground font-medium"
                >
                  Height (m)
                </label>
                <Input
                  id="ig-height"
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="e.g. 1.5"
                  value={iGirderHeight}
                  onChange={(e) => setIGirderHeight(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
              <div className="flex-1 flex flex-col gap-0.5">
                <label
                  htmlFor="ig-count"
                  className="text-[10px] text-muted-foreground font-medium"
                >
                  No. of Girders
                </label>
                <Input
                  id="ig-count"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 5"
                  value={iGirderCount}
                  onChange={(e) => setIGirderCount(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
            </div>

            {/* Preview info */}
            {(iGirderLength || iGirderWidth) && (
              <div className="rounded bg-background border border-border p-1.5 flex flex-col gap-0.5">
                <div className="text-[9px] text-muted-foreground">
                  Horizontal · 0.5m gap between girders
                </div>
                <div className="text-[10px] font-medium text-foreground">
                  {Math.max(1, Number.parseInt(iGirderCount) || 1)} girder
                  {(Number.parseInt(iGirderCount) || 1) > 1 ? "s" : ""} ×{" "}
                  {iGirderLength || "?"}m long × {iGirderWidth || "?"}m wide
                </div>
              </div>
            )}

            <div className="flex gap-1.5">
              <Button
                size="sm"
                className="flex-1 h-7 text-[11px]"
                onClick={handlePlaceIGirders}
                disabled={
                  !iGirderLength ||
                  !iGirderWidth ||
                  !iGirderHeight ||
                  !iGirderCount
                }
                data-ocid="igirder.submit_button"
              >
                Place
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-7 text-[11px]"
                onClick={() => setIGirderDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Permanent Formwork Section */}
      <div className="border-t border-border">
        <div className="px-3 py-1.5 flex items-center gap-1">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Formwork
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Box Type I-Girder-Formwork item */}
        <div className="mx-2 mb-1">
          <div className="group flex items-center gap-1 rounded hover:bg-muted/60 transition-colors">
            <button
              type="button"
              onClick={() => {
                setFormworkDialogOpen((prev) => !prev);
                if (!formworkDialogOpen) {
                  setFormworkLength("30");
                  setFormworkWidth("4");
                  setFormworkHeight("6");
                  setFormworkCount("30");
                }
              }}
              className="flex-1 flex items-center gap-2 px-2 py-1.5 cursor-pointer min-w-0"
              title="Click to configure and place Formwork"
              data-ocid="sidebar.formwork.box_igirder"
            >
              {/* Simple box icon */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="Box I-Girder Formwork"
              >
                <rect
                  x="1"
                  y="5"
                  width="16"
                  height="8"
                  rx="0"
                  fill="#FF6B00"
                  stroke="#7a5a30"
                  strokeWidth="1"
                />
                <line
                  x1="1"
                  y1="9"
                  x2="17"
                  y2="9"
                  stroke="#7a5a30"
                  strokeWidth="0.75"
                  strokeDasharray="2 1"
                />
              </svg>
              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="text-[11px] font-medium text-foreground leading-tight break-words">
                  Box Type I-Girder-Formwork
                </span>
                <div className="text-[9px] text-muted-foreground">
                  Click to configure
                </div>
              </div>
              <Settings className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            </button>
          </div>

          {/* Formwork inline config panel */}
          {formworkDialogOpen && (
            <div className="mt-1 rounded border border-border bg-muted/40 p-2 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-foreground">
                  Formwork Config
                </span>
                <button
                  type="button"
                  onClick={() => setFormworkDialogOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              <div className="flex gap-1.5">
                <div className="flex-1 flex flex-col gap-0.5">
                  <label
                    htmlFor="fw-length"
                    className="text-[10px] text-muted-foreground font-medium"
                  >
                    Length (m)
                  </label>
                  <Input
                    id="fw-length"
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="e.g. 20"
                    value={formworkLength}
                    onChange={(e) => setFormworkLength(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-0.5">
                  <label
                    htmlFor="fw-width"
                    className="text-[10px] text-muted-foreground font-medium"
                  >
                    Width (m)
                  </label>
                  <Input
                    id="fw-width"
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="e.g. 1.5"
                    value={formworkWidth}
                    onChange={(e) => setFormworkWidth(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-1.5">
                <div className="flex-1 flex flex-col gap-0.5">
                  <label
                    htmlFor="fw-height"
                    className="text-[10px] text-muted-foreground font-medium"
                  >
                    Height (m)
                  </label>
                  <Input
                    id="fw-height"
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="e.g. 1.5"
                    value={formworkHeight}
                    onChange={(e) => setFormworkHeight(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-0.5">
                  <label
                    htmlFor="fw-count"
                    className="text-[10px] text-muted-foreground font-medium"
                  >
                    No. of Formwork
                  </label>
                  <Input
                    id="fw-count"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 5"
                    value={formworkCount}
                    onChange={(e) => setFormworkCount(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
              </div>

              {/* Preview info */}
              {(formworkLength || formworkWidth) && (
                <div className="rounded bg-background border border-border p-1.5 flex flex-col gap-0.5">
                  <div className="text-[9px] text-muted-foreground">
                    Horizontal · 0.5m gap between formwork
                  </div>
                  <div className="text-[10px] font-medium text-foreground">
                    {Math.max(1, Number.parseInt(formworkCount) || 1)} formwork
                    × {formworkLength || "?"}m × {formworkWidth || "?"}m
                  </div>
                </div>
              )}

              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  className="flex-1 h-7 text-[11px]"
                  onClick={handlePlaceFormwork}
                  disabled={
                    !formworkLength ||
                    !formworkWidth ||
                    !formworkHeight ||
                    !formworkCount
                  }
                  data-ocid="formwork.submit_button"
                >
                  Place
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-7 text-[11px]"
                  onClick={() => setFormworkDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Permanent Equipment Section */}
      <div className="border-t border-border">
        <div className="px-3 py-1.5 flex items-center gap-1">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Equipment
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
        {EQUIPMENT_ITEMS.map((item, idx) => (
          <div key={item.name}>
            <div className="group flex items-center gap-1 mx-2 mb-1 rounded hover:bg-muted/60 transition-colors">
              {item.name === "Batching-Plant" ||
              item.name === "Reinforcement-Cage" ||
              item.name === "Factory-Shed" ? (
                <button
                  type="button"
                  onClick={() => {
                    if (item.name === "Reinforcement-Cage") {
                      setRcDialogOpen((prev) => !prev);
                    } else if (item.name === "Factory-Shed") {
                      handlePlaceFactoryShed();
                    } else {
                      setBatchingDialogOpen((prev) => !prev);
                      setBatchingGirderCount("1");
                    }
                  }}
                  className="flex-1 flex items-center gap-2 px-2 py-1.5 cursor-pointer min-w-0"
                  title="Click to configure and place"
                  data-ocid={`sidebar.equipment.item.${idx + 1}`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-6 h-6 object-cover rounded flex-shrink-0 border border-border"
                  />
                  <div className="min-w-0 text-left flex-1">
                    <div className="text-xs font-medium break-words leading-tight">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {item.name === "Factory-Shed"
                        ? "Auto-sized from girders"
                        : `L:${item.height}m × W:${item.width}m`}
                    </div>
                  </div>
                  <Settings className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                </button>
              ) : (
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onClick={() => onAddElement(item)}
                  className="flex-1 flex items-center gap-2 px-2 py-1.5 cursor-pointer min-w-0"
                  title="Click or drag to place on canvas"
                  data-ocid={`sidebar.equipment.item.${idx + 1}`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-6 h-6 object-cover rounded flex-shrink-0 border border-border"
                  />
                  <div className="min-w-0 text-left">
                    <div className="text-xs font-medium break-words leading-tight">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      L:{item.height}m × W:{item.width}m
                    </div>
                  </div>
                </button>
              )}
            </div>

            {/* Batching-Plant inline config panel */}
            {item.name === "Batching-Plant" && batchingDialogOpen && (
              <div className="mx-2 mb-2 rounded border border-border bg-muted/40 p-2 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-foreground">
                    Batching-Plant Config
                  </span>
                  <button
                    type="button"
                    onClick={() => setBatchingDialogOpen(false)}
                    className="text-muted-foreground hover:text-foreground"
                    data-ocid="batching.close_button"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>

                <div className="flex flex-col gap-0.5">
                  <label
                    htmlFor="batching-girder-count"
                    className="text-[10px] text-muted-foreground font-medium"
                  >
                    No. of I-Girders
                  </label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={batchingGirderCount}
                    onChange={(e) => setBatchingGirderCount(e.target.value)}
                    className="h-7 text-xs"
                    id="batching-girder-count"
                    data-ocid="batching.input"
                  />
                </div>

                {/* Info panel */}
                <div className="rounded bg-background border border-border p-1.5 flex flex-col gap-0.5">
                  <div className="text-[9px] text-muted-foreground font-semibold mb-0.5">
                    Sub-areas for {girderCount} girder
                    {girderCount !== 1 ? "s" : ""}:
                  </div>
                  {[
                    { name: "QA-Lab", w: 20, h: 20, color: "#3b82f6" },
                    {
                      name: "RMC-Store",
                      w: girderCount * 1,
                      h: 0.5,
                      color: "#22c55e",
                    },
                    {
                      name: "RMC-Garage",
                      w: girderCount * 1,
                      h: 0.5,
                      color: "#f59e0b",
                    },
                    {
                      name: "Aggregates-10m",
                      w: girderCount * 1,
                      h: 1,
                      color: "#f97316",
                    },
                    {
                      name: "Aggregates-20m",
                      w: girderCount * 1,
                      h: 1,
                      color: "#ef4444",
                    },
                    {
                      name: "Crushed-Sand",
                      w: girderCount * 1,
                      h: 3,
                      color: "#eab308",
                    },
                    {
                      name: "Sedimentation-Tank-1",
                      w: Number((20 / 3).toFixed(2)),
                      h: 20,
                      color: "#14b8a6",
                    },
                    {
                      name: "Sedimentation-Tank-2",
                      w: Number((20 / 3).toFixed(2)),
                      h: 20,
                      color: "#14b8a6",
                    },
                    {
                      name: "Sedimentation-Tank-3",
                      w: Number((20 / 3).toFixed(2)),
                      h: 20,
                      color: "#14b8a6",
                    },
                  ].map((area) => (
                    <div key={area.name} className="flex items-center gap-1">
                      <span
                        className="inline-block w-2 h-2 rounded-sm shrink-0"
                        style={{ background: area.color }}
                      />
                      <span className="text-[9px] text-muted-foreground truncate flex-1">
                        {area.name}
                      </span>
                      <span className="text-[9px] font-medium text-foreground shrink-0">
                        {area.w}×{area.h}m
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    className="flex-1 h-7 text-[11px]"
                    onClick={handlePlaceBatchingPlant}
                    data-ocid="batching.submit_button"
                  >
                    Place
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-[11px]"
                    onClick={() => setBatchingDialogOpen(false)}
                    data-ocid="batching.cancel_button"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Reinforcement-Cage inline config panel */}
            {item.name === "Reinforcement-Cage" && rcDialogOpen && (
              <div className="mx-2 mb-2 rounded border border-border bg-muted/40 p-2 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-foreground">
                    Reinforcement-Cage Config
                  </span>
                  <button
                    type="button"
                    onClick={() => setRcDialogOpen(false)}
                    className="text-muted-foreground hover:text-foreground"
                    data-ocid="rc.close_button"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex flex-col gap-0.5">
                  <label
                    htmlFor="rc-length"
                    className="text-[10px] text-muted-foreground font-medium"
                  >
                    Length (m)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    step="0.1"
                    value={rcLength}
                    onChange={(e) => setRcLength(e.target.value)}
                    className="h-7 text-xs"
                    id="rc-length"
                    data-ocid="rc.length_input"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label
                    htmlFor="rc-width"
                    className="text-[10px] text-muted-foreground font-medium"
                  >
                    Width (m)
                  </label>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={rcWidth}
                    onChange={(e) => setRcWidth(e.target.value)}
                    className="h-7 text-xs"
                    id="rc-width"
                    data-ocid="rc.width_input"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label
                    htmlFor="rc-height"
                    className="text-[10px] text-muted-foreground font-medium"
                  >
                    Height 3D (m)
                  </label>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={rcHeight}
                    onChange={(e) => setRcHeight(e.target.value)}
                    className="h-7 text-xs"
                    id="rc-height"
                    data-ocid="rc.height_input"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label
                    htmlFor="rc-count"
                    className="text-[10px] text-muted-foreground font-medium"
                  >
                    No. of Cages
                  </label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={rcCount}
                    onChange={(e) => setRcCount(e.target.value)}
                    className="h-7 text-xs"
                    id="rc-count"
                    data-ocid="rc.count_input"
                  />
                </div>
                {(rcLength || rcWidth) && (
                  <div className="text-[10px] text-muted-foreground rounded bg-background border border-border p-1.5">
                    {Math.max(1, Number.parseInt(rcCount) || 1)} cage(s) ×{" "}
                    {rcLength || "?"}m long × {rcWidth || "?"}m wide
                  </div>
                )}
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    className="flex-1 h-7 text-[11px]"
                    onClick={handlePlaceReinforcementCages}
                    data-ocid="rc.submit_button"
                  >
                    Place
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-[11px]"
                    onClick={() => setRcDialogOpen(false)}
                    data-ocid="rc.cancel_button"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Element Form */}
      {showForm ? (
        <div className="border-t border-border p-2 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs font-semibold">New Element</span>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <Input
            placeholder="Element name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="h-7 text-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateElement();
              if (e.key === "Escape") setShowForm(false);
            }}
          />

          <div className="flex gap-1.5">
            <div className="flex-1 flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground">
                Length (m)
              </span>
              <Input
                placeholder="L"
                type="number"
                min="0.1"
                step="0.1"
                value={formLength}
                onChange={(e) => setFormLength(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div className="flex-1 flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground">
                Width (m)
              </span>
              <Input
                placeholder="W"
                type="number"
                min="0.1"
                step="0.1"
                value={formWidth}
                onChange={(e) => setFormWidth(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground">
              Height (m) — 3D
            </span>
            <Input
              placeholder="H (optional)"
              type="number"
              min="0.1"
              step="0.1"
              value={formHeight3d}
              onChange={(e) => setFormHeight3d(e.target.value)}
              className="h-7 text-xs"
            />
          </div>

          {/* Color picker */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="form-color"
              className="text-[10px] text-muted-foreground shrink-0"
            >
              Color
            </label>
            <div className="flex items-center gap-1.5 flex-1">
              <div
                className="relative w-7 h-7 rounded border border-border overflow-hidden cursor-pointer flex-shrink-0"
                title="Pick color"
              >
                <input
                  id="form-color"
                  type="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <span
                  className="block w-full h-full rounded"
                  style={{ backgroundColor: formColor }}
                />
              </div>
              <Input
                value={formColor}
                onChange={(e) => setFormColor(e.target.value)}
                className="h-7 text-xs font-mono flex-1"
                maxLength={7}
                placeholder="#rrggbb"
              />
            </div>
          </div>

          <Button
            size="sm"
            className="h-7 text-xs w-full"
            onClick={handleCreateElement}
            disabled={!formName.trim()}
          >
            Add to Library
          </Button>
        </div>
      ) : (
        <div className="p-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs gap-1.5"
            onClick={openForm}
            data-ocid="sidebar.add_element_btn"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Element
          </Button>
        </div>
      )}
    </aside>
  );
}
