import { useEffect } from "react";
import { RippleCanvas } from "@/components/ripple-canvas";
import { ControlDock } from "@/components/control-dock";
import { useRippleStore } from "@/lib/ripple/store";

export function RippleApp() {
  useEffect(() => {
    void useRippleStore.persist.rehydrate();
  }, []);

  const viscosity = useRippleStore((s) => s.viscosity);
  const strength = useRippleStore((s) => s.strength);
  const palette = useRippleStore((s) => s.palette);
  const clearToken = useRippleStore((s) => s.clearToken);
  const setViscosity = useRippleStore((s) => s.setViscosity);
  const setStrength = useRippleStore((s) => s.setStrength);
  const setPalette = useRippleStore((s) => s.setPalette);
  const requestClear = useRippleStore((s) => s.requestClear);

  return (
    <main className="relative h-dvh w-full select-none overflow-hidden bg-background text-foreground">
      <RippleCanvas
        viscosity={viscosity}
        strength={strength}
        palette={palette}
        clearToken={clearToken}
      />

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 pt-5 sm:p-6">
        <header className="flex max-w-md flex-col gap-1 pr-4">
          <h1 className="font-display text-3xl font-medium leading-tight tracking-display text-balance text-foreground sm:text-4xl">
            Undula
          </h1>
          <p className="max-w-xs text-pretty text-sm text-muted-foreground">
            Drag across the surface. Waves expand, then settle.
          </p>
        </header>

        <div className="mb-12 flex w-full justify-start sm:mb-0">
          <ControlDock
            viscosity={viscosity}
            strength={strength}
            palette={palette}
            onViscosity={setViscosity}
            onStrength={setStrength}
            onPalette={setPalette}
            onClear={requestClear}
          />
        </div>
      </div>
    </main>
  );
}
