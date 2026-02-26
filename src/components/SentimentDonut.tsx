"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { AnalyzeResponse } from "@/lib/types";

const COLORS = ["#22c55e", "#e5e7eb", "#ef4444"];

type Props = {
  sentiment: AnalyzeResponse["sentiment"];
};

export function SentimentDonut({ sentiment }: Props) {
  const data = [
    { name: "Positive", value: sentiment.positive },
    { name: "Neutral", value: sentiment.neutral },
    { name: "Negative", value: sentiment.negative }
  ];

  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            innerRadius={55}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any, name: any) => [`${value}%`, name]}
            contentStyle={{ fontSize: "0.8rem" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "0.5rem",
          fontSize: "0.75rem",
          color: "#64748b"
        }}
      >
        <span>Positive {sentiment.positive}%</span>
        <span>Neutral {sentiment.neutral}%</span>
        <span>Negative {sentiment.negative}%</span>
      </div>
    </div>
  );
}

