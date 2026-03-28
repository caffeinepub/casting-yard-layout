import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import type { ElementStatus, ShapeType, YardElement } from "../types/yard";

interface PropertiesPanelProps {
  elements: YardElement[];
  onUpdate: (id: bigint, changes: Partial<YardElement>) => void;
  onDelete: (id: bigint) => void;
  onDeleteAll: () => void;
  onBulkColor: (color: string) => void;
  onBringToFront: (id: bigint) => void;
  onSendToBack: (id: bigint) => void;
}

const STATUS_LABELS: Record<ElementStatus, string> = {
  planned: "Planned",
  inProgress: "In Progress",
  complete: "Complete",
};

const STATUS_COLORS: Record<ElementStatus, string> = {
  planned: "bg-slate-100 text-slate-700",
  inProgress: "bg-yellow-50 text-yellow-700",
  complete: "bg-green-50 text-green-700",
};

const SHAPE_LABELS: Record<ShapeType, string> = {
  rectangle: "Rectangle",
  "l-shape": "L-Shape",
  "t-shape": "T-Shape",
  "i-shape": "I-Shape",
  circle: "Circle",
  open: "Open",
};

export function PropertiesPanel({
  elements,
  onUpdate,
  onDelete,
  onDeleteAll,
  onBulkColor,
  onBringToFront,
  onSendToBack,
}: PropertiesPanelProps) {
  // No selection
  if (elements.length === 0) {
    return (
      <aside
        className="w-56 shrink-0 bg-card border-l border-border flex flex-col"
        data-ocid="properties.panel"
      >
        <div className="p-3 border-b border-border">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Element Properties
          </h3>
        </div>
        <div
          className="flex-1 flex flex-col items-center justify-center gap-2 p-4 text-center"
          data-ocid="properties.empty_state"
        >
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <span className="text-lg">📦</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Select an element on the canvas to view and edit its properties.
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            Tip: Drag to marquee-select multiple elements, or use Ctrl+A to
            select all.
          </p>
        </div>
      </aside>
    );
  }

  // Multi-selection panel
  if (elements.length > 1) {
    // Check if all have the same color
    const firstColor = elements[0].color;
    const allSameColor = elements.every((e) => e.color === firstColor);
    const bulkColor = allSameColor ? firstColor : "#888888";

    return (
      <aside
        className="w-56 shrink-0 bg-card border-l border-border flex flex-col overflow-y-auto"
        data-ocid="properties.panel"
      >
        <div className="p-3 border-b border-border">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Element Properties
          </h3>
        </div>

        <div className="p-3 flex flex-col gap-3">
          {/* Multi-select summary */}
          <div className="flex items-center gap-2 p-2 rounded bg-blue-50 border border-blue-200">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[10px] font-bold">
                {elements.length}
              </span>
            </div>
            <div>
              <div className="text-xs font-semibold text-blue-700">
                {elements.length} Elements Selected
              </div>
              <div className="text-[10px] text-blue-500">
                Hold Shift to add/remove
              </div>
            </div>
          </div>

          {/* Selected element names */}
          <div className="space-y-1">
            <Label className="text-xs">Selected</Label>
            <div className="bg-muted/40 rounded p-2 space-y-1 max-h-32 overflow-y-auto">
              {elements.slice(0, 5).map((el) => (
                <div key={String(el.id)} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: el.color }}
                  />
                  <span className="text-[11px] text-foreground truncate">
                    {el.name}
                  </span>
                </div>
              ))}
              {elements.length > 5 && (
                <div className="text-[10px] text-muted-foreground">
                  and {elements.length - 5} more…
                </div>
              )}
            </div>
          </div>

          {/* Bulk color */}
          <div className="space-y-1">
            <Label className="text-xs">Bulk Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bulkColor}
                onChange={(e) => onBulkColor(e.target.value)}
                className="w-8 h-7 rounded border border-input cursor-pointer p-0.5 bg-background"
                data-ocid="properties.bulk_color.input"
              />
              <Input
                value={bulkColor}
                onChange={(e) => onBulkColor(e.target.value)}
                className="h-7 text-xs flex-1"
                placeholder="#rrggbb"
                data-ocid="properties.bulk_color.text"
              />
            </div>
          </div>

          {/* Delete all selected */}
          <Button
            variant="destructive"
            size="sm"
            className="w-full mt-1 text-xs"
            onClick={onDeleteAll}
            data-ocid="properties.delete_all.button"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete {elements.length} Elements
          </Button>
        </div>
      </aside>
    );
  }

  // Single element panel
  const element = elements[0];

  return (
    <aside
      className="w-56 shrink-0 bg-card border-l border-border flex flex-col overflow-y-auto"
      data-ocid="properties.panel"
    >
      <div className="p-3 border-b border-border">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Element Properties
        </h3>
      </div>

      <div className="p-3 flex flex-col gap-3">
        {/* Color swatch + type */}
        <div className="flex items-center gap-2 p-2 rounded bg-muted/40">
          <span
            className="w-5 h-5 rounded flex-shrink-0 shadow-xs"
            style={{ backgroundColor: element.color }}
          />
          <div>
            <div className="text-xs font-semibold capitalize">
              {element.elementType}
            </div>
            <div className="text-[10px] text-muted-foreground">
              ID: {String(element.id)}
            </div>
          </div>
          <span
            className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[element.status]}`}
          >
            {STATUS_LABELS[element.status]}
          </span>
        </div>

        {/* Name */}
        <div className="space-y-1">
          <Label className="text-xs">Name</Label>
          <Input
            value={element.name}
            onChange={(e) => onUpdate(element.id, { name: e.target.value })}
            className="h-7 text-xs"
            data-ocid="properties.name.input"
          />
        </div>

        {/* Color picker */}
        <div className="space-y-1">
          <Label className="text-xs">Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={element.color}
              onChange={(e) => onUpdate(element.id, { color: e.target.value })}
              className="w-8 h-7 rounded border border-input cursor-pointer p-0.5 bg-background"
              data-ocid="properties.color.input"
            />
            <Input
              value={element.color}
              onChange={(e) => onUpdate(element.id, { color: e.target.value })}
              className="h-7 text-xs flex-1"
              placeholder="#rrggbb"
              data-ocid="properties.color.text"
            />
          </div>
        </div>

        {/* Layer order */}
        <div className="space-y-1">
          <Label className="text-xs">Layer Order</Label>
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onBringToFront(element.id)}
              data-ocid="properties.bring_to_front.button"
            >
              <ArrowUp className="h-3 w-3 mr-1" />
              To Front
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onSendToBack(element.id)}
              data-ocid="properties.send_to_back.button"
            >
              <ArrowDown className="h-3 w-3 mr-1" />
              To Back
            </Button>
          </div>
        </div>

        {/* Dimensions */}
        <div className="space-y-1">
          <Label className="text-xs">Width (m)</Label>
          <Input
            type="number"
            min={0.1}
            step={0.5}
            value={element.width}
            onChange={(e) =>
              onUpdate(element.id, {
                width: Number.parseFloat(e.target.value) || element.width,
              })
            }
            className="h-7 text-xs"
            data-ocid="properties.width.input"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Depth (m)</Label>
          <Input
            type="number"
            min={0.1}
            step={0.5}
            value={element.height}
            onChange={(e) =>
              onUpdate(element.id, {
                height: Number.parseFloat(e.target.value) || element.height,
              })
            }
            className="h-7 text-xs"
            data-ocid="properties.depth.input"
          />
        </div>

        {/* 3D Height */}
        <div className="space-y-1">
          <Label className="text-xs">3D Height (m)</Label>
          <Input
            type="number"
            min={0.1}
            step={0.1}
            value={element.height3d}
            onChange={(e) =>
              onUpdate(element.id, {
                height3d: Number.parseFloat(e.target.value) || element.height3d,
              })
            }
            className="h-7 text-xs"
            data-ocid="properties.height3d.input"
          />
        </div>

        {/* Shape selector */}
        <div className="space-y-1">
          <Label className="text-xs">Shape</Label>
          <Select
            value={element.shape}
            onValueChange={(v) =>
              onUpdate(element.id, { shape: v as ShapeType })
            }
          >
            <SelectTrigger
              className="h-7 text-xs"
              data-ocid="properties.shape.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SHAPE_LABELS) as ShapeType[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {SHAPE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Position */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">X (m)</Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={Math.round(element.xPosition * 10) / 10}
              onChange={(e) =>
                onUpdate(element.id, {
                  xPosition: Number.parseFloat(e.target.value) || 0,
                })
              }
              className="h-7 text-xs"
              data-ocid="properties.xposition.input"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Y (m)</Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={Math.round(element.yPosition * 10) / 10}
              onChange={(e) =>
                onUpdate(element.id, {
                  yPosition: Number.parseFloat(e.target.value) || 0,
                })
              }
              className="h-7 text-xs"
              data-ocid="properties.yposition.input"
            />
          </div>
        </div>

        {/* Rotation */}
        <div className="space-y-1">
          <Label className="text-xs">Rotation (°)</Label>
          <Input
            type="number"
            min={0}
            max={360}
            step={5}
            value={Math.round(element.rotationAngle)}
            onChange={(e) =>
              onUpdate(element.id, {
                rotationAngle: Number.parseFloat(e.target.value) || 0,
              })
            }
            className="h-7 text-xs"
            data-ocid="properties.rotation.input"
          />
        </div>

        {/* Status */}
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select
            value={element.status}
            onValueChange={(v) =>
              onUpdate(element.id, { status: v as ElementStatus })
            }
          >
            <SelectTrigger
              className="h-7 text-xs"
              data-ocid="properties.status.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="inProgress">In Progress</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Delete */}
        <Button
          variant="destructive"
          size="sm"
          className="w-full mt-1 text-xs"
          onClick={() => onDelete(element.id)}
          data-ocid="properties.delete.button"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Delete Element
        </Button>
      </div>
    </aside>
  );
}
