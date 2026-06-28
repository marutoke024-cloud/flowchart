import { useEffect, useRef } from "react";
import type { DiagramNode, Side } from "./types";
import { useStore } from "./store";
import { bestTextColor } from "./utils";
import EditableText from "./EditableText";
import { IconChevron, IconZoom, IconResize } from "./icons";

interface Props {
  node: DiagramNode;
  startLink: (id: string, side: Side, clientX: number, clientY: number) => void;
}

const MIN_W = 110;

/** Horizontal padding (as % of width) keeps text inside non-rectangular shapes. */
function bodyPadding(shape: DiagramNode["shape"]): string {
  switch (shape) {
    case "diamond": return "16px 24%";
    case "circle": return "14px 17%";
    case "ellipse": return "12px 15%";
    case "parallelogram": return "14px 19%";
    case "hexagon": return "14px 13%";
    case "database": return "26px 18px 20px";
    case "predefined": return "14px 24px";
    case "multidoc": return "14px 20px 24px 14px";
    default: return "14px 16px";
  }
}

/** SVG background that draws the shape's fill + border for every shape kind. */
function ShapeBg({ node }: { node: DiagramNode }) {
  const { width: w, height: h, shape, fill, borderColor, borderWidth, borderStyle, roundness } = node;
  const stroke = borderStyle === "none" ? "none" : borderColor;
  const dash = borderStyle === "dashed" ? `${borderWidth * 3} ${borderWidth * 2}` : undefined;
  const inset = borderWidth / 2 + 0.5;
  // structural detail lines (predefined bars, database rim) must stay visible
  // even when the box has no border — fall back to the contrasting text colour.
  const ink = borderStyle === "none" ? node.textColor : borderColor;
  const inkW = borderStyle === "none" ? 2 : borderWidth;
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
    case "circle": {
      const r = Math.min(w, h) / 2 - inset;
      el = <circle cx={w / 2} cy={h / 2} r={r} {...common} />;
      break;
    }
    case "diamond":
      el = <polygon points={`${w / 2},${inset} ${w - inset},${h / 2} ${w / 2},${h - inset} ${inset},${h / 2}`} {...common} />;
      break;
    case "parallelogram": {
      const o = Math.min(h * 0.5, w * 0.24, 40);
      el = <polygon points={`${o},${inset} ${w - inset},${inset} ${w - o},${h - inset} ${inset},${h - inset}`} {...common} />;
      break;
    }
    case "hexagon": {
      const o = Math.min(w * 0.22, h * 0.5);
      el = <polygon points={`${o},${inset} ${w - o},${inset} ${w - inset},${h / 2} ${w - o},${h - inset} ${o},${h - inset} ${inset},${h / 2}`} {...common} />;
      break;
    }
    case "predefined": {
      const bar = Math.min(18, w * 0.12);
      el = (
        <g>
          <rect x={inset} y={inset} width={w - inset * 2} height={h - inset * 2} {...common} />
          <line x1={inset + bar} y1={inset} x2={inset + bar} y2={h - inset} stroke={ink} strokeWidth={inkW} vectorEffect="non-scaling-stroke" />
          <line x1={w - inset - bar} y1={inset} x2={w - inset - bar} y2={h - inset} stroke={ink} strokeWidth={inkW} vectorEffect="non-scaling-stroke" />
        </g>
      );
      break;
    }
    case "database": {
      const rx = w / 2 - inset;
      const ry = Math.min(h * 0.18, 18);
      const cx = w / 2;
      const top = inset + ry;
      const bot = h - inset - ry;
      const body = `M ${inset} ${top} L ${inset} ${bot} A ${rx} ${ry} 0 0 0 ${w - inset} ${bot} L ${w - inset} ${top}`;
      el = (
        <g>
          {/* cylinder body */}
          <path d={`${body} A ${rx} ${ry} 0 0 1 ${inset} ${top} Z`} fill={fill} stroke="none" />
          {/* lighter top cap so it reads as a cylinder */}
          <ellipse cx={cx} cy={top} rx={rx} ry={ry} fill="rgba(255,255,255,0.22)" stroke={ink} strokeWidth={inkW} vectorEffect="non-scaling-stroke" />
          {/* left side, bottom arc, right side */}
          <path d={body} fill="none" stroke={ink} strokeWidth={inkW} strokeDasharray={dash} vectorEffect="non-scaling-stroke" />
        </g>
      );
      break;
    }
    case "multidoc": {
      const off = 7;
      const amp = Math.min(12, h * 0.12);
      const x0 = inset;
      const x1 = w - inset - off * 2;
      const docTop = inset + off * 2;
      const docBot = h - inset;
      const wave = `M ${x0} ${docTop} L ${x1} ${docTop} L ${x1} ${docBot - amp} C ${x1 - (x1 - x0) * 0.25} ${docBot + amp} ${x0 + (x1 - x0) * 0.25} ${docBot - amp * 2} ${x0} ${docBot - amp} Z`;
      const stack = { fill, stroke: ink, strokeWidth: inkW, vectorEffect: "non-scaling-stroke" as const };
      el = (
        <g>
          <rect x={inset + off * 2} y={inset} width={w - inset * 2 - off * 2} height={h - inset * 2 - off * 2} {...stack} />
          <rect x={inset + off} y={inset + off} width={w - inset * 2 - off * 2} height={h - inset * 2 - off * 2} {...stack} />
          <path d={wave} {...stack} />
        </g>
      );
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
  const isImage = node.kind === "image";
  const isText = node.kind === "text";

  // Height follows content (text wrap, image, notes); width is user-controlled.
  // Measured height is written back so the shape background and edges stay in sync.
  // Image boxes are sized directly by the user, so they opt out.
  useEffect(() => {
    if (isImage || node.fixedH) return;
    const el = elRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const h = Math.round(el.offsetHeight);
      const cur = useStore.getState().nodes.find((n) => n.id === node.id);
      if (cur && Math.abs(cur.height - h) > 1) updateNode(node.id, { height: h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [node.id, updateNode, isImage, node.fixedH]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (editing) return;
    const target = e.target as HTMLElement;
    if (target.closest(".handle, .resize, .node-label")) return;
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
    const start = { sx: e.clientX, sy: e.clientY, w: node.width, h: node.height };
    let committed = false;
    let vertical = node.fixedH ?? false;
    const move = (ev: PointerEvent) => {
      if (!committed) {
        committed = true;
        commit();
      }
      const w = Math.max(MIN_W, Math.round(start.w + (ev.clientX - start.sx) / zoom));
      const dy = (ev.clientY - start.sy) / zoom;
      if (isImage) {
        const h = Math.max(60, Math.round(start.h + dy));
        updateNode(node.id, { width: w, height: h });
        return;
      }
      // boxes/text: drag down to set an explicit height (like a frame); a pure
      // horizontal drag keeps the height content-driven.
      if (!vertical && Math.abs(dy) > 4) vertical = true;
      if (vertical) {
        const h = Math.max(48, Math.round(start.h + dy));
        updateNode(node.id, { width: w, height: h, fixedH: true });
      } else {
        updateNode(node.id, { width: w });
      }
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const handle = (side: Side) => (e: React.PointerEvent) => {
    e.stopPropagation();
    startLink(node.id, side, e.clientX, e.clientY);
  };

  const labelRef = useRef<HTMLSpanElement>(null);

  return (
    <div
      ref={elRef}
      className={`node node-${node.shape} ${isImage ? "node-imagebox" : ""} ${isText ? "node-textbox" : ""} ${selected ? "selected" : ""}`}
      data-node-id={node.id}
      style={{ left: node.x, top: node.y, width: node.width, ...(isImage || node.fixedH ? { height: node.height } : {}) }}
      onPointerDown={onPointerDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (isImage) openLightbox(node.image!);
        else setEditing(node.id);
      }}
    >
      {isText ? (
        <div
          className="node-freetext"
          style={{
            fontSize: node.fontSize ?? 18,
            color: node.textColor,
            fontWeight: node.bold ? 700 : 500,
          }}
        >
          <EditableText
            className="node-freetext-edit"
            value={node.text}
            editing={editing}
            placeholder="Text…"
            onChange={(v) => updateNode(node.id, { text: v })}
            onCommit={commit}
          />
        </div>
      ) : isImage ? (
        <>
          <img
            className="node-fill-image"
            src={node.image}
            alt=""
            draggable={false}
            style={{ borderRadius: node.roundness }}
          />
          <button
            className="node-zoom"
            title="Enlarge"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              openLightbox(node.image!);
            }}
          >
            <IconZoom />
          </button>
        </>
      ) : (
        <>
          <ShapeBg node={node} />

          <div
            className="node-body"
            style={{
              padding: bodyPadding(node.shape),
              justifyContent: node.image || node.details ? "flex-start" : "center",
              color: node.textColor,
              ...(node.fixedH ? { overflow: "hidden" } : {}),
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
        </>
      )}

      {node.label && (
        <div
          className="node-label"
          style={{ background: node.label.color, color: bestTextColor(node.label.color) }}
        >
          <span
            ref={labelRef}
            className="node-label-text"
            contentEditable
            suppressContentEditableWarning
            data-placeholder="Label"
            onPointerDown={(e) => e.stopPropagation()}
            onFocus={commit}
            onBlur={(e) =>
              updateNode(node.id, {
                label: { ...node.label!, text: e.currentTarget.textContent ?? "" },
              })
            }
          >
            {node.label.text}
          </span>
        </div>
      )}

      {/* side anchors: hidden until hover/selected, used to draw connectors */}
      {!isText && (
        <>
          <div className="handle t" onPointerDown={handle("t")} />
          <div className="handle b" onPointerDown={handle("b")} />
          <div className="handle l" onPointerDown={handle("l")} />
          <div className="handle r" onPointerDown={handle("r")} />
        </>
      )}
      {selected && (
        <div className="resize" onPointerDown={onResizeDown}>
          <IconResize />
        </div>
      )}
    </div>
  );
}
