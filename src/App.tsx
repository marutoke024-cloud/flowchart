import { useEffect } from "react";
import Canvas from "./Canvas";
import Toolbar from "./Toolbar";
import PropertiesPanel from "./PropertiesPanel";
import ZoomBar from "./ZoomBar";
import Lightbox from "./Lightbox";
import { useStore } from "./store";

export default function App() {
  const hasNodes = useStore((s) => s.nodes.length > 0);
  const panelOpen = useStore((s) => s.selectedId !== null || s.selectedEdgeId !== null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      const editable =
        tag === "input" ||
        tag === "textarea" ||
        (document.activeElement as HTMLElement | null)?.isContentEditable;

      const { selectedId, selectedEdgeId, removeNode, removeEdge, undo, redo } =
        useStore.getState();

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if (!editable && (e.key === "Delete" || e.key === "Backspace")) {
        if (selectedId) {
          e.preventDefault();
          removeNode(selectedId);
        } else if (selectedEdgeId) {
          e.preventDefault();
          removeEdge(selectedEdgeId);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={`app ${panelOpen ? "panel-open" : ""}`}>
      <Canvas />
      {!hasNodes && (
        <div className="hint">
          <h2>Start your diagram</h2>
          <p>Double-tap the canvas or press <b>Add</b> to create a box.</p>
          <p>Drag the dots on a selected box to connect it.</p>
        </div>
      )}
      <Toolbar />
      <PropertiesPanel />
      <ZoomBar />
      <Lightbox />
    </div>
  );
}
