import { create } from "zustand";
import { nanoid } from "nanoid";
import type {
  DiagramEdge,
  DiagramNode,
  DiagramSnapshot,
  ShapeKind,
  Viewport,
} from "./types";
import {
  arrowColor,
  DEFAULT_COLOR_KEY,
  DEFAULT_THEME,
  FRAME_DEFAULTS,
  NODE_DEFAULTS,
  themeByName,
} from "./theme";
import { bestTextColor, frameAccent, tint } from "./utils";
import type { Side } from "./types";

const STORAGE_KEY = "flowmin.diagram.v1";
const WORKS_KEY = "flowmin.works.v1";
const HISTORY_LIMIT = 60;

export interface SavedWork {
  id: string;
  name: string;
  updatedAt: number;
  data: {
    nodes: DiagramNode[];
    edges: DiagramEdge[];
    theme: string;
    boardBg: string;
    viewport: Viewport;
  };
}

function loadWorks(): SavedWork[] {
  try {
    const raw = localStorage.getItem(WORKS_KEY);
    return raw ? (JSON.parse(raw) as SavedWork[]) : [];
  } catch {
    return [];
  }
}
function saveWorks(works: SavedWork[]) {
  try {
    localStorage.setItem(WORKS_KEY, JSON.stringify(works));
  } catch {
    /* storage full */
  }
}

interface PersistShape {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  viewport: Viewport;
  theme?: string;
  boardBg?: string;
  leftPanelOpen?: boolean;
}

function boardBgFor(theme: string): string {
  return tint(themeByName(theme).colors[5], 0.4);
}

function loadPersisted(): PersistShape | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistShape;
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) return null;
    return parsed;
  } catch {
    return null;
  }
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
function persist(state: DiagramState) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const payload: PersistShape = {
        nodes: state.nodes,
        edges: state.edges,
        viewport: state.viewport,
        theme: state.theme,
        boardBg: state.boardBg,
        leftPanelOpen: state.leftPanelOpen,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* storage may be full or unavailable — fail silently */
    }
  }, 300);
}

export interface DiagramState {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  viewport: Viewport;
  selectedId: string | null;
  selectedEdgeId: string | null;
  editingId: string | null;
  lightboxSrc: string | null;
  theme: string;
  boardBg: string;
  leftPanelOpen: boolean;

  // app shell + persistence to "Works"
  view: "home" | "editor";
  works: SavedWork[];
  currentWorkId: string | null;
  dirty: boolean;

  past: DiagramSnapshot[];
  future: DiagramSnapshot[];

  // history helpers
  commit: () => void;

  // selection / editing
  select: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  setEditing: (id: string | null) => void;
  openLightbox: (src: string | null) => void;

  // viewport
  setViewport: (vp: Viewport) => void;

  // theme
  setTheme: (name: string) => void;

  // ui
  toggleLeftPanel: () => void;

  // app shell
  setView: (v: "home" | "editor") => void;
  saveWork: (name?: string) => void;
  newWork: () => void;
  loadWork: (id: string) => void;
  deleteWork: (id: string) => void;

  // node ops
  addNode: (x: number, y: number, shape?: ShapeKind) => string;
  addFrame: (x: number, y: number) => string;
  addImageNode: (x: number, y: number, image: string, width: number, height: number) => string;
  addText: (x: number, y: number) => string;
  updateNode: (id: string, patch: Partial<DiagramNode>) => void;
  removeNode: (id: string) => void;

  // edge ops
  addEdge: (from: string, to: string, fromSide?: Side, toSide?: Side) => void;
  updateEdge: (id: string, patch: Partial<DiagramEdge>) => void;
  removeEdge: (id: string) => void;

  // global
  undo: () => void;
  redo: () => void;
  clearAll: () => void;
  loadDiagram: (data: { nodes: DiagramNode[]; edges: DiagramEdge[] }) => void;
}

const persisted = loadPersisted();

function snapshot(state: DiagramState): DiagramSnapshot {
  return {
    nodes: state.nodes.map((n) => ({ ...n })),
    edges: state.edges.map((e) => ({ ...e })),
  };
}

export const useStore = create<DiagramState>((set, get) => ({
  nodes: persisted?.nodes ?? [],
  edges: persisted?.edges ?? [],
  viewport: persisted?.viewport ?? { x: 0, y: 0, zoom: 1 },
  theme: persisted?.theme ?? DEFAULT_THEME,
  boardBg: persisted?.boardBg ?? boardBgFor(persisted?.theme ?? DEFAULT_THEME),
  leftPanelOpen: persisted?.leftPanelOpen ?? false,
  view: "home",
  works: loadWorks(),
  currentWorkId: null,
  dirty: false,
  selectedId: null,
  selectedEdgeId: null,
  editingId: null,
  lightboxSrc: null,
  past: [],
  future: [],

  commit: () => {
    const s = get();
    const past = [...s.past, snapshot(s)].slice(-HISTORY_LIMIT);
    set({ past, future: [], dirty: true });
  },

  select: (id) => set({ selectedId: id, selectedEdgeId: null }),
  selectEdge: (id) => set({ selectedEdgeId: id, selectedId: null }),
  setEditing: (id) => set({ editingId: id }),
  openLightbox: (src) => set({ lightboxSrc: src }),

  setViewport: (vp) => {
    set({ viewport: vp });
    persist(get());
  },

  toggleLeftPanel: () => {
    set((s) => ({ leftPanelOpen: !s.leftPanelOpen }));
    persist(get());
  },

  setView: (v) => set({ view: v }),

  saveWork: (name) => {
    const s = get();
    const data = {
      nodes: s.nodes.map((n) => ({ ...n })),
      edges: s.edges.map((e) => ({ ...e })),
      theme: s.theme,
      boardBg: s.boardBg,
      viewport: s.viewport,
    };
    const now = Date.now();
    let id = s.currentWorkId;
    let works: SavedWork[];
    if (id && s.works.some((w) => w.id === id)) {
      works = s.works.map((w) => (w.id === id ? { ...w, name: name ?? w.name, updatedAt: now, data } : w));
    } else {
      id = nanoid(8);
      works = [{ id, name: name?.trim() || `Untitled ${s.works.length + 1}`, updatedAt: now, data }, ...s.works];
    }
    saveWorks(works);
    set({ works, currentWorkId: id, dirty: false });
  },

  newWork: () => {
    set({
      nodes: [],
      edges: [],
      selectedId: null,
      selectedEdgeId: null,
      editingId: null,
      currentWorkId: null,
      dirty: false,
      view: "editor",
      past: [],
      future: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    });
    persist(get());
  },

  loadWork: (id) => {
    const w = get().works.find((x) => x.id === id);
    if (!w) return;
    const d = w.data;
    set({
      nodes: d.nodes.map((n) => ({ ...n })),
      edges: d.edges.map((e) => ({ ...e })),
      theme: d.theme ?? get().theme,
      boardBg: d.boardBg ?? boardBgFor(d.theme ?? get().theme),
      viewport: d.viewport ?? { x: 0, y: 0, zoom: 1 },
      currentWorkId: id,
      dirty: false,
      view: "editor",
      selectedId: null,
      selectedEdgeId: null,
      editingId: null,
      past: [],
      future: [],
    });
    persist(get());
  },

  deleteWork: (id) => {
    const works = get().works.filter((w) => w.id !== id);
    saveWorks(works);
    set((s) => ({ works, currentWorkId: s.currentWorkId === id ? null : s.currentWorkId }));
  },

  setTheme: (name) => {
    get().commit();
    const palette = themeByName(name);
    set((s) => ({
      theme: name,
      boardBg: boardBgFor(name),
      // recolour boxes that follow a theme slot; frames get a tinted fill +
      // matching accent; custom box colours are left as-is
      nodes: s.nodes.map((n) => {
        if (n.kind === "frame") {
          const fill = tint(palette.colors[0], 0.86);
          return { ...n, fill, borderColor: frameAccent(fill) };
        }
        if (n.colorKey === undefined) return n;
        const fill = palette.colors[n.colorKey] ?? n.fill;
        return { ...n, fill, textColor: bestTextColor(fill) };
      }),
      // recolour connectors that follow the theme
      edges: s.edges.map((e) =>
        e.themed === false ? e : { ...e, color: palette.arrow },
      ),
    }));
    persist(get());
  },

  addNode: (x, y, shape = "rounded") => {
    get().commit();
    const id = nanoid(8);
    const palette = themeByName(get().theme);
    const fill = palette.colors[DEFAULT_COLOR_KEY];
    const node: DiagramNode = {
      id,
      x: Math.round(x - NODE_DEFAULTS.width / 2),
      y: Math.round(y - NODE_DEFAULTS.height / 2),
      width: NODE_DEFAULTS.width,
      height: NODE_DEFAULTS.height,
      shape,
      text: "",
      fill,
      colorKey: DEFAULT_COLOR_KEY,
      textColor: bestTextColor(fill),
      borderColor: NODE_DEFAULTS.borderColor,
      borderWidth: NODE_DEFAULTS.borderWidth,
      borderStyle: "none",
      roundness: NODE_DEFAULTS.roundness,
    };
    set((s) => ({
      nodes: [...s.nodes, node],
      selectedId: id,
      selectedEdgeId: null,
      editingId: id,
    }));
    persist(get());
    return id;
  },

  addFrame: (x, y) => {
    get().commit();
    const id = nanoid(8);
    const frame: DiagramNode = {
      id,
      kind: "frame",
      x: Math.round(x - FRAME_DEFAULTS.width / 2),
      y: Math.round(y - FRAME_DEFAULTS.height / 2),
      width: FRAME_DEFAULTS.width,
      height: FRAME_DEFAULTS.height,
      shape: "rounded",
      text: "",
      fill: FRAME_DEFAULTS.fill,
      textColor: "#475569",
      borderColor: frameAccent(FRAME_DEFAULTS.fill),
      borderWidth: 2,
      borderStyle: "solid",
      roundness: 16,
    };
    // frames go to the back so regular nodes render on top
    set((s) => ({
      nodes: [frame, ...s.nodes],
      selectedId: id,
      selectedEdgeId: null,
      editingId: null,
    }));
    persist(get());
    return id;
  },

  addImageNode: (x, y, image, width, height) => {
    get().commit();
    const id = nanoid(8);
    const node: DiagramNode = {
      id,
      kind: "image",
      x: Math.round(x - width / 2),
      y: Math.round(y - height / 2),
      width,
      height,
      shape: "rounded",
      text: "",
      fill: "#ffffff",
      textColor: "#0f172a",
      borderColor: "#cbd5e1",
      borderWidth: 0,
      borderStyle: "none",
      roundness: 12,
      image,
    };
    set((s) => ({
      nodes: [...s.nodes, node],
      selectedId: id,
      selectedEdgeId: null,
      editingId: null,
    }));
    persist(get());
    return id;
  },

  addText: (x, y) => {
    get().commit();
    const id = nanoid(8);
    const node: DiagramNode = {
      id,
      kind: "text",
      x: Math.round(x - 90),
      y: Math.round(y - 16),
      width: 180,
      height: 32,
      shape: "rounded",
      text: "",
      fill: "transparent",
      textColor: "#1b1d1a",
      borderColor: "transparent",
      borderWidth: 0,
      borderStyle: "none",
      roundness: 0,
      fontSize: 18,
      bold: false,
    };
    set((s) => ({
      nodes: [...s.nodes, node],
      selectedId: id,
      selectedEdgeId: null,
      editingId: id,
    }));
    persist(get());
    return id;
  },

  updateNode: (id, patch) => {
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    }));
    persist(get());
  },

  removeNode: (id) => {
    get().commit();
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.from !== id && e.to !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
      editingId: s.editingId === id ? null : s.editingId,
    }));
    persist(get());
  },

  addEdge: (from, to, fromSide, toSide) => {
    if (from === to) return;
    // only block an identical connector (same direction + same anchors);
    // reverse direction or a different anchor pair is allowed
    const exists = get().edges.some(
      (e) => e.from === from && e.to === to && e.fromSide === fromSide && e.toSide === toSide,
    );
    if (exists) return;
    get().commit();
    const edge: DiagramEdge = {
      id: nanoid(8),
      from,
      to,
      fromSide,
      toSide,
      color: arrowColor(get().theme),
      themed: true,
    };
    set((s) => ({ edges: [...s.edges, edge] }));
    persist(get());
  },

  updateEdge: (id, patch) => {
    set((s) => ({
      edges: s.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
    persist(get());
  },

  removeEdge: (id) => {
    get().commit();
    set((s) => ({
      edges: s.edges.filter((e) => e.id !== id),
      selectedEdgeId: s.selectedEdgeId === id ? null : s.selectedEdgeId,
    }));
    persist(get());
  },

  undo: () => {
    const s = get();
    if (s.past.length === 0) return;
    const previous = s.past[s.past.length - 1];
    set({
      past: s.past.slice(0, -1),
      future: [snapshot(s), ...s.future].slice(0, HISTORY_LIMIT),
      nodes: previous.nodes.map((n) => ({ ...n })),
      edges: previous.edges.map((e) => ({ ...e })),
      editingId: null,
      dirty: true,
    });
    persist(get());
  },

  redo: () => {
    const s = get();
    if (s.future.length === 0) return;
    const next = s.future[0];
    set({
      future: s.future.slice(1),
      past: [...s.past, snapshot(s)].slice(-HISTORY_LIMIT),
      nodes: next.nodes.map((n) => ({ ...n })),
      edges: next.edges.map((e) => ({ ...e })),
      editingId: null,
      dirty: true,
    });
    persist(get());
  },

  clearAll: () => {
    get().commit();
    set({ nodes: [], edges: [], selectedId: null, selectedEdgeId: null, editingId: null });
    persist(get());
  },

  loadDiagram: (data) => {
    get().commit();
    set({
      nodes: data.nodes.map((n) => ({ ...n })),
      edges: data.edges.map((e) => ({ ...e })),
      selectedId: null,
      selectedEdgeId: null,
      editingId: null,
    });
    persist(get());
  },
}));
