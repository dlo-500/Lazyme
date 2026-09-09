import type { ReactNode } from "react";
import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { PALETTES, type PaletteId } from "@/lib/ripple/palettes";
import { cn } from "@/lib/utils";

interface ControlDockProps {
  viscosity: number;
  strength: number;
  palette: PaletteId;
  onViscosity: (value: number) => void;
  onStrength: (value: number) => void;
  onPalette: (palette: PaletteId) => void;
  onClear: () => void;
}

export function ControlDock({
  viscosity,
  strength,
  palette,
  onViscosity,
  onStrength,
  onPalette,
  onClear,
}: ControlDockProps) {
  const viscPct = Math.round(viscosity * 100);
  const strPct = Math.round(strength * 100);

  return (
    <section
      className="pointer-events-auto w-full max-w-sm rounded-2xl bg-card p-4 shadow-border animate-dock-in"
      aria-label="Surface controls"
    >
      <div className="flex flex-col gap-4">
        <Field label="Viscosity" value={`${viscPct}`}>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[viscPct]}
            onValueChange={(v) => onViscosity((v[0] ?? 0) / 100)}
            aria-label="Viscosity"
          />
        </Field>

        <Field label="Wave strength" value={`${strPct}`}>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[strPct]}
            onValueChange={(v) => onStrength((v[0] ?? 0) / 100)}
            aria-label="Wave strength"
          />
        </Field>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Color map</p>
          <div className="flex flex-wrap gap-1">
            {PALETTES.map((item) => {
              const selected = item.id === palette;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onPalette(item.id)}
                  className={cn(
                    "inline-flex h-11 shrink-0 items-center gap-2 rounded-sm px-3 text-xs font-medium transition-[background-color,color,opacity] duration-150",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className={cn("size-2 rounded-full", swatchClass(item.id))}
                    aria-hidden="true"
                  />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={onClear}>
          <Eraser />
          Clear surface
        </Button>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="font-mono text-xs tabular-nums text-foreground">{value}</span>
      </div>
      {children}
    </div>
  );
}

function swatchClass(id: PaletteId) {
  switch (id) {
    case "abyss":
      return "bg-swatch-abyss";
    case "mercury":
      return "bg-swatch-mercury";
    case "ember":
      return "bg-swatch-ember";
    case "kelp":
      return "bg-swatch-kelp";
    case "pearl":
      return "bg-swatch-pearl";
    default:
      return "bg-primary";
  }
}
