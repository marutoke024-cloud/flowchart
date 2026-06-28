import { useRef } from "react";
import { useStore } from "./store";
import { themeByName } from "./theme";
import { bestTextColor, fileToDataUrl } from "./utils";
import { IconImage, IconTag, IconTrash } from "./icons";
import { ShapeIcon } from "./icons";
import type { ShapeKind } from "./types";

const SHAPES: ShapeKind[] = [
  "rounded",
  "rect",
  "diamond",
  "ellipse",
  "circle",
  "hexagon",
  "parallelogram",
];

const LABEL_COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#0ea5e9", "#8b5cf6", "#64748b"];

function NodePanel({ id }: { id: string }) {
  const node = useStore((s) => s.nodes.find((n) => n.id === id))!;
  const themeName = useStore((s) => s.theme);
  const updateNode = useStore((s) => s.updateNode);
  const removeNode = useStore((s) => s.removeNode);
  const commit = useStore((s) => s.commit);
  const fileInput = useRef<HTMLInputElement>(null);
  const palette = themeByName(themeName);

  if (!node) return null;

  const set = (patch: Parameters<typeof updateNode>[1], history = false) => {
    if (history) commit();
    updateNode(id, patch);
  };

  const onImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await fileToDataUrl(file);
      commit();
      updateNode(id, { image: url });
    } catch {
      alert("Could not load that image.");
    }
    e.target.value = "";
  };

  return (
    <div className="panel">
      <div>
        <h4>Shape</h4>
        <div className="shape-row">
          {SHAPES.map((sk) => (
            <button
              key={sk}
              className={`shape-btn ${node.shape === sk ? "active" : ""}`}
              onClick={() => set({ shape: sk }, true)}
              title={sk}
            >
              <ShapeIcon kind={sk} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4>Fill · {palette.name} theme</h4>
        <div className="swatches">
          {palette.colors.map((c, i) => (
            <button
              key={c + i}
              className={`swatch ${node.colorKey === i ? "active" : ""}`}
              style={{ background: c }}
              onClick={() =>
                set({ fill: c, colorKey: i, textColor: bestTextColor(c) }, true)
              }
            />
          ))}
          <label className="swatch-custom" title="Custom fill">
            <input
              type="color"
              value={node.fill}
              onPointerDown={() => commit()}
              onChange={(e) =>
                set({ fill: e.target.value, colorKey: undefined })
              }
            />
          </label>
        </div>
      </div>

      <div>
        <h4>Text color</h4>
        <div className="swatches">
          {["#0f172a", "#ffffff", "#4f46e5", "#16a34a", "#dc2626"].map((c) => (
            <button
              key={c}
              className={`swatch ${node.textColor === c ? "active" : ""}`}
              style={{ background: c }}
              onClick={() => set({ textColor: c }, true)}
            />
          ))}
          <label className="swatch-custom" title="Custom text color">
            <input
              type="color"
              value={node.textColor}
              onPointerDown={() => commit()}
              onChange={(e) => set({ textColor: e.target.value })}
            />
          </label>
        </div>
      </div>

      <div>
        <h4>Border</h4>
        <div className="field">
          <label>Style</label>
          <select
            value={node.borderStyle}
            onChange={(e) => set({ borderStyle: e.target.value as never }, true)}
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="none">None</option>
          </select>
          <label className="swatch-custom" title="Border color">
            <input
              type="color"
              value={node.borderColor}
              onPointerDown={() => commit()}
              onChange={(e) => set({ borderColor: e.target.value })}
            />
          </label>
        </div>
        <div className="field">
          <label>Thickness</label>
          <input
            type="range"
            min={1}
            max={8}
            value={node.borderWidth}
            onPointerDown={() => commit()}
            onChange={(e) => set({ borderWidth: Number(e.target.value) })}
          />
          <span className="val">{node.borderWidth}px</span>
        </div>
        {node.shape === "rounded" && (
          <div className="field">
            <label>Roundness</label>
            <input
              type="range"
              min={0}
              max={48}
              value={node.roundness}
              onPointerDown={() => commit()}
              onChange={(e) => set({ roundness: Number(e.target.value) })}
            />
            <span className="val">{node.roundness}px</span>
          </div>
        )}
      </div>

      <div>
        <h4>Content</h4>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={onImage}
        />
        <button className="panel-btn" onClick={() => fileInput.current?.click()}>
          <IconImage />
          {node.image ? "Replace image" : "Add image"}
        </button>
        {node.image && (
          <button
            className="panel-btn"
            style={{ marginTop: 6 }}
            onClick={() => set({ image: undefined }, true)}
          >
            Remove image
          </button>
        )}
        <button
          className="panel-btn"
          style={{ marginTop: 6 }}
          onClick={() =>
            node.details === undefined
              ? set({ details: "", detailsOpen: true }, true)
              : set({ details: undefined, detailsOpen: false }, true)
          }
        >
          {node.details === undefined ? "Add collapsible notes" : "Remove notes"}
        </button>
      </div>

      <div>
        <h4>Corner label</h4>
        {node.label === undefined ? (
          <button
            className="panel-btn"
            onClick={() => set({ label: { text: "Label", color: LABEL_COLORS[0] } }, true)}
          >
            <IconTag />
            Add label
          </button>
        ) : (
          <>
            <div className="swatches">
              {LABEL_COLORS.map((c) => (
                <button
                  key={c}
                  className={`swatch ${node.label!.color === c ? "active" : ""}`}
                  style={{ background: c }}
                  onClick={() => set({ label: { ...node.label!, color: c } }, true)}
                />
              ))}
              <label className="swatch-custom" title="Custom label color">
                <input
                  type="color"
                  value={node.label.color}
                  onPointerDown={() => commit()}
                  onChange={(e) => set({ label: { ...node.label!, color: e.target.value } })}
                />
              </label>
            </div>
            <button
              className="panel-btn"
              style={{ marginTop: 8 }}
              onClick={() => set({ label: undefined }, true)}
            >
              Remove label
            </button>
          </>
        )}
      </div>

      <button className="panel-btn danger" onClick={() => removeNode(id)}>
        <IconTrash />
        Delete node
      </button>
    </div>
  );
}

function FramePanel({ id }: { id: string }) {
  const node = useStore((s) => s.nodes.find((n) => n.id === id));
  const updateNode = useStore((s) => s.updateNode);
  const removeNode = useStore((s) => s.removeNode);
  const commit = useStore((s) => s.commit);
  if (!node) return null;

  const FILLS = ["#fbf7e9", "#eef2ff", "#ecfdf5", "#fdf2f8", "#f1f5f9", "#ffffff"];

  return (
    <div className="panel">
      <div>
        <h4>Frame fill</h4>
        <div className="swatches">
          {FILLS.map((c) => (
            <button
              key={c}
              className={`swatch ${node.fill === c ? "active" : ""}`}
              style={{ background: c }}
              onClick={() => {
                commit();
                updateNode(id, { fill: c });
              }}
            />
          ))}
          <label className="swatch-custom" title="Custom fill">
            <input
              type="color"
              value={node.fill}
              onPointerDown={() => commit()}
              onChange={(e) => updateNode(id, { fill: e.target.value })}
            />
          </label>
        </div>
      </div>
      <div>
        <h4>Frame accent</h4>
        <div className="swatches">
          <label className="swatch-custom" title="Title & border color">
            <input
              type="color"
              value={node.borderColor}
              onPointerDown={() => commit()}
              onChange={(e) => updateNode(id, { borderColor: e.target.value })}
            />
          </label>
          <span style={{ fontSize: 12, color: "var(--muted)", alignSelf: "center" }}>
            Title &amp; border
          </span>
        </div>
      </div>
      <button className="panel-btn danger" onClick={() => removeNode(id)}>
        <IconTrash />
        Delete frame
      </button>
    </div>
  );
}

function EdgePanel({ id }: { id: string }) {
  const edge = useStore((s) => s.edges.find((e) => e.id === id));
  const updateEdge = useStore((s) => s.updateEdge);
  const removeEdge = useStore((s) => s.removeEdge);
  const commit = useStore((s) => s.commit);
  if (!edge) return null;

  return (
    <div className="panel">
      <div>
        <h4>Connector color</h4>
        <div className="swatches">
          {["#94a3b8", "#0f172a", "#4f46e5", "#16a34a", "#f97316", "#dc2626"].map((c) => (
            <button
              key={c}
              className={`swatch ${edge.color === c ? "active" : ""}`}
              style={{ background: c }}
              onClick={() => {
                commit();
                updateEdge(id, { color: c });
              }}
            />
          ))}
        </div>
      </div>
      <div className="field">
        <label>Dashed</label>
        <input
          type="checkbox"
          checked={!!edge.dashed}
          onChange={(e) => {
            commit();
            updateEdge(id, { dashed: e.target.checked });
          }}
        />
      </div>
      <div>
        <h4>Label</h4>
        <input
          className="panel-btn"
          style={{ textAlign: "left", padding: "0 10px" }}
          value={edge.label ?? ""}
          placeholder="e.g. Yes / No"
          onFocus={() => commit()}
          onChange={(e) => updateEdge(id, { label: e.target.value })}
        />
      </div>
      <button className="panel-btn danger" onClick={() => removeEdge(id)}>
        <IconTrash />
        Delete connector
      </button>
    </div>
  );
}

export default function PropertiesPanel() {
  const selectedId = useStore((s) => s.selectedId);
  const selectedEdgeId = useStore((s) => s.selectedEdgeId);
  const selectedKind = useStore((s) => s.nodes.find((n) => n.id === s.selectedId)?.kind);
  if (selectedId) return selectedKind === "frame" ? <FramePanel id={selectedId} /> : <NodePanel id={selectedId} />;
  if (selectedEdgeId) return <EdgePanel id={selectedEdgeId} />;
  return null;
}
