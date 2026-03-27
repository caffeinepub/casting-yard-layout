import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Home, Loader2, Save } from "lucide-react";

interface HeaderProps {
  projectName: string;
  onProjectChange: (name: string) => void;
  onSave: () => void;
  isSaving: boolean;
  projects: string[];
  onGoToDashboard?: () => void;
}

export function Header({
  projectName,
  onProjectChange,
  onSave,
  isSaving,
  projects,
  onGoToDashboard,
}: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-4 h-14 shrink-0 no-select"
      style={{ backgroundColor: "oklch(0.22 0.028 220)" }}
      data-ocid="header.section"
    >
      {/* Brand - icon on the left */}
      <div className="flex items-center gap-2">
        {onGoToDashboard && (
          <button
            type="button"
            onClick={onGoToDashboard}
            className="flex items-center justify-center w-8 h-8 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors mr-1"
            title="Back to Dashboard"
            data-ocid="header.dashboard.link"
          >
            <Home className="h-4 w-4" />
          </button>
        )}
        <img
          src="/assets/uploads/7b9257d0-0137-4292-9b25-8cab2885d15a-019d2dc5-66ab-77ca-ad8e-7349102dd8ed-1.png"
          alt="Casting Yard Pro Icon"
          className="h-9 w-9 object-contain rounded"
          data-ocid="header.app_icon.image"
        />
        <span className="text-white font-bold text-base tracking-wider">
          Casting Yard Pro
        </span>
      </div>

      {/* Nav */}
      <nav className="hidden md:flex items-center gap-1">
        {["Dashboard", "Projects", "Inventory", "Settings"].map((item) => (
          <button
            type="button"
            key={item}
            onClick={item === "Dashboard" ? onGoToDashboard : undefined}
            className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
            data-ocid={`nav.${item.toLowerCase()}.link`}
          >
            {item}
          </button>
        ))}
      </nav>

      {/* Right side: Project selector + Save + PCEPL Logo + Trademark */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/80 bg-white/10 hover:bg-white/20 rounded transition-colors"
              data-ocid="header.project.select"
            >
              {projectName}
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {projects.map((p) => (
              <DropdownMenuItem key={p} onClick={() => onProjectChange(p)}>
                {p}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              onClick={() => onProjectChange("New Yard Project")}
            >
              + New Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className="text-xs font-bold tracking-wide"
          style={{ backgroundColor: "#1E7ACB", color: "white" }}
          data-ocid="header.save_project.button"
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5 mr-1.5" />
          )}
          SAVE PROJECT
        </Button>

        {/* Divider */}
        <div className="h-8 w-px bg-white/20" />

        {/* PCEPL Logo + Trademark */}
        <div className="flex items-center gap-2">
          <img
            src="/assets/uploads/image-019d2ab3-dddb-71b9-873f-0a7d4163888c-1.png"
            alt="PCEPL Logo"
            className="h-10 w-auto object-contain rounded"
            data-ocid="header.pcepl_logo.image"
          />
          <span
            className="text-white/50 text-[10px] leading-tight max-w-[100px] hidden lg:block"
            data-ocid="header.trademark.text"
          >
            This app is Developed by PCEPL
          </span>
        </div>
      </div>
    </header>
  );
}
