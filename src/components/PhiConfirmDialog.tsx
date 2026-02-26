"use client";

import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  reasons: string[];
  onConfirm: () => void;
  onCancel: () => void;
};

export function PhiConfirmDialog({ open, reasons, onConfirm, onCancel }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-slate-900">Possible PHI detected</h3>
        <p className="mt-2 text-sm text-slate-600">
          Your input may contain personally identifiable information (phone numbers, emails, or names).
          Upload only anonymized feedback. Do not submit real patient identifiers.
        </p>
        <ul className="mt-3 list-disc list-inside text-sm text-amber-800">
          {reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm font-medium text-slate-700">
          Confirm that data is de-identified and safe to process.
        </p>
        <div className="mt-4 flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>I confirm, proceed</Button>
        </div>
      </div>
    </div>
  );
}
