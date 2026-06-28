import { useRef } from "react";
import { useStore } from "./store";
import { fitViewport, viewCenter, downloadJson, fileToDataUrl, emptySpot } from "./utils";
import {
  IconPlus,
  IconUndo,
  IconRedo,
  IconFit,
  IconExport,
  IconImport,
  IconFrame,
  IconImage,
  IconSidebar,
  IconText,
} from "./icons";

const NODE_W = 208;
const NODE_H = 96;

/** Centre point for a new element, nudged to an empty spot. */
function placement(w: number, h: number) {
  const vp = useStore.getState().viewport;
  const c = viewCenter(vp, window.innerWidth, window.innerHeight);
  const boxes = useStore.getState().nodes.filter((n) => n.kind !== "frame");
  return emptySpot(boxes, c.x, c.y, w, h);
}
import type { DiagramEdge, DiagramNode } from "./types";
import ThemeMenu from "./ThemeMenu";

export default function Toolbar() {
  const addNode = useStore((s) => s.addNode);
  const addFrame = useStore((s) => s.addFrame);
  const addImageNode = useStore((s) => s.addImageNode);
  const addText = useStore((s) => s.addText);
  const toggleLeftPanel = useStore((s) => s.toggleLeftPanel);
  const leftPanelOpen = useStore((s) => s.leftPanelOpen);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const setViewport = useStore((s) => s.setViewport);
  const loadDiagram = useStore((s) => s.loadDiagram);
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);

  const fileInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  const onAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await fileToDataUrl(file);
      const img = new Image();
      img.onload = () => {
        const max = 260;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(80, Math.round(img.width * scale));
        const h = Math.max(60, Math.round(img.height * scale));
        const p = placement(w, h);
        addImageNode(p.x, p.y, url, w, h);
      };
      img.src = url;
    } catch {
      alert("Could not load that image.");
    }
    e.target.value = "";
  };

  const onAdd = () => {
    const p = placement(NODE_W, NODE_H);
    addNode(p.x, p.y);
  };

  const onAddFrame = () => {
    const p = placement(460, 320);
    addFrame(p.x, p.y);
  };

  const onAddText = () => {
    const p = placement(180, 40);
    addText(p.x, p.y);
  };

  const onFit = () => {
    const vp = fitViewport(useStore.getState().nodes, window.innerWidth, window.innerHeight);
    if (vp) setViewport(vp);
  };

  const onExport = () => {
    const { nodes, edges } = useStore.getState();
    downloadJson({ version: 1, nodes, edges }, "flowmin-diagram.json");
  };

  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as {
          nodes: DiagramNode[];
          edges: DiagramEdge[];
        };
        if (Array.isArray(data.nodes) && Array.isArray(data.edges)) {
          loadDiagram(data);
          const vp = fitViewport(data.nodes, window.innerWidth, window.innerHeight);
          if (vp) setViewport(vp);
        }
      } catch {
        alert("Could not read that file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="toolbar">
      <div className="brand">
        <svg width="22" height="22" viewBox="0 0 100 100">
          <rect width="100" height="100" rx="22" fill="#222725" />
          <rect x="22" y="28" width="30" height="20" rx="5" fill="#f7f7f2" />
          <rect x="52" y="54" width="30" height="20" rx="5" fill="#899878" />
          <path d="M37 48 L37 64 L52 64" stroke="#f7f7f2" strokeWidth="4" fill="none" />
        </svg>
        <span>FlowMin</span>
      </div>
      <div className="divider" />

      <button className="tbtn primary" onClick={onAdd} title="Add box">
        <IconPlus />
        <span className="lbl">Add</span>
      </button>
      <button className="tbtn" onClick={onAddText} title="Add text to the board">
        <IconText />
        <span className="lbl">Text</span>
      </button>
      <button className="tbtn" onClick={onAddFrame} title="Add frame (group container)">
        <IconFrame />
        <span className="lbl">Frame</span>
      </button>
      <button className="tbtn" onClick={() => imageInput.current?.click()} title="Add image box">
        <IconImage />
        <span className="lbl">Image</span>
      </button>
      <input
        ref={imageInput}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={onAddImage}
      />
      <button
        className={`tbtn ${leftPanelOpen ? "active" : ""}`}
        onClick={toggleLeftPanel}
        title="Toggle writing panel"
      >
        <IconSidebar />
        <span className="lbl">Notes</span>
      </button>

      <button className="tbtn" onClick={undo} disabled={!canUndo} title="Undo (⌘Z)">
        <IconUndo />
      </button>
      <button className="tbtn" onClick={redo} disabled={!canRedo} title="Redo (⌘⇧Z)">
        <IconRedo />
      </button>

      <div className="divider" />

      <ThemeMenu />

      <button className="tbtn" onClick={onFit} title="Fit to screen">
        <IconFit />
      </button>
      <button className="tbtn" onClick={onExport} title="Export JSON">
        <IconExport />
      </button>
      <button className="tbtn" onClick={() => fileInput.current?.click()} title="Import JSON">
        <IconImport />
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        onChange={onImportFile}
      />
    </div>
  );
}
