import { useCallback, useEffect, useRef, useState } from "react";
import type {
  LibraryItem,
  ScaleOption,
  ShapeType,
  TextLabel,
  ToolMode,
  YardElement,
} from "../types/yard";

interface Canvas2DProps {
  elements: YardElement[];
  selectedIds: Set<bigint>;
  activeTool: ToolMode;
  scale: ScaleOption;
  yardLength: number;
  yardWidth: number;
  onSelectElement: (ids: Set<bigint>) => void;
  onMoveElement: (id: bigint, x: number, y: number) => void;
  onMoveElements: (moves: { id: bigint; x: number; y: number }[]) => void;
  onRotateElement: (id: bigint, angle: number) => void;
  onDropElement: (item: LibraryItem, x: number, y: number) => void;
  textLabels: TextLabel[];
  onAddTextLabel: (label: TextLabel) => void;
  onUpdateTextLabel: (id: bigint, changes: Partial<TextLabel>) => void;
  onDeleteTextLabel: (id: bigint) => void;
  onMoveStart: () => void;
}

const SCALE_PX_PER_M: Record<ScaleOption, number> = {
  "1:100": 8,
  "1:200": 4,
  "1:500": 1.6,
};

const GRID_STEP = 10; // meters
const SNAP_THRESHOLD = 3; // meters

const BATCHING_PLANT_AREAS = [
  { label: "QA/QC LAB", color: "#e8f5e9" },
  { label: "RMC STORE", color: "#e3f2fd" },
  { label: "RMC GARAGE", color: "#fff3e0" },
  { label: "AGGREGATES 10MM", color: "#fce4ec" },
  { label: "AGGREGATES 20MM", color: "#f3e5f5" },
  { label: "CRUSHED SAND", color: "#fffde7" },
  { label: "SEDIMENTATION TANK-3", color: "#e1f5fe" },
  { label: "SEDIMENTATION TANK-2", color: "#e0f7fa" },
  { label: "SEDIMENTATION TANK-1", color: "#e0f2f1" },
];

const HANDLE_POSITIONS = ["tl", "tr", "bl", "br"] as const;

let textLabelCounter = BigInt(10000);
function genTextId(): bigint {
  textLabelCounter += BigInt(1);
  return textLabelCounter;
}

function ElementShape({
  shape,
  ex,
  ey,
  ew,
  eh,
  color,
  isSelected,
  pxPerM,
}: {
  shape: ShapeType;
  ex: number;
  ey: number;
  ew: number;
  eh: number;
  color: string;
  isSelected: boolean;
  pxPerM: number;
}) {
  const stroke = isSelected ? "#1E7ACB" : "none";
  const strokeWidth = isSelected ? 2 : 0;
  const commonProps = { fill: color, stroke, strokeWidth, opacity: 0.9 };

  switch (shape) {
    case "circle":
      return (
        <ellipse
          cx={ex + ew / 2}
          cy={ey + eh / 2}
          rx={ew / 2}
          ry={eh / 2}
          {...commonProps}
        />
      );
    case "l-shape": {
      const halfH = eh / 2;
      const halfW = ew / 2;
      return (
        <>
          <rect
            x={ex}
            y={ey + halfH}
            width={ew}
            height={halfH}
            {...commonProps}
          />
          <rect x={ex} y={ey} width={halfW} height={halfH} {...commonProps} />
        </>
      );
    }
    case "t-shape": {
      const barH = eh * 0.35;
      const stemW = ew * 0.4;
      const stemH = eh - barH;
      return (
        <>
          <rect x={ex} y={ey} width={ew} height={barH} {...commonProps} />
          <rect
            x={ex + (ew - stemW) / 2}
            y={ey + barH}
            width={stemW}
            height={stemH}
            {...commonProps}
          />
        </>
      );
    }
    case "i-shape": {
      const flangeH = eh * 0.25;
      const webH = eh - flangeH * 2;
      const flangeW = ew;
      const webW = ew * 0.35;
      return (
        <>
          <rect
            x={ex}
            y={ey}
            width={flangeW}
            height={flangeH}
            {...commonProps}
          />
          <rect
            x={ex + (ew - webW) / 2}
            y={ey + flangeH}
            width={webW}
            height={webH}
            {...commonProps}
          />
          <rect
            x={ex}
            y={ey + flangeH + webH}
            width={flangeW}
            height={flangeH}
            {...commonProps}
          />
        </>
      );
    }
    case "open": {
      // Open shape: cover block + top bar + bottom bar, open on left and right
      // 0.5m thickness in pixels
      const wallH = Math.max(0.5 * pxPerM, 2);
      return (
        <>
          {/* Cover block (NEW) - sits on top of the element */}
          <rect x={ex} y={ey} width={ew} height={wallH} {...commonProps} />
          {/* Top horizontal bar (shifted down by wallH) */}
          <rect
            x={ex}
            y={ey + wallH}
            width={ew}
            height={wallH}
            {...commonProps}
          />
          {/* Bottom horizontal bar (full width) */}
          <rect
            x={ex}
            y={ey + eh - wallH}
            width={ew}
            height={wallH}
            {...commonProps}
          />
        </>
      );
    }
    default:
      return <rect x={ex} y={ey} width={ew} height={eh} {...commonProps} />;
  }
}

export function Canvas2D({
  elements,
  selectedIds,
  activeTool,
  scale,
  yardLength,
  yardWidth,
  onSelectElement,
  onMoveElement,
  onMoveElements,
  onRotateElement,
  onDropElement,
  textLabels,
  onAddTextLabel,
  onUpdateTextLabel,
  onDeleteTextLabel,
  onMoveStart,
}: Canvas2DProps) {
  const pxPerM = SCALE_PX_PER_M[scale];
  const yardLengthPx = yardLength * pxPerM;
  const yardWidthPx = yardWidth * pxPerM;
  const MARGIN = 32;

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;

  // Zoom & pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const panRef = useRef(pan);
  panRef.current = pan;
  const panDrag = useRef<{
    startX: number;
    startY: number;
    origPan: { x: number; y: number };
  } | null>(null);

  // Snap highlight state
  const [snapTargetId, setSnapTargetId] = useState<bigint | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setZoom((prev) => {
        const newZoom = Math.max(0.2, Math.min(8, prev * factor));
        const ratio = newZoom / prev;
        setPan((p) => ({
          x: mx - ratio * (mx - p.x),
          y: my - ratio * (my - p.y),
        }));
        return newZoom;
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const [editingText, setEditingText] = useState<{
    id: bigint | null;
    x: number;
    y: number;
    xM: number;
    yM: number;
    value: string;
  } | null>(null);

  const [drag, setDrag] = useState<{
    id: bigint;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origPositions: Map<bigint, { x: number; y: number }>;
  } | null>(null);

  const [rotateDrag, setRotateDrag] = useState<{
    id: bigint;
    cx: number;
    cy: number;
    startAngle: number;
    origAngle: number;
  } | null>(null);

  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    shift: boolean;
  } | null>(null);

  const [isDragOver, setIsDragOver] = useState(false);

  // getSVGPoint: inverse-transform using pan and zoom
  const getSVGPoint = useCallback(
    (e: React.MouseEvent | MouseEvent): { x: number; y: number } => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left - panRef.current.x) / zoomRef.current,
        y: (e.clientY - rect.top - panRef.current.y) / zoomRef.current,
      };
    },
    [],
  );

  const svgToMeters = useCallback(
    (svgX: number, svgY: number) => ({
      x: (svgX - MARGIN) / pxPerM,
      y: (svgY - MARGIN) / pxPerM,
    }),
    [pxPerM],
  );

  const commitTextEdit = useCallback(
    (value: string) => {
      if (!editingText) return;
      const trimmed = value.trim();
      if (editingText.id === null) {
        if (trimmed) {
          onAddTextLabel({
            id: genTextId(),
            text: trimmed,
            x: editingText.xM,
            y: editingText.yM,
            fontSize: 14,
          });
        }
      } else {
        if (trimmed) {
          onUpdateTextLabel(editingText.id, { text: trimmed });
        } else {
          onDeleteTextLabel(editingText.id);
        }
      }
      setEditingText(null);
    },
    [editingText, onAddTextLabel, onUpdateTextLabel, onDeleteTextLabel],
  );

  const handleMouseDown = (e: React.MouseEvent, el: YardElement) => {
    e.stopPropagation();

    if (activeTool === "text") {
      return;
    }

    if (e.shiftKey) {
      const next = new Set(selectedIds);
      if (next.has(el.id)) {
        next.delete(el.id);
      } else {
        next.add(el.id);
      }
      onSelectElement(next);
      if (activeTool === "select" || activeTool === "move") {
        onMoveStart();
        const pt = getSVGPoint(e);
        const origPositions = new Map(
          elements
            .filter((elem) => next.has(elem.id))
            .map((elem) => [elem.id, { x: elem.xPosition, y: elem.yPosition }]),
        );
        setDrag({
          id: el.id,
          startX: pt.x,
          startY: pt.y,
          origX: el.xPosition,
          origY: el.yPosition,
          origPositions,
        });
      }
      return;
    }

    if (!selectedIds.has(el.id)) {
      onSelectElement(new Set([el.id]));
    }

    if (activeTool === "select" || activeTool === "move") {
      onMoveStart();
      const pt = getSVGPoint(e);
      const activeIds = selectedIds.has(el.id) ? selectedIds : new Set([el.id]);
      const origPositions = new Map(
        elements
          .filter((elem) => activeIds.has(elem.id))
          .map((elem) => [elem.id, { x: elem.xPosition, y: elem.yPosition }]),
      );
      setDrag({
        id: el.id,
        startX: pt.x,
        startY: pt.y,
        origX: el.xPosition,
        origY: el.yPosition,
        origPositions,
      });
    } else if (activeTool === "rotate") {
      const pt = getSVGPoint(e);
      const ex = el.xPosition * pxPerM + MARGIN;
      const ey = el.yPosition * pxPerM + MARGIN;
      const ew = el.width * pxPerM;
      const eh = el.height * pxPerM;
      const cx = ex + ew / 2;
      const cy = ey + eh / 2;
      const startAngle = Math.atan2(pt.y - cy, pt.x - cx) * (180 / Math.PI);
      setRotateDrag({
        id: el.id,
        cx,
        cy,
        startAngle,
        origAngle: el.rotationAngle,
      });
    }
  };

  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    if (
      e.target !== svgRef.current &&
      !(e.target as Element).classList.contains("canvas-bg")
    ) {
      return;
    }

    if (activeTool === "text") {
      if (editingText) {
        return;
      }
      const pt = getSVGPoint(e);
      const meters = svgToMeters(pt.x, pt.y);
      setEditingText({
        id: null,
        x: pt.x,
        y: pt.y,
        xM: meters.x,
        yM: meters.y,
        value: "",
      });
      return;
    }

    if (activeTool !== "select" && activeTool !== "move") {
      onSelectElement(new Set());
      return;
    }
    const pt = getSVGPoint(e);
    setMarquee({
      startX: pt.x,
      startY: pt.y,
      currentX: pt.x,
      currentY: pt.y,
      shift: e.shiftKey,
    });
    if (!e.shiftKey) {
      onSelectElement(new Set());
    }
  };

  const handleContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1 || e.button === 2) {
      e.preventDefault();
      panDrag.current = {
        startX: e.clientX,
        startY: e.clientY,
        origPan: panRef.current,
      };
    }
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (panDrag.current) {
        const dx = e.clientX - panDrag.current.startX;
        const dy = e.clientY - panDrag.current.startY;
        setPan({
          x: panDrag.current.origPan.x + dx,
          y: panDrag.current.origPan.y + dy,
        });
      }

      if (drag) {
        const pt = getSVGPoint(e);
        const dx = (pt.x - drag.startX) / pxPerM;
        const dy = (pt.y - drag.startY) / pxPerM;

        if (drag.origPositions.size > 1) {
          const moves: { id: bigint; x: number; y: number }[] = [];
          for (const [id, orig] of drag.origPositions) {
            moves.push({
              id,
              x: Math.max(0, orig.x + dx),
              y: Math.max(0, orig.y + dy),
            });
          }
          onMoveElements(moves);
        } else {
          // Single element drag — apply snap-to-similar logic
          const draggedEl = elements.find((el) => el.id === drag.id);
          let newX = Math.max(0, drag.origX + dx);
          let newY = Math.max(0, drag.origY + dy);
          let snapId: bigint | null = null;

          if (draggedEl) {
            const dL = newX; // dragged left edge
            const dR = newX + draggedEl.width; // dragged right edge
            const dT = newY; // dragged top edge
            const dB = newY + draggedEl.height; // dragged bottom edge

            let bestXDist = SNAP_THRESHOLD;
            let snapX: number | null = null;
            let bestYDist = SNAP_THRESHOLD;
            let snapY: number | null = null;
            let candidateSnapId: bigint | null = null;

            for (const other of elements) {
              if (other.id === drag.id) continue;
              if (other.name !== draggedEl.name) continue;

              const oL = other.xPosition;
              const oR = other.xPosition + other.width;
              const oT = other.yPosition;
              const oB = other.yPosition + other.height;

              // X-axis snaps
              const xCandidates: [number, number][] = [
                [Math.abs(dL - oR), oR], // left edge → other's right
                [Math.abs(dR - oL), oL - draggedEl.width], // right edge → other's left
                [Math.abs(dL - oL), oL], // align left edges
                [Math.abs(dR - oR), oR - draggedEl.width], // align right edges
              ];
              for (const [dist, snapVal] of xCandidates) {
                if (dist < bestXDist) {
                  bestXDist = dist;
                  snapX = snapVal;
                  candidateSnapId = other.id;
                }
              }

              // Y-axis snaps
              const yCandidates: [number, number][] = [
                [Math.abs(dT - oB), oB], // top edge → other's bottom
                [Math.abs(dB - oT), oT - draggedEl.height], // bottom edge → other's top
                [Math.abs(dT - oT), oT], // align top edges
                [Math.abs(dB - oB), oB - draggedEl.height], // align bottom edges
              ];
              for (const [dist, snapVal] of yCandidates) {
                if (dist < bestYDist) {
                  bestYDist = dist;
                  snapY = snapVal;
                  if (candidateSnapId === null) candidateSnapId = other.id;
                }
              }
            }

            if (snapX !== null) {
              newX = Math.max(0, snapX);
              snapId = candidateSnapId;
            }
            if (snapY !== null) {
              newY = Math.max(0, snapY);
              snapId = candidateSnapId;
            }
          }

          setSnapTargetId(snapId);
          onMoveElement(drag.id, newX, newY);
        }
      } else if (rotateDrag) {
        const pt = getSVGPoint(e);
        const currentAngle =
          Math.atan2(pt.y - rotateDrag.cy, pt.x - rotateDrag.cx) *
          (180 / Math.PI);
        const delta = currentAngle - rotateDrag.startAngle;
        onRotateElement(
          rotateDrag.id,
          (rotateDrag.origAngle + delta + 360) % 360,
        );
      } else if (marquee) {
        const pt = getSVGPoint(e);
        setMarquee((prev) =>
          prev ? { ...prev, currentX: pt.x, currentY: pt.y } : null,
        );
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 1 || e.button === 2) {
        panDrag.current = null;
      }

      setSnapTargetId(null);

      if (marquee) {
        const mx = Math.min(marquee.startX, marquee.currentX);
        const my = Math.min(marquee.startY, marquee.currentY);
        const mw = Math.abs(marquee.currentX - marquee.startX);
        const mh = Math.abs(marquee.currentY - marquee.startY);

        if (mw > 4 || mh > 4) {
          const intersected = elements.filter((el) => {
            const ex = el.xPosition * pxPerM + MARGIN;
            const ey = el.yPosition * pxPerM + MARGIN;
            const ew = el.width * pxPerM;
            const eh = el.height * pxPerM;
            return ex < mx + mw && ex + ew > mx && ey < my + mh && ey + eh > my;
          });

          const newIds = new Set(intersected.map((el) => el.id));

          if (marquee.shift) {
            const merged = new Set(selectedIdsRef.current);
            for (const id of newIds) merged.add(id);
            onSelectElement(merged);
          } else {
            onSelectElement(newIds);
          }
        }
        setMarquee(null);
      }
      setDrag(null);
      setRotateDrag(null);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [
    drag,
    rotateDrag,
    marquee,
    getSVGPoint,
    pxPerM,
    onMoveElement,
    onMoveElements,
    onRotateElement,
    onSelectElement,
    elements,
  ]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const raw = e.dataTransfer.getData("application/yard-element");
    if (!raw) return;
    try {
      const item: LibraryItem = JSON.parse(raw);
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const svgX = (e.clientX - rect.left - panRef.current.x) / zoomRef.current;
      const svgY = (e.clientY - rect.top - panRef.current.y) / zoomRef.current;
      const { x, y } = svgToMeters(svgX, svgY);
      onDropElement(item, Math.max(0, x), Math.max(0, y));
    } catch {
      // ignore
    }
  };

  // Generate grid lines (separate loops for X and Y axes)
  const gridLines: React.ReactNode[] = [];
  for (let m = 0; m <= yardLength; m += GRID_STEP) {
    const px = m * pxPerM + MARGIN;
    gridLines.push(
      <line
        key={`v${m}`}
        x1={px}
        y1={MARGIN}
        x2={px}
        y2={yardWidthPx + MARGIN}
        stroke="#e2e8f0"
        strokeWidth="0.5"
      />,
    );
  }
  for (let m = 0; m <= yardWidth; m += GRID_STEP) {
    const py = m * pxPerM + MARGIN;
    gridLines.push(
      <line
        key={`h${m}`}
        x1={MARGIN}
        y1={py}
        x2={yardLengthPx + MARGIN}
        y2={py}
        stroke="#e2e8f0"
        strokeWidth="0.5"
      />,
    );
  }

  // Scale markers
  const scaleMarkers: React.ReactNode[] = [];
  for (let m = 0; m <= yardLength; m += GRID_STEP * 2) {
    const px = m * pxPerM + MARGIN;
    scaleMarkers.push(
      <text
        key={`xm${m}`}
        x={px}
        y={MARGIN - 4}
        textAnchor="middle"
        fontSize={9}
        fill="#94a3b8"
      >
        {m}m
      </text>,
    );
  }
  for (let m = 0; m <= yardWidth; m += GRID_STEP * 2) {
    const py = m * pxPerM + MARGIN;
    scaleMarkers.push(
      <text
        key={`ym${m}`}
        x={MARGIN - 4}
        y={py + 3}
        textAnchor="end"
        fontSize={9}
        fill="#94a3b8"
      >
        {m}m
      </text>,
    );
  }

  const marqueeRect = marquee
    ? {
        x: Math.min(marquee.startX, marquee.currentX),
        y: Math.min(marquee.startY, marquee.currentY),
        w: Math.abs(marquee.currentX - marquee.startX),
        h: Math.abs(marquee.currentY - marquee.startY),
      }
    : null;

  const cursorClass =
    activeTool === "text"
      ? "cursor-text"
      : activeTool === "move" || drag
        ? "cursor-move"
        : activeTool === "rotate"
          ? "cursor-crosshair"
          : "";

  return (
    <div
      ref={containerRef}
      className={`flex-1 overflow-hidden bg-[oklch(0.98_0.004_240)] ${
        isDragOver ? "ring-2 ring-inset ring-blue-400" : ""
      }`}
      onMouseDown={handleContainerMouseDown}
      onContextMenu={(e) => e.preventDefault()}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      data-ocid="canvas.canvas_target"
      data-printable="true"
      style={{ width: "100%", height: "100%" }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        role="img"
        aria-label="Yard layout canvas"
        onMouseDown={handleBackgroundMouseDown}
        className={`no-select ${cursorClass} ${marquee ? "select-none" : ""}`}
        textRendering="geometricPrecision"
      >
        <title>Yard layout canvas</title>
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* White yard background */}
          <rect
            className="canvas-bg"
            x={MARGIN}
            y={MARGIN}
            width={yardLengthPx}
            height={yardWidthPx}
            fill="white"
            stroke="#94a3b8"
            strokeWidth={1}
          />

          {gridLines}
          {scaleMarkers}

          {/* Elements */}
          {elements.map((el) => {
            const ex = el.xPosition * pxPerM + MARGIN;
            const ey = el.yPosition * pxPerM + MARGIN;
            const ew = el.width * pxPerM;
            const eh = el.height * pxPerM;
            const isSelected = selectedIds.has(el.id);
            const isSnapTarget = snapTargetId === el.id;
            const cx = ex + ew / 2;
            const cy = ey + eh / 2;

            const handlePositions: Record<string, [number, number]> = {
              tl: [ex, ey],
              tr: [ex + ew, ey],
              bl: [ex, ey + eh],
              br: [ex + ew, ey + eh],
            };

            return (
              <g
                key={String(el.id)}
                transform={`rotate(${el.rotationAngle}, ${cx}, ${cy})`}
                onMouseDown={(e) => handleMouseDown(e, el)}
                style={{
                  cursor:
                    activeTool === "rotate"
                      ? "crosshair"
                      : activeTool === "text"
                        ? "text"
                        : "pointer",
                }}
              >
                {el.name === "Batching-Plant" ? (
                  <>
                    {BATCHING_PLANT_AREAS.map((area, areaIdx) => {
                      const areaW = ew / BATCHING_PLANT_AREAS.length;
                      const areaX = ex + areaIdx * areaW;
                      const lines = area.label.split(" ");
                      const fontSize = Math.min(9, Math.max(5, areaW * 0.55));
                      return (
                        <g key={area.label} style={{ pointerEvents: "none" }}>
                          <rect
                            x={areaX}
                            y={ey}
                            width={areaW}
                            height={eh}
                            fill={area.color}
                            stroke="#94a3b8"
                            strokeWidth={0.5}
                          />
                          <text
                            transform={`translate(${areaX + areaW / 2}, ${ey + eh / 2}) rotate(-90)`}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={fontSize}
                            fontFamily="sans-serif"
                            fontWeight="600"
                            fill="#374151"
                          >
                            {lines.map((line, li) => (
                              <tspan
                                key={`${area.label}-${li}`}
                                x={0}
                                dy={
                                  li === 0
                                    ? -(lines.length - 1) * fontSize * 0.6
                                    : fontSize * 1.2
                                }
                              >
                                {line}
                              </tspan>
                            ))}
                          </text>
                        </g>
                      );
                    })}
                    {/* Outer border */}
                    <rect
                      x={ex}
                      y={ey}
                      width={ew}
                      height={eh}
                      fill="none"
                      stroke={isSelected ? "#1E7ACB" : "#374151"}
                      strokeWidth={isSelected ? 2 : 1}
                      strokeDasharray={isSelected ? "4 2" : undefined}
                    />
                    {/* "BATCHING PLANT" title above the group */}
                    <text
                      x={cx}
                      y={ey - 4}
                      textAnchor="middle"
                      fontSize={Math.min(9, Math.max(6, ew / 20))}
                      fontWeight="700"
                      fontFamily="sans-serif"
                      fill="#374151"
                      style={{ pointerEvents: "none" }}
                    >
                      BATCHING PLANT
                    </text>
                  </>
                ) : el.imageUrl &&
                  (el.name === "Reinforcement-Cage" ||
                    el.name === "Factory-Shed" ||
                    el.name === "Road") ? (
                  <>
                    <defs>
                      <pattern
                        id={`tile-pattern-${el.id}`}
                        patternUnits="userSpaceOnUse"
                        x={ex}
                        y={ey}
                        width={eh}
                        height={eh}
                      >
                        <image
                          href={el.imageUrl}
                          x={0}
                          y={0}
                          width={eh}
                          height={eh}
                          preserveAspectRatio="xMidYMid slice"
                        />
                      </pattern>
                    </defs>
                    <rect
                      x={ex}
                      y={ey}
                      width={ew}
                      height={eh}
                      fill={`url(#tile-pattern-${el.id})`}
                      style={{ pointerEvents: "none" }}
                    />
                    {isSelected && (
                      <rect
                        x={ex}
                        y={ey}
                        width={ew}
                        height={eh}
                        fill="none"
                        stroke="#1E7ACB"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                      />
                    )}
                  </>
                ) : el.imageUrl && el.name === "Road-Vertical" ? (
                  <>
                    <defs>
                      <pattern
                        id={`tile-pattern-v-${el.id}`}
                        patternUnits="userSpaceOnUse"
                        x={ex}
                        y={ey}
                        width={ew}
                        height={ew}
                      >
                        <image
                          href={el.imageUrl}
                          x={0}
                          y={0}
                          width={ew}
                          height={ew}
                          transform={`rotate(90, ${ew / 2}, ${ew / 2})`}
                          preserveAspectRatio="xMidYMid slice"
                        />
                      </pattern>
                    </defs>
                    <rect
                      x={ex}
                      y={ey}
                      width={ew}
                      height={eh}
                      fill={`url(#tile-pattern-v-${el.id})`}
                      style={{ pointerEvents: "none" }}
                    />
                    {isSelected && (
                      <rect
                        x={ex}
                        y={ey}
                        width={ew}
                        height={eh}
                        fill="none"
                        stroke="#1E7ACB"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                      />
                    )}
                  </>
                ) : el.imageUrl ? (
                  <>
                    <image
                      href={el.imageUrl}
                      x={ex}
                      y={ey}
                      width={ew}
                      height={eh}
                      preserveAspectRatio="none"
                      style={{ pointerEvents: "none" }}
                    />
                    {isSelected && (
                      <rect
                        x={ex}
                        y={ey}
                        width={ew}
                        height={eh}
                        fill="none"
                        stroke="#1E7ACB"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                      />
                    )}
                  </>
                ) : el.name === "Box-I-Girder-Formwork" ? (
                  <>
                    <rect
                      x={ex}
                      y={ey}
                      width={ew}
                      height={eh}
                      fill="#FF6600"
                      opacity={0.9}
                      stroke="none"
                    />
                    {/* Inner black top border line */}
                    <line
                      x1={ex}
                      y1={ey + 2}
                      x2={ex + ew}
                      y2={ey + 2}
                      stroke="black"
                      strokeWidth={2}
                      style={{ pointerEvents: "none" }}
                    />
                    {/* Inner black bottom border line */}
                    <line
                      x1={ex}
                      y1={ey + eh - 2}
                      x2={ex + ew}
                      y2={ey + eh - 2}
                      stroke="black"
                      strokeWidth={2}
                      style={{ pointerEvents: "none" }}
                    />
                    {isSelected && (
                      <rect
                        x={ex}
                        y={ey}
                        width={ew}
                        height={eh}
                        fill="none"
                        stroke="#1E7ACB"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                      />
                    )}
                  </>
                ) : (
                  <ElementShape
                    shape={el.shape}
                    ex={ex}
                    ey={ey}
                    ew={ew}
                    eh={eh}
                    color={el.color}
                    isSelected={isSelected}
                    pxPerM={pxPerM}
                  />
                )}
                {/* Label rendering: Bay, I-Girder, Reinforcement-Cage, others */}
                {(() => {
                  if (el.name === "Batching-Plant") return null;

                  if (el.name === "Bay") {
                    // Compute 1-based index by sorting bays by yPosition
                    const bays = elements
                      .filter((e) => e.name === "Bay")
                      .sort((a, b) => a.yPosition - b.yPosition);
                    const bayIndex = bays.findIndex((b) => b.id === el.id) + 1;
                    const radius = Math.max(
                      10,
                      Math.min(Math.min(ew, eh) * 0.15, 18),
                    );
                    const fontSize = radius * 0.9;
                    return (
                      <g style={{ pointerEvents: "none" }}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={radius}
                          fill="white"
                          opacity={0.9}
                        />
                        <text
                          x={cx}
                          y={cy + fontSize * 0.35}
                          textAnchor="middle"
                          fontSize={fontSize}
                          fontWeight="700"
                          fontFamily="sans-serif"
                          fill="#1a6b2a"
                          style={{ pointerEvents: "none" }}
                        >
                          {`B${bayIndex}`}
                        </text>
                      </g>
                    );
                  }

                  if (
                    el.name === "I-Girder" ||
                    el.name === "Reinforcement-Cage"
                  ) {
                    // Info panels rendered in a separate top-layer pass below
                    return null;
                  }

                  // Default: show last word of element name
                  return (
                    <text
                      x={cx}
                      y={cy + 3.5}
                      textAnchor="middle"
                      fontSize={Math.min(10, Math.max(7, ew / 4))}
                      fontWeight="700"
                      fill="rgba(0,0,0,0.75)"
                      style={{ pointerEvents: "none" }}
                    >
                      {el.name.split(" ").slice(-1)[0]}
                    </text>
                  );
                })()}
                {/* Snap highlight */}
                {isSnapTarget && (
                  <rect
                    x={ex - 2}
                    y={ey - 2}
                    width={ew + 4}
                    height={eh + 4}
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    style={{ pointerEvents: "none" }}
                  />
                )}
                {isSelected && (
                  <>
                    {HANDLE_POSITIONS.map((pos) => {
                      const [hx, hy] = handlePositions[pos];
                      return (
                        <rect
                          key={pos}
                          x={hx - 3}
                          y={hy - 3}
                          width={6}
                          height={6}
                          fill="white"
                          stroke="#1E7ACB"
                          strokeWidth={1.5}
                          style={{ pointerEvents: "none" }}
                        />
                      );
                    })}
                    {selectedIds.size === 1 && (
                      <>
                        <circle
                          cx={cx}
                          cy={ey - 10}
                          r={4}
                          fill="#1E7ACB"
                          stroke="white"
                          strokeWidth={1.5}
                          style={{ cursor: "crosshair" }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            const pt = getSVGPoint(e);
                            const angle =
                              Math.atan2(pt.y - cy, pt.x - cx) *
                              (180 / Math.PI);
                            setRotateDrag({
                              id: el.id,
                              cx,
                              cy,
                              startAngle: angle,
                              origAngle: el.rotationAngle,
                            });
                          }}
                        />
                        <line
                          x1={cx}
                          y1={ey}
                          x2={cx}
                          y2={ey - 10}
                          stroke="#1E7ACB"
                          strokeWidth={1}
                          strokeDasharray="2,2"
                          style={{ pointerEvents: "none" }}
                        />
                      </>
                    )}
                  </>
                )}
              </g>
            );
          })}

          {/* I-Girder / R-Cage Info Panels - rendered on top layer */}
          {(() => {
            const rendered = new Set<string>();
            const panels: React.ReactNode[] = [];

            for (const el of elements) {
              if (el.name !== "I-Girder" && el.name !== "Reinforcement-Cage")
                continue;

              const baysLocal = elements.filter((e) => e.name === "Bay");
              let parentBay: (typeof elements)[0] | null = null;
              for (const bay of baysLocal) {
                if (
                  el.xPosition >= bay.xPosition &&
                  el.xPosition < bay.xPosition + bay.width &&
                  el.yPosition >= bay.yPosition &&
                  el.yPosition < bay.yPosition + bay.height
                ) {
                  parentBay = bay;
                  break;
                }
              }
              if (!parentBay) continue;

              const groupKey = `${el.name}-${parentBay.id}`;
              if (rendered.has(groupKey)) continue;

              const siblings = elements
                .filter(
                  (e) =>
                    e.name === el.name &&
                    parentBay !== null &&
                    e.xPosition >= parentBay.xPosition &&
                    e.xPosition < parentBay.xPosition + parentBay.width &&
                    e.yPosition >= parentBay.yPosition &&
                    e.yPosition < parentBay.yPosition + parentBay.height,
                )
                .sort(
                  (a, b) =>
                    a.xPosition + a.yPosition - (b.xPosition + b.yPosition),
                );

              if (siblings.length === 0) continue;

              const first = siblings[0];
              const fex = first.xPosition * pxPerM + MARGIN;
              const fey = first.yPosition * pxPerM + MARGIN;
              const few = first.width * pxPerM;

              rendered.add(groupKey);

              const totalCount = siblings.length;
              let spacing = 0.5;
              if (siblings.length >= 2) {
                const gap =
                  siblings[1].yPosition -
                  siblings[0].yPosition -
                  siblings[0].height;
                spacing = Math.round(gap * 100) / 100;
              }

              const isGirder = el.name === "I-Girder";
              const line1 = isGirder
                ? `I-Girders: ${totalCount}`
                : `R-Cages: ${totalCount}`;
              const line2 = `Spacing: ${spacing}m`;
              const line3 = `L: ${first.width}m  H: ${first.height3d}m  W: ${first.height}m`;

              const panelW = Math.min(few * 0.95, 80);
              const panelH = 30;
              const fontSize = 6;
              const panelY = fey - panelH - 4;

              panels.push(
                <g key={groupKey} style={{ pointerEvents: "none" }}>
                  <rect
                    x={fex + 2}
                    y={panelY}
                    width={panelW}
                    height={panelH}
                    fill="rgba(255,255,255,0.92)"
                    stroke="#94a3b8"
                    strokeWidth={0.5}
                  />
                  <text
                    x={fex + 5}
                    y={panelY + fontSize + 2}
                    fontSize={fontSize}
                    fontFamily="sans-serif"
                    fill="#1a1a2e"
                  >
                    {line1}
                  </text>
                  <text
                    x={fex + 5}
                    y={panelY + (fontSize + 2) * 2 + 2}
                    fontSize={fontSize}
                    fontFamily="sans-serif"
                    fill="#1a1a2e"
                  >
                    {line2}
                  </text>
                  <text
                    x={fex + 5}
                    y={panelY + (fontSize + 2) * 3 + 2}
                    fontSize={fontSize}
                    fontFamily="sans-serif"
                    fill="#1a1a2e"
                  >
                    {line3}
                  </text>
                </g>,
              );
            }

            return panels;
          })()}

          {/* Text Labels */}
          {textLabels.map((label) => {
            const px = label.x * pxPerM + MARGIN;
            const py = label.y * pxPerM + MARGIN;
            const isEditing = editingText?.id === label.id;

            if (isEditing) {
              return (
                <foreignObject
                  key={String(label.id)}
                  x={px}
                  y={py - label.fontSize - 2}
                  width={220}
                  height={label.fontSize + 12}
                >
                  <input
                    // biome-ignore lint/a11y/noAutofocus: intentional for inline text editing
                    autoFocus
                    value={editingText?.value ?? ""}
                    onChange={(e) =>
                      setEditingText((prev) =>
                        prev ? { ...prev, value: e.target.value } : null,
                      )
                    }
                    onBlur={(e) => commitTextEdit(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        commitTextEdit(e.currentTarget.value);
                      if (e.key === "Escape") setEditingText(null);
                      e.stopPropagation();
                    }}
                    style={{
                      fontSize: `${label.fontSize}px`,
                      fontFamily: "sans-serif",
                      border: "1px solid #1E7ACB",
                      borderRadius: 3,
                      padding: "1px 4px",
                      outline: "none",
                      background: "rgba(255,255,255,0.95)",
                      color: "#1a1a2e",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  />
                </foreignObject>
              );
            }

            return (
              <text
                key={String(label.id)}
                x={px}
                y={py}
                fontSize={label.fontSize}
                fontFamily="sans-serif"
                fill="#1a1a2e"
                style={{
                  pointerEvents: "all",
                  cursor: activeTool === "text" ? "text" : "default",
                  userSelect: "none",
                }}
                onClick={(e) => {
                  if (activeTool === "text") {
                    e.stopPropagation();
                    setEditingText({
                      id: label.id,
                      x: px,
                      y: py,
                      xM: label.x,
                      yM: label.y,
                      value: label.text,
                    });
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    (e.key === "Enter" || e.key === " ") &&
                    activeTool === "text"
                  ) {
                    e.stopPropagation();
                    setEditingText({
                      id: label.id,
                      x: px,
                      y: py,
                      xM: label.x,
                      yM: label.y,
                      value: label.text,
                    });
                  }
                }}
                tabIndex={activeTool === "text" ? 0 : -1}
              >
                {label.text}
              </text>
            );
          })}

          {/* New text input */}
          {editingText && editingText.id === null && (
            <foreignObject
              x={editingText.x}
              y={editingText.y - 18}
              width={220}
              height={28}
            >
              <input
                // biome-ignore lint/a11y/noAutofocus: intentional for inline text editing
                autoFocus
                value={editingText.value}
                onChange={(e) =>
                  setEditingText((prev) =>
                    prev ? { ...prev, value: e.target.value } : null,
                  )
                }
                onBlur={(e) => commitTextEdit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitTextEdit(e.currentTarget.value);
                  if (e.key === "Escape") setEditingText(null);
                  e.stopPropagation();
                }}
                placeholder="Type text..."
                style={{
                  fontSize: "14px",
                  fontFamily: "sans-serif",
                  border: "1px solid #1E7ACB",
                  borderRadius: 3,
                  padding: "1px 4px",
                  outline: "none",
                  background: "rgba(255,255,255,0.95)",
                  color: "#1a1a2e",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            </foreignObject>
          )}

          {/* Marquee */}
          {marqueeRect && marqueeRect.w > 2 && marqueeRect.h > 2 && (
            <rect
              x={marqueeRect.x}
              y={marqueeRect.y}
              width={marqueeRect.w}
              height={marqueeRect.h}
              fill="rgba(30,122,203,0.08)"
              stroke="#1E7ACB"
              strokeWidth={1.5}
              strokeDasharray="5,3"
              style={{ pointerEvents: "none" }}
            />
          )}

          {/* Yard Summary Legend */}
          {(() => {
            const iGirderCount = elements.filter(
              (el) =>
                el.name.toLowerCase().includes("i-girder") &&
                !el.name.toLowerCase().includes("formwork"),
            ).length;
            const rcCount = elements.filter(
              (el) => el.name === "Reinforcement-Cage",
            ).length;
            const formworkCount = elements.filter((el) =>
              el.name.toLowerCase().includes("formwork"),
            ).length;
            const bayCount = elements.filter(
              (el) => el.name.toLowerCase() === "bay",
            ).length;

            const legendW = 170;
            const legendH = 106;
            const spacingM = 10;
            const legendX = MARGIN + yardLengthPx - spacingM * pxPerM - legendW;
            const legendY = MARGIN + yardWidthPx - spacingM * pxPerM - legendH;

            return (
              <g style={{ pointerEvents: "none" }}>
                {/* Background */}
                <rect
                  x={legendX}
                  y={legendY}
                  width={legendW}
                  height={legendH}
                  fill="rgba(255,255,255,0.92)"
                  stroke="#94a3b8"
                  strokeWidth={1}
                />
                {/* Title */}
                <text
                  x={legendX + legendW / 2}
                  y={legendY + 20}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={700}
                  fontFamily="sans-serif"
                  fill="#1a1a2e"
                >
                  YARD SUMMARY
                </text>
                {/* Divider */}
                <line
                  x1={legendX + 8}
                  y1={legendY + 26}
                  x2={legendX + legendW - 8}
                  y2={legendY + 26}
                  stroke="#94a3b8"
                  strokeWidth={0.75}
                />
                {/* Row 1: I-Girders */}
                <rect
                  x={legendX + 10}
                  y={legendY + 32}
                  width={10}
                  height={8}
                  fill="#5FAE4E"
                />
                <text
                  x={legendX + 26}
                  y={legendY + 40}
                  fontSize={9}
                  fontFamily="sans-serif"
                  fill="#1a1a2e"
                >
                  I-Girders Placed:
                </text>
                <text
                  x={legendX + legendW - 10}
                  y={legendY + 40}
                  fontSize={9}
                  fontFamily="sans-serif"
                  fill="#1a1a2e"
                  textAnchor="end"
                >
                  {iGirderCount}
                </text>
                {/* Row 2: Formwork */}
                <rect
                  x={legendX + 10}
                  y={legendY + 48}
                  width={10}
                  height={8}
                  fill="#FF6600"
                />
                <text
                  x={legendX + 26}
                  y={legendY + 56}
                  fontSize={9}
                  fontFamily="sans-serif"
                  fill="#1a1a2e"
                >
                  Formwork Placed:
                </text>
                <text
                  x={legendX + legendW - 10}
                  y={legendY + 56}
                  fontSize={9}
                  fontFamily="sans-serif"
                  fill="#1a1a2e"
                  textAnchor="end"
                >
                  {formworkCount}
                </text>
                {/* Row 3: Bays */}
                <rect
                  x={legendX + 10}
                  y={legendY + 64}
                  width={10}
                  height={8}
                  fill="#2F7DE1"
                />
                <text
                  x={legendX + 26}
                  y={legendY + 72}
                  fontSize={9}
                  fontFamily="sans-serif"
                  fill="#1a1a2e"
                >
                  No. of Bays:
                </text>
                <text
                  x={legendX + legendW - 10}
                  y={legendY + 72}
                  fontSize={9}
                  fontFamily="sans-serif"
                  fill="#1a1a2e"
                  textAnchor="end"
                >
                  {bayCount}
                </text>
                {/* Row 4: Reinforcement-Cages */}
                <rect
                  x={legendX + 10}
                  y={legendY + 80}
                  width={10}
                  height={8}
                  fill="#7c9cbf"
                />
                <text
                  x={legendX + 26}
                  y={legendY + 88}
                  fontSize={9}
                  fontFamily="sans-serif"
                  fill="#1a1a2e"
                >
                  R-Cages Placed:
                </text>
                <text
                  x={legendX + legendW - 10}
                  y={legendY + 88}
                  fontSize={9}
                  fontFamily="sans-serif"
                  fill="#1a1a2e"
                  textAnchor="end"
                >
                  {rcCount}
                </text>
              </g>
            );
          })()}

          {/* Drag-over overlay */}
          {isDragOver && (
            <rect
              x={MARGIN}
              y={MARGIN}
              width={yardLengthPx}
              height={yardWidthPx}
              fill="rgba(30,122,203,0.06)"
              stroke="#1E7ACB"
              strokeWidth={2}
              strokeDasharray="6,4"
              style={{ pointerEvents: "none" }}
            />
          )}
        </g>
      </svg>
    </div>
  );
}
