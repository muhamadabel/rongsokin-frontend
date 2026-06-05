import { Recycle } from "lucide-react";

interface LogoProps {
  /** Ukuran kotak logo dalam px */
  size?: number;
  className?: string;
}

/**
 * Logo Rongsok.in — simbol daur ulang (recycle) di atas kotak lime.
 * Bermakna: marketplace daur ulang. Konsisten dipakai di nav, auth, dll.
 */
export function Logo({ size = 36, className = "" }: LogoProps) {
  return (
    <div
      className={`bg-brand-500 text-ink rounded-2xl flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <Recycle size={Math.round(size * 0.56)} strokeWidth={2.4} />
    </div>
  );
}
