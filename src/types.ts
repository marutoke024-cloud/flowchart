export type ShapeKind =
  | "rect"
  | "rounded"
  | "diamond"
  | "ellipse"
  | "circle"
  | "hexagon"
  | "parallelogram";

export type BorderStyle = "solid" | "dashed" | "none";

export type NodeKind = "node" | "frame" | "image" | "text";

export type Side = "t" | "r" | "b" | "l";

export interface NodeLabel {
  text: string;
  color: string;
}

export interface DiagramNode {
  id: string;
  /** "node" = a regular box, "frame" = a large background container. */
  kind?: NodeKind;
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
  /** Optional colored tag pinned to the top-right corner. */
  label?: NodeLabel;
  /** Long-form description (rich HTML) shown/edited in the left writing panel. */
  description?: string;
  /** Free text node styling. */
  fontSize?: number;
  bold?: boolean;
}

export interface DiagramEdge {
  id: string;
  from: string;
  to: string;
  /** Which side of each node the connector attaches to. */
  fromSide?: Side;
  toSide?: Side;
  label?: string;
  color: string;
  /** True if the colour should follow the active theme. */
  themed?: boolean;
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
  /** Connector colour for this theme. */
  arrow: string;
}
