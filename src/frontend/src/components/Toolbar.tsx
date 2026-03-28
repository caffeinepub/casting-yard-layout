import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckSquare,
  Download,
  MousePointer2,
  Move,
  Printer,
  Redo2,
  RotateCw,
  Ruler,
  Settings,
  Trash2,
  Type,
  Undo2,
  Upload,
} from "lucide-react";
import type { ScaleOption, ToolMode, ViewMode } from "../types/yard";

interface ToolbarProps {
  activeTool: ToolMode;
  onToolChange: (tool: ToolMode) => void;
  viewMode: ViewMode;
  onViewChange: (view: ViewMode) => void;
  scale: ScaleOption;
  onScaleChange: (scale: ScaleOption) => void;
  onClearYard: () => void;
  yardLength: number;
  yardWidth: number;
  onYardLengthChange: (size: number) => void;
  onYardWidthChange: (size: number) => void;
  onSelectAll: () => void;
  selectedCount: number;
  totalCount: number;
  onSaveFile: () => void;
  onLoadFile: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenSettings?: () => void;
}

const TOOLS: {
  id: ToolMode;
  label: string;
  Icon: React.FC<{ className?: string }>;
}[] = [
  { id: "select", label: "Select", Icon: MousePointer2 },
  { id: "move", label: "Move", Icon: Move },
  { id: "rotate", label: "Rotate", Icon: RotateCw },
  { id: "measure", label: "Measure", Icon: Ruler },
  { id: "text", label: "Text", Icon: Type },
];

function handlePrintToPDF() {
  window.print();
}

export function Toolbar({
  activeTool,
  onToolChange,
  viewMode,
  onViewChange,
  scale,
  onScaleChange,
  onClearYard,
  yardLength,
  yardWidth,
  onYardLengthChange,
  onYardWidthChange,
  onSelectAll,
  selectedCount,
  totalCount,
  onSaveFile,
  onLoadFile,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenSettings,
}: ToolbarProps) {
  return (
    <div
      className="flex items-center gap-2 px-3 h-11 shrink-0 no-select"
      style={{ backgroundColor: "oklch(0.27 0.022 220)" }}
      data-ocid="toolbar.section"
    >
      {/* Tool buttons */}
      <div className="flex items-center gap-0.5">
        {TOOLS.map(({ id, label, Icon }) => (
          <button
            type="button"
            key={id}
            onClick={() => onToolChange(id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
              activeTool === id
                ? "text-white"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
            style={activeTool === id ? { backgroundColor: "#1E7ACB" } : {}}
            title={id === "text" ? "Text annotation (T)" : label}
            data-ocid={`toolbar.${id}.button`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 ml-1 border-l border-white/20 pl-1">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
              canUndo
                ? "text-white/70 hover:text-white hover:bg-white/10"
                : "text-white/20 cursor-not-allowed"
            }`}
            data-ocid="toolbar.undo.button"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Undo</span>
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
              canRedo
                ? "text-white/70 hover:text-white hover:bg-white/10"
                : "text-white/20 cursor-not-allowed"
            }`}
            data-ocid="toolbar.redo.button"
          >
            <Redo2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Redo</span>
          </button>
        </div>

        {/* Select All */}
        <button
          type="button"
          onClick={onSelectAll}
          title={
            selectedCount === totalCount && totalCount > 0
              ? "Deselect All"
              : "Select All (Ctrl+A)"
          }
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ml-0.5 ${
            selectedCount > 0 && selectedCount === totalCount
              ? "text-blue-300 bg-blue-400/20"
              : "text-white/60 hover:text-white hover:bg-white/10"
          }`}
          data-ocid="toolbar.select_all.button"
        >
          <CheckSquare className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            {selectedCount > 0
              ? `${selectedCount}/${totalCount}`
              : "Select All"}
          </span>
        </button>

        {/* Clear Yard */}
        <button
          type="button"
          onClick={onClearYard}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-white/60 hover:text-red-400 hover:bg-red-400/10 transition-colors ml-1"
          data-ocid="toolbar.clear_yard.button"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Clear Yard</span>
        </button>

        {/* Print to PDF */}
        <button
          type="button"
          onClick={handlePrintToPDF}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-white/60 hover:text-green-400 hover:bg-green-400/10 transition-colors ml-1"
          title="Print 2D Grid View to PDF"
          data-ocid="toolbar.print_pdf.button"
        >
          <Printer className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Print to PDF</span>
        </button>

        {/* Save File */}
        <button
          type="button"
          onClick={onSaveFile}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-white/60 hover:text-cyan-400 hover:bg-cyan-400/10 transition-colors ml-1"
          title="Save layout to file"
          data-ocid="toolbar.save_file.button"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Save File</span>
        </button>

        {/* Load File */}
        <button
          type="button"
          onClick={onLoadFile}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-white/60 hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors ml-1"
          title="Load layout from file"
          data-ocid="toolbar.load_file.button"
        >
          <Upload className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Load File</span>
        </button>
      </div>

      <div className="h-5 w-px bg-white/20 mx-1" />

      {/* View toggle */}
      <div className="flex items-center gap-0.5 bg-white/10 rounded-md p-0.5">
        {(["2d", "3d"] as ViewMode[]).map((v) => (
          <button
            type="button"
            key={v}
            onClick={() => onViewChange(v)}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
              viewMode === v
                ? "text-white shadow"
                : "text-white/60 hover:text-white"
            }`}
            style={viewMode === v ? { backgroundColor: "#1E7ACB" } : {}}
            data-ocid={`toolbar.view_${v}.toggle`}
          >
            {v === "2d" ? "2D Grid View" : "3D Isometric View"}
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-white/20 mx-1" />

      {/* Scale selector */}
      <div className="flex items-center gap-1.5">
        <span className="text-white/60 text-xs font-medium">Scale</span>
        <Select
          value={scale}
          onValueChange={(v) => onScaleChange(v as ScaleOption)}
        >
          <SelectTrigger
            className="h-7 w-24 text-xs border-white/20 bg-white/10 text-white"
            data-ocid="toolbar.scale.select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1:100">1:100</SelectItem>
            <SelectItem value="1:200">1:200</SelectItem>
            <SelectItem value="1:500">1:500</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="h-5 w-px bg-white/20 mx-1" />

      {/* Yard Size inputs */}
      <div className="flex items-center gap-1.5">
        <span className="text-white/60 text-xs font-medium">Yard</span>
        <div className="flex items-center gap-1">
          <span className="text-white/40 text-xs">L</span>
          <input
            type="number"
            min={50}
            max={2000}
            step={10}
            value={yardLength}
            onChange={(e) => {
              const val = Math.min(2000, Math.max(50, Number(e.target.value)));
              onYardLengthChange(val);
            }}
            className="h-7 w-20 text-xs rounded px-2 border border-white/20 bg-white/10 text-white text-center focus:outline-none focus:border-blue-400"
            data-ocid="toolbar.yard_length.input"
          />
          <span className="text-white/40 text-xs">m</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-white/40 text-xs">W</span>
          <input
            type="number"
            min={50}
            max={2000}
            step={10}
            value={yardWidth}
            onChange={(e) => {
              const val = Math.min(2000, Math.max(50, Number(e.target.value)));
              onYardWidthChange(val);
            }}
            className="h-7 w-20 text-xs rounded px-2 border border-white/20 bg-white/10 text-white text-center focus:outline-none focus:border-blue-400"
            data-ocid="toolbar.yard_width.input"
          />
          <span className="text-white/40 text-xs">m</span>
        </div>
      </div>

      {/* Settings button */}
      {onOpenSettings && (
        <button
          type="button"
          onClick={onOpenSettings}
          title="Spacing Settings"
          className="ml-auto flex items-center gap-1.5 h-7 px-2.5 rounded text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          data-ocid="toolbar.settings_button"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      )}
    </div>
  );
}
