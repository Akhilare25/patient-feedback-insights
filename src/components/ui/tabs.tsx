"use client";

import * as React from "react";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({ value, defaultValue, onValueChange, children, ...props }: TabsProps) {
  const [internalValue, setInternalValue] = React.useState<string>(value ?? defaultValue ?? "");

  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const setValue = (next: string) => {
    if (value === undefined) {
      setInternalValue(next);
    }
    onValueChange?.(next);
  };

  return (
    <TabsContext.Provider value={{ value: internalValue, setValue }}>
      <div {...props}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const base =
    "inline-flex items-center rounded-md bg-slate-100 p-0.5 text-xs font-medium text-slate-600";
  return <div className={[base, className].filter(Boolean).join(" ")} {...props} />;
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({ value, className, ...props }: TabsTriggerProps) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) {
    throw new Error("TabsTrigger must be used within Tabs");
  }

  const isActive = ctx.value === value;
  const base =
    "inline-flex items-center justify-center rounded-sm px-3 py-1 transition-colors border border-transparent";
  const styles = isActive
    ? "bg-white text-slate-900 shadow-sm border-slate-200"
    : "text-slate-600 hover:text-slate-900";

  return (
    <button
      type="button"
      className={[base, styles, className].filter(Boolean).join(" ")}
      aria-pressed={isActive}
      onClick={() => ctx.setValue(value)}
      {...props}
    />
  );
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  className?: string;
}

export function TabsContent({ value, className, ...props }: TabsContentProps) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) {
    throw new Error("TabsContent must be used within Tabs");
  }

  if (ctx.value !== value) return null;

  return <div className={className} {...props} />;
}

