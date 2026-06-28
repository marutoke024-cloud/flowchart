import type { ShapeKind } from "./types";

const s = { width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const IconPlus = () => (
  <svg viewBox="0 0 24 24" {...s}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconUndo = () => (
  <svg viewBox="0 0 24 24" {...s}><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5H8" /></svg>
);
export const IconRedo = () => (
  <svg viewBox="0 0 24 24" {...s}><path d="m15 14 5-5-5-5" /><path d="M20 9H9a5 5 0 0 0-5 5v0a5 5 0 0 0 5 5h7" /></svg>
);
export const IconFit = () => (
  <svg viewBox="0 0 24 24" {...s}><path d="M9 3H5a2 2 0 0 0-2 2v4M15 3h4a2 2 0 0 1 2 2v4M9 21H5a2 2 0 0 1-2-2v-4M15 21h4a2 2 0 0 0 2-2v-4" /></svg>
);
export const IconExport = () => (
  <svg viewBox="0 0 24 24" {...s}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>
);
export const IconImport = () => (
  <svg viewBox="0 0 24 24" {...s}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg>
);
export const IconImage = () => (
  <svg viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="1.6" /><path d="m21 15-5-5L5 21" /></svg>
);
export const IconTrash = () => (
  <svg viewBox="0 0 24 24" {...s}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
);
export const IconFrame = () => (
  <svg viewBox="0 0 24 24" {...s}><path d="M4 8h16M4 16h16M8 4v16M16 4v16" /><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
);
export const IconTag = () => (
  <svg viewBox="0 0 24 24" {...s}><path d="M20.6 13.4 13 21a2 2 0 0 1-2.8 0l-7-7a2 2 0 0 1 0-2.8L10.8 3H20a1 1 0 0 1 1 1v9.4Z" /><circle cx="16.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" /></svg>
);
export const IconPalette = () => (
  <svg viewBox="0 0 24 24" {...s}><path d="M12 22a10 10 0 1 1 0-20c5.5 0 10 3.8 10 8.5 0 3-2.5 4.5-5 4.5h-1.8c-.8 0-1.5.7-1.5 1.5 0 .4.2.8.4 1 .3.4.5.8.5 1.3 0 1.2-1 2.2-2.1 2.2Z" /><circle cx="7.5" cy="11" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" /><circle cx="16.5" cy="11" r="1" fill="currentColor" stroke="none" /></svg>
);
export const IconChevron = () => (
  <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>
);

export function ShapeIcon({ kind }: { kind: ShapeKind }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinejoin: "round" as const };
  switch (kind) {
    case "rect":
      return <svg viewBox="0 0 24 24" width={20} height={20}><rect x="3" y="6" width="18" height="12" {...p} /></svg>;
    case "rounded":
      return <svg viewBox="0 0 24 24" width={20} height={20}><rect x="3" y="6" width="18" height="12" rx="5" {...p} /></svg>;
    case "diamond":
      return <svg viewBox="0 0 24 24" width={20} height={20}><path d="M12 3 21 12 12 21 3 12Z" {...p} /></svg>;
    case "ellipse":
      return <svg viewBox="0 0 24 24" width={20} height={20}><ellipse cx="12" cy="12" rx="9" ry="6.5" {...p} /></svg>;
    case "hexagon":
      return <svg viewBox="0 0 24 24" width={20} height={20}><path d="M7 5h10l4 7-4 7H7l-4-7Z" {...p} /></svg>;
    case "circle":
      return <svg viewBox="0 0 24 24" width={20} height={20}><circle cx="12" cy="12" r="8.5" {...p} /></svg>;
    case "parallelogram":
      return <svg viewBox="0 0 24 24" width={20} height={20}><path d="M8 6h13l-5 12H3Z" {...p} /></svg>;
  }
}
