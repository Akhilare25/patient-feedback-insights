import "@/app/globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Patient Feedback Insights Copilot",
  description: "Analyze healthcare patient feedback and generate actionable insights."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}

