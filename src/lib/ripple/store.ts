import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PaletteId } from "./palettes";
import { PALETTES } from "./palettes";

export interface RippleSettings {
  viscosity: number;
  strength: number;
  palette: PaletteId;
  clearToken: number;
  setViscosity: (value: number) => void;
  setStrength: (value: number) => void;
  setPalette: (palette: PaletteId) => void;
  requestClear: () => void;
}

function isPaletteId(value: unknown): value is PaletteId {
  return PALETTES.some((p) => p.id === value);
}

export const useRippleStore = create<RippleSettings>()(
  persist(
    (set) => ({
      viscosity: 0.32,
      strength: 0.68,
      palette: "abyss",
      clearToken: 0,
      setViscosity: (value) => set({ viscosity: Math.min(1, Math.max(0, value)) }),
      setStrength: (value) => set({ strength: Math.min(1, Math.max(0, value)) }),
      setPalette: (palette) => set({ palette }),
      requestClear: () => set((s) => ({ clearToken: s.clearToken + 1 })),
    }),
    {
      name: "undula-settings-v1",
      skipHydration: true,
      partialize: (state) => ({
        viscosity: state.viscosity,
        strength: state.strength,
        palette: state.palette,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<RippleSettings>;
        return {
          ...current,
          viscosity:
            typeof p.viscosity === "number" ? Math.min(1, Math.max(0, p.viscosity)) : current.viscosity,
          strength:
            typeof p.strength === "number" ? Math.min(1, Math.max(0, p.strength)) : current.strength,
          palette: isPaletteId(p.palette) ? p.palette : current.palette,
        };
      },
    },
  ),
);
