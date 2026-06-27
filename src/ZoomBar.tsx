import { useStore } from "./store";
import { clamp } from "./geometry";

export default function ZoomBar() {
  const viewport = useStore((s) => s.viewport);
  const setViewport = useStore((s) => s.setViewport);

  const zoomBy = (factor: number) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const zoom = clamp(viewport.zoom * factor, 0.2, 3);
    const k = zoom / viewport.zoom;
    setViewport({
      zoom,
      x: cx - (cx - viewport.x) * k,
      y: cy - (cy - viewport.y) * k,
    });
  };

  return (
    <div className="zoombar">
      <button onClick={() => zoomBy(1 / 1.2)} title="Zoom out">−</button>
      <span className="pct">{Math.round(viewport.zoom * 100)}%</span>
      <button onClick={() => zoomBy(1.2)} title="Zoom in">+</button>
    </div>
  );
}
