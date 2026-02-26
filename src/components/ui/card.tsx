import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={["rounded-xl border border-slate-200 bg-white shadow-sm", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={["border-b border-slate-100 px-4 py-3", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={["text-sm font-semibold text-slate-900", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={["p-4", className].filter(Boolean).join(" ")} {...props} />;
}

