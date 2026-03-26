import { useCallback, useEffect, useRef, useState } from "react";
import type {
  LibraryItem,
  ScaleOption,
  ShapeType,
  ToolMode,
  YardElement,
} from "../types/yard";

interface Canvas2DProps {
  elements: YardElement[];
  selectedIds: Set<bigint>;
  activeTool: ToolMode;
  scale: ScaleOption;
  yardSize: number;
  onSelectElement: (ids: Set<bigint>) => void;
  onMoveElement: (id: bigint, x: number, y: number) => void;
  onMoveElements: (moves: { id: bigint; x: number; y: number }[]) => void;
  onRotateElement: (id: bigint, angle: number) => void;
  onDropElement: (item: LibraryItem, x: number, y: number) => void;
}

const SCALE_PX_PER_M: Record<ScaleOption, number> = {
  "1:100": 8,
  "1:200": 4,
  "1:500": 1.6,
};

const GRID_STEP = 10; // meters

const HANDLE_POSITIONS = ["tl", "tr", "bl", "br"] as const;

function ElementShape({
  shape,
  ex,
  ey,
  ew,
  eh,
  color,
  isSelected,
}: {
  shape: ShapeType;
  ex: number;
  ey: number;
  ew: number;
  eh: number;
  color: string;
  isSelected: boolean;
}) {
  const stroke = isSelected ? "#1E7ACB" : "rgba(0,0,0,0.2)";
  const strokeWidth = isSelected ? 2 : 1;
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
            rx={2}
          />
          <rect
            x={ex}
            y={ey}
            width={halfW}
            height={halfH}
            {...commonProps}
            rx={2}
          />
        </>
      );
    }
    case "t-shape": {
      const barH = eh * 0.35;
      const stemW = ew * 0.4;
      const stemH = eh - barH;
      return (
        <>
          <rect
            x={ex}
            y={ey}
            width={ew}
            height={barH}
            {...commonProps}
            rx={2}
          />
          <rect
            x={ex + (ew - stemW) / 2}
            y={ey + barH}
            width={stemW}
            height={stemH}
            {...commonProps}
            rx={2}
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
            rx={2}
          />
          <rect
            x={ex + (ew - webW) / 2}
            y={ey + flangeH}
            width={webW}
            height={webH}
            {...commonProps}
            rx={2}
          />
          <rect
            x={ex}
            y={ey + flangeH + webH}
            width={flangeW}
            height={flangeH}
            {...commonProps}
            rx={2}
          />
        </>
      );
    }
    default:
      return (
        <rect x={ex} y={ey} width={ew} height={eh} {...commonProps} rx={2} />
      );
  }
}

export function Canvas2D({
  elements,
  selectedIds,
  activeTool,
  scale,
  yardSize,
  onSelectElement,
  onMoveElement,
  onMoveElements,
  onRotateElement,
  onDropElement,
}: Canvas2DProps) {
  const pxPerM = SCALE_PX_PER_M[scale];
  const yardPx = yardSize * pxPerM;
  const MARGIN = 32;

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep a ref to selectedIds so event handlers in useEffect can access current value
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;

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

  // Marquee selection state
  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    shift: boolean;
  } | null>(null);

  const [isDragOver, setIsDragOver] = useState(false);

  const getSVGPoint = useCallback(
    (e: React.MouseEvent | MouseEvent): { x: number; y: number } => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
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

  const handleMouseDown = (e: React.MouseEvent, el: YardElement) => {
    e.stopPropagation();

    // Shift-click: toggle element in selection
    if (e.shiftKey) {
      const next = new Set(selectedIds);
      if (next.has(el.id)) {
        next.delete(el.id);
      } else {
        next.add(el.id);
      }
      onSelectElement(next);
      if (activeTool === "select" || activeTool === "move") {
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

    // Normal click: if element not in selection, set selection to just this element
    if (!selectedIds.has(el.id)) {
      onSelectElement(new Set([el.id]));
    }

    if (activeTool === "select" || activeTool === "move") {
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
      const eh = Math.max(el.height * pxPerM, 6);
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

  // Marquee mousedown on background
  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    if (
      e.target !== svgRef.current &&
      !(e.target as Element).classList.contains("canvas-bg")
    ) {
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

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
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
          onMoveElement(
            drag.id,
            Math.max(0, drag.origX + dx),
            Math.max(0, drag.origY + dy),
          );
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

    const onMouseUp = () => {
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
            const eh = Math.max(el.height * pxPerM, 6);
            return ex < mx + mw && ex + ew > mx && ey < my + mh && ey + eh > my;
          });

          const newIds = new Set(intersected.map((el) => el.id));

          if (marquee.shift) {
            // Merge with current selection using the ref
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
      const svgX = e.clientX - rect.left;
      const svgY = e.clientY - rect.top;
      const { x, y } = svgToMeters(svgX, svgY);
      onDropElement(item, Math.max(0, x), Math.max(0, y));
    } catch {
      // ignore
    }
  };

  // Generate grid lines
  const gridLines: React.ReactNode[] = [];
  for (let m = 0; m <= yardSize; m += GRID_STEP) {
    const px = m * pxPerM + MARGIN;
    gridLines.push(
      <line
        key={`v${m}`}
        x1={px}
        y1={MARGIN}
        x2={px}
        y2={yardPx + MARGIN}
        stroke="#e2e8f0"
        strokeWidth="0.5"
      />,
    );
    gridLines.push(
      <line
        key={`h${m}`}
        x1={MARGIN}
        y1={px}
        x2={yardPx + MARGIN}
        y2={px}
        stroke="#e2e8f0"
        strokeWidth="0.5"
      />,
    );
  }

  // Scale markers
  const scaleMarkers: React.ReactNode[] = [];
  for (let m = 0; m <= yardSize; m += GRID_STEP * 2) {
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
    scaleMarkers.push(
      <text
        key={`ym${m}`}
        x={MARGIN - 4}
        y={px + 3}
        textAnchor="end"
        fontSize={9}
        fill="#94a3b8"
      >
        {m}m
      </text>,
    );
  }

  const svgW = yardPx + MARGIN * 2;
  const svgH = yardPx + MARGIN * 2;

  const marqueeRect = marquee
    ? {
        x: Math.min(marquee.startX, marquee.currentX),
        y: Math.min(marquee.startY, marquee.currentY),
        w: Math.abs(marquee.currentX - marquee.startX),
        h: Math.abs(marquee.currentY - marquee.startY),
      }
    : null;

  return (
    <div
      ref={containerRef}
      className={`flex-1 overflow-auto bg-[oklch(0.98_0.004_240)] ${
        isDragOver ? "ring-2 ring-inset ring-blue-400" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      data-ocid="canvas.canvas_target"
      data-printable="true"
    >
      <svg
        ref={svgRef}
        width={svgW}
        height={svgH}
        role="img"
        aria-label="Yard layout canvas"
        onMouseDown={handleBackgroundMouseDown}
        className={`no-select ${
          activeTool === "move" || drag ? "cursor-move" : ""
        } ${activeTool === "rotate" ? "cursor-crosshair" : ""} ${
          marquee ? "select-none" : ""
        }`}
      >
        <title>Yard layout canvas</title>

        {/* White yard background */}
        <rect
          className="canvas-bg"
          x={MARGIN}
          y={MARGIN}
          width={yardPx}
          height={yardPx}
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
          const eh = Math.max(el.height * pxPerM, 6);
          const isSelected = selectedIds.has(el.id);
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
                cursor: activeTool === "rotate" ? "crosshair" : "pointer",
              }}
            >
              {/* Shadow */}
              <rect
                x={ex + 2}
                y={ey + 2}
                width={ew}
                height={eh}
                fill="rgba(0,0,0,0.12)"
                rx={2}
              />
              {/* Shape-aware element body */}
              <ElementShape
                shape={el.shape}
                ex={ex}
                ey={ey}
                ew={ew}
                eh={eh}
                color={el.color}
                isSelected={isSelected}
              />
              {/* Label */}
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
              {/* Selection handles */}
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
                        rx={1}
                        style={{ pointerEvents: "none" }}
                      />
                    );
                  })}
                  {/* Rotate handle - only show for single selection */}
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
                            Math.atan2(pt.y - cy, pt.x - cx) * (180 / Math.PI);
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

        {/* Marquee selection rectangle */}
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
            rx={2}
            style={{ pointerEvents: "none" }}
          />
        )}

        {/* Drag-over overlay */}
        {isDragOver && (
          <rect
            x={MARGIN}
            y={MARGIN}
            width={yardPx}
            height={yardPx}
            fill="rgba(30,122,203,0.06)"
            stroke="#1E7ACB"
            strokeWidth={2}
            strokeDasharray="6,4"
            rx={4}
            style={{ pointerEvents: "none" }}
          />
        )}
      </svg>
    </div>
  );
}
