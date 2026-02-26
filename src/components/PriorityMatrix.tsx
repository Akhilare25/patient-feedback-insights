import type { PriorityMatrixBuckets } from "@/lib/types";

type Props = {
  matrix: PriorityMatrixBuckets;
};

export function PriorityMatrix({ matrix }: Props) {
  const cellStyle: React.CSSProperties = {
    border: "1px solid #e2e8f0",
    borderRadius: "0.6rem",
    padding: "0.6rem",
    backgroundColor: "#f8fafc"
  };

  const renderList = (title: string, items: PriorityMatrixBuckets[keyof PriorityMatrixBuckets]) => (
    <div style={cellStyle}>
      <div style={{ fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.35rem", color: "#475569" }}>
        {title}
      </div>
      {items.length === 0 ? (
        <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>No items mapped.</p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: "1rem", fontSize: "0.8rem" }}>
          {items.map((rec, idx) => (
            <li key={idx} style={{ marginBottom: "0.25rem" }}>
              <span style={{ fontWeight: 500 }}>{rec.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,minmax(0,1fr))",
          gap: "0.6rem",
          marginBottom: "0.6rem"
        }}
      >
        {renderList("High impact / Low effort", matrix.highImpactLowEffort)}
        {renderList("High impact / High effort", matrix.highImpactHighEffort)}
        {renderList("Low impact / Low effort", matrix.lowImpactLowEffort)}
        {renderList("Low impact / High effort", matrix.lowImpactHighEffort)}
      </div>
      <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0 }}>
        Use this matrix in huddles to agree on the next 1–3 changes to move into action.
      </p>
    </div>
  );
}

