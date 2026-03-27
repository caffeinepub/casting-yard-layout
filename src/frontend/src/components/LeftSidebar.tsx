import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Settings, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { LibraryItem } from "../types/yard";

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
  libraryItems: LibraryItem[];
  onLibraryChange: (items: LibraryItem[]) => void;
  yardLength: number;
  yardWidth: number;
}

export function LeftSidebar({
  onAddElement,
  onAddMultipleElements,
  libraryItems,
  onLibraryChange,
  yardLength,
  yardWidth,
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
  const [iGirderLength, setIGirderLength] = useState("");
  const [iGirderWidth, setIGirderWidth] = useState("");
  const [iGirderHeight, setIGirderHeight] = useState("");
  const [iGirderCount, setIGirderCount] = useState("1");

  // Bay config
  const [bayDialogOpen, setBayDialogOpen] = useState(false);
  const [bayLength, setBayLength] = useState("");
  const [bayWidth, setBayWidth] = useState("");
  const [bayCount, setBayCount] = useState("1");

  const batchingPlantItem = EQUIPMENT_ITEMS.find(
    (i) => i.name === "Batching-Plant",
  )!;

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
    const calculatedLength = count * 20;
    const calculatedWidth = 20;
    onAddElement({
      ...batchingPlantItem,
      height: calculatedLength,
      width: calculatedWidth,
    });
    setBatchingDialogOpen(false);
    setBatchingGirderCount("1");
  };

  const handlePlaceIGirders = () => {
    // length = horizontal dimension (runs along X axis)
    // width = vertical/spacing dimension (runs along Y axis)
    const girderLength = Number.parseFloat(iGirderLength) || 10;
    const girderWidth = Number.parseFloat(iGirderWidth) || 2;
    const height3d = Number.parseFloat(iGirderHeight) || 1.5;
    const count = Math.max(1, Number.parseInt(iGirderCount) || 1);

    // In the canvas: element.width = horizontal span, element.height = vertical span
    // I-Girders are horizontal: width = girder length, height = girder width
    const girderTemplate: LibraryItem = {
      name: "I-Girder",
      elementType: "custom",
      width: girderLength, // horizontal (length of girder)
      height: girderWidth, // vertical (width of girder)
      height3d,
      color: "#7c9cbf",
      defaultStatus: "planned",
    };

    const items: LibraryItem[] = Array.from({ length: count }, () => ({
      ...girderTemplate,
    }));

    // Place vertically: spacing between girders = girder width + 0.5m
    onAddMultipleElements(items, girderWidth + 0.5, "vertical");
    setIGirderDialogOpen(false);
    setIGirderLength("");
    setIGirderWidth("");
    setIGirderHeight("");
    setIGirderCount("1");
  };

  const handlePlaceBays = () => {
    const bLength = Number.parseFloat(bayLength) || 20;
    const bWidth = Number.parseFloat(bayWidth) || 10;
    const count = Math.max(1, Number.parseInt(bayCount) || 1);

    // spacing = gap between bay edges (edge-to-edge), exactly 30m
    const spacing = 30;

    const totalHeight = count * bWidth + (count - 1) * 30;
    const startX = Math.max(0, (yardLength - bLength) / 2);
    const startY = Math.max(0, (yardWidth - totalHeight) / 2);

    const items: LibraryItem[] = Array.from({ length: count }, () => ({
      name: "Bay",
      elementType: "custom" as const,
      width: bLength, // horizontal (length)
      height: bWidth, // vertical (width)
      height3d: 5,
      color: "#e0b84a",
      defaultStatus: "planned" as const,
    }));

    onAddMultipleElements(items, spacing, "vertical", {
      yardLength,
      yardWidth,
      startX,
      startY,
    });
    setBayDialogOpen(false);
    setBayLength("");
    setBayWidth("");
    setBayCount("1");
  };

  const visibleItems = libraryItems.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()),
  );

  const girderCount = Math.max(1, Number.parseInt(batchingGirderCount) || 1);

  return (
    <aside
      className="w-56 shrink-0 bg-card border-r border-border flex flex-col overflow-hidden"
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
      <div className="flex-1 overflow-y-auto py-1">
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

        {/* I-Girder item */}
        <div className="mx-2 mb-1">
          <div className="group flex items-center gap-1 rounded hover:bg-muted/60 transition-colors">
            <button
              type="button"
              onClick={() => {
                setIGirderDialogOpen((prev) => !prev);
                if (!iGirderDialogOpen) {
                  setIGirderLength("");
                  setIGirderWidth("");
                  setIGirderHeight("");
                  setIGirderCount("1");
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
                <rect
                  x="1"
                  y="1"
                  width="16"
                  height="3"
                  rx="0.5"
                  fill="#7c9cbf"
                />
                <rect x="7.5" y="4" width="3" height="10" fill="#7c9cbf" />
                <rect
                  x="1"
                  y="14"
                  width="16"
                  height="3"
                  rx="0.5"
                  fill="#7c9cbf"
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
                    Horizontal · {(Number.parseFloat(iGirderWidth) || 0) + 0.5}m
                    vertical spacing
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
              {item.name === "Batching-Plant" ? (
                <button
                  type="button"
                  onClick={() => {
                    setBatchingDialogOpen((prev) => !prev);
                    setBatchingGirderCount("1");
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
                      L:{item.height}m × W:{item.width}m
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
                  <div className="text-[9px] text-muted-foreground">
                    1 girder = 35 m³ concrete = 20×20m
                  </div>
                  <div className="text-[10px] font-medium text-foreground">
                    Total space: {girderCount * 20}m × 20m
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Total concrete: {girderCount * 35} m³
                  </div>
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
