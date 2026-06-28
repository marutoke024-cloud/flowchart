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
  {
    name: "Olive",
    colors: ["#8A7D50", "#8F9D77", "#CFD0A8", "#E7E3CF", "#3F3A23", "#F6F4E8"],
    arrow: "#5F5A33",
  },
  {
    name: "Cornflower",
    colors: ["#5B6B96", "#AAB2EF", "#FDF3C6", "#F97A52", "#2C3454", "#FBFAF2"],
    arrow: "#41496E",
  },
  {
    name: "Mist",
    colors: ["#6F9B73", "#9FB6A8", "#C9D0CB", "#E2A657", "#33433A", "#F4F6F1"],
    arrow: "#4A6B50",
  },
  {
    name: "Plum",
    colors: ["#5C5170", "#9A8290", "#C2A9B6", "#F9D8B0", "#2F2740", "#F7F1EE"],
    arrow: "#4A4159",
  },
  {
    name: "Rosewood",
    colors: ["#CF5A5A", "#DF8D8B", "#9E3B3B", "#F4D9C8", "#5A2222", "#FDF3EE"],
    arrow: "#8A3030",
  },
  {
    name: "Harvest",
    colors: ["#2F3E5C", "#93A97E", "#E0C14B", "#CF8B5A", "#1D2740", "#F5F3EA"],
    arrow: "#2F3E5C",
  },
  {
    name: "Cacao",
    colors: ["#B3613A", "#5A3E2B", "#DDBF94", "#A07A55", "#2E2422", "#F3ECE0"],
    arrow: "#5A3E2B",
  },
  {
    name: "Ember",
    colors: ["#F0492F", "#2E3F4F", "#3F5566", "#9AA7B1", "#0E2433", "#EEF1F3"],
    arrow: "#0E2433",
  },
  {
    name: "Crimson",
    colors: ["#D2173F", "#4A4A4A", "#9AA0A3", "#CFD3D4", "#181818", "#F1F1F1"],
    arrow: "#181818",
  },
  {
    name: "Forest",
    colors: ["#356B52", "#BB5A37", "#7A9B86", "#E3D5AD", "#141414", "#F3EFE2"],
    arrow: "#141414",
  },
  {
    name: "Orchid",
    colors: ["#7A6F9B", "#3A2440", "#7BA2B3", "#A9C6B8", "#241528", "#F2EEF2"],
    arrow: "#3A2440",
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
