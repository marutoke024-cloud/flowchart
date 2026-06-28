import type { DiagramNode, Side, Viewport } from "./types";

export interface Point {
  x: number;
  y: number;
}

export function nodeCenter(n: DiagramNode): Point {
  return { x: n.x + n.width / 2, y: n.y + n.height / 2 };
}

const DIRS: Record<Side, Point> = {
  t: { x: 0, y: -1 },
  b: { x: 0, y: 1 },
  l: { x: -1, y: 0 },
  r: { x: 1, y: 0 },
};

/** Midpoint of a node's side, on its bounding box border. */
export function sidePoint(n: DiagramNode, side: Side): Point {
  const cx = n.x + n.width / 2;
  const cy = n.y + n.height / 2;
  switch (side) {
    case "t": return { x: cx, y: n.y };
    case "b": return { x: cx, y: n.y + n.height };
    case "l": return { x: n.x, y: cy };
    case "r": return { x: n.x + n.width, y: cy };
  }
}

/** Pick facing sides for two nodes based on their relative position. */
export function chooseSides(a: DiagramNode, b: DiagramNode): [Side, Side] {
  const ca = nodeCenter(a);
  const cb = nodeCenter(b);
  const dx = cb.x - ca.x;
  const dy = cb.y - ca.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? ["r", "l"] : ["l", "r"];
  }
  return dy >= 0 ? ["b", "t"] : ["t", "b"];
}

/** Nearest side of node `n` to an arbitrary world point. */
export function nearestSide(n: DiagramNode, p: Point): Side {
  const c = nodeCenter(n);
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  // normalise by half-extents so a wide box still picks sensible sides
  const nx = dx / (n.width / 2 || 1);
  const ny = dy / (n.height / 2 || 1);
  if (Math.abs(nx) >= Math.abs(ny)) return nx >= 0 ? "r" : "l";
  return ny >= 0 ? "b" : "t";
}

function dedupe(pts: Point[]): Point[] {
  const out: Point[] = [];
  for (const p of pts) {
    const last = out[out.length - 1];
    if (!last || Math.abs(last.x - p.x) > 0.5 || Math.abs(last.y - p.y) > 0.5) {
      out.push(p);
    }
  }
  return out;
}

/** Orthogonal (elbow) waypoints from one node side to another. */
export function orthoPoints(
  a: DiagramNode,
  sideA: Side,
  b: DiagramNode,
  sideB: Side,
  stub = 26,
): Point[] {
  const p0 = sidePoint(a, sideA);
  const d0 = DIRS[sideA];
  const e0 = { x: p0.x + d0.x * stub, y: p0.y + d0.y * stub };
  const p3 = sidePoint(b, sideB);
  const d3 = DIRS[sideB];
  const e3 = { x: p3.x + d3.x * stub, y: p3.y + d3.y * stub };

  const aH = sideA === "l" || sideA === "r";
  const bH = sideB === "l" || sideB === "r";
  const pts: Point[] = [p0, e0];

  if (aH && bH) {
    const mx = (e0.x + e3.x) / 2;
    pts.push({ x: mx, y: e0.y }, { x: mx, y: e3.y });
  } else if (!aH && !bH) {
    const my = (e0.y + e3.y) / 2;
    pts.push({ x: e0.x, y: my }, { x: e3.x, y: my });
  } else if (aH && !bH) {
    pts.push({ x: e3.x, y: e0.y });
  } else {
    pts.push({ x: e0.x, y: e3.y });
  }

  pts.push(e3, p3);
  return dedupe(pts);
}

/** Orthogonal waypoints from a node side toward a free point (live linking). */
export function orthoToPoint(a: DiagramNode, sideA: Side, target: Point, stub = 26): Point[] {
  const p0 = sidePoint(a, sideA);
  const d0 = DIRS[sideA];
  const e0 = { x: p0.x + d0.x * stub, y: p0.y + d0.y * stub };
  const aH = sideA === "l" || sideA === "r";
  const pts: Point[] = [p0, e0];
  if (aH) pts.push({ x: target.x, y: e0.y });
  else pts.push({ x: e0.x, y: target.y });
  pts.push(target);
  return dedupe(pts);
}

/** Build an SVG path with rounded corners from a polyline. */
export function roundedPath(pts: Point[], r = 10): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const v1 = { x: p1.x - p0.x, y: p1.y - p0.y };
    const v2 = { x: p2.x - p1.x, y: p2.y - p1.y };
    const l1 = Math.hypot(v1.x, v1.y) || 1;
    const l2 = Math.hypot(v2.x, v2.y) || 1;
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const a = { x: p1.x - (v1.x / l1) * rr, y: p1.y - (v1.y / l1) * rr };
    const c = { x: p1.x + (v2.x / l2) * rr, y: p1.y + (v2.y / l2) * rr };
    d += ` L ${a.x} ${a.y} Q ${p1.x} ${p1.y} ${c.x} ${c.y}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/** Point at the middle of a polyline (by length) — used for edge labels. */
export function polylineMidpoint(pts: Point[]): Point {
  if (pts.length === 0) return { x: 0, y: 0 };
  if (pts.length === 1) return pts[0];
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  let half = total / 2;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (half <= seg) {
      const t = seg === 0 ? 0 : half / seg;
      return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t };
    }
    half -= seg;
  }
  return pts[pts.length - 1];
}

export function screenToWorld(sx: number, sy: number, vp: Viewport): Point {
  return { x: (sx - vp.x) / vp.zoom, y: (sy - vp.y) / vp.zoom };
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
