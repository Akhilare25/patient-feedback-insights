"use client";

import * as React from "react";

export type ButtonVariant = "default" | "outline";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "default", size = "md", className, ...props },
  ref
) {
  const base =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";
  const padding = size === "sm" ? "px-3 py-1.5 text-xs" : "px-3.5 py-2 text-sm";
  const styles =
    variant === "outline"
      ? "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
      : "bg-sky-600 text-white hover:bg-sky-700";

  return (
    <button
      ref={ref}
      className={[base, padding, styles, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
});

