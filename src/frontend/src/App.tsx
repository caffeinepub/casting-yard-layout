import { Toaster } from "@/components/ui/sonner";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Canvas2D } from "./components/Canvas2D";
import { Canvas3D } from "./components/Canvas3D";
import { Header } from "./components/Header";
import { LeftSidebar } from "./components/LeftSidebar";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { Toolbar } from "./components/Toolbar";
import { useSaveProject } from "./hooks/useQueries";
import type {
  LibraryItem,
  ScaleOption,
  TextLabel,
  ToolMode,
  ViewMode,
  YardElement,
} from "./types/yard";
import { ELEMENT_3D_HEIGHT, ELEMENT_COLORS } from "./types/yard";

let nextId = BigInt(100);
function genId(): bigint {
  nextId += BigInt(1);
  return nextId;
}

const PLACEMENT_SPACING = 2;
const PLACEMENT_START_X = 5;
const PLACEMENT_START_Y = 5;
const MAX_HISTORY = 50;

interface HistorySnapshot {
  elements: YardElement[];
  textLabels: TextLabel[];
}

export default function App() {
  const [elements, setElements] = useState<YardElement[]>([]);
  const [textLabels, setTextLabels] = useState<TextLabel[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<bigint>>(new Set());
  const [activeTool, setActiveTool] = useState<ToolMode>("select");
  const [viewMode, setViewMode] = useState<ViewMode>("2d");
  const [scale, setScale] = useState<ScaleOption>("1:200");
  const [projectName, setProjectName] = useState("Main Casting Yard");
  const [yardLength, setYardLength] = useState(540);
  const [yardWidth, setYardWidth] = useState(540);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);

  const clipboard = useRef<YardElement[]>([]);
  const lastPlacedRef = useRef<{ x: number; y: number; width: number } | null>(
    null,
  );

  const undoStack = useRef<HistorySnapshot[]>([]);
  const redoStack = useRef<HistorySnapshot[]>([]);
  const elementsRef = useRef(elements);
  const textLabelsRef = useRef(textLabels);
  elementsRef.current = elements;
  textLabelsRef.current = textLabels;

  const pushHistory = useCallback(() => {
    const snapshot: HistorySnapshot = {
      elements: elementsRef.current,
      textLabels: textLabelsRef.current,
    };
    undoStack.current = [
      ...undoStack.current.slice(-MAX_HISTORY + 1),
      snapshot,
    ];
    redoStack.current = [];
  }, []);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const refreshUndoRedo = useCallback(() => {
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(redoStack.current.length > 0);
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    const snapshot = undoStack.current[undoStack.current.length - 1];
    undoStack.current = undoStack.current.slice(0, -1);
    redoStack.current = [
      ...redoStack.current,
      { elements: elementsRef.current, textLabels: textLabelsRef.current },
    ];
    setElements(snapshot.elements);
    setTextLabels(snapshot.textLabels);
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(true);
  }, []);

  const handleRedo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    const snapshot = redoStack.current[redoStack.current.length - 1];
    redoStack.current = redoStack.current.slice(0, -1);
    undoStack.current = [
      ...undoStack.current,
      { elements: elementsRef.current, textLabels: textLabelsRef.current },
    ];
    setElements(snapshot.elements);
    setTextLabels(snapshot.textLabels);
    setCanUndo(true);
    setCanRedo(redoStack.current.length > 0);
  }, []);

  const saveProject = useSaveProject();

  const selectedElements = elements.filter((e) => selectedIds.has(e.id));

  const handleMoveStart = useCallback(() => {
    pushHistory();
    refreshUndoRedo();
  }, [pushHistory, refreshUndoRedo]);

  const handleAddElement = useCallback(
    (item: LibraryItem) => {
      pushHistory();
      let xPosition: number;
      let yPosition: number;

      if (lastPlacedRef.current === null) {
        xPosition = PLACEMENT_START_X;
        yPosition = PLACEMENT_START_Y;
      } else {
        xPosition =
          lastPlacedRef.current.x +
          lastPlacedRef.current.width +
          PLACEMENT_SPACING;
        yPosition = lastPlacedRef.current.y;
      }

      const newEl: YardElement = {
        id: genId(),
        name: item.name,
        elementType: item.elementType,
        width: item.width,
        height: item.height,
        xPosition,
        yPosition,
        rotationAngle: 0,
        color: item.color ?? ELEMENT_COLORS[item.elementType],
        status: item.defaultStatus,
        height3d: item.height3d ?? ELEMENT_3D_HEIGHT[item.elementType],
        shape: "rectangle",
        imageUrl: item.imageUrl,
      };

      lastPlacedRef.current = { x: xPosition, y: yPosition, width: item.width };

      setElements((prev) => [...prev, newEl]);
      setSelectedIds(new Set([newEl.id]));
      refreshUndoRedo();
      toast.success(`Added ${item.name} to yard`);
    },
    [pushHistory, refreshUndoRedo],
  );

  const handleDropElement = useCallback(
    (item: LibraryItem, x: number, y: number) => {
      pushHistory();
      const newEl: YardElement = {
        id: genId(),
        name: item.name,
        elementType: item.elementType,
        width: item.width,
        height: item.height,
        xPosition: Math.max(0, x),
        yPosition: Math.max(0, y),
        rotationAngle: 0,
        color: item.color ?? ELEMENT_COLORS[item.elementType],
        status: item.defaultStatus,
        height3d: item.height3d ?? ELEMENT_3D_HEIGHT[item.elementType],
        shape: "rectangle",
        imageUrl: item.imageUrl,
      };
      setElements((prev) => [...prev, newEl]);
      setSelectedIds(new Set([newEl.id]));
      refreshUndoRedo();
    },
    [pushHistory, refreshUndoRedo],
  );

  const handleMoveElement = useCallback((id: bigint, x: number, y: number) => {
    setElements((prev) =>
      prev.map((e) => (e.id === id ? { ...e, xPosition: x, yPosition: y } : e)),
    );
  }, []);

  const handleMoveElements = useCallback(
    (moves: { id: bigint; x: number; y: number }[]) => {
      setElements((prev) => {
        const map = new Map(moves.map((m) => [m.id, m]));
        return prev.map((e) =>
          map.has(e.id)
            ? { ...e, xPosition: map.get(e.id)!.x, yPosition: map.get(e.id)!.y }
            : e,
        );
      });
    },
    [],
  );

  const handleRotateElement = useCallback((id: bigint, angle: number) => {
    setElements((prev) =>
      prev.map((e) => (e.id === id ? { ...e, rotationAngle: angle } : e)),
    );
  }, []);

  const handleUpdateElement = useCallback(
    (id: bigint, changes: Partial<YardElement>) => {
      pushHistory();
      setElements((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...changes } : e)),
      );
      refreshUndoRedo();
    },
    [pushHistory, refreshUndoRedo],
  );

  const handleDeleteElement = useCallback(
    (id: bigint) => {
      pushHistory();
      setElements((prev) => prev.filter((e) => e.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      refreshUndoRedo();
      toast.success("Element removed");
    },
    [pushHistory, refreshUndoRedo],
  );

  const handleDeleteSelected = useCallback(() => {
    pushHistory();
    setElements((prev) => prev.filter((e) => !selectedIds.has(e.id)));
    setSelectedIds(new Set());
    refreshUndoRedo();
    toast.success("Selected elements deleted");
  }, [selectedIds, pushHistory, refreshUndoRedo]);

  const handleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allIds = new Set(elements.map((e) => e.id));
      if (prev.size === allIds.size) return new Set();
      return allIds;
    });
  }, [elements]);

  const handleBulkColor = useCallback(
    (color: string) => {
      setElements((prev) =>
        prev.map((e) => (selectedIds.has(e.id) ? { ...e, color } : e)),
      );
    },
    [selectedIds],
  );

  const handleBringToFront = useCallback((id: bigint) => {
    setElements((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const next = [...prev];
      const [el] = next.splice(idx, 1);
      next.push(el);
      return next;
    });
    toast.success("Brought to front");
  }, []);

  const handleSendToBack = useCallback((id: bigint) => {
    setElements((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx === -1 || idx === 0) return prev;
      const next = [...prev];
      const [el] = next.splice(idx, 1);
      next.unshift(el);
      return next;
    });
    toast.success("Sent to back");
  }, []);

  const handleClearYard = useCallback(() => {
    pushHistory();
    setElements([]);
    setTextLabels([]);
    setSelectedIds(new Set());
    lastPlacedRef.current = null;
    refreshUndoRedo();
    toast.info("Yard cleared");
  }, [pushHistory, refreshUndoRedo]);

  const handleAddTextLabel = useCallback(
    (label: TextLabel) => {
      pushHistory();
      setTextLabels((prev) => [...prev, label]);
      refreshUndoRedo();
    },
    [pushHistory, refreshUndoRedo],
  );

  const handleUpdateTextLabel = useCallback(
    (id: bigint, changes: Partial<TextLabel>) => {
      setTextLabels((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...changes } : l)),
      );
    },
    [],
  );

  const handleDeleteTextLabel = useCallback((id: bigint) => {
    setTextLabels((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const handleSave = useCallback(() => {
    saveProject.mutate(
      { projectName, elements },
      {
        onSuccess: () => toast.success("Project saved successfully!"),
        onError: () => toast.error("Failed to save project"),
      },
    );
  }, [saveProject, projectName, elements]);

  const handleSaveFile = useCallback(() => {
    const data = {
      version: 3,
      projectName,
      yardLength,
      yardWidth,
      libraryItems,
      elements: elements.map((el) => ({ ...el, id: el.id.toString() })),
      textLabels: textLabels.map((l) => ({ ...l, id: l.id.toString() })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, "_")}.cyld`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Layout saved to file");
  }, [projectName, yardLength, yardWidth, libraryItems, elements, textLabels]);

  const handleLoadFile = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".cyld,.json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.projectName) setProjectName(data.projectName);
          // Support old single yardSize and new yardLength/yardWidth
          if (data.yardLength) setYardLength(data.yardLength);
          else if (data.yardSize) setYardLength(data.yardSize);
          if (data.yardWidth) setYardWidth(data.yardWidth);
          else if (data.yardSize) setYardWidth(data.yardSize);
          if (data.libraryItems) setLibraryItems(data.libraryItems);
          if (data.elements) {
            const loaded = data.elements.map((el: any) => ({
              ...el,
              id: BigInt(el.id),
            }));
            setElements(loaded);
            if (loaded.length > 0) {
              const last = loaded[loaded.length - 1] as YardElement;
              lastPlacedRef.current = {
                x: last.xPosition,
                y: last.yPosition,
                width: last.width,
              };
            }
          }
          if (data.textLabels) {
            setTextLabels(
              data.textLabels.map((l: any) => ({ ...l, id: BigInt(l.id) })),
            );
          }
          setSelectedIds(new Set());
          toast.success("Layout loaded successfully");
        } catch {
          toast.error("Failed to load file — invalid format");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        handleRedo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        setElements((prev) => {
          setSelectedIds(new Set(prev.map((el) => el.id)));
          return prev;
        });
      } else if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        setElements((prev) => {
          const sel = prev.filter((el) => selectedIds.has(el.id));
          if (sel.length > 0) {
            clipboard.current = sel;
            toast.info(
              sel.length === 1
                ? `Copied ${sel[0].name}`
                : `Copied ${sel.length} elements`,
            );
          }
          return prev;
        });
      } else if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        const srcs = clipboard.current;
        if (!srcs || srcs.length === 0) return;
        e.preventDefault();
        pushHistory();
        const newEls: YardElement[] = srcs.map((src) => ({
          ...src,
          id: genId(),
          xPosition: src.xPosition + 5,
          yPosition: src.yPosition + 5,
        }));
        setElements((prev) => [...prev, ...newEls]);
        setSelectedIds(new Set(newEls.map((el) => el.id)));
        refreshUndoRedo();
        toast.success(
          newEls.length === 1
            ? `Pasted ${srcs[0].name}`
            : `Pasted ${newEls.length} elements`,
        );
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.size > 0) {
          e.preventDefault();
          pushHistory();
          setElements((prev) => prev.filter((el) => !selectedIds.has(el.id)));
          setSelectedIds(new Set());
          refreshUndoRedo();
          toast.success(
            selectedIds.size === 1
              ? "Element deleted"
              : `${selectedIds.size} elements deleted`,
          );
        }
      } else if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      ) {
        if (selectedIds.size === 0) return;
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        const dx =
          e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy =
          e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        pushHistory();
        setElements((prev) =>
          prev.map((el) =>
            selectedIds.has(el.id)
              ? {
                  ...el,
                  xPosition: Math.max(0, el.xPosition + dx),
                  yPosition: Math.max(0, el.yPosition + dy),
                }
              : el,
          ),
        );
        refreshUndoRedo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedIds, handleUndo, handleRedo, pushHistory, refreshUndoRedo]);

  const firstSelectedId = selectedIds.size > 0 ? [...selectedIds][0] : null;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <Toaster />

      <Header
        projectName={projectName}
        onProjectChange={setProjectName}
        onSave={handleSave}
        isSaving={saveProject.isPending}
        projects={[
          "Main Casting Yard",
          "North Yard",
          "South Yard",
          "Test Yard",
        ]}
      />

      {/* Secondary title row */}
      <div
        className="flex items-center justify-between px-4 h-8 shrink-0 border-b border-white/10"
        style={{ backgroundColor: "oklch(0.22 0.028 220)" }}
      >
        <h1 className="text-xs font-bold tracking-[0.2em] uppercase text-white/90">
          Casting Yard Pro
        </h1>
        <div className="flex items-center gap-3 text-xs text-white/50">
          <span>{elements.length} elements</span>
          {selectedIds.size > 0 && (
            <span className="text-blue-300">{selectedIds.size} selected</span>
          )}
          <span>·</span>
          <span>
            {yardLength}m × {yardWidth}m yard
          </span>
        </div>
      </div>

      <Toolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        viewMode={viewMode}
        onViewChange={setViewMode}
        scale={scale}
        onScaleChange={setScale}
        onClearYard={handleClearYard}
        yardLength={yardLength}
        yardWidth={yardWidth}
        onYardLengthChange={setYardLength}
        onYardWidthChange={setYardWidth}
        onSelectAll={handleSelectAll}
        selectedCount={selectedIds.size}
        totalCount={elements.length}
        onSaveFile={handleSaveFile}
        onLoadFile={handleLoadFile}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Main 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar
          onAddElement={handleAddElement}
          libraryItems={libraryItems}
          onLibraryChange={setLibraryItems}
        />

        {viewMode === "2d" ? (
          <Canvas2D
            elements={elements}
            selectedIds={selectedIds}
            activeTool={activeTool}
            scale={scale}
            yardLength={yardLength}
            yardWidth={yardWidth}
            onSelectElement={setSelectedIds}
            onMoveElement={handleMoveElement}
            onMoveElements={handleMoveElements}
            onRotateElement={handleRotateElement}
            onDropElement={handleDropElement}
            textLabels={textLabels}
            onAddTextLabel={handleAddTextLabel}
            onUpdateTextLabel={handleUpdateTextLabel}
            onDeleteTextLabel={handleDeleteTextLabel}
            onMoveStart={handleMoveStart}
          />
        ) : (
          <Canvas3D
            elements={elements}
            selectedId={firstSelectedId}
            yardLength={yardLength}
            yardWidth={yardWidth}
            onSelectElement={(id) =>
              setSelectedIds(id ? new Set([id]) : new Set())
            }
          />
        )}

        <PropertiesPanel
          elements={selectedElements}
          onUpdate={handleUpdateElement}
          onDelete={handleDeleteElement}
          onDeleteAll={handleDeleteSelected}
          onBulkColor={handleBulkColor}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
        />
      </div>

      {/* Footer */}
      <footer
        className="flex items-center justify-between px-4 h-7 shrink-0 border-t border-border"
        style={{ backgroundColor: "oklch(0.96 0.006 240)" }}
      >
        <span className="text-[10px] text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </span>
        <span className="text-[10px] text-muted-foreground">
          Precast Concrete Yard Management
        </span>
      </footer>
    </div>
  );
}
