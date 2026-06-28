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
import { bestTextColor } from "./utils";
import type { Side } from "./types";

const STORAGE_KEY = "flowmin.diagram.v1";
const HISTORY_LIMIT = 60;

interface PersistShape {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  viewport: Viewport;
  theme?: string;
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

  // node ops
  addNode: (x: number, y: number, shape?: ShapeKind) => string;
  addFrame: (x: number, y: number) => string;
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
  selectedId: null,
  selectedEdgeId: null,
  editingId: null,
  lightboxSrc: null,
  past: [],
  future: [],

  commit: () => {
    const s = get();
    const past = [...s.past, snapshot(s)].slice(-HISTORY_LIMIT);
    set({ past, future: [] });
  },

  select: (id) => set({ selectedId: id, selectedEdgeId: null }),
  selectEdge: (id) => set({ selectedEdgeId: id, selectedId: null }),
  setEditing: (id) => set({ editingId: id }),
  openLightbox: (src) => set({ lightboxSrc: src }),

  setViewport: (vp) => {
    set({ viewport: vp });
    persist(get());
  },

  setTheme: (name) => {
    get().commit();
    const palette = themeByName(name);
    set((s) => ({
      theme: name,
      // recolour boxes that follow a theme slot; custom colours are left as-is
      nodes: s.nodes.map((n) => {
        if (n.kind === "frame" || n.colorKey === undefined) return n;
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
      borderColor: FRAME_DEFAULTS.borderColor,
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
    const exists = get().edges.some(
      (e) =>
        (e.from === from && e.to === to) || (e.from === to && e.to === from),
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
