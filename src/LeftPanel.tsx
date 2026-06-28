import { useStore } from "./store";

/**
 * A toggleable writing panel on the left. When a box is selected you can write
 * a long description for it (e.g. the scene behind a "climax" node).
 */
export default function LeftPanel() {
  const open = useStore((s) => s.leftPanelOpen);
  const toggle = useStore((s) => s.toggleLeftPanel);
  const node = useStore((s) => s.nodes.find((n) => n.id === s.selectedId));
  const updateNode = useStore((s) => s.updateNode);
  const commit = useStore((s) => s.commit);

  if (!open) return null;

  const writable = node && node.kind !== "frame";

  return (
    <aside className="leftpanel">
      <div className="leftpanel-head">
        <span className="leftpanel-title">
          {writable ? node!.text || "Untitled box" : "Writing panel"}
        </span>
        <button className="leftpanel-close" onClick={toggle} aria-label="Hide panel">
          ×
        </button>
      </div>

      {writable ? (
        <textarea
          key={node!.id}
          className="leftpanel-text"
          placeholder="Write the details for this box…"
          value={node!.description ?? ""}
          onFocus={commit}
          onChange={(e) => updateNode(node!.id, { description: e.target.value })}
        />
      ) : (
        <div className="leftpanel-empty">
          Select a box to write its details here.
          <br />
          Great for plotting a story scene-by-scene.
        </div>
      )}
    </aside>
  );
}
