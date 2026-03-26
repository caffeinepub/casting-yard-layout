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

export default function App() {
  const [elements, setElements] = useState<YardElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<bigint>>(new Set());
  const [activeTool, setActiveTool] = useState<ToolMode>("select");
  const [viewMode, setViewMode] = useState<ViewMode>("2d");
  const [scale, setScale] = useState<ScaleOption>("1:200");
  const [projectName, setProjectName] = useState("Main Casting Yard");
  const [yardSize, setYardSize] = useState(200);

  const clipboard = useRef<YardElement[]>([]);

  const saveProject = useSaveProject();

  const selectedElements = elements.filter((e) => selectedIds.has(e.id));

  const handleAddElement = useCallback((item: LibraryItem) => {
    const newEl: YardElement = {
      id: genId(),
      name: item.name,
      elementType: item.elementType,
      width: item.width,
      height: item.height,
      xPosition: 20 + Math.random() * 40,
      yPosition: 20 + Math.random() * 40,
      rotationAngle: 0,
      color: item.color ?? ELEMENT_COLORS[item.elementType],
      status: item.defaultStatus,
      height3d: item.height3d ?? ELEMENT_3D_HEIGHT[item.elementType],
      shape: "rectangle",
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedIds(new Set([newEl.id]));
    toast.success(`Added ${item.name} to yard`);
  }, []);

  const handleDropElement = useCallback(
    (item: LibraryItem, x: number, y: number) => {
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
      };
      setElements((prev) => [...prev, newEl]);
      setSelectedIds(new Set([newEl.id]));
    },
    [],
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
      setElements((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...changes } : e)),
      );
    },
    [],
  );

  const handleDeleteElement = useCallback((id: bigint) => {
    setElements((prev) => prev.filter((e) => e.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    toast.success("Element removed");
  }, []);

  const handleDeleteSelected = useCallback(() => {
    setElements((prev) => prev.filter((e) => !selectedIds.has(e.id)));
    setSelectedIds(new Set());
    toast.success("Selected elements deleted");
  }, [selectedIds]);

  const handleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allIds = new Set(elements.map((e) => e.id));
      // If all already selected, deselect all
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

  // Bring the element to the top of the render stack (last in array = drawn on top)
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

  // Send the element to the bottom of the render stack (first in array = drawn behind)
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
    setElements([]);
    setSelectedIds(new Set());
    toast.info("Yard cleared");
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

  // Keyboard shortcuts: Ctrl+A, Ctrl+C, Ctrl+V, Delete/Backspace
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

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
        const newEls: YardElement[] = srcs.map((src) => ({
          ...src,
          id: genId(),
          xPosition: src.xPosition + 5,
          yPosition: src.yPosition + 5,
        }));
        setElements((prev) => [...prev, ...newEls]);
        setSelectedIds(new Set(newEls.map((el) => el.id)));
        toast.success(
          newEls.length === 1
            ? `Pasted ${srcs[0].name}`
            : `Pasted ${newEls.length} elements`,
        );
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.size > 0) {
          e.preventDefault();
          setElements((prev) => prev.filter((el) => !selectedIds.has(el.id)));
          setSelectedIds(new Set());
          toast.success(
            selectedIds.size === 1
              ? "Element deleted"
              : `${selectedIds.size} elements deleted`,
          );
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedIds]);

  // The single selectedId for Canvas3D compatibility (first selected)
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
          Casting Yard Layout Planner
        </h1>
        <div className="flex items-center gap-3 text-xs text-white/50">
          <span>{elements.length} elements</span>
          {selectedIds.size > 0 && (
            <span className="text-blue-300">{selectedIds.size} selected</span>
          )}
          <span>·</span>
          <span>
            {yardSize}m × {yardSize}m yard
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
        yardSize={yardSize}
        onYardSizeChange={setYardSize}
        onSelectAll={handleSelectAll}
        selectedCount={selectedIds.size}
        totalCount={elements.length}
      />

      {/* Main 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar onAddElement={handleAddElement} />

        {viewMode === "2d" ? (
          <Canvas2D
            elements={elements}
            selectedIds={selectedIds}
            activeTool={activeTool}
            scale={scale}
            yardSize={yardSize}
            onSelectElement={setSelectedIds}
            onMoveElement={handleMoveElement}
            onMoveElements={handleMoveElements}
            onRotateElement={handleRotateElement}
            onDropElement={handleDropElement}
          />
        ) : (
          <Canvas3D
            elements={elements}
            selectedId={firstSelectedId}
            yardSize={yardSize}
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
