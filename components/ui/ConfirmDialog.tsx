"use client";

import { useEffect } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDialogStore } from "@/store/dialogStore";

/**
 * Modal konfirmasi/alert global (pengganti window.confirm & window.alert).
 * Dirender sekali di layout. State & kontrol via useDialogStore + helper
 * confirmDialog()/alertDialog().
 */
export default function ConfirmDialog() {
  const open = useDialogStore((s) => s.open);
  const variant = useDialogStore((s) => s.variant);
  const title = useDialogStore((s) => s.title);
  const message = useDialogStore((s) => s.message);
  const confirmText = useDialogStore((s) => s.confirmText);
  const cancelText = useDialogStore((s) => s.cancelText);
  const tone = useDialogStore((s) => s.tone);
  const handleConfirm = useDialogStore((s) => s.handleConfirm);
  const handleCancel = useDialogStore((s) => s.handleCancel);

  // Esc = batal (confirm) / tutup (alert); Enter = konfirmasi
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") variant === "confirm" ? handleCancel() : handleConfirm();
      else if (e.key === "Enter") handleConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, variant, handleConfirm, handleCancel]);

  if (!open) return null;

  const danger = tone === "danger";
  // Klik backdrop: batal untuk confirm, tutup untuk alert
  const onBackdrop = variant === "confirm" ? handleCancel : handleConfirm;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-ink/70 backdrop-blur-md"
      onClick={onBackdrop}
    >
      <div
        className="w-full max-w-sm bg-surface-raised rounded-2xl p-6 shadow-2xl space-y-5"
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              danger ? "bg-status-error/15 text-status-error" : "bg-brand-100 text-brand-800"
            }`}
          >
            {danger ? <AlertTriangle size={20} /> : <HelpCircle size={20} />}
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-extrabold text-base text-ink">{title}</h3>
            {message && (
              <p className="text-xs text-ink-muted leading-relaxed mt-1 whitespace-pre-line">
                {message}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {variant === "confirm" && cancelText && (
            <Button variant="ghost" onClick={handleCancel} className="flex-1">
              {cancelText}
            </Button>
          )}
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={handleConfirm}
            className="flex-1"
            autoFocus
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
