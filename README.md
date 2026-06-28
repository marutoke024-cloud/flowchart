# FlowMin

A minimal, FigJam‑style board for **flowcharts, diagrams and wireflows**. Drop boxes
on an infinite canvas, connect them, drop in images and collapsible notes, and recolor
the whole board with one click. Built to feel light on **desktop, iPad Air and phones
(Galaxy S25, etc.)**.

The UI palette is built from a calm porcelain / sage / carbon set, and the diagram
boxes are **colored by default** with switchable theme palettes.

## Features

- **Infinite canvas** — pan (drag the background or two‑finger drag), zoom (`Ctrl`/`⌘` +
  scroll, pinch, or the zoom bar). Works with mouse, trackpad, pen and touch via Pointer
  Events.
- **Boxes** in seven shapes: rounded, rectangle, diamond, ellipse, circle, hexagon,
  parallelogram. Box text is centered and the box auto-grows to fit (diamonds included);
  collapsible notes stay left-aligned.
- **Frames** — drop a large background container (like a FigJam section) to group boxes,
  with an editable title.
- **Corner labels** — pin a small colored, editable tag to a box's top-right corner.
- **Smart connectors** — orthogonal / elbow routing with rounded corners that leave each
  box perpendicular and snap to top/bottom/left/right anchor points; arrows follow the
  active theme color. Connectors **route around** boxes in the way (A\* pathfinding) and
  fall back to a clean elbow when the path is clear.
- **Image boxes** — `+ Image` drops an image as its own box: connectable, labelable,
  resizable on both axes, with a magnifier (or double-click) to view it enlarged.
- **Writing panel** — toggle a left-hand panel and select any box to write a long
  description for it (e.g. select a "climax" box to draft that scene). Built for plotting.
- Typeface is **Noto Sans** (with Noto Sans JP) everywhere you write.
- **Colored by default** + **theme switching** — pick from *Sage, Vivid, Ocean, Sunset,
  Mono*. Switching a theme recolors the whole board consistently; each box keeps its
  color slot. Custom colors are preserved.
- **Images in boxes** — add an image per box; **click/tap it to view it enlarged** in a
  lightbox. Large images are downscaled automatically.
- **Collapsible long text** — add a foldable "details" section to any box for longer
  notes without bloating the diagram.
- **Connectors** with arrowheads and optional labels (e.g. *Yes / No*); solid or dashed,
  recolorable.
- **Auto‑sizing boxes** — height follows content (text wrap, image, notes); width is
  resizable.
- **Undo / redo**, keyboard shortcuts, **autosave** to `localStorage`, and **JSON
  export / import** to save or share a board.
- **Responsive** — the properties panel becomes a bottom sheet on phones; the toolbar
  condenses to icons.

## Usage

| Action | How |
| --- | --- |
| New box | **Add** button, or **double‑click / double‑tap** the canvas |
| Edit text | Double‑click a box; type. `Esc` to finish |
| Move box | Drag it (drag from the text/padding area) |
| Resize width | Drag the square handle (bottom‑right of a selected box) |
| Connect boxes | Select a box, drag from one of the round handles onto another box |
| Style a box | Use the properties panel (shape, fill, text color, border, image, notes) |
| Switch theme | **Theme** in the toolbar |
| Enlarge an image | Click / tap the image inside a box |
| Delete | Select a box or connector, press `Delete` / `Backspace` |
| Undo / redo | `⌘/Ctrl+Z`, `⌘/Ctrl+Shift+Z` (or `Ctrl+Y`) |
| Save / load | Export / Import (JSON) in the toolbar; autosaves locally too |

## Development

```bash
npm install
npm run dev        # start the dev server
npm run build      # type-check + production build to dist/
npm run preview    # preview the production build
```

Stack: **React + TypeScript + Vite**, state via **Zustand**. No backend — everything
runs in the browser and persists to `localStorage`. The build (`dist/`) is fully static
and can be hosted anywhere (e.g. GitHub Pages); asset paths are relative.

## Project layout

```
src/
  store.ts          Zustand store: nodes, edges, viewport, theme, history, persistence
  theme.ts          Diagram themes + UI palette constants
  Canvas.tsx        Infinite canvas: pan / pinch / zoom, linking, add-on-double-click
  Node.tsx          A box: shapes, editable text, image, collapsible notes, handles
  Edges.tsx         SVG connector layer with arrowheads and labels
  PropertiesPanel.tsx  Box / connector styling
  ThemeMenu.tsx     Theme palette switcher
  Toolbar.tsx, ZoomBar.tsx, Lightbox.tsx, EditableText.tsx
  geometry.ts, utils.ts, icons.tsx, types.ts
```
