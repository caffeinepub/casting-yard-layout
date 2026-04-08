import { Button } from "@/components/ui/button";
import {
  Calendar,
  FileUp,
  FolderOpen,
  Grid3X3,
  Layers,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef } from "react";
import type { SavedProject } from "../types/project";
import type { NewYardConfig } from "../utils/autoLayout";

interface DashboardProps {
  projects: SavedProject[];
  onCreateNew: () => void;
  onCreateNewWithConfig: (config: NewYardConfig) => void;
  onDrawBoundary: () => void;
  onOpenProject: (project: SavedProject) => void;
  onDeleteProject: (id: string) => void;
  onOpenSample: (url: string, name: string) => void;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function Dashboard({
  projects,
  onCreateNewWithConfig: _onCreateNewWithConfig,
  onDrawBoundary,
  onOpenProject,
  onDeleteProject,
  onOpenSample,
}: DashboardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleLoadFile() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result as string;
        const data = JSON.parse(raw);
        const project: SavedProject = {
          id: crypto.randomUUID(),
          projectName: data.projectName ?? file.name.replace(/\.cyld$/, ""),
          yardLength: data.yardLength ?? data.yardSize ?? 540,
          yardWidth: data.yardWidth ?? data.yardSize ?? 540,
          elementCount: Array.isArray(data.elements) ? data.elements.length : 0,
          lastModified: new Date().toISOString(),
          data: raw,
        };
        onOpenProject(project);
      } catch {
        alert("Failed to load file \u2014 invalid format");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const sampleUrl =
    "/assets/i_girder_casting_yard_1-019d2eb6-4d21-771c-a644-037bb01af55c.cyld";
  const sampleName = "I Girder Casting Yard";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "oklch(0.15 0.025 220)" }}
      data-ocid="dashboard.page"
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 h-14 shrink-0 border-b"
        style={{
          backgroundColor: "oklch(0.22 0.028 220)",
          borderColor: "oklch(0.3 0.02 220)",
        }}
        data-ocid="dashboard.header.section"
      >
        <div className="flex items-center gap-3">
          <img
            src="/assets/uploads/7b9257d0-0137-4292-9b25-8cab2885d15a-019d2dc5-66ab-77ca-ad8e-7349102dd8ed-1.png"
            alt="Casting Yard Pro Icon"
            className="h-9 w-9 object-contain rounded"
          />
          <span className="text-white font-bold text-base tracking-wider">
            Casting Yard Pro
          </span>
        </div>

        <div className="flex items-center gap-3">
          <img
            src="/assets/uploads/image-019d2ab3-dddb-71b9-873f-0a7d4163888c-1.png"
            alt="PCEPL Logo"
            className="h-10 w-auto object-contain rounded"
          />
          <span className="text-white/50 text-[10px] leading-tight max-w-[100px] hidden lg:block">
            This app is Developed by PCEPL
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-8 py-8 max-w-7xl mx-auto w-full">
        {/* Hero row */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide mb-1">
              Project Dashboard
            </h1>
            <p className="text-white/50 text-sm">
              Manage your casting yard layouts
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLoadFile}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium text-white/70 border transition-colors hover:text-white hover:bg-white/10"
              style={{ borderColor: "oklch(0.35 0.025 220)" }}
              data-ocid="dashboard.load_file.button"
            >
              <FileUp className="h-4 w-4" />
              Load from File
            </button>

            <Button
              onClick={onDrawBoundary}
              className="flex items-center gap-2 text-sm font-bold px-4 py-2"
              style={{
                backgroundColor: "#1E7ACB",
                color: "white",
              }}
              data-ocid="dashboard.create_new.button"
            >
              <PlusCircle className="h-4 w-4" />
              Create New
            </Button>
          </div>
        </motion.div>

        {/* ── Sample Layouts section ── */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-8"
          data-ocid="dashboard.samples.section"
        >
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-widest">
              Sample Layouts
            </h2>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "oklch(0.38 0.12 260 / 0.35)",
                color: "oklch(0.75 0.12 260)",
                border: "1px solid oklch(0.5 0.1 260 / 0.4)",
              }}
            >
              Built-in
            </span>
          </div>

          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            }}
          >
            {/* Sample card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="group relative rounded-xl border overflow-hidden cursor-pointer"
              style={{
                backgroundColor: "oklch(0.19 0.03 240)",
                borderColor: "oklch(0.42 0.08 260 / 0.5)",
              }}
              onClick={() => onOpenSample(sampleUrl, sampleName)}
              data-ocid="dashboard.samples.item.1"
            >
              {/* Sample badge */}
              <span
                className="absolute top-2.5 left-2.5 z-10 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "oklch(0.38 0.14 260 / 0.85)",
                  color: "oklch(0.9 0.08 260)",
                  border: "1px solid oklch(0.6 0.1 260 / 0.5)",
                }}
              >
                Sample
              </span>

              {/* Preview area */}
              <div
                className="relative h-36 flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: "oklch(0.16 0.025 240)" }}
              >
                <svg
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full opacity-20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern
                      id="grid-sample"
                      width="20"
                      height="20"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 20 0 L 0 0 0 20"
                        fill="none"
                        stroke="oklch(0.55 0.06 260)"
                        strokeWidth="0.5"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid-sample)" />
                </svg>

                {/* Stylised I-girder preview shape */}
                <div className="relative flex flex-col items-center justify-center gap-0.5 z-10">
                  {/* Top flange */}
                  <div
                    className="rounded-sm"
                    style={{
                      width: "100px",
                      height: "10px",
                      backgroundColor: "oklch(0.58 0.14 260 / 0.85)",
                    }}
                  />
                  {/* Web */}
                  <div
                    className="rounded-sm"
                    style={{
                      width: "22px",
                      height: "38px",
                      backgroundColor: "oklch(0.48 0.12 260 / 0.7)",
                    }}
                  />
                  {/* Bottom flange */}
                  <div
                    className="rounded-sm"
                    style={{
                      width: "100px",
                      height: "10px",
                      backgroundColor: "oklch(0.58 0.14 260 / 0.85)",
                    }}
                  />
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition-colors duration-200 flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs font-semibold text-white bg-blue-600/80 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <FolderOpen className="h-3.5 w-3.5" />
                    Open in Editor
                  </span>
                </div>
              </div>

              {/* Card body */}
              <div className="px-4 pt-3 pb-3">
                <h3 className="text-sm font-semibold text-white leading-snug">
                  {sampleName}
                </h3>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-[11px] text-white/50">
                    <Layers className="h-3 w-3" />
                    Sample Layout
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-white/50">
                    <Calendar className="h-3 w-3" />
                    540×540m
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Divider between samples and saved projects */}
        <div
          className="mb-6 border-t"
          style={{ borderColor: "oklch(0.28 0.02 220)" }}
        />

        {/* Stats bar */}
        {projects.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-6 mb-6 px-4 py-3 rounded-lg"
            style={{ backgroundColor: "oklch(0.2 0.025 220)" }}
          >
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <FolderOpen className="h-4 w-4 text-blue-400" />
              <span>
                <span className="text-white font-semibold">
                  {projects.length}
                </span>{" "}
                saved project{projects.length !== 1 ? "s" : ""}
              </span>
            </div>
          </motion.div>
        )}

        {/* Projects grid */}
        {projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col items-center justify-center py-16 gap-5"
            data-ocid="dashboard.empty_state"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-2"
              style={{ backgroundColor: "oklch(0.22 0.028 220)" }}
            >
              <Grid3X3 className="h-9 w-9 text-white/30" />
            </div>
            <h2 className="text-xl font-semibold text-white/70">
              No saved projects yet
            </h2>
            <p className="text-white/40 text-sm text-center max-w-xs">
              Create your first casting yard layout or load an existing file to
              get started.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={handleLoadFile}
                className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium text-white/60 border transition-colors hover:text-white hover:bg-white/10"
                style={{ borderColor: "oklch(0.35 0.025 220)" }}
                data-ocid="dashboard.empty_load_file.button"
              >
                <FileUp className="h-4 w-4" />
                Load from File
              </button>
              <Button
                onClick={onDrawBoundary}
                className="flex items-center gap-2 text-sm font-bold px-4 py-2"
                style={{
                  backgroundColor: "#1E7ACB",
                  color: "white",
                }}
                data-ocid="dashboard.empty_create_new.button"
              >
                <PlusCircle className="h-4 w-4" />
                Create New
              </Button>
            </div>
          </motion.div>
        ) : (
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            }}
            data-ocid="dashboard.projects.list"
          >
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                data-ocid={`dashboard.projects.item.${i + 1}`}
                className="group relative rounded-xl border overflow-hidden"
                style={{
                  backgroundColor: "oklch(0.2 0.025 220)",
                  borderColor: "oklch(0.3 0.022 220)",
                }}
              >
                {/* Clickable area — no nested interactive elements */}
                <div
                  className="cursor-pointer"
                  onClick={() => onOpenProject(project)}
                  onKeyDown={(e) => e.key === "Enter" && onOpenProject(project)}
                >
                  {/* Card preview area */}
                  <div
                    className="relative h-36 flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: "oklch(0.17 0.022 220)" }}
                  >
                    {/* Grid pattern background */}
                    <svg
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full opacity-20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs>
                        <pattern
                          id={`grid-${project.id}`}
                          width="20"
                          height="20"
                          patternUnits="userSpaceOnUse"
                        >
                          <path
                            d="M 20 0 L 0 0 0 20"
                            fill="none"
                            stroke="oklch(0.5 0.02 220)"
                            strokeWidth="0.5"
                          />
                        </pattern>
                      </defs>
                      <rect
                        width="100%"
                        height="100%"
                        fill={`url(#grid-${project.id})`}
                      />
                    </svg>

                    {/* Yard outline preview */}
                    <div
                      className="relative border-2 flex items-center justify-center"
                      style={{
                        borderColor: "#1E7ACB",
                        width: "120px",
                        height: `${Math.min(100, Math.round(120 * (project.yardWidth / project.yardLength)))}px`,
                        backgroundColor: "oklch(0.19 0.03 220 / 0.6)",
                      }}
                    >
                      <span className="text-[10px] text-white/40 font-mono">
                        {project.yardLength}\u00d7{project.yardWidth}m
                      </span>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition-colors duration-200 flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs font-semibold text-white bg-blue-600/80 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <FolderOpen className="h-3.5 w-3.5" />
                        Open in Editor
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="px-4 pt-3 pb-2">
                    <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 pr-8">
                      {project.projectName}
                    </h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-[11px] text-white/50">
                        <Layers className="h-3 w-3" />
                        {project.elementCount} element
                        {project.elementCount !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-white/50">
                        <Calendar className="h-3 w-3" />
                        {formatDate(project.lastModified)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delete button — absolutely positioned, outside clickable area */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProject(project.id);
                  }}
                  className="absolute top-3 right-3 p-1 rounded text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors z-10"
                  title="Delete project"
                  data-ocid={`dashboard.projects.delete_button.${i + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className="flex items-center justify-between px-6 h-7 shrink-0 border-t"
        style={{
          backgroundColor: "oklch(0.18 0.025 220)",
          borderColor: "oklch(0.28 0.02 220)",
        }}
      >
        <span className="text-[10px] text-white/30">
          \u00a9 {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/60 transition-colors"
          >
            caffeine.ai
          </a>
        </span>
        <span className="text-[10px] text-white/30">
          Precast Concrete Yard Management
        </span>
      </footer>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".cyld,.json"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
