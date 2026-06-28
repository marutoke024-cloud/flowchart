import { useState } from "react";
import { useStore } from "./store";

const SHAPES = [
  { c: "#222725", s: "circle" },
  { c: "#899878", s: "diamond" },
  { c: "#e4e6c3", s: "square" },
  { c: "#22c55e", s: "square" },
  { c: "#a9b388", s: "triangle" },
  { c: "#5f6f52", s: "circle" },
  { c: "#cdd0a8", s: "square" },
  { c: "#f59e0b", s: "diamond" },
  { c: "#334155", s: "square" },
  { c: "#9fb6a8", s: "circle" },
  { c: "#222725", s: "triangle" },
  { c: "#899878", s: "square" },
];

function Shape({ kind, color }: { kind: string; color: string }) {
  if (kind === "circle") return <span className="orb-shape" style={{ background: color, borderRadius: "50%" }} />;
  if (kind === "diamond")
    return <span className="orb-shape" style={{ background: color, borderRadius: 8, transform: "rotate(45deg)" }} />;
  if (kind === "triangle")
    return (
      <span
        className="orb-shape"
        style={{ width: 0, height: 0, background: "transparent", borderLeft: "16px solid transparent", borderRight: "16px solid transparent", borderBottom: `28px solid ${color}` }}
      />
    );
  return <span className="orb-shape" style={{ background: color, borderRadius: 10 }} />;
}

export default function Home() {
  const setView = useStore((s) => s.setView);
  const newWork = useStore((s) => s.newWork);
  const loadWork = useStore((s) => s.loadWork);
  const deleteWork = useStore((s) => s.deleteWork);
  const works = useStore((s) => s.works);
  const [showWorks, setShowWorks] = useState(false);

  const R = 270;

  return (
    <div className="home">
      <nav className="home-nav">
        <div className="home-brand">FlowMin</div>
        <div className="home-links">
          <button className="home-link" onClick={() => setView("editor")}>
            Continue editing the latest diagram
          </button>
          <button className="home-link" onClick={() => setShowWorks(true)}>
            Works
          </button>
          <button className="home-link strong" onClick={newWork}>
            New Work
          </button>
        </div>
      </nav>

      <div className="home-stage">
        <div className="home-orbit">
          <div className="home-ring">
            {SHAPES.map((sh, i) => {
              const a = (i / SHAPES.length) * 360;
              return (
                <div
                  key={i}
                  className="orb-slot"
                  style={{ transform: `rotate(${a}deg) translate(${R}px) rotate(${-a}deg)` }}
                >
                  <div className="orb-counter">
                    <Shape kind={sh.s} color={sh.c} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="home-hero">
          <div className="home-line">
            <h1>Diagrams</h1>
            <p>Map how it works.</p>
          </div>
          <div className="home-amp">&amp;</div>
          <div className="home-line right">
            <h1>Stories</h1>
            <p>Plot how it unfolds.</p>
          </div>
        </div>
      </div>

      {showWorks && (
        <div className="works-overlay" onClick={() => setShowWorks(false)}>
          <div className="works-modal" onClick={(e) => e.stopPropagation()}>
            <div className="works-head">
              <h3>Works</h3>
              <button className="leftpanel-close" onClick={() => setShowWorks(false)}>
                ×
              </button>
            </div>
            {works.length === 0 ? (
              <p className="works-empty">No saved works yet. Open a board and press Save.</p>
            ) : (
              <ul className="works-list">
                {works.map((w) => (
                  <li key={w.id}>
                    <button className="works-open" onClick={() => loadWork(w.id)}>
                      <span className="works-name">{w.name}</span>
                      <span className="works-meta">
                        {w.data.nodes.length} items · {new Date(w.updatedAt).toLocaleDateString()}
                      </span>
                    </button>
                    <button
                      className="works-del"
                      title="Delete"
                      onClick={() => {
                        if (confirm(`Delete "${w.name}"?`)) deleteWork(w.id);
                      }}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
