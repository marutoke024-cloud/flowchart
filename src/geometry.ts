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

// ---------------------------------------------------------------------------
// Obstacle-avoiding routing (A* on a coarse grid, with a cheap straight-path
// fast path). Used to route connectors around boxes that sit between them.
// ---------------------------------------------------------------------------

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function nodeRect(n: DiagramNode): Rect {
  return { x: n.x, y: n.y, w: n.width, h: n.height };
}

function inflate(r: Rect, m: number): Rect {
  return { x: r.x - m, y: r.y - m, w: r.w + m * 2, h: r.h + m * 2 };
}

/** Does an axis-aligned segment intersect a rectangle? */
function segHitsRect(a: Point, b: Point, r: Rect): boolean {
  const minx = Math.min(a.x, b.x);
  const maxx = Math.max(a.x, b.x);
  const miny = Math.min(a.y, b.y);
  const maxy = Math.max(a.y, b.y);
  return maxx > r.x && minx < r.x + r.w && maxy > r.y && miny < r.y + r.h;
}

export function pathClear(pts: Point[], rects: Rect[]): boolean {
  for (let i = 0; i < pts.length - 1; i++) {
    for (const r of rects) {
      if (segHitsRect(pts[i], pts[i + 1], r)) return false;
    }
  }
  return true;
}

const STUB = 26;

/** Collapse consecutive collinear / duplicate points. */
function simplify(pts: Point[]): Point[] {
  const out = dedupe(pts);
  const res: Point[] = [];
  for (let i = 0; i < out.length; i++) {
    if (i === 0 || i === out.length - 1) {
      res.push(out[i]);
      continue;
    }
    const a = out[i - 1];
    const b = out[i];
    const c = out[i + 1];
    const collinear =
      (Math.abs(a.x - b.x) < 0.5 && Math.abs(b.x - c.x) < 0.5) ||
      (Math.abs(a.y - b.y) < 0.5 && Math.abs(b.y - c.y) < 0.5);
    if (!collinear) res.push(b);
  }
  return res;
}

/**
 * Route from one node side to another, going around obstacle rectangles.
 * Returns null if no route is found within the search region.
 */
export function routeAround(
  a: DiagramNode,
  sideA: Side,
  b: DiagramNode,
  sideB: Side,
  obstacles: Rect[],
): Point[] | null {
  const p0 = sidePoint(a, sideA);
  const d0 = DIRS[sideA];
  const e0 = { x: p0.x + d0.x * STUB, y: p0.y + d0.y * STUB };
  const p3 = sidePoint(b, sideB);
  const d3 = DIRS[sideB];
  const e3 = { x: p3.x + d3.x * STUB, y: p3.y + d3.y * STUB };

  const DET = 170;
  const minX = Math.min(e0.x, e3.x) - DET;
  const minY = Math.min(e0.y, e3.y) - DET;
  const maxX = Math.max(e0.x, e3.x) + DET;
  const maxY = Math.max(e0.y, e3.y) + DET;

  let cell = 20;
  let cols = Math.ceil((maxX - minX) / cell);
  let rows = Math.ceil((maxY - minY) / cell);
  while (cols * rows > 9000) {
    cell *= 1.5;
    cols = Math.ceil((maxX - minX) / cell);
    rows = Math.ceil((maxY - minY) / cell);
  }
  if (cols < 2 || rows < 2) return null;

  const blockers = obstacles.concat([nodeRect(a), nodeRect(b)]).map((r) => inflate(r, 8));
  const blocked = new Uint8Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const cx = minX + (i + 0.5) * cell;
      const cy = minY + (j + 0.5) * cell;
      for (const r of blockers) {
        if (cx > r.x && cx < r.x + r.w && cy > r.y && cy < r.y + r.h) {
          blocked[j * cols + i] = 1;
          break;
        }
      }
    }
  }

  const clampI = (x: number) => Math.max(0, Math.min(cols - 1, Math.round((x - minX) / cell - 0.5)));
  const clampJ = (y: number) => Math.max(0, Math.min(rows - 1, Math.round((y - minY) / cell - 0.5)));
  const si = clampI(e0.x);
  const sj = clampJ(e0.y);
  const gi = clampI(e3.x);
  const gj = clampJ(e3.y);
  blocked[sj * cols + si] = 0;
  blocked[gj * cols + gi] = 0;

  // A* with a turn penalty so paths prefer long straight runs.
  const TURN = 4;
  const DIRC = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  const key = (i: number, j: number, d: number) => (j * cols + i) * 3 + d;
  const g = new Map<number, number>();
  const came = new Map<number, number>();
  const open: { f: number; g: number; i: number; j: number; d: number }[] = [];
  const h = (i: number, j: number) => Math.abs(i - gi) + Math.abs(j - gj);
  const startKey = key(si, sj, 2);
  g.set(startKey, 0);
  open.push({ f: h(si, sj), g: 0, i: si, j: sj, d: 2 });

  let foundKey = -1;
  while (open.length) {
    let bi = 0;
    for (let k = 1; k < open.length; k++) if (open[k].f < open[bi].f) bi = k;
    const cur = open.splice(bi, 1)[0];
    if (cur.i === gi && cur.j === gj) {
      foundKey = key(cur.i, cur.j, cur.d);
      break;
    }
    if (cur.g > (g.get(key(cur.i, cur.j, cur.d)) ?? Infinity)) continue;
    for (let m = 0; m < 4; m++) {
      const ni = cur.i + DIRC[m][0];
      const nj = cur.j + DIRC[m][1];
      if (ni < 0 || nj < 0 || ni >= cols || nj >= rows) continue;
      if (blocked[nj * cols + ni]) continue;
      const nd = DIRC[m][0] !== 0 ? 0 : 1;
      const turn = cur.d !== 2 && cur.d !== nd ? TURN : 0;
      const ng = cur.g + 1 + turn;
      const nk = key(ni, nj, nd);
      if (ng < (g.get(nk) ?? Infinity)) {
        g.set(nk, ng);
        came.set(nk, key(cur.i, cur.j, cur.d));
        open.push({ f: ng + h(ni, nj), g: ng, i: ni, j: nj, d: nd });
      }
    }
  }

  if (foundKey < 0) return null;

  const cells: Point[] = [];
  let k: number | undefined = foundKey;
  while (k !== undefined) {
    const cellIdx = Math.floor(k / 3);
    const i = cellIdx % cols;
    const j = Math.floor(cellIdx / cols);
    cells.push({ x: minX + (i + 0.5) * cell, y: minY + (j + 0.5) * cell });
    k = came.get(k);
  }
  cells.reverse();
  if (cells.length === 0) return null;

  // snap the grid endpoints to the true stub points and stitch the anchors on
  cells[0] = e0;
  cells[cells.length - 1] = e3;
  return simplify([p0, ...cells, p3]);
}

/**
 * Pick a connector route: a clean orthogonal elbow when nothing is in the way,
 * otherwise an A* route around the obstacles.
 */
export function routeEdge(
  a: DiagramNode,
  sideA: Side,
  b: DiagramNode,
  sideB: Side,
  others: Rect[],
): Point[] {
  const simple = orthoPoints(a, sideA, b, sideB);
  const clearRects = others.map((r) => inflate(r, 4));
  if (pathClear(simple, clearRects)) return simple;
  const around = routeAround(a, sideA, b, sideB, others);
  return around ?? simple;
}

export function screenToWorld(sx: number, sy: number, vp: Viewport): Point {
  return { x: (sx - vp.x) / vp.zoom, y: (sy - vp.y) / vp.zoom };
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
