import { useStore } from "./store";
import {
  chooseSides,
  orthoPoints,
  orthoToPoint,
  polylineMidpoint,
  roundedPath,
} from "./geometry";
import type { Point } from "./geometry";
import type { Side } from "./types";

interface Props {
  tempLink: { from: string; fromSide: Side; to: Point } | null;
}

export default function Edges({ tempLink }: Props) {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const selectedEdgeId = useStore((s) => s.selectedEdgeId);
  const selectEdge = useStore((s) => s.selectEdge);

  const byId = new Map(nodes.map((n) => [n.id, n]));

  return (
    <svg className="edge-layer" width={1} height={1}>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="context-stroke" />
        </marker>
        <marker id="arrow-sel" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="#4f46e5" />
        </marker>
      </defs>

      {edges.map((e) => {
        const a = byId.get(e.from);
        const b = byId.get(e.to);
        if (!a || !b) return null;
        const [autoA, autoB] = chooseSides(a, b);
        const pts = orthoPoints(a, e.fromSide ?? autoA, b, e.toSide ?? autoB);
        const d = roundedPath(pts);
        const sel = selectedEdgeId === e.id;
        const stroke = sel ? "#4f46e5" : e.color;
        const mid = polylineMidpoint(pts);
        return (
          <g key={e.id}>
            <path
              className="edge-hit"
              d={d}
              fill="none"
              stroke="transparent"
              strokeWidth={18}
              onPointerDown={(ev) => {
                ev.stopPropagation();
                selectEdge(e.id);
              }}
            />
            <path
              d={d}
              fill="none"
              stroke={stroke}
              strokeWidth={sel ? 2.6 : 2}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={e.dashed ? "6 6" : undefined}
              markerEnd={`url(#${sel ? "arrow-sel" : "arrow"})`}
              style={{ pointerEvents: "none" }}
            />
            {e.label && (
              <text className="edge-label" x={mid.x} y={mid.y - 4} textAnchor="middle">
                {e.label}
              </text>
            )}
          </g>
        );
      })}

      {tempLink &&
        (() => {
          const a = byId.get(tempLink.from);
          if (!a) return null;
          const pts = orthoToPoint(a, tempLink.fromSide, tempLink.to);
          return (
            <path
              d={roundedPath(pts)}
              fill="none"
              stroke="#4f46e5"
              strokeWidth={2}
              strokeDasharray="5 5"
              strokeLinejoin="round"
              markerEnd="url(#arrow-sel)"
              style={{ pointerEvents: "none" }}
            />
          );
        })()}
    </svg>
  );
}
