interface LogoProps {
  /** Ukuran kotak logo dalam px */
  size?: number;
  className?: string;
}

/**
 * Logo Rongsok.in — power-ring (simbol "aktif/hidup kembali") yang
 * memeluk tempat sampah (rongsok). Makna: menghidupkan kembali sampah.
 * Mark lime di atas kotak ink, konsisten dipakai di nav, auth, dll.
 */
export function Logo({ size = 36, className = "" }: LogoProps) {
  return (
    <div
      className={`bg-ink rounded-2xl flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={Math.round(size * 0.64)}
        height={Math.round(size * 0.64)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#9fe870"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* cincin power, terbuka di atas */}
        <path d="M14.7 5.6 A 8 8 0 1 1 9.3 5.6" />
        {/* batang power */}
        <path d="M12 3 L12 8" />
        {/* tutup tempat sampah + pegangan */}
        <path d="M8.4 11.4 H15.6" />
        <path d="M10.4 11.4 V10.2 H13.6 V11.4" />
        {/* badan tempat sampah */}
        <path d="M9.1 11.4 L9.8 17.2 H14.2 L14.9 11.4" />
        {/* garis vertikal */}
        <path d="M10.9 13.2 V15.4 M12 13.2 V15.4 M13.1 13.2 V15.4" />
      </svg>
    </div>
  );
}
