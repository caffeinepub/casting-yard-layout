import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Layers,
  LayoutGrid,
  Ruler,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { NewYardConfig } from "../utils/autoLayout";
import { sectionCount } from "../utils/autoLayout";

interface NewYardWizardProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (config: NewYardConfig) => void;
}

const DARK_CARD = "oklch(0.19 0.03 240)";
const DARK_BG = "oklch(0.15 0.025 220)";
const BORDER = "oklch(0.3 0.025 220)";
const ACCENT_BLUE = "#1E7ACB";

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => `step-${i}`).map(
        (stepKey, i) => (
          <div key={stepKey} className="flex items-center gap-2">
            <div
              className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all duration-300"
              style={{
                backgroundColor:
                  i < step
                    ? "oklch(0.55 0.16 145)"
                    : i === step
                      ? ACCENT_BLUE
                      : "oklch(0.28 0.022 220)",
                color: i <= step ? "white" : "oklch(0.55 0.02 220)",
                border:
                  i === step
                    ? `2px solid ${ACCENT_BLUE}`
                    : "2px solid transparent",
              }}
            >
              {i < step ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <span>{i + 1}</span>
              )}
            </div>
            {i < total - 1 && (
              <div
                className="w-12 h-0.5 rounded-full transition-all duration-500"
                style={{
                  backgroundColor:
                    i < step ? "oklch(0.55 0.16 145)" : "oklch(0.3 0.022 220)",
                }}
              />
            )}
          </div>
        ),
      )}
    </div>
  );
}

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  min?: number;
  placeholder?: string;
  id: string;
}

function FormField({
  label,
  value,
  onChange,
  unit = "m",
  min = 1,
  placeholder = "",
  id,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor={id}
        className="text-xs font-semibold tracking-wider uppercase"
        style={{ color: "oklch(0.65 0.04 220)" }}
      >
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          value={value}
          min={min}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10 bg-transparent border font-mono text-sm"
          style={{
            backgroundColor: "oklch(0.17 0.022 220)",
            borderColor: BORDER,
            color: "white",
          }}
          data-ocid={`wizard.${id}.input`}
        />
        {unit && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono"
            style={{ color: "oklch(0.5 0.02 220)" }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function SummaryRow({ label, value, icon }: SummaryRowProps) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-lg"
      style={{ backgroundColor: "oklch(0.22 0.025 220)" }}
    >
      <div className="flex items-center gap-2.5">
        <span style={{ color: "oklch(0.55 0.12 240)" }}>{icon}</span>
        <span className="text-sm" style={{ color: "oklch(0.65 0.03 220)" }}>
          {label}
        </span>
      </div>
      <span className="text-sm font-semibold text-white font-mono">
        {value}
      </span>
    </div>
  );
}

const SLIDE_VARIANTS = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

export function NewYardWizard({
  open,
  onClose,
  onConfirm,
}: NewYardWizardProps) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  // Step 1 - Yard dimensions
  const [yardLength, setYardLength] = useState("500");
  const [yardWidth, setYardWidth] = useState("300");

  // Step 2 - Bay config
  const [bayCount, setBayCount] = useState("3");
  const [bayLength, setBayLength] = useState("150");
  const [bayWidth, setBayWidth] = useState("30");

  function goNext() {
    setDir(1);
    setStep((s) => s + 1);
  }

  function goBack() {
    setDir(-1);
    setStep((s) => s - 1);
  }

  function handleConfirm() {
    onConfirm({
      yardLength: Math.max(100, Number(yardLength) || 500),
      yardWidth: Math.max(50, Number(yardWidth) || 300),
      bayCount: Math.max(1, Number(bayCount) || 3),
      bayLength: Math.max(30, Number(bayLength) || 150),
      bayWidth: Math.max(10, Number(bayWidth) || 30),
    });
    // Reset for next use
    setStep(0);
    setYardLength("500");
    setYardWidth("300");
    setBayCount("3");
    setBayLength("150");
    setBayWidth("30");
  }

  function handleOpenChange(val: boolean) {
    if (!val) {
      setStep(0);
      onClose();
    }
  }

  // Derived preview values
  const perBay = sectionCount(Number(bayLength) || 150);
  const nBays = Math.max(1, Number(bayCount) || 3);
  const bLen = Number(bayLength) || 150;
  const bWid = Number(bayWidth) || 30;
  const yLen = Number(yardLength) || 500;
  const yWid = Number(yardWidth) || 300;

  const step1Valid = Number(yardLength) >= 1 && Number(yardWidth) >= 1;
  const step2Valid =
    Number(bayCount) >= 1 && Number(bayLength) >= 1 && Number(bayWidth) >= 1;

  const STEP_LABELS = ["Yard Dimensions", "Bay Configuration", "Summary"];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-lg border-0 shadow-2xl p-0 overflow-hidden"
        style={{ backgroundColor: DARK_BG }}
        data-ocid="wizard.dialog"
      >
        {/* Title bar */}
        <div
          className="px-6 pt-6 pb-4 border-b"
          style={{ borderColor: BORDER }}
        >
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white tracking-wide">
              Create New Casting Yard
            </DialogTitle>
            <p
              className="text-xs mt-0.5"
              style={{ color: "oklch(0.55 0.03 220)" }}
            >
              {STEP_LABELS[step]}
            </p>
          </DialogHeader>
          <div className="mt-4">
            <StepIndicator step={step} total={3} />
          </div>
        </div>

        {/* Step content */}
        <div className="px-6 py-5 min-h-[280px] relative overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            {step === 0 && (
              <motion.div
                key="step0"
                custom={dir}
                variants={SLIDE_VARIANTS}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="space-y-5"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${ACCENT_BLUE}25` }}
                  >
                    <Ruler className="w-4 h-4" style={{ color: ACCENT_BLUE }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Casting Yard Dimensions
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "oklch(0.5 0.02 220)" }}
                    >
                      Set the overall size of your yard
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    id="yard-length"
                    label="Yard Length"
                    value={yardLength}
                    onChange={setYardLength}
                    unit="m"
                    min={100}
                    placeholder="500"
                  />
                  <FormField
                    id="yard-width"
                    label="Yard Width"
                    value={yardWidth}
                    onChange={setYardWidth}
                    unit="m"
                    min={50}
                    placeholder="300"
                  />
                </div>

                {/* Visual yard preview */}
                <div
                  className="rounded-lg p-4 flex items-center justify-center"
                  style={{ backgroundColor: DARK_CARD }}
                >
                  <div className="text-center">
                    <p
                      className="text-[10px] uppercase tracking-widest mb-2"
                      style={{ color: "oklch(0.45 0.02 220)" }}
                    >
                      Yard Preview
                    </p>
                    <div className="flex items-center justify-center">
                      <div
                        className="relative border-2 flex items-center justify-center"
                        style={{
                          borderColor: ACCENT_BLUE,
                          width: "120px",
                          height: `${
                            yLen > 0 && yWid > 0
                              ? Math.max(40, Math.round(120 * (yWid / yLen)))
                              : 80
                          }px`,
                          backgroundColor: "oklch(0.19 0.03 220 / 0.6)",
                        }}
                      >
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: "oklch(0.55 0.06 240)" }}
                        >
                          {yLen}×{yWid}m
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                custom={dir}
                variants={SLIDE_VARIANTS}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "oklch(0.35 0.12 145 / 0.25)" }}
                  >
                    <LayoutGrid
                      className="w-4 h-4"
                      style={{ color: "oklch(0.65 0.18 145)" }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Bay Configuration
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "oklch(0.5 0.02 220)" }}
                    >
                      Each bay is divided into 3 equal sections
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    id="bay-count"
                    label="No. of Bays"
                    value={bayCount}
                    onChange={setBayCount}
                    unit=""
                    min={1}
                    placeholder="3"
                  />
                  <FormField
                    id="bay-length"
                    label="Bay Length"
                    value={bayLength}
                    onChange={setBayLength}
                    unit="m"
                    min={30}
                    placeholder="150"
                  />
                  <FormField
                    id="bay-width"
                    label="Bay Width"
                    value={bayWidth}
                    onChange={setBayWidth}
                    unit="m"
                    min={10}
                    placeholder="30"
                  />
                </div>

                {/* Section preview card */}
                <div
                  className="rounded-lg p-4 space-y-2"
                  style={{ backgroundColor: DARK_CARD }}
                >
                  <p
                    className="text-[10px] uppercase tracking-widest font-semibold mb-3"
                    style={{ color: "oklch(0.45 0.02 220)" }}
                  >
                    Auto-placed elements per bay
                  </p>

                  {/* Bay section diagram */}
                  <div
                    className="flex rounded overflow-hidden border"
                    style={{ borderColor: BORDER, height: "36px" }}
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

                  <div className="grid grid-cols-3 gap-2 mt-2">
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
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={dir}
                variants={SLIDE_VARIANTS}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "oklch(0.35 0.12 260 / 0.25)" }}
                  >
                    <Layers
                      className="w-4 h-4"
                      style={{ color: "oklch(0.7 0.15 260)" }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Layout Summary
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "oklch(0.5 0.02 220)" }}
                    >
                      Review your configuration before creating
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <SummaryRow
                    label="Yard Size"
                    value={`${yLen}m × ${yWid}m`}
                    icon={<Ruler className="w-3.5 h-3.5" />}
                  />
                  <SummaryRow
                    label="Number of Bays"
                    value={`${nBays} bay${nBays !== 1 ? "s" : ""}`}
                    icon={<LayoutGrid className="w-3.5 h-3.5" />}
                  />
                  <SummaryRow
                    label="Bay Dimensions"
                    value={`${bLen}m × ${bWid}m`}
                    icon={<Ruler className="w-3.5 h-3.5" />}
                  />
                  <SummaryRow
                    label="I-Girders per bay"
                    value={`${perBay} girder${perBay !== 1 ? "s" : ""}`}
                    icon={<Layers className="w-3.5 h-3.5" />}
                  />
                  <SummaryRow
                    label="Formwork per bay"
                    value={`${perBay} piece${perBay !== 1 ? "s" : ""}`}
                    icon={<Layers className="w-3.5 h-3.5" />}
                  />
                  <SummaryRow
                    label="RC Cages per bay"
                    value={`${perBay} cage${perBay !== 1 ? "s" : ""}`}
                    icon={<Layers className="w-3.5 h-3.5" />}
                  />
                </div>

                <div
                  className="rounded-lg px-4 py-3 flex items-center gap-3 mt-1"
                  style={{
                    backgroundColor: "oklch(0.35 0.12 145 / 0.15)",
                    border: "1px solid oklch(0.45 0.14 145 / 0.35)",
                  }}
                >
                  <CheckCircle2
                    className="w-4 h-4 shrink-0"
                    style={{ color: "oklch(0.65 0.18 145)" }}
                  />
                  <p
                    className="text-xs"
                    style={{ color: "oklch(0.7 0.08 145)" }}
                  >
                    All elements (bays, roads, girders, formwork, shed,
                    reinforcement cages) will be auto-placed when you click
                    &ldquo;Create Layout&rdquo;.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer actions */}
        <div
          className="px-6 py-4 flex items-center justify-between border-t"
          style={{ borderColor: BORDER }}
        >
          {step > 0 ? (
            <Button
              variant="ghost"
              onClick={goBack}
              className="flex items-center gap-2 text-sm"
              style={{ color: "oklch(0.6 0.03 220)" }}
              data-ocid="wizard.back.button"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex items-center gap-2 text-sm"
              style={{ color: "oklch(0.6 0.03 220)" }}
              data-ocid="wizard.cancel.button"
            >
              Cancel
            </Button>
          )}

          {step < 2 ? (
            <Button
              onClick={goNext}
              disabled={step === 0 ? !step1Valid : !step2Valid}
              className="flex items-center gap-2 text-sm font-semibold px-5"
              style={{ backgroundColor: ACCENT_BLUE, color: "white" }}
              data-ocid="wizard.next.button"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleConfirm}
              className="flex items-center gap-2 text-sm font-bold px-6"
              style={{
                backgroundColor: "oklch(0.52 0.17 145)",
                color: "white",
              }}
              data-ocid="wizard.create_layout.primary_button"
            >
              <CheckCircle2 className="w-4 h-4" />
              Create Layout
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
