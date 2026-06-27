import { clamp } from "./geometry";
import type { DiagramNode, Viewport } from "./types";

/** Read an image file and return a downscaled data URL (max 1100px edge). */
export function fileToDataUrl(file: File, maxEdge = 1100): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("bad image"));
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        if (scale === 1) {
          resolve(reader.result as string);
          return;
        }
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Viewport that fits all nodes within the screen with padding. */
export function fitViewport(nodes: DiagramNode[], w: number, h: number): Viewport | null {
  if (nodes.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  }
  const pad = 80;
  const bw = maxX - minX || 1;
  const bh = maxY - minY || 1;
  const zoom = clamp(Math.min((w - pad * 2) / bw, (h - pad * 2) / bh), 0.2, 1.4);
  return {
    zoom,
    x: w / 2 - ((minX + maxX) / 2) * zoom,
    y: h / 2 - ((minY + maxY) / 2) * zoom,
  };
}

/** World point at the center of the current viewport. */
export function viewCenter(vp: Viewport, w: number, h: number) {
  return { x: (w / 2 - vp.x) / vp.zoom, y: (h / 2 - vp.y) / vp.zoom };
}

/** Pick a readable text colour (near-black or off-white) for a given fill. */
export function bestTextColor(fill: string): string {
  const hex = fill.replace("#", "");
  if (hex.length < 6) return "#1A1C1A";
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return lum > 0.5 ? "#1A1C1A" : "#FBFBF7";
}

export function downloadJson(data: unknown, name: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
