export type PaletteId = "abyss" | "mercury" | "ember" | "kelp" | "pearl";

export type Rgb = readonly [number, number, number];

export interface Palette {
  id: PaletteId;
  label: string;
  /** Four color stops from trough → crest, 0–1 RGB. */
  stops: readonly [Rgb, Rgb, Rgb, Rgb];
  spec: Rgb;
}

export const PALETTES: readonly Palette[] = [
  {
    id: "abyss",
    label: "Abyss",
    stops: [
      [0.02, 0.04, 0.07],
      [0.04, 0.2, 0.3],
      [0.28, 0.68, 0.72],
      [0.82, 0.94, 0.96],
    ],
    spec: [0.78, 0.94, 0.98],
  },
  {
    id: "mercury",
    label: "Mercury",
    stops: [
      [0.05, 0.055, 0.06],
      [0.16, 0.18, 0.2],
      [0.52, 0.56, 0.6],
      [0.9, 0.92, 0.94],
    ],
    spec: [0.95, 0.96, 0.98],
  },
  {
    id: "ember",
    label: "Ember",
    stops: [
      [0.05, 0.03, 0.02],
      [0.28, 0.1, 0.05],
      [0.78, 0.38, 0.16],
      [0.98, 0.86, 0.62],
    ],
    spec: [1.0, 0.9, 0.7],
  },
  {
    id: "kelp",
    label: "Kelp",
    stops: [
      [0.02, 0.05, 0.04],
      [0.05, 0.18, 0.14],
      [0.22, 0.55, 0.4],
      [0.78, 0.92, 0.76],
    ],
    spec: [0.82, 0.98, 0.86],
  },
  {
    id: "pearl",
    label: "Pearl",
    stops: [
      [0.1, 0.13, 0.16],
      [0.28, 0.34, 0.4],
      [0.62, 0.72, 0.78],
      [0.93, 0.96, 0.98],
    ],
    spec: [1.0, 1.0, 1.0],
  },
] as const;

export function paletteById(id: PaletteId): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}
