import { useStore } from "./store";
import { borderPoint, edgePath, nodeCenter } from "./geometry";
import type { Point } from "./geometry";

interface Props {
  tempLink: { from: string; to: Point } | null;
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
        <marker id="arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="context-stroke" />
        </marker>
        <marker id="arrow-sel" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="#4f46e5" />
        </marker>
      </defs>

      {edges.map((e) => {
        const a = byId.get(e.from);
        const b = byId.get(e.to);
        if (!a || !b) return null;
        const pa = borderPoint(a, nodeCenter(b));
        const pb = borderPoint(b, nodeCenter(a));
        const d = edgePath(pa, pb);
        const sel = selectedEdgeId === e.id;
        const stroke = sel ? "#4f46e5" : e.color;
        const mid = { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 };
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
              strokeDasharray={e.dashed ? "6 5" : undefined}
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
          const pa = borderPoint(a, tempLink.to);
          return (
            <path
              d={edgePath(pa, tempLink.to)}
              fill="none"
              stroke="#4f46e5"
              strokeWidth={2}
              strokeDasharray="5 5"
              markerEnd="url(#arrow-sel)"
              style={{ pointerEvents: "none" }}
            />
          );
        })()}
    </svg>
  );
}
