import { useRef } from "react";
import type { DiagramNode } from "./types";
import { useStore } from "./store";
import { bestTextColor } from "./utils";
import EditableText from "./EditableText";
import { IconResize } from "./icons";

const MIN_W = 160;
const MIN_H = 120;

/** A large background container used to group boxes (like a FigJam section). */
export default function Frame({ node }: { node: DiagramNode }) {
  const selected = useStore((s) => s.selectedId === node.id);
  const editing = useStore((s) => s.editingId === node.id);
  const select = useStore((s) => s.select);
  const setEditing = useStore((s) => s.setEditing);
  const updateNode = useStore((s) => s.updateNode);
  const commit = useStore((s) => s.commit);

  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if (editing) return;
    const target = e.target as HTMLElement;
    if (target.closest(".resize")) return;
    e.stopPropagation();
    select(node.id);
    const zoom = useStore.getState().viewport.zoom;
    drag.current = { sx: e.clientX, sy: e.clientY, ox: node.x, oy: node.y, moved: false };
    const move = (ev: PointerEvent) => {
      const st = drag.current;
      if (!st) return;
      if (!st.moved && Math.hypot(ev.clientX - st.sx, ev.clientY - st.sy) > 3) {
        st.moved = true;
        commit();
      }
      if (st.moved) {
        updateNode(node.id, {
          x: Math.round(st.ox + (ev.clientX - st.sx) / zoom),
          y: Math.round(st.oy + (ev.clientY - st.sy) / zoom),
        });
      }
    };
    const up = () => {
      drag.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const onResize = (e: React.PointerEvent) => {
    e.stopPropagation();
    const zoom = useStore.getState().viewport.zoom;
    const start = { sx: e.clientX, sy: e.clientY, w: node.width, h: node.height };
    let committed = false;
    const move = (ev: PointerEvent) => {
      if (!committed) {
        committed = true;
        commit();
      }
      updateNode(node.id, {
        width: Math.max(MIN_W, Math.round(start.w + (ev.clientX - start.sx) / zoom)),
        height: Math.max(MIN_H, Math.round(start.h + (ev.clientY - start.sy) / zoom)),
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div
      className={`frame ${selected ? "selected" : ""}`}
      data-frame-id={node.id}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        background: node.fill,
        borderColor: node.borderColor,
        borderRadius: node.roundness,
      }}
      onPointerDown={onPointerDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(node.id);
      }}
    >
      <div className="frame-title" style={{ background: node.borderColor, color: bestTextColor(node.borderColor) }}>
        <EditableText
          className="frame-title-text"
          value={node.text}
          editing={editing}
          placeholder="Group name"
          onChange={(v) => updateNode(node.id, { text: v })}
          onCommit={commit}
        />
      </div>
      {selected && (
        <div className="resize" onPointerDown={onResize}>
          <IconResize />
        </div>
      )}
    </div>
  );
}
