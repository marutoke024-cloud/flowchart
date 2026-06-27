export type ShapeKind = "rect" | "rounded" | "diamond" | "ellipse" | "hexagon";

export type BorderStyle = "solid" | "dashed" | "none";

export interface DiagramNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: ShapeKind;
  text: string;
  fill: string;
  /** Theme palette slot this fill came from; undefined for custom colours. */
  colorKey?: number;
  textColor: string;
  borderColor: string;
  borderWidth: number;
  borderStyle: BorderStyle;
  roundness: number;
  /** Optional embedded image, stored as a data URL. */
  image?: string;
  /** Collapsible long-form text. */
  details?: string;
  detailsOpen?: boolean;
}

export interface DiagramEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  color: string;
  dashed?: boolean;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface DiagramSnapshot {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface ThemePalette {
  name: string;
  colors: string[];
}
