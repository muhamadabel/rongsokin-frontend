import { RefreshCw, Box, Wrench, Wine, Tv, Leaf, Shirt, Package } from 'lucide-react';
import type { ComponentType } from 'react';

type IconCmp = ComponentType<{ size?: number; className?: string }>;

export interface CategoryIconOption {
  /** disimpan di WasteCategory.iconUrl */
  key: string;
  label: string;
  Icon: IconCmp;
}

/** Pilihan ikon untuk admin saat menambah/mengubah kategori. */
export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { key: 'plastik', label: 'Plastik', Icon: RefreshCw },
  { key: 'kertas', label: 'Kertas/Kardus', Icon: Box },
  { key: 'logam', label: 'Logam/Besi', Icon: Wrench },
  { key: 'kaca', label: 'Kaca/Botol', Icon: Wine },
  { key: 'elektronik', label: 'Elektronik', Icon: Tv },
  { key: 'kain', label: 'Kain/Tekstil', Icon: Shirt },
  { key: 'organik', label: 'Organik', Icon: Leaf },
  { key: 'lainnya', label: 'Lainnya', Icon: Package },
];

const byKey: Record<string, IconCmp> = Object.fromEntries(
  CATEGORY_ICON_OPTIONS.map((o) => [o.key, o.Icon])
);

/**
 * Ikon untuk sebuah kategori. Prioritas: ikon yang dipilih admin (iconUrl = key),
 * lalu fallback tebak dari nama (kompat kategori lama), terakhir ikon umum.
 */
export function iconForCategory(category?: {
  name?: string | null;
  iconUrl?: string | null;
}): IconCmp {
  const key = category?.iconUrl?.trim().toLowerCase();
  if (key && byKey[key]) return byKey[key];

  const name = category?.name || '';
  if (/plastik/i.test(name)) return RefreshCw;
  if (/kertas|kardus/i.test(name)) return Box;
  if (/logam|besi|kaleng|alumini/i.test(name)) return Wrench;
  if (/kaca|botol/i.test(name)) return Wine;
  if (/elektronik|gadget/i.test(name)) return Tv;
  if (/kain|tekstil|baju|pakaian/i.test(name)) return Shirt;
  if (/organik|daun|kompos|sisa/i.test(name)) return Leaf;
  return Package;
}
