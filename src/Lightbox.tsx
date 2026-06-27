import { useEffect } from "react";
import { useStore } from "./store";

export default function Lightbox() {
  const src = useStore((s) => s.lightboxSrc);
  const close = useStore((s) => s.openLightbox);

  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [src, close]);

  if (!src) return null;
  return (
    <div className="lightbox" onClick={() => close(null)}>
      <button className="close" onClick={() => close(null)} aria-label="Close">
        ×
      </button>
      <img src={src} alt="" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
