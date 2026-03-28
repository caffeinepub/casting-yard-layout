import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, RotateCcw, Settings } from "lucide-react";
import type { SpacingSettings } from "../types/yard";
import { DEFAULT_SPACING_SETTINGS } from "../types/yard";

interface SettingsPageProps {
  settings: SpacingSettings;
  onSettingsChange: (s: SpacingSettings) => void;
  onBack: () => void;
}

function NumInput({
  label,
  hint,
  value,
  onChange,
  step = 0.1,
  min = 0,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-white/80">{label}</Label>
      {hint && <p className="text-[11px] text-white/40 -mt-1">{hint}</p>}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          step={step}
          min={min}
          value={value}
          onChange={(e) => {
            const v = Number.parseFloat(e.target.value);
            if (!Number.isNaN(v)) onChange(Math.max(min, v));
          }}
          className="h-8 w-32 text-sm bg-white/10 border-white/20 text-white focus:border-blue-400"
        />
        <span className="text-xs text-white/40">m</span>
      </div>
    </div>
  );
}

interface SectionCardProps {
  title: string;
  onReset: () => void;
  children: React.ReactNode;
}

function SectionCard({ title, onReset, children }: SectionCardProps) {
  return (
    <Card
      className="border-white/10"
      style={{ backgroundColor: "oklch(0.22 0.028 220)" }}
    >
      <CardHeader className="pb-3 pt-4 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-white/90 tracking-wide uppercase">
            {title}
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-white/50 hover:text-white hover:bg-white/10 gap-1"
            onClick={onReset}
            data-ocid="settings.reset_button"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsPage({
  settings,
  onSettingsChange,
  onBack,
}: SettingsPageProps) {
  const update = (patch: Partial<SpacingSettings>) =>
    onSettingsChange({ ...settings, ...patch });

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ backgroundColor: "oklch(0.18 0.022 220)" }}
      data-ocid="settings.page"
    >
      {/* Page header */}
      <div
        className="sticky top-0 z-10 flex items-center gap-4 px-6 py-4 border-b border-white/10"
        style={{ backgroundColor: "oklch(0.18 0.022 220)" }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-white/70 hover:text-white hover:bg-white/10 gap-2 h-8 px-3"
          data-ocid="settings.back_button"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Editor
        </Button>

        <div className="flex items-center gap-2 ml-2">
          <Settings className="w-5 h-5 text-blue-400" />
          <div>
            <h1 className="text-base font-bold text-white">Spacing Settings</h1>
            <p className="text-xs text-white/50">
              Configure default spacing used when placing elements on the yard
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onSettingsChange({ ...DEFAULT_SPACING_SETTINGS })}
          className="ml-auto h-8 text-xs border-white/20 text-white/70 hover:text-white hover:bg-white/10 gap-1.5"
          data-ocid="settings.reset_all_button"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset All to Defaults
        </Button>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col gap-5">
        {/* Bay */}
        <SectionCard
          title="Bay"
          onReset={() =>
            update({
              bayVerticalSpacing: DEFAULT_SPACING_SETTINGS.bayVerticalSpacing,
            })
          }
        >
          <NumInput
            label="Vertical spacing between bays"
            hint="Edge-to-edge gap between stacked bays"
            value={settings.bayVerticalSpacing}
            onChange={(v) => update({ bayVerticalSpacing: v })}
            step={1}
            min={0}
          />
        </SectionCard>

        {/* I-Girder */}
        <SectionCard
          title="I-Girder"
          onReset={() =>
            update({
              iGirderVerticalGap: DEFAULT_SPACING_SETTINGS.iGirderVerticalGap,
              iGirderLeftMargin: DEFAULT_SPACING_SETTINGS.iGirderLeftMargin,
              iGirderBayMargin: DEFAULT_SPACING_SETTINGS.iGirderBayMargin,
              iGirderColumnGap: DEFAULT_SPACING_SETTINGS.iGirderColumnGap,
            })
          }
        >
          <NumInput
            label="Vertical gap between girders"
            hint="Edge-to-edge gap in each stack column"
            value={settings.iGirderVerticalGap}
            onChange={(v) => update({ iGirderVerticalGap: v })}
            step={0.1}
            min={0}
          />
          <NumInput
            label="Left margin from bay edge"
            hint="Space from left bay edge to first girder"
            value={settings.iGirderLeftMargin}
            onChange={(v) => update({ iGirderLeftMargin: v })}
            step={1}
            min={0}
          />
          <NumInput
            label="Bay top/bottom margin"
            hint="Margin from bay top and bottom edges"
            value={settings.iGirderBayMargin}
            onChange={(v) => update({ iGirderBayMargin: v })}
            step={0.5}
            min={0}
          />
          <NumInput
            label="Column overflow gap"
            hint="Horizontal gap when starting a new column"
            value={settings.iGirderColumnGap}
            onChange={(v) => update({ iGirderColumnGap: v })}
            step={0.5}
            min={0}
          />
        </SectionCard>

        {/* Formwork */}
        <SectionCard
          title="Box Type I-Girder Formwork"
          onReset={() =>
            update({
              formworkVerticalGap: DEFAULT_SPACING_SETTINGS.formworkVerticalGap,
              formworkLeftMargin: DEFAULT_SPACING_SETTINGS.formworkLeftMargin,
              formworkBayMargin: DEFAULT_SPACING_SETTINGS.formworkBayMargin,
              formworkColumnGap: DEFAULT_SPACING_SETTINGS.formworkColumnGap,
            })
          }
        >
          <NumInput
            label="Vertical gap between pieces"
            hint="Edge-to-edge gap in each stack column"
            value={settings.formworkVerticalGap}
            onChange={(v) => update({ formworkVerticalGap: v })}
            step={0.1}
            min={0}
          />
          <NumInput
            label="Left margin from bay edge"
            hint="Space from left bay edge to first piece"
            value={settings.formworkLeftMargin}
            onChange={(v) => update({ formworkLeftMargin: v })}
            step={1}
            min={0}
          />
          <NumInput
            label="Bay top/bottom margin"
            hint="Margin from bay top and bottom edges"
            value={settings.formworkBayMargin}
            onChange={(v) => update({ formworkBayMargin: v })}
            step={0.5}
            min={0}
          />
          <NumInput
            label="Column overflow gap"
            hint="Horizontal gap when starting a new column"
            value={settings.formworkColumnGap}
            onChange={(v) => update({ formworkColumnGap: v })}
            step={0.5}
            min={0}
          />
        </SectionCard>

        {/* Reinforcement-Cage */}
        <SectionCard
          title="Reinforcement-Cage"
          onReset={() =>
            update({
              rcVerticalGap: DEFAULT_SPACING_SETTINGS.rcVerticalGap,
              rcLeftMargin: DEFAULT_SPACING_SETTINGS.rcLeftMargin,
              rcBayMargin: DEFAULT_SPACING_SETTINGS.rcBayMargin,
              rcColumnGap: DEFAULT_SPACING_SETTINGS.rcColumnGap,
            })
          }
        >
          <NumInput
            label="Vertical gap between cages"
            hint="Edge-to-edge gap in each stack column"
            value={settings.rcVerticalGap}
            onChange={(v) => update({ rcVerticalGap: v })}
            step={0.1}
            min={0}
          />
          <NumInput
            label="Left margin from bay edge"
            hint="Space from left bay edge to first cage"
            value={settings.rcLeftMargin}
            onChange={(v) => update({ rcLeftMargin: v })}
            step={1}
            min={0}
          />
          <NumInput
            label="Bay top/bottom margin"
            hint="Margin from bay top and bottom edges"
            value={settings.rcBayMargin}
            onChange={(v) => update({ rcBayMargin: v })}
            step={0.5}
            min={0}
          />
          <NumInput
            label="Column overflow gap"
            hint="Horizontal gap when starting a new column"
            value={settings.rcColumnGap}
            onChange={(v) => update({ rcColumnGap: v })}
            step={0.5}
            min={0}
          />
        </SectionCard>
      </div>
    </div>
  );
}
