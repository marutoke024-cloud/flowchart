import { useEffect, useRef, useState } from "react";
import { useStore } from "./store";
import { THEMES } from "./theme";
import { IconPalette } from "./icons";

export default function ThemeMenu() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  return (
    <div className="theme-menu" ref={ref}>
      <button
        className={`tbtn ${open ? "active" : ""}`}
        onClick={() => setOpen((o) => !o)}
        title="Theme colors"
      >
        <IconPalette />
        <span className="lbl">Theme</span>
      </button>

      {open && (
        <div className="theme-pop">
          <h4>Theme colors</h4>
          {THEMES.map((t) => (
            <button
              key={t.name}
              className={`theme-row ${t.name === theme ? "active" : ""}`}
              onClick={() => {
                setTheme(t.name);
                setOpen(false);
              }}
            >
              <span className="theme-swatches">
                {t.colors.map((c, i) => (
                  <span key={i} style={{ background: c }} />
                ))}
              </span>
              <span className="theme-name">{t.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
