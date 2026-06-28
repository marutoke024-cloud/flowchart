import { useEffect, useRef, useState } from "react";
import { useStore } from "./store";
import { clamp, nearestSide, nodeCenter, screenToWorld } from "./geometry";
import type { Point } from "./geometry";
import type { Side, Viewport } from "./types";
import Node from "./Node";
import Frame from "./Frame";
import Edges from "./Edges";

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;

function zoomAt(vp: Viewport, factor: number, px: number, py: number): Viewport {
  const zoom = clamp(vp.zoom * factor, MIN_ZOOM, MAX_ZOOM);
  const k = zoom / vp.zoom;
  return { zoom, x: px - (px - vp.x) * k, y: py - (py - vp.y) * k };
}

export default function Canvas() {
  const ref = useRef<HTMLDivElement>(null);
  const nodes = useStore((s) => s.nodes);
  const viewport = useStore((s) => s.viewport);
  const setViewport = useStore((s) => s.setViewport);
  const addNode = useStore((s) => s.addNode);
  const select = useStore((s) => s.select);
  const selectEdge = useStore((s) => s.selectEdge);
  const setEditing = useStore((s) => s.setEditing);
  const addEdge = useStore((s) => s.addEdge);

  const [panning, setPanning] = useState(false);
  const [tempLink, setTempLink] = useState<{ from: string; fromSide: Side; to: Point } | null>(null);

  // active pointers for pan / pinch
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const gesture = useRef<{ dist: number; cx: number; cy: number } | null>(null);
  const panMoved = useRef(false);

  const rect = () => ref.current!.getBoundingClientRect();

  // --- pan & pinch via pointer events on the background ---
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.target !== ref.current && !(e.target as HTMLElement).classList.contains("world")) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    panMoved.current = false;
    if (pointers.current.size === 1) setPanning(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    const prev = pointers.current.get(e.pointerId)!;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 1) {
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      if (Math.abs(dx) + Math.abs(dy) > 1) panMoved.current = true;
      setViewport({ ...useStore.getState().viewport, x: useStore.getState().viewport.x + dx, y: useStore.getState().viewport.y + dy });
    } else if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const r = rect();
      const cx = (pts[0].x + pts[1].x) / 2 - r.left;
      const cy = (pts[0].y + pts[1].y) / 2 - r.top;
      panMoved.current = true;
      if (gesture.current) {
        const factor = dist / gesture.current.dist;
        let vp = zoomAt(useStore.getState().viewport, factor, cx, cy);
        vp = { ...vp, x: vp.x + (cx - gesture.current.cx), y: vp.y + (cy - gesture.current.cy) };
        setViewport(vp);
      }
      gesture.current = { dist, cx, cy };
    }
  };

  const endPointer = (e: React.PointerEvent) => {
    // ignore pointers that started on a node/edge (they bubble up here too)
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) gesture.current = null;
    if (pointers.current.size === 0) {
      setPanning(false);
      if (!panMoved.current) {
        select(null);
        selectEdge(null);
        setEditing(null);
      }
    }
  };

  // --- wheel: pan, or zoom with ctrl/meta (incl. trackpad pinch) ---
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const vp = useStore.getState().viewport;
      if (e.ctrlKey || e.metaKey) {
        const factor = Math.exp(-e.deltaY * 0.0015);
        setViewport(zoomAt(vp, factor, e.clientX - r.left, e.clientY - r.top));
      } else {
        setViewport({ ...vp, x: vp.x - e.deltaX, y: vp.y - e.deltaY });
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [setViewport]);

  // --- linking flow started from node side handles ---
  const startLink = (fromId: string, fromSide: Side, clientX: number, clientY: number) => {
    const r = rect();
    const vp = useStore.getState().viewport;
    setTempLink({ from: fromId, fromSide, to: screenToWorld(clientX - r.left, clientY - r.top, vp) });

    const move = (ev: PointerEvent) => {
      const cur = useStore.getState().viewport;
      setTempLink({ from: fromId, fromSide, to: screenToWorld(ev.clientX - r.left, ev.clientY - r.top, cur) });
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const target = document.elementFromPoint(ev.clientX, ev.clientY)?.closest("[data-node-id]");
      const toId = target?.getAttribute("data-node-id");
      if (toId && toId !== fromId) {
        const all = useStore.getState().nodes;
        const node = all.find((n) => n.id === toId);
        const src = all.find((n) => n.id === fromId);
        const cur = useStore.getState().viewport;
        const wp = screenToWorld(ev.clientX - r.left, ev.clientY - r.top, cur);
        let toSide = node ? nearestSide(node, wp) : undefined;
        // if dropped near the centre, attach to the side facing the source
        if (node && src) {
          const c = nodeCenter(node);
          const nx = (wp.x - c.x) / (node.width / 2 || 1);
          const ny = (wp.y - c.y) / (node.height / 2 || 1);
          if (Math.hypot(nx, ny) < 0.45) toSide = nearestSide(node, nodeCenter(src));
        }
        addEdge(fromId, toId, fromSide, toSide);
      }
      setTempLink(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    if (e.target !== ref.current && !(e.target as HTMLElement).classList.contains("world")) return;
    const r = rect();
    const w = screenToWorld(e.clientX - r.left, e.clientY - r.top, useStore.getState().viewport);
    addNode(w.x, w.y);
  };

  return (
    <div
      ref={ref}
      className={`canvas ${panning ? "panning" : ""} ${tempLink ? "linking" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onDoubleClick={onDoubleClick}
    >
      <div
        className="world"
        style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}
      >
        {nodes.filter((n) => n.kind === "frame").map((n) => (
          <Frame key={n.id} node={n} />
        ))}
        <Edges tempLink={tempLink} />
        {nodes.filter((n) => n.kind !== "frame").map((n) => (
          <Node key={n.id} node={n} startLink={startLink} />
        ))}
      </div>
    </div>
  );
}
