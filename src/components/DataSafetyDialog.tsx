"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DataSafetyDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Data safety
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-900">Data safety</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Upload anonymized feedback only. Do not include names, phone numbers, addresses, MRNs, or identifying
              details. Demo tool for learning purposes.
            </p>
            <div className="mt-4 flex justify-end">
              <Button size="sm" onClick={() => setOpen(false)}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

