import { useState } from "react";
import { useStore } from "./store";

/* Distinctive, unevenly-sized orbiting tiles (inspired by the reference). */
const ORBS: { size: number; el: React.ReactNode }[] = [
  {
    size: 62,
    el: (
      <svg viewBox="0 0 62 62" width="62" height="62">
        <rect width="62" height="62" rx="13" fill="#2f4a32" />
        <rect x="5" y="5" width="52" height="52" rx="9" fill="none" stroke="#a8c66c" strokeWidth="1.5" />
        <text x="31" y="42" textAnchor="middle" fontFamily="Georgia, serif" fontSize="30" fill="#dbe8a6">Gg</text>
      </svg>
    ),
  },
  {
    size: 46,
    el: (
      <svg viewBox="0 0 46 46" width="46" height="46">
        <rect x="9" y="9" width="28" height="28" rx="8" transform="rotate(45 23 23)" fill="#9bcf5f" />
        <path d="M23 11 L25.5 20.5 35 23 25.5 25.5 23 35 20.5 25.5 11 23 20.5 20.5 Z" fill="#22351f" />
      </svg>
    ),
  },
  {
    size: 38,
    el: (
      <svg viewBox="0 0 38 38" width="38" height="38">
        <circle cx="19" cy="19" r="19" fill="#14201a" />
        <text x="19" y="27" textAnchor="middle" fontFamily="Georgia, serif" fontSize="20" fill="#cfe89a">g</text>
      </svg>
    ),
  },
  {
    size: 54,
    el: (
      <svg viewBox="0 0 54 54" width="54" height="54">
        <rect width="54" height="54" rx="13" fill="#bfe0e8" />
        <path d="M14 17h4l3 16h14l3-11H21" fill="none" stroke="#1f3a3a" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx="24" cy="38" r="2.6" fill="#1f3a3a" />
        <circle cx="35" cy="38" r="2.6" fill="#1f3a3a" />
        <circle cx="39" cy="16" r="4" fill="#cfe23f" />
      </svg>
    ),
  },
  {
    size: 48,
    el: (
      <svg viewBox="0 0 48 48" width="48" height="48">
        <polygon points="24,6 42,16 24,26 6,16" fill="#15201a" />
        <polygon points="6,16 24,26 24,44 6,34" fill="#5f7a3f" />
        <polygon points="42,16 24,26 24,44 42,34" fill="#cfe23f" />
      </svg>
    ),
  },
  {
    size: 42,
    el: (
      <svg viewBox="0 0 42 42" width="42" height="42">
        <rect width="42" height="42" rx="11" fill="#2c3b34" />
        <circle cx="14" cy="14" r="3.4" fill="#e9d24b" />
        <circle cx="28" cy="14" r="3.4" fill="#c0c8c4" />
        <circle cx="14" cy="28" r="3.4" fill="#9bcf5f" />
        <circle cx="28" cy="28" r="3.4" fill="#e08a4a" />
      </svg>
    ),
  },
  {
    size: 58,
    el: (
      <svg viewBox="0 0 58 58" width="58" height="58">
        <rect width="58" height="58" rx="13" fill="#22534a" />
        {[10, 22, 34, 46].map((x) =>
          [10, 22, 34, 46].map((y) => (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width="9"
              height="9"
              rx="2"
              fill={(x + y) % 24 === 0 ? "#cfe23f" : (x * y) % 7 === 0 ? "#7fb39a" : "#19463d"}
            />
          )),
        )}
      </svg>
    ),
  },
  {
    size: 50,
    el: (
      <svg viewBox="0 0 50 50" width="50" height="50">
        <polygon points="25,5 45,16 25,27 5,16" fill="#b7d27a" />
        <polygon points="5,16 25,27 25,47 5,36" fill="#4f7a3f" />
        <polygon points="45,16 25,27 25,47 45,36" fill="#2f4a32" />
      </svg>
    ),
  },
  {
    size: 48,
    el: (
      <svg viewBox="0 0 48 48" width="48" height="48">
        <rect width="48" height="48" rx="12" fill="#8a7d50" />
        <path d="M9 30 C16 16 22 38 28 26 S40 18 41 24" fill="none" stroke="#f3efdf" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    size: 44,
    el: (
      <svg viewBox="0 0 44 44" width="44" height="44">
        <polygon points="8,12 36,8 40,16 12,20" fill="#356b52" />
        <polygon points="8,21 36,17 40,25 12,29" fill="#6f9b73" />
        <polygon points="8,30 36,26 40,34 12,38" fill="#9bcf5f" />
      </svg>
    ),
  },
  {
    size: 34,
    el: (
      <svg viewBox="0 0 40 40" width="34" height="34">
        <rect x="4" y="20" width="14" height="14" rx="3" fill="#6fb0c4" />
        <circle cx="29" cy="27" r="7" fill="#2f4a32" />
        <polygon points="20,4 28,18 12,18" fill="#cfe23f" />
      </svg>
    ),
  },
];

export default function Home() {
  const setView = useStore((s) => s.setView);
  const newWork = useStore((s) => s.newWork);
  const loadWork = useStore((s) => s.loadWork);
  const deleteWork = useStore((s) => s.deleteWork);
  const works = useStore((s) => s.works);
  const [showWorks, setShowWorks] = useState(false);

  const R = 330;

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
          <div className="home-tilt">
            <div className="home-ring">
              {ORBS.map((o, i) => {
                const a = (i / ORBS.length) * 360;
                return (
                  <div
                    key={i}
                    className="orb-slot"
                    style={{
                      transform: `rotate(${a}deg) translate(${R}px) rotate(${-a}deg)`,
                      margin: -o.size / 2,
                    }}
                  >
                    <div className="orb-counter">
                      <div className="orb-deskew">{o.el}</div>
                    </div>
                  </div>
                );
              })}
            </div>
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
