import { create } from 'zustand';

// Custom confirm/alert global — pengganti window.confirm / window.alert bawaan browser.
// Dipakai imperatif lewat helper confirmDialog()/alertDialog() (mirip API native),
// tapi tampil sebagai modal bergaya brand. Komponen <ConfirmDialog /> di layout
// yang merender state ini.

export type DialogTone = 'default' | 'danger';

export interface DialogOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  /** Kosongkan untuk menyembunyikan tombol batal (mode alert) */
  cancelText?: string;
  tone?: DialogTone;
}

interface DialogState {
  open: boolean;
  variant: 'confirm' | 'alert';
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  tone: DialogTone;
  _resolve: ((value: boolean) => void) | null;
  /** Tampilkan dialog konfirmasi. Resolve true (OK) / false (batal). */
  confirm: (opts: DialogOptions) => Promise<boolean>;
  /** Tampilkan pemberitahuan satu tombol. Resolve saat ditutup. */
  alert: (opts: DialogOptions) => Promise<void>;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export const useDialogStore = create<DialogState>((set, get) => ({
  open: false,
  variant: 'confirm',
  title: '',
  message: '',
  confirmText: 'Ya',
  cancelText: 'Batal',
  tone: 'default',
  _resolve: null,

  confirm: (opts) =>
    new Promise<boolean>((resolve) => {
      // Tutup dialog sebelumnya (kalau ada) tanpa menggantung promise-nya
      const prev = get()._resolve;
      if (prev) prev(false);
      set({
        open: true,
        variant: 'confirm',
        title: opts.title ?? 'Konfirmasi',
        message: opts.message ?? '',
        confirmText: opts.confirmText ?? 'Ya',
        cancelText: opts.cancelText ?? 'Batal',
        tone: opts.tone ?? 'default',
        _resolve: resolve,
      });
    }),

  alert: (opts) =>
    new Promise<void>((resolve) => {
      const prev = get()._resolve;
      if (prev) prev(false);
      set({
        open: true,
        variant: 'alert',
        title: opts.title ?? 'Pemberitahuan',
        message: opts.message ?? '',
        confirmText: opts.confirmText ?? 'Oke',
        cancelText: '',
        tone: opts.tone ?? 'default',
        _resolve: () => resolve(),
      });
    }),

  handleConfirm: () => {
    const r = get()._resolve;
    set({ open: false, _resolve: null });
    r?.(true);
  },
  handleCancel: () => {
    const r = get()._resolve;
    set({ open: false, _resolve: null });
    r?.(false);
  },
}));

// Helper imperatif — panggil dari event handler mana pun:
//   if (await confirmDialog({ title: "Hapus?", tone: "danger" })) { ... }
//   await alertDialog({ message: "Tersimpan." });
export const confirmDialog = (opts: DialogOptions): Promise<boolean> =>
  useDialogStore.getState().confirm(opts);
export const alertDialog = (opts: DialogOptions): Promise<void> =>
  useDialogStore.getState().alert(opts);
