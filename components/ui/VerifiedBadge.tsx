import { BadgeCheck } from "flowbite-react-icons/solid";

interface Props {
  /** xs = ikon kecil saja, sm/md = pill dengan label */
  size?: "xs" | "sm" | "md";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

/**
 * Badge "Terverifikasi" — penanda akun yang sudah lolos KYC (KTP).
 * Pakai di profil, kartu pengepul, dan halaman detail.
 */
export function VerifiedBadge({
  size = "sm",
  showLabel = true,
  label = "Terverifikasi",
  className = "",
}: Props) {
  if (size === "xs" || !showLabel) {
    const px = size === "md" ? 22 : size === "xs" ? 18 : 20;
    return (
      <BadgeCheck
        size={px}
        className={`text-brand-700 shrink-0 ${className}`}
        aria-label={label}
      />
    );
  }

  const iconPx = size === "md" ? 18 : 16;
  const pad = size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[10px]";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-brand-100 text-brand-800 font-bold uppercase tracking-wide ${pad} ${className}`}
    >
      <BadgeCheck size={iconPx} className="text-brand-700" />
      {label}
    </span>
  );
}
