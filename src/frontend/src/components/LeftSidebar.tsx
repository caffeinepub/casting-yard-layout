import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { LibraryItem } from "../types/yard";

const DEFAULT_COLOR = "#4f86c6";

const EQUIPMENT_ITEMS: import("../types/yard").LibraryItem[] = [
  {
    name: "Gantry Crane",
    elementType: "custom",
    width: 5,
    height: 30,
    color: "#FFD700",
    defaultStatus: "planned",
    imageUrl:
      "/assets/uploads/istockphoto-464854298-1024x1024-019d2b15-f4f1-70fa-aca4-80e5b8dbc76f-1.png",
  },
  {
    name: "Batching Plant",
    elementType: "custom",
    width: 30,
    height: 30,
    height3d: 12,
    color: "#22c55e",
    defaultStatus: "planned",
    imageUrl:
      "/assets/uploads/image-019d2e26-ba9f-715b-8085-8f4fe41ec417-1.png",
  },
];

interface LeftSidebarProps {
  onAddElement: (item: LibraryItem) => void;
  libraryItems: LibraryItem[];
  onLibraryChange: (items: LibraryItem[]) => void;
}

export function LeftSidebar({
  onAddElement,
  libraryItems,
  onLibraryChange,
}: LeftSidebarProps) {
  const [search, setSearch] = useState("");

  // Add element form
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formLength, setFormLength] = useState("");
  const [formWidth, setFormWidth] = useState("");
  const [formHeight3d, setFormHeight3d] = useState("");
  const [formColor, setFormColor] = useState(DEFAULT_COLOR);

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

  const visibleItems = libraryItems.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()),
  );

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
                <div className="text-xs font-medium truncate">{item.name}</div>
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
          <div
            key={item.name}
            className="group flex items-center gap-1 mx-2 mb-1 rounded hover:bg-muted/60 transition-colors"
          >
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
                <div className="text-xs font-medium truncate">{item.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  L:{item.height}m × W:{item.width}m
                </div>
              </div>
            </button>
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
