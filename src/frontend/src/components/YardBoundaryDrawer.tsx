import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import L from "leaflet";
import {
  ArrowRight,
  CheckCircle2,
  Info,
  Lock,
  LockOpen,
  Pencil,
  RotateCcw,
  Search,
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
  // Scan at center of polygon height for best coverage, fall back to bounding-box width.
  const fallbackLen = Math.max(30, Math.floor(boundingWidth) - 4);
  const centerY = 20 + boundingHeight / 2;
  const scanHeight = Math.min(30, boundingHeight / 2);
  const polygonLen =
    translatedBoundaryPoints.length >= 3
      ? Math.floor(
          maxBayLengthForBoundary(
            translatedBoundaryPoints,
            centerY - scanHeight / 2,
            scanHeight,
            2,
          ),
        )
      : 0;
  const maxBayLength = polygonLen >= 10 ? polygonLen : fallbackLen;

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Map state
  const [mapLocked, setMapLocked] = useState(false);
  const [metersPerPixel, setMetersPerPixel] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Drawing state (pixel coords on the SVG overlay)
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [closed, setClosed] = useState(false);
  const [showBayConfig, setShowBayConfig] = useState(false);

  // SVG pan (when locked, right-click drag pans the SVG viewport offset)
  const svgPanRef = useRef(false);
  const svgPanStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
  const [svgOffset, setSvgOffset] = useState({ x: 0, y: 0 });

  // Hint text
  const [hint, setHint] = useState(
    "Search for a location, then lock the map to start drawing your boundary",
  );

  // ── Initialize Leaflet map ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Lock / unlock map ──────────────────────────────────────────────────────
  function lockMap() {
    const map = mapRef.current;
    if (!map) return;

    map.dragging.disable();
    map.scrollWheelZoom.disable();
    map.doubleClickZoom.disable();
    map.touchZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();

    const center = map.getCenter();
    const zoom = map.getZoom();
    const lat = center.lat;
    // Earth circumference × cos(lat) / 2^(zoom+8) = meters per pixel
    const mpp =
      (40075016.686 * Math.cos((lat * Math.PI) / 180)) / 2 ** (zoom + 8);
    setMetersPerPixel(mpp > 0 ? mpp : 1);
    setMapLocked(true);
    setHint(
      "Map locked. Click to place boundary points · Right-click drag to pan · Double-click or click first point to close",
    );
  }

  function unlockMap() {
    const map = mapRef.current;
    if (!map) return;

    map.dragging.enable();
    map.scrollWheelZoom.enable();
    map.doubleClickZoom.enable();
    map.touchZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();

    // Reset all drawing state
    setMapLocked(false);
    setPoints([]);
    setClosed(false);
    setCursor(null);
    setSvgOffset({ x: 0, y: 0 });
    setHint(
      "Search for a location, then lock the map to start drawing your boundary",
    );
  }

  // ── Search (Nominatim) ─────────────────────────────────────────────────────
  async function handleSearch() {
    const q = searchQuery.trim();
    if (!q) return;
    setIsSearching(true);
    setSearchError("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
        { headers: { Accept: "application/json" } },
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        mapRef.current?.setView(
          [Number.parseFloat(lat), Number.parseFloat(lon)],
          15,
        );
        setSearchError("");
      } else {
        setSearchError("Location not found");
      }
    } catch {
      setSearchError("Search failed");
    } finally {
      setIsSearching(false);
    }
  }

  // ── SVG Drawing logic ──────────────────────────────────────────────────────
  function getSvgPoint(
    clientX: number,
    clientY: number,
  ): { x: number; y: number } {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: clientX - rect.left - svgOffset.x,
      y: clientY - rect.top - svgOffset.y,
    };
  }

  function handleSvgMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!mapLocked) return;

    if (svgPanRef.current) {
      const dx = e.clientX - svgPanStart.current.mx;
      const dy = e.clientY - svgPanStart.current.my;
      setSvgOffset({
        x: svgPanStart.current.ox + dx,
        y: svgPanStart.current.oy + dy,
      });
      return;
    }

    if (!closed) {
      const pt = getSvgPoint(e.clientX, e.clientY);
      setCursor(pt);
    }
  }

  function handleSvgMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    if (!mapLocked) return;

    // Right-click: pan the SVG overlay
    if (e.button === 2) {
      e.preventDefault();
      svgPanRef.current = true;
      svgPanStart.current = {
        mx: e.clientX,
        my: e.clientY,
        ox: svgOffset.x,
        oy: svgOffset.y,
      };
      return;
    }

    if (closed || e.button !== 0) return;

    const pt = getSvgPoint(e.clientX, e.clientY);

    // Click on first point to close (within 12px)
    if (points.length >= 3) {
      const first = points[0];
      const distPx = Math.sqrt(
        (first.x +
          svgOffset.x -
          (e.clientX - svgRef.current!.getBoundingClientRect().left)) **
          2 +
          (first.y +
            svgOffset.y -
            (e.clientY - svgRef.current!.getBoundingClientRect().top)) **
            2,
      );
      if (distPx < 12) {
        closeBoundary();
        return;
      }
    }

    setPoints((prev) => [...prev, pt]);
  }

  function handleSvgMouseUp(e: React.MouseEvent<SVGSVGElement>) {
    if (e.button === 2) {
      svgPanRef.current = false;
    }
  }

  function handleSvgDoubleClick(e: React.MouseEvent<SVGSVGElement>) {
    e.preventDefault();
    if (!mapLocked || closed || points.length < 3) return;
    closeBoundary();
  }

  function closeBoundary() {
    // Auto-rotate polygon so longest dimension is horizontal (for max bay length)
    let didRotate = false;
    setPoints((prev) => {
      if (prev.length < 3) return prev;

      // Compute bounding box
      const xs = prev.map((p) => p.x);
      const ys = prev.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const width = maxX - minX;
      const height = maxY - minY;

      // If height > width, rotate 90° clockwise around centroid so longest axis = horizontal
      if (height > width) {
        didRotate = true;
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const rotated = prev.map((p) => ({
          x: cx + (p.y - cy),
          y: cy - (p.x - cx),
        }));
        return rotated;
      }
      return prev;
    });

    setClosed(true);
    setCursor(null);
    setHint(
      didRotate
        ? "Boundary rotated 90° to maximize bay length. Configure bays to place inside it."
        : "Boundary defined. Configure bays to place inside it.",
    );
  }

  function handleReset() {
    setPoints([]);
    setClosed(false);
    setCursor(null);
    setSvgOffset({ x: 0, y: 0 });
    setHint(
      "Map locked. Click to place boundary points · Right-click drag to pan · Double-click or click first point to close",
    );
  }

  function handleRemoveLast() {
    if (closed) {
      setClosed(false);
      setHint(
        "Map locked. Click to place boundary points · Double-click or click first point to close",
      );
    } else {
      setPoints((prev) => prev.slice(0, -1));
    }
  }

  // Prevent context menu on SVG
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const prevent = (e: MouseEvent) => e.preventDefault();
    el.addEventListener("contextmenu", prevent);
    return () => el.removeEventListener("contextmenu", prevent);
  }, []);

  // ── Bounding box (in pixel space) ─────────────────────────────────────────
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

  // Convert pixel points to meter points
  function toMeterPoints(
    pts: { x: number; y: number }[],
  ): { x: number; y: number }[] {
    return pts.map((p) => ({
      x: p.x * metersPerPixel,
      y: p.y * metersPerPixel,
    }));
  }

  function handleBayConfigConfirm(
    bayCount: number,
    bayLength: number,
    bayWidth: number,
  ) {
    const bb = boundingBox();
    if (!bb) return;
    const margin = 20; // meters
    const bbWidthM = bb.width * metersPerPixel;
    const bbHeightM = bb.height * metersPerPixel;
    const yardLength = bbWidthM + margin * 2;
    const yardWidth = bbHeightM + margin * 2;

    const meterPts = toMeterPoints(points);
    const translatedPoints = meterPts.map((p) => ({
      x: p.x - bb.minX * metersPerPixel + margin,
      y: p.y - bb.minY * metersPerPixel + margin,
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

  // ── Compute bounding box and translated meter points for BayConfigModal ────
  const bb = boundingBox();
  const bbWidthM = bb ? bb.width * metersPerPixel : 0;
  const bbHeightM = bb ? bb.height * metersPerPixel : 0;
  const margin = 20;
  const translatedMeterPts = bb
    ? toMeterPoints(points).map((p) => ({
        x: p.x - bb.minX * metersPerPixel + margin,
        y: p.y - bb.minY * metersPerPixel + margin,
      }))
    : [];

  // ── SVG rendered points with offset ───────────────────────────────────────
  function withOffset(p: { x: number; y: number }) {
    return { x: p.x + svgOffset.x, y: p.y + svgOffset.y };
  }

  const svgPointsStr = points
    .map((p) => {
      const s = withOffset(p);
      return `${s.x},${s.y}`;
    })
    .join(" ");

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col"
      style={{ backgroundColor: DARK_BG }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 h-14 shrink-0 border-b gap-3"
        style={{
          backgroundColor: "oklch(0.22 0.028 220)",
          borderColor: BORDER,
        }}
      >
        {/* Left: title + point count */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Pencil className="w-4 h-4" style={{ color: ACCENT_BLUE }} />
          <span className="text-sm font-bold text-white whitespace-nowrap">
            Draw Yard Boundary
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
            style={{
              backgroundColor: "oklch(0.35 0.1 240 / 0.35)",
              color: "oklch(0.7 0.1 240)",
            }}
          >
            {closed
              ? `${points.length} pts · ${Math.round(bbWidthM)}m × ${Math.round(bbHeightM)}m`
              : `${points.length} pt${points.length !== 1 ? "s" : ""} placed`}
          </span>
        </div>

        {/* Center: search + lock */}
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          {/* Search */}
          <div className="flex items-center gap-1.5 flex-1">
            <div className="relative flex-1">
              <Input
                data-ocid="boundary.search_input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search location…"
                disabled={mapLocked}
                className="text-sm pr-3 h-8"
                style={{
                  backgroundColor: mapLocked
                    ? "oklch(0.17 0.015 220)"
                    : "white",
                  color: mapLocked ? "oklch(0.5 0.02 220)" : "#111",
                  borderColor: BORDER,
                }}
              />
            </div>
            <Button
              data-ocid="boundary.search_button"
              size="sm"
              onClick={handleSearch}
              disabled={mapLocked || isSearching || !searchQuery.trim()}
              className="h-8 px-3 gap-1.5 text-xs font-semibold shrink-0"
              style={{ backgroundColor: ACCENT_BLUE, color: "white" }}
            >
              <Search className="w-3.5 h-3.5" />
              {isSearching ? "…" : "Search"}
            </Button>
          </div>

          {/* Search error */}
          {searchError && (
            <span className="text-xs text-red-400 whitespace-nowrap">
              {searchError}
            </span>
          )}

          {/* Lock / Unlock */}
          {!mapLocked ? (
            <Button
              data-ocid="boundary.lock_button"
              size="sm"
              onClick={lockMap}
              className="h-8 px-3 gap-1.5 text-xs font-semibold shrink-0"
              style={{ backgroundColor: ACCENT_BLUE, color: "white" }}
            >
              <Lock className="w-3.5 h-3.5" />
              Lock Map
            </Button>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md"
                style={{
                  backgroundColor: "oklch(0.22 0.1 145 / 0.3)",
                  border: "1px solid oklch(0.45 0.15 145 / 0.5)",
                  color: "oklch(0.72 0.18 145)",
                }}
              >
                <Lock className="w-3 h-3" />
                Map Locked ✓
              </span>
              <button
                type="button"
                data-ocid="boundary.unlock_button"
                onClick={unlockMap}
                className="text-xs underline"
                style={{ color: "oklch(0.6 0.06 240)" }}
              >
                Unlock
              </button>
            </div>
          )}
        </div>

        {/* Right: drawing actions + close */}
        <div className="flex items-center gap-1.5 shrink-0">
          {mapLocked && points.length > 0 && !closed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveLast}
              className="text-xs gap-1.5 h-8"
              style={{ color: "oklch(0.6 0.03 220)" }}
            >
              <RotateCcw className="w-3 h-3" />
              Undo
            </Button>
          )}
          {mapLocked && closed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs gap-1.5 h-8"
              style={{ color: "oklch(0.6 0.03 220)" }}
            >
              <RotateCcw className="w-3 h-3" />
              Redraw
            </Button>
          )}
          {mapLocked && !closed && points.length >= 3 && (
            <Button
              size="sm"
              onClick={closeBoundary}
              className="text-xs font-semibold gap-1.5 h-8"
              style={{ backgroundColor: ACCENT_BLUE, color: "white" }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Close Boundary
            </Button>
          )}
          {closed && (
            <Button
              data-ocid="boundary.configure_bays_button"
              size="sm"
              onClick={() => setShowBayConfig(true)}
              className="text-xs font-semibold gap-1.5 h-8"
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
            data-ocid="boundary.close_button"
            onClick={onCancel}
            className="ml-1 flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: "oklch(0.55 0.03 220)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Hint bar ────────────────────────────────────────────────────── */}
      <div
        className="px-4 py-1.5 text-xs border-b flex items-center gap-2"
        style={{
          backgroundColor: "oklch(0.18 0.02 220)",
          borderColor: BORDER,
          color: "oklch(0.55 0.03 220)",
        }}
      >
        {mapLocked ? (
          <Lock
            className="w-3 h-3 shrink-0"
            style={{ color: "oklch(0.65 0.18 145)" }}
          />
        ) : (
          <LockOpen
            className="w-3 h-3 shrink-0"
            style={{ color: ACCENT_BLUE }}
          />
        )}
        {hint}
      </div>

      {/* ── Map + SVG overlay ───────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        {/* Leaflet map container */}
        <div
          ref={mapContainerRef}
          className="absolute inset-0"
          style={{ zIndex: 0 }}
        />

        {/* SVG drawing overlay */}
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full"
          style={{
            zIndex: 10,
            pointerEvents: mapLocked ? "all" : "none",
            cursor: mapLocked
              ? svgPanRef.current
                ? "grabbing"
                : closed
                  ? "default"
                  : "crosshair"
              : "default",
          }}
          onMouseMove={handleSvgMouseMove}
          onMouseDown={handleSvgMouseDown}
          onMouseUp={handleSvgMouseUp}
          onDoubleClick={handleSvgDoubleClick}
        >
          <title>Yard boundary drawing overlay</title>

          {/* Filled polygon when closed */}
          {closed && points.length >= 3 && (
            <polygon
              points={svgPointsStr}
              fill="oklch(0.25 0.06 145 / 0.22)"
              stroke="#22c55e"
              strokeWidth={2.5}
              strokeDasharray="10 5"
            />
          )}

          {/* Polyline while drawing */}
          {!closed && points.length >= 2 && (
            <polyline
              points={svgPointsStr}
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
              const last = withOffset(points[points.length - 1]);
              const cp = {
                x: cursor.x + svgOffset.x,
                y: cursor.y + svgOffset.y,
              };
              return (
                <line
                  x1={last.x}
                  y1={last.y}
                  x2={cp.x}
                  y2={cp.y}
                  stroke={ACCENT_BLUE}
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  opacity={0.6}
                />
              );
            })()}

          {/* Close indicator (hover over first point) */}
          {!closed &&
            cursor &&
            points.length >= 3 &&
            (() => {
              const first = withOffset(points[0]);
              const cx = cursor.x + svgOffset.x;
              const cy = cursor.y + svgOffset.y;
              const dist = Math.sqrt((first.x - cx) ** 2 + (first.y - cy) ** 2);
              if (dist < 12) {
                return (
                  <circle
                    cx={first.x}
                    cy={first.y}
                    r={10}
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
            const s = withOffset(p);
            const isFirst = i === 0;
            return (
              <g key={`pt-${i}-${p.x.toFixed(0)}-${p.y.toFixed(0)}`}>
                <circle
                  cx={s.x}
                  cy={s.y}
                  r={isFirst && !closed ? 7 : 4.5}
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
              </g>
            );
          })}

          {/* Cursor snapped dot */}
          {!closed &&
            cursor &&
            (() => {
              const s = {
                x: cursor.x + svgOffset.x,
                y: cursor.y + svgOffset.y,
              };
              return (
                <circle
                  cx={s.x}
                  cy={s.y}
                  r={3.5}
                  fill={ACCENT_BLUE}
                  opacity={0.8}
                />
              );
            })()}

          {/* Bounding box size label when closed */}
          {closed &&
            bb &&
            (() => {
              const minPt = withOffset({ x: bb.minX, y: bb.minY });
              const maxPt = withOffset({ x: bb.maxX, y: bb.maxY });
              const cx = (minPt.x + maxPt.x) / 2;
              return (
                <g>
                  <text
                    x={cx}
                    y={minPt.y - 10}
                    fontSize={12}
                    fill="#22c55e"
                    fontFamily="monospace"
                    textAnchor="middle"
                    fontWeight="bold"
                    style={{ textShadow: "0 1px 4px #000" }}
                  >
                    {Math.round(bbWidthM)}m × {Math.round(bbHeightM)}m
                  </text>
                </g>
              );
            })()}
        </svg>

        {/* Instructions overlay when unlocked */}
        {!mapLocked && (
          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-xl pointer-events-none"
            style={{
              zIndex: 20,
              backgroundColor: "oklch(0.15 0.03 240 / 0.92)",
              border: `1px solid ${BORDER}`,
              backdropFilter: "blur(8px)",
            }}
          >
            <Lock className="w-4 h-4 shrink-0" style={{ color: ACCENT_BLUE }} />
            <p className="text-xs text-white">
              Search for your location above, then click{" "}
              <span className="font-semibold" style={{ color: ACCENT_BLUE }}>
                Lock Map
              </span>{" "}
              to start drawing your casting yard boundary.
            </p>
          </div>
        )}

        {/* Instructions overlay when locked, no points */}
        {mapLocked && points.length === 0 && (
          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-xl pointer-events-none"
            style={{
              zIndex: 20,
              backgroundColor: "oklch(0.15 0.03 240 / 0.92)",
              border: `1px solid ${BORDER}`,
              backdropFilter: "blur(8px)",
            }}
          >
            <Pencil
              className="w-4 h-4 shrink-0"
              style={{ color: ACCENT_BLUE }}
            />
            <p className="text-xs text-white">
              Click on the map to place boundary points. Right-click drag to
              pan. Double-click or click the first point to close.
            </p>
          </div>
        )}
      </div>

      {/* Bay config modal overlay */}
      {showBayConfig && bb && (
        <BayConfigModal
          onConfirm={handleBayConfigConfirm}
          onBack={() => setShowBayConfig(false)}
          boundingWidth={bbWidthM}
          boundingHeight={bbHeightM}
          translatedBoundaryPoints={translatedMeterPts}
        />
      )}
    </div>
  );
}
