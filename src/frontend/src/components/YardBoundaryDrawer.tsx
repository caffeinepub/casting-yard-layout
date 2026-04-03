import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowRight,
  CheckCircle2,
  Info,
  Layers,
  Pencil,
  RotateCcw,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BoundaryPoint, NewYardConfig } from "../utils/autoLayout";
import { maxBayLengthForBoundary, sectionCount } from "../utils/autoLayout";

interface YardBoundaryDrawerProps {
  onConfirm: (config: NewYardConfig) => void;
  onCancel: () => void;
}

const DARK_BG = "oklch(0.15 0.025 220)";
const DARK_CARD = "oklch(0.19 0.03 240)";
const BORDER = "oklch(0.3 0.025 220)";
const ACCENT_BLUE = "#1E7ACB";

// ── Bay Config Modal (step 2 extracted) ──────────────────────────────────────
interface BayConfigModalProps {
  onConfirm: (bayCount: number, bayLength: number, bayWidth: number) => void;
  onBack: () => void;
  boundingWidth: number;
  boundingHeight: number;
  translatedBoundaryPoints: { x: number; y: number }[];
}

function BayConfigModal({
  onConfirm,
  onBack,
  boundingWidth,
  boundingHeight,
  translatedBoundaryPoints,
}: BayConfigModalProps) {
  // Use actual polygon shape (with 2m inset) to compute the real max bay length.
  // Fall back to bounding-box minus 4m if polygon check fails.
  const maxBayLength = Math.max(
    1,
    translatedBoundaryPoints.length >= 3
      ? Math.floor(maxBayLengthForBoundary(translatedBoundaryPoints, 20, 30, 2))
      : Math.floor(boundingWidth) - 4,
  );

  const [bayCount, setBayCount] = useState("3");
  // Auto-set bay length to the max allowed by the boundary
  const [bayLength, setBayLength] = useState(String(maxBayLength));
  const [bayWidth, setBayWidth] = useState("30");

  const parsedBayLength = Math.min(
    Number(bayLength) || maxBayLength,
    maxBayLength,
  );
  const isAtMax = parsedBayLength >= maxBayLength;

  const valid =
    Number(bayCount) >= 1 && Number(bayLength) >= 1 && Number(bayWidth) >= 1;

  const perBay = sectionCount(
    parsedBayLength,
    Number(bayWidth) || 30,
    30,
    0.8,
    0.5,
    1,
    2,
  );

  function handleBayLengthChange(val: string) {
    const num = Number(val);
    if (!Number.isNaN(num) && num > maxBayLength) {
      setBayLength(String(maxBayLength));
    } else {
      setBayLength(val);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
    >
      <div
        className="w-[440px] rounded-2xl overflow-hidden shadow-2xl border"
        style={{ backgroundColor: DARK_BG, borderColor: BORDER }}
      >
        {/* Header */}
        <div
          className="px-6 pt-5 pb-4 border-b"
          style={{ borderColor: BORDER }}
        >
          <p
            className="text-[10px] uppercase tracking-widest font-semibold mb-1"
            style={{ color: "oklch(0.5 0.06 240)" }}
          >
            Step 2 of 2
          </p>
          <h2 className="text-base font-bold text-white">Bay Configuration</h2>
          <p
            className="text-xs mt-0.5"
            style={{ color: "oklch(0.5 0.02 220)" }}
          >
            Boundary: {Math.round(boundingWidth)}m ×{" "}
            {Math.round(boundingHeight)}m
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Max length notice */}
          <div
            className="flex items-start gap-2.5 rounded-lg px-3 py-2.5"
            style={{
              backgroundColor: isAtMax
                ? "oklch(0.22 0.08 145 / 0.25)"
                : "oklch(0.22 0.06 240 / 0.25)",
              border: `1px solid ${
                isAtMax
                  ? "oklch(0.45 0.12 145 / 0.5)"
                  : "oklch(0.4 0.1 240 / 0.4)"
              }`,
            }}
          >
            <Info
              className="w-3.5 h-3.5 mt-0.5 shrink-0"
              style={{
                color: isAtMax
                  ? "oklch(0.65 0.15 145)"
                  : "oklch(0.65 0.12 240)",
              }}
            />
            <p
              className="text-xs leading-relaxed"
              style={{
                color: isAtMax
                  ? "oklch(0.75 0.12 145)"
                  : "oklch(0.72 0.08 240)",
              }}
            >
              {isAtMax ? (
                <>
                  <span className="font-semibold">
                    Maximum bay length is {maxBayLength}m
                  </span>{" "}
                  — automatically set to fit the drawn boundary.
                </>
              ) : (
                <>
                  Bay length is limited to{" "}
                  <span className="font-semibold font-mono">
                    {maxBayLength}m
                  </span>{" "}
                  by the drawn boundary.
                </>
              )}
            </p>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                id: "bc",
                label: "No. of Bays",
                val: bayCount,
                set: setBayCount,
                unit: "",
                min: 1,
                ph: "3",
                isLimited: false,
              },
              {
                id: "bl",
                label: "Bay Length",
                val: bayLength,
                set: handleBayLengthChange,
                unit: "m",
                min: 1,
                ph: String(maxBayLength),
                isLimited: true,
              },
              {
                id: "bw",
                label: "Bay Width",
                val: bayWidth,
                set: setBayWidth,
                unit: "m",
                min: 10,
                ph: "30",
                isLimited: false,
              },
            ].map((f) => (
              <div key={f.id} className="flex flex-col gap-1.5">
                <Label
                  htmlFor={f.id}
                  className="text-xs font-semibold tracking-wider uppercase"
                  style={{ color: "oklch(0.65 0.04 220)" }}
                >
                  {f.label}
                </Label>
                <div className="relative">
                  <Input
                    id={f.id}
                    type="number"
                    value={f.val}
                    min={f.min}
                    max={f.isLimited ? maxBayLength : undefined}
                    placeholder={f.ph}
                    onChange={(e) => f.set(e.target.value)}
                    className="pr-8 bg-transparent border font-mono text-sm"
                    style={{
                      backgroundColor: "oklch(0.17 0.022 220)",
                      borderColor:
                        f.isLimited && isAtMax
                          ? "oklch(0.45 0.12 145 / 0.7)"
                          : BORDER,
                      color: "white",
                    }}
                  />
                  {f.unit && (
                    <span
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-mono"
                      style={{ color: "oklch(0.5 0.02 220)" }}
                    >
                      {f.unit}
                    </span>
                  )}
                </div>
                {f.isLimited && (
                  <p
                    className="text-[10px] font-mono"
                    style={{ color: "oklch(0.5 0.06 145)" }}
                  >
                    max {maxBayLength}m
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Section diagram */}
          <div
            className="rounded-lg p-3 space-y-2"
            style={{ backgroundColor: DARK_CARD }}
          >
            <p
              className="text-[10px] uppercase tracking-widest font-semibold"
              style={{ color: "oklch(0.45 0.02 220)" }}
            >
              Auto-placed per bay
            </p>
            <div
              className="flex rounded overflow-hidden border"
              style={{ borderColor: BORDER, height: "30px" }}
            >
              <div
                className="flex-1 flex items-center justify-center text-[9px] font-bold"
                style={{
                  backgroundColor: "oklch(0.28 0.04 220)",
                  color: "#c8c8c8",
                }}
              >
                I-Girders
              </div>
              <div className="w-px" style={{ backgroundColor: BORDER }} />
              <div
                className="flex-1 flex items-center justify-center text-[9px] font-bold"
                style={{
                  backgroundColor: "oklch(0.25 0.06 40)",
                  color: "#FF6B00",
                }}
              >
                Formwork + Shed
              </div>
              <div className="w-px" style={{ backgroundColor: BORDER }} />
              <div
                className="flex-1 flex items-center justify-center text-[9px] font-bold"
                style={{
                  backgroundColor: "oklch(0.22 0.012 220)",
                  color: "#999",
                }}
              >
                Reinf. Cage
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  label: "I-Girders",
                  color: "#c8c8c8",
                  bg: "oklch(0.28 0.04 220)",
                },
                {
                  label: "Formwork",
                  color: "#FF6B00",
                  bg: "oklch(0.25 0.06 40)",
                },
                {
                  label: "RC Cages",
                  color: "#999",
                  bg: "oklch(0.22 0.012 220)",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded p-2 text-center"
                  style={{ backgroundColor: item.bg }}
                >
                  <p
                    className="text-base font-bold font-mono"
                    style={{ color: item.color }}
                  >
                    {perBay}
                  </p>
                  <p
                    className="text-[9px] mt-0.5"
                    style={{ color: "oklch(0.55 0.02 220)" }}
                  >
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex items-center justify-between border-t"
          style={{ borderColor: BORDER }}
        >
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-sm"
            style={{ color: "oklch(0.6 0.03 220)" }}
          >
            ← Back to Boundary
          </Button>
          <Button
            onClick={() =>
              onConfirm(
                Math.max(1, Number(bayCount) || 3),
                Math.min(maxBayLength, Math.max(1, parsedBayLength)),
                Math.max(10, Number(bayWidth) || 30),
              )
            }
            disabled={!valid}
            className="flex items-center gap-2 text-sm font-bold px-6"
            style={{ backgroundColor: "oklch(0.52 0.17 145)", color: "white" }}
          >
            <CheckCircle2 className="w-4 h-4" />
            Create Layout
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main YardBoundaryDrawer ───────────────────────────────────────────────────
export function YardBoundaryDrawer({
  onConfirm,
  onCancel,
}: YardBoundaryDrawerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport / pan / zoom state
  const [vpOffset, setVpOffset] = useState({ x: 0, y: 0 });
  const [vpScale, setVpScale] = useState(2); // px per meter
  const isPanning = useRef(false);
  const panStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });

  // Drawing state
  const [points, setPoints] = useState<BoundaryPoint[]>([]);
  const [cursor, setCursor] = useState<BoundaryPoint | null>(null);
  const [closed, setClosed] = useState(false);
  const [showBayConfig, setShowBayConfig] = useState(false);

  // Tooltip hint
  const [hint, setHint] = useState(
    "Click to place boundary points · Right-click to pan · Scroll to zoom · Double-click or click first point to close",
  );

  // Grid size in meters
  const GRID = 10;
  // Canvas in meters (large virtual space)
  const _CANVAS_M = 2000;

  function svgToMeters(clientX: number, clientY: number): BoundaryPoint {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const mx = (clientX - rect.left - vpOffset.x) / vpScale;
    const my = (clientY - rect.top - vpOffset.y) / vpScale;
    // Snap to 1m grid
    return { x: Math.round(mx), y: Math.round(my) };
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (closed) return;
    if (isPanning.current) {
      const dx = e.clientX - panStart.current.mx;
      const dy = e.clientY - panStart.current.my;
      setVpOffset({ x: panStart.current.ox + dx, y: panStart.current.oy + dy });
      return;
    }
    setCursor(svgToMeters(e.clientX, e.clientY));
  }

  function handleMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    if (e.button === 2 || e.button === 1) {
      e.preventDefault();
      isPanning.current = true;
      panStart.current = {
        mx: e.clientX,
        my: e.clientY,
        ox: vpOffset.x,
        oy: vpOffset.y,
      };
      return;
    }
    if (closed) return;
    if (e.button !== 0) return;

    const pt = svgToMeters(e.clientX, e.clientY);

    // Click on first point to close
    if (points.length >= 3) {
      const first = points[0];
      const distPx = Math.sqrt(
        ((first.x - pt.x) * vpScale) ** 2 + ((first.y - pt.y) * vpScale) ** 2,
      );
      if (distPx < 10) {
        closeBoundary();
        return;
      }
    }
    setPoints((prev) => [...prev, pt]);
  }

  function handleMouseUp(e: React.MouseEvent<SVGSVGElement>) {
    if (e.button === 2 || e.button === 1) {
      isPanning.current = false;
    }
  }

  function handleDoubleClick(e: React.MouseEvent<SVGSVGElement>) {
    e.preventDefault();
    if (closed || points.length < 3) return;
    closeBoundary();
  }

  function closeBoundary() {
    setClosed(true);
    setCursor(null);
    setHint("Boundary defined. Configure bays to place inside it.");
  }

  function handleWheel(e: React.WheelEvent<SVGSVGElement>) {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const newScale = Math.min(20, Math.max(0.3, vpScale * factor));
    // Zoom towards mouse
    const newOx = mouseX - (mouseX - vpOffset.x) * (newScale / vpScale);
    const newOy = mouseY - (mouseY - vpOffset.y) * (newScale / vpScale);
    setVpScale(newScale);
    setVpOffset({ x: newOx, y: newOy });
  }

  function handleReset() {
    setPoints([]);
    setClosed(false);
    setCursor(null);
    setHint(
      "Click to place boundary points · Right-click to pan · Scroll to zoom · Double-click or click first point to close",
    );
  }

  function handleRemoveLast() {
    if (closed) {
      setClosed(false);
      setHint(
        "Click to place boundary points · Double-click or click first point to close",
      );
    } else {
      setPoints((prev) => prev.slice(0, -1));
    }
  }

  const boundingBox = useCallback(() => {
    if (points.length < 2) return null;
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    };
  }, [points]);

  function handleBayConfigConfirm(
    bayCount: number,
    bayLength: number,
    bayWidth: number,
  ) {
    const bb = boundingBox();
    if (!bb) return;
    // Derive yardLength/yardWidth from bounding box, add some margin
    const margin = 20;
    const yardLength = bb.width + margin * 2;
    const yardWidth = bb.height + margin * 2;

    // Translate boundary points so they start from margin,margin
    const translatedPoints = points.map((p) => ({
      x: p.x - bb.minX + margin,
      y: p.y - bb.minY + margin,
    }));

    onConfirm({
      yardLength,
      yardWidth,
      bayCount,
      bayLength,
      bayWidth,
      boundaryPoints: translatedPoints,
    });
  }

  // Prevent right-click context menu on the SVG
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const prevent = (e: MouseEvent) => e.preventDefault();
    el.addEventListener("contextmenu", prevent);
    return () => el.removeEventListener("contextmenu", prevent);
  }, []);

  // Build polyline points string
  function mToSvg(mx: number, my: number) {
    return {
      x: mx * vpScale + vpOffset.x,
      y: my * vpScale + vpOffset.y,
    };
  }

  const svgPoints = points.map((p) => {
    const s = mToSvg(p.x, p.y);
    return `${s.x},${s.y}`;
  });

  const bb = boundingBox();

  // Grid lines
  const gridStart = Math.floor(-vpOffset.x / vpScale / GRID) * GRID;
  const gridEnd = gridStart + Math.ceil(3000 / vpScale / GRID) * GRID + GRID;
  const gridLines: React.ReactNode[] = [];
  for (let x = gridStart; x <= gridEnd; x += GRID) {
    const sx = x * vpScale + vpOffset.x;
    gridLines.push(
      <line
        key={`gx${x}`}
        x1={sx}
        y1={0}
        x2={sx}
        y2={10000}
        stroke="oklch(0.28 0.02 220)"
        strokeWidth={0.5}
        opacity={0.6}
      />,
    );
    gridLines.push(
      <text
        key={`gxt${x}`}
        x={sx + 2}
        y={12}
        fontSize={9}
        fill="oklch(0.4 0.02 220)"
        fontFamily="monospace"
      >
        {x}m
      </text>,
    );
  }
  const vGridStart = Math.floor(-vpOffset.y / vpScale / GRID) * GRID;
  const vGridEnd = vGridStart + Math.ceil(3000 / vpScale / GRID) * GRID + GRID;
  for (let y = vGridStart; y <= vGridEnd; y += GRID) {
    const sy = y * vpScale + vpOffset.y;
    gridLines.push(
      <line
        key={`gy${y}`}
        x1={0}
        y1={sy}
        x2={10000}
        y2={sy}
        stroke="oklch(0.28 0.02 220)"
        strokeWidth={0.5}
        opacity={0.6}
      />,
    );
    if (y !== vGridStart) {
      gridLines.push(
        <text
          key={`gyt${y}`}
          x={2}
          y={sy - 2}
          fontSize={9}
          fill="oklch(0.4 0.02 220)"
          fontFamily="monospace"
        >
          {y}m
        </text>,
      );
    }
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-40 flex flex-col"
      style={{ backgroundColor: DARK_BG }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 h-12 shrink-0 border-b"
        style={{
          backgroundColor: "oklch(0.22 0.028 220)",
          borderColor: BORDER,
        }}
      >
        <div className="flex items-center gap-3">
          <Pencil className="w-4 h-4" style={{ color: ACCENT_BLUE }} />
          <span className="text-sm font-bold text-white">
            Draw Yard Boundary
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: "oklch(0.35 0.1 240 / 0.35)",
              color: "oklch(0.7 0.1 240)",
            }}
          >
            {closed
              ? `${points.length} points · ${Math.round(bb?.width ?? 0)}m × ${Math.round(bb?.height ?? 0)}m`
              : `${points.length} point${points.length !== 1 ? "s" : ""} placed`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {points.length > 0 && !closed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveLast}
              className="text-xs gap-1.5"
              style={{ color: "oklch(0.6 0.03 220)" }}
            >
              <RotateCcw className="w-3 h-3" />
              Undo Last
            </Button>
          )}
          {closed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs gap-1.5"
              style={{ color: "oklch(0.6 0.03 220)" }}
            >
              <RotateCcw className="w-3 h-3" />
              Redraw
            </Button>
          )}
          {!closed && points.length >= 3 && (
            <Button
              size="sm"
              onClick={closeBoundary}
              className="text-xs font-semibold gap-1.5"
              style={{ backgroundColor: ACCENT_BLUE, color: "white" }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Close Boundary
            </Button>
          )}
          {closed && (
            <Button
              size="sm"
              onClick={() => setShowBayConfig(true)}
              className="text-xs font-semibold gap-1.5"
              style={{
                backgroundColor: "oklch(0.52 0.17 145)",
                color: "white",
              }}
            >
              Configure Bays
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="ml-2 flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: "oklch(0.55 0.03 220)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hint bar */}
      <div
        className="px-5 py-1.5 text-xs border-b"
        style={{
          backgroundColor: "oklch(0.18 0.02 220)",
          borderColor: BORDER,
          color: "oklch(0.55 0.03 220)",
        }}
      >
        {hint}
      </div>

      {/* Drawing canvas */}
      <div className="flex-1 overflow-hidden relative">
        <svg
          ref={svgRef}
          role="img"
          aria-label="Yard boundary drawing canvas"
          className="w-full h-full"
          style={{
            cursor: closed ? "default" : "crosshair",
            userSelect: "none",
          }}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          onWheel={handleWheel}
        >
          <title>Yard boundary drawing canvas</title>
          {/* Grid */}
          {gridLines}

          {/* Filled polygon when closed */}
          {closed && points.length >= 3 && (
            <polygon
              points={svgPoints.join(" ")}
              fill="oklch(0.25 0.06 145 / 0.18)"
              stroke="#22c55e"
              strokeWidth={2}
              strokeDasharray="8 4"
            />
          )}

          {/* Polyline while drawing */}
          {!closed && points.length >= 2 && (
            <polyline
              points={svgPoints.join(" ")}
              fill="none"
              stroke={ACCENT_BLUE}
              strokeWidth={2}
              strokeDasharray="8 4"
            />
          )}

          {/* Live cursor line */}
          {!closed &&
            cursor &&
            points.length >= 1 &&
            (() => {
              const last = points[points.length - 1];
              const lp = mToSvg(last.x, last.y);
              const cp = mToSvg(cursor.x, cursor.y);
              return (
                <line
                  x1={lp.x}
                  y1={lp.y}
                  x2={cp.x}
                  y2={cp.y}
                  stroke={ACCENT_BLUE}
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  opacity={0.6}
                />
              );
            })()}

          {/* Closing indicator line (first point proximity) */}
          {!closed &&
            cursor &&
            points.length >= 3 &&
            (() => {
              const first = points[0];
              const distPx = Math.sqrt(
                ((first.x - cursor.x) * vpScale) ** 2 +
                  ((first.y - cursor.y) * vpScale) ** 2,
              );
              if (distPx < 10) {
                const fp = mToSvg(first.x, first.y);
                return (
                  <circle
                    cx={fp.x}
                    cy={fp.y}
                    r={8}
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth={2}
                    opacity={0.9}
                  />
                );
              }
              return null;
            })()}

          {/* Vertex dots */}
          {points.map((p, i) => {
            const s = mToSvg(p.x, p.y);
            const isFirst = i === 0;
            return (
              <g key={`pt-${p.x}-${p.y}-${i}`}>
                <circle
                  cx={s.x}
                  cy={s.y}
                  r={isFirst && !closed ? 6 : 4}
                  fill={
                    isFirst && !closed
                      ? "#22c55e"
                      : closed
                        ? "#22c55e"
                        : ACCENT_BLUE
                  }
                  stroke="white"
                  strokeWidth={1.5}
                />
                {/* Coordinate label for first & last */}
                {(i === 0 || i === points.length - 1) && (
                  <text
                    x={s.x + 8}
                    y={s.y - 6}
                    fontSize={9}
                    fill="white"
                    fontFamily="monospace"
                    opacity={0.7}
                  >
                    {Math.round(p.x)},{Math.round(p.y)}m
                  </text>
                )}
              </g>
            );
          })}

          {/* Cursor snapped dot */}
          {!closed &&
            cursor &&
            (() => {
              const s = mToSvg(cursor.x, cursor.y);
              return (
                <circle
                  cx={s.x}
                  cy={s.y}
                  r={3}
                  fill={ACCENT_BLUE}
                  opacity={0.7}
                />
              );
            })()}

          {/* Bounding box dimensions when closed */}
          {closed &&
            bb &&
            (() => {
              const topLeft = mToSvg(bb.minX, bb.minY);
              const bottomRight = mToSvg(bb.maxX, bb.maxY);
              const centerX = (topLeft.x + bottomRight.x) / 2;
              const centerY = (topLeft.y + bottomRight.y) / 2;
              return (
                <g>
                  {/* Width label */}
                  <text
                    x={centerX}
                    y={topLeft.y - 8}
                    fontSize={11}
                    fill="#22c55e"
                    fontFamily="monospace"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {Math.round(bb.width)}m
                  </text>
                  {/* Height label */}
                  <text
                    x={bottomRight.x + 8}
                    y={centerY}
                    fontSize={11}
                    fill="#22c55e"
                    fontFamily="monospace"
                    textAnchor="start"
                    fontWeight="bold"
                  >
                    {Math.round(bb.height)}m
                  </text>
                </g>
              );
            })()}
        </svg>

        {/* Instructions overlay (shown when no points yet) */}
        {points.length === 0 && (
          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-xl pointer-events-none"
            style={{
              backgroundColor: "oklch(0.22 0.03 240 / 0.9)",
              border: `1px solid ${BORDER}`,
            }}
          >
            <Pencil
              className="w-4 h-4 shrink-0"
              style={{ color: ACCENT_BLUE }}
            />
            <p className="text-xs text-white">
              Click anywhere to place your first boundary point. Use scroll to
              zoom, right-click drag to pan.
            </p>
          </div>
        )}
      </div>

      {/* Bay config modal overlay */}
      {showBayConfig &&
        bb &&
        (() => {
          const margin = 20;
          const tPts = points.map((p) => ({
            x: p.x - bb.minX + margin,
            y: p.y - bb.minY + margin,
          }));
          return (
            <BayConfigModal
              onConfirm={handleBayConfigConfirm}
              onBack={() => setShowBayConfig(false)}
              boundingWidth={bb.width}
              boundingHeight={bb.height}
              translatedBoundaryPoints={tPts}
            />
          );
        })()}
    </div>
  );
}
