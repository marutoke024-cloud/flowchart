import { useEffect, useRef } from "react";
import type { DiagramNode } from "./types";
import { useStore } from "./store";
import EditableText from "./EditableText";
import { IconChevron } from "./icons";

interface Props {
  node: DiagramNode;
  startLink: (id: string, clientX: number, clientY: number) => void;
}

const MIN_W = 96;

/** SVG background that draws the shape's fill + border for every shape kind. */
function ShapeBg({ node }: { node: DiagramNode }) {
  const { width: w, height: h, shape, fill, borderColor, borderWidth, borderStyle, roundness } = node;
  const stroke = borderStyle === "none" ? "none" : borderColor;
  const dash = borderStyle === "dashed" ? `${borderWidth * 3} ${borderWidth * 2}` : undefined;
  const inset = borderWidth / 2 + 0.5;
  const common = {
    fill,
    stroke,
    strokeWidth: borderStyle === "none" ? 0 : borderWidth,
    strokeDasharray: dash,
    vectorEffect: "non-scaling-stroke" as const,
  };

  let el;
  switch (shape) {
    case "ellipse":
      el = <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - inset} ry={h / 2 - inset} {...common} />;
      break;
    case "diamond":
      el = <polygon points={`${w / 2},${inset} ${w - inset},${h / 2} ${w / 2},${h - inset} ${inset},${h / 2}`} {...common} />;
      break;
    case "hexagon": {
      const o = Math.min(w * 0.22, h * 0.5);
      el = <polygon points={`${o},${inset} ${w - o},${inset} ${w - inset},${h / 2} ${w - o},${h - inset} ${o},${h - inset} ${inset},${h / 2}`} {...common} />;
      break;
    }
    case "rect":
      el = <rect x={inset} y={inset} width={w - inset * 2} height={h - inset * 2} {...common} />;
      break;
    case "rounded":
    default:
      el = <rect x={inset} y={inset} width={w - inset * 2} height={h - inset * 2} rx={roundness} {...common} />;
      break;
  }
  return (
    <svg
      className="node-bg"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "visible", filter: "drop-shadow(0 1px 2px rgba(15,23,42,0.06))" }}
    >
      {el}
    </svg>
  );
}

export default function Node({ node, startLink }: Props) {
  const selected = useStore((s) => s.selectedId === node.id);
  const editing = useStore((s) => s.editingId === node.id);
  const select = useStore((s) => s.select);
  const setEditing = useStore((s) => s.setEditing);
  const updateNode = useStore((s) => s.updateNode);
  const commit = useStore((s) => s.commit);
  const openLightbox = useStore((s) => s.openLightbox);

  const dragState = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);
  const elRef = useRef<HTMLDivElement>(null);

  // Height follows content (text wrap, image, notes); width is user-controlled.
  // Measured height is written back so the shape background and edges stay in sync.
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const h = Math.round(el.offsetHeight);
      const cur = useStore.getState().nodes.find((n) => n.id === node.id);
      if (cur && Math.abs(cur.height - h) > 1) updateNode(node.id, { height: h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [node.id, updateNode]);

  const needsExtraPad = node.shape === "diamond" || node.shape === "ellipse";

  const onPointerDown = (e: React.PointerEvent) => {
    if (editing) return;
    const target = e.target as HTMLElement;
    if (target.closest(".handle, .resize")) return;
    e.stopPropagation();
    select(node.id);
    const zoom = useStore.getState().viewport.zoom;
    dragState.current = { sx: e.clientX, sy: e.clientY, ox: node.x, oy: node.y, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const move = (ev: PointerEvent) => {
      const st = dragState.current;
      if (!st) return;
      const dx = (ev.clientX - st.sx) / zoom;
      const dy = (ev.clientY - st.sy) / zoom;
      if (!st.moved && Math.hypot(ev.clientX - st.sx, ev.clientY - st.sy) > 3) {
        st.moved = true;
        commit();
      }
      if (st.moved) updateNode(node.id, { x: Math.round(st.ox + dx), y: Math.round(st.oy + dy) });
    };
    const up = () => {
      dragState.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const onResizeDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    const zoom = useStore.getState().viewport.zoom;
    const start = { sx: e.clientX, w: node.width };
    let committed = false;
    const move = (ev: PointerEvent) => {
      if (!committed) {
        committed = true;
        commit();
      }
      // width only — height is driven by content
      const w = Math.max(MIN_W, Math.round(start.w + (ev.clientX - start.sx) / zoom));
      updateNode(node.id, { width: w });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const handle = (side: string) => (e: React.PointerEvent) => {
    e.stopPropagation();
    startLink(node.id, e.clientX, e.clientY);
    void side;
  };

  return (
    <div
      ref={elRef}
      className={`node node-${node.shape} ${selected ? "selected" : ""}`}
      data-node-id={node.id}
      style={{ left: node.x, top: node.y, width: node.width }}
      onPointerDown={onPointerDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(node.id);
      }}
    >
      <ShapeBg node={node} />

      <div
        className="node-body"
        style={{
          padding: needsExtraPad ? "10px 22px" : undefined,
          justifyContent: node.image || node.details ? "flex-start" : "center",
          color: node.textColor,
        }}
      >
        <EditableText
          className="node-text"
          value={node.text}
          editing={editing}
          placeholder="Type…"
          onChange={(v) => updateNode(node.id, { text: v })}
          onCommit={commit}
        />

        {node.image && (
          <img
            className="node-image"
            src={node.image}
            alt=""
            draggable={false}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              openLightbox(node.image!);
            }}
          />
        )}

        {node.details !== undefined && (
          <div className="node-details">
            <button
              className={`node-details-toggle ${node.detailsOpen ? "open" : ""}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                updateNode(node.id, { detailsOpen: !node.detailsOpen });
              }}
            >
              <span className="chev"><IconChevron /></span>
              {node.detailsOpen ? "Hide details" : "Show details"}
            </button>
            {node.detailsOpen && (
              <EditableText
                className="node-details-text"
                value={node.details}
                editing={editing}
                placeholder="Add longer notes…"
                onChange={(v) => updateNode(node.id, { details: v })}
                onCommit={commit}
              />
            )}
          </div>
        )}
      </div>

      {selected && (
        <>
          <div className="handle t" onPointerDown={handle("t")} />
          <div className="handle b" onPointerDown={handle("b")} />
          <div className="handle l" onPointerDown={handle("l")} />
          <div className="handle r" onPointerDown={handle("r")} />
          <div className="resize" onPointerDown={onResizeDown} />
        </>
      )}
    </div>
  );
}
