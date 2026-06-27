import type { DiagramNode, Viewport } from "./types";

export interface Point {
  x: number;
  y: number;
}

export function nodeCenter(n: DiagramNode): Point {
  return { x: n.x + n.width / 2, y: n.y + n.height / 2 };
}

/**
 * Find the point on the border of node `n` along the ray pointing toward
 * `target`. Treats every shape as its bounding box, which is accurate enough
 * for clean-looking flowchart connectors.
 */
export function borderPoint(n: DiagramNode, target: Point): Point {
  const c = nodeCenter(n);
  const dx = target.x - c.x;
  const dy = target.y - c.y;
  if (dx === 0 && dy === 0) return c;

  const hw = n.width / 2;
  const hh = n.height / 2;
  const scale = 1 / Math.max(Math.abs(dx) / hw, Math.abs(dy) / hh);
  return { x: c.x + dx * scale, y: c.y + dy * scale };
}

/** Convert a screen coordinate (relative to the canvas element) to world space. */
export function screenToWorld(
  sx: number,
  sy: number,
  vp: Viewport,
): Point {
  return {
    x: (sx - vp.x) / vp.zoom,
    y: (sy - vp.y) / vp.zoom,
  };
}

/** Build an SVG path for an arrow with a slight curve between two points. */
export function edgePath(a: Point, b: Point): string {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  // gentle quadratic curve perpendicular to the line for a softer look
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const bend = Math.min(len * 0.12, 26);
  const nx = -dy / len;
  const ny = dx / len;
  const cx = mx + nx * bend;
  const cy = my + ny * bend;
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
