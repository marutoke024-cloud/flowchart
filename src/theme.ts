import type { ThemePalette } from "./types";

/**
 * Diagram themes. Each theme is an ordered set of box fill colors plus an
 * arrow colour. A node remembers which slot (colorKey) it uses, so switching
 * the theme recolours the whole board consistently — like FigJam / Visme.
 *
 * Slot convention (kept consistent across themes so switching looks good):
 *   0 = primary   1 = accent   2 = soft/light   3 = pale   4 = dark   5 = paper
 */
export const THEMES: ThemePalette[] = [
  {
    name: "Sage",
    colors: ["#899878", "#A9B388", "#5F6F52", "#E4E6C3", "#222725", "#F7F7F2"],
    arrow: "#5F6F52",
  },
  {
    name: "Vivid",
    colors: ["#22C55E", "#F97316", "#EAB308", "#0EA5E9", "#334155", "#F1F5F9"],
    arrow: "#475569",
  },
  {
    name: "Ocean",
    colors: ["#0EA5A4", "#38BDF8", "#6366F1", "#A5F3FC", "#0F2A43", "#ECFEFF"],
    arrow: "#0F766E",
  },
  {
    name: "Sunset",
    colors: ["#FB7185", "#F97316", "#FBBF24", "#FDE68A", "#7C2D12", "#FFF7ED"],
    arrow: "#9A3412",
  },
  {
    name: "Mono",
    colors: ["#475569", "#64748B", "#94A3B8", "#CBD5E1", "#1F2937", "#FFFFFF"],
    arrow: "#334155",
  },
];

export const DEFAULT_THEME = "Sage";

/** Slot used for freshly created boxes. */
export const DEFAULT_COLOR_KEY = 0;

export function themeByName(name: string): ThemePalette {
  return THEMES.find((t) => t.name === name) ?? THEMES[0];
}

export function arrowColor(name: string): string {
  return themeByName(name).arrow;
}

/** Look of a freshly created node (colours come from the active theme). */
export const NODE_DEFAULTS = {
  width: 208,
  height: 96,
  borderColor: "#222725",
  borderWidth: 2,
  roundness: 16,
};

/** Look of a freshly created frame (background container). */
export const FRAME_DEFAULTS = {
  width: 460,
  height: 320,
  fill: "#fbf7e9",
  borderColor: "#d8d2b4",
};
