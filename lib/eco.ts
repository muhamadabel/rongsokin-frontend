// Helper perhitungan & gamifikasi dampak ekologis.
//
// Faktor CO2_KM_PER_KG = 5 (1 kg sampah terdaur ulang ~ setara mencegah emisi
// 5 km perjalanan motor). Angka ini SENGAJA konservatif (underestimate), bukan
// asumsi sembarangan — berikut dasar & perhitungannya:
//
// 1) Emisi motor Indonesia (g CO2/km), dari studi lokal:
//    - ITB (2018), "Pengembangan Faktor Emisi Sepeda Motor untuk Inventarisasi
//      Emisi di Indonesia": 7,35–22,85 g/km.
//      https://digilib.itb.ac.id/assets/files/disk1/637/jbptitbpp-gdl-adyatiprad-31825-1-2018ds-k.pdf
//    - IJTech UI (2023): motor 125cc rata-rata 83,06 g CO2-eq/km.
//      https://ijtech.eng.ui.ac.id/article/view/5454
//    - ScienceDirect: motor bakar dalam ~50,6 g CO2/km.
//    → Range realistis: ~15–83 g CO2/km (tengah ~50 g/km).
//
// 2) Penghematan CO2 dari daur ulang per kg sampah:
//    - EndPlasticSoup: 1 kg plastik baru = 3 kg CO2e produksi.
//      https://endplasticsoup.org/1-kg-of-plastic-equals-3-kg-co2-equivalents/
//    - EPA: daur ulang butuh energi lebih sedikit drpd bahan baru → emisi turun.
//      https://archive.epa.gov/epawaste/nonhaz/municipal/web/pdf/climfold.pdf
//    → Estimasi konservatif penghematan sampah campuran: ~1 kg CO2 per kg daur ulang.
//
// 3) Konversi ke "km motor tercegah": 1 kg CO2 ÷ ~50 g/km (tengah) ≈ 20 km;
//    ÷ 15 g/km (emisi terendah) ≈ 66 km. Jadi rentang ilmiah realistis: 15–66
//    km motor tercegah per kg sampah daur ulang.
//
// Angka 5 di sini jauh di BAWAH rentang itu (aman, tidak overclaim) — dipakai
// sebagai figur pemasaran yang mudah dibayangkan & pasti tidak melebih-lebihkan.

export const CO2_KM_PER_KG = 5;

/** Estimasi km perjalanan motor yang emisinya tercegah dari `kg` sampah terdaur ulang. */
export const co2KmFromKg = (kg: number): number => kg * CO2_KM_PER_KG;

export interface EcoTier {
  label: string;
  emoji: string;
  badge: string;
  /** Ambang minimum kg untuk tier ini */
  min: number;
  /** kg untuk naik ke tier berikutnya; null kalau sudah tertinggi */
  next: number | null;
}

const TIERS: EcoTier[] = [
  { label: "Pemula Hijau", emoji: "🌱", badge: "/badge/pemula-hijau.png", min: 0, next: 10 },
  { label: "Pejuang Daur Ulang", emoji: "♻️", badge: "/badge/pejuang-daur-ulang.png", min: 10, next: 50 },
  { label: "Pahlawan Lingkungan", emoji: "🌿", badge: "/badge/pahlawan-lingkungan.png", min: 50, next: 100 },
  { label: "Legenda Bumi", emoji: "🌍", badge: "/badge/legenda-bumi.png", min: 100, next: null },
];

/** Tier gamifikasi berdasarkan total kg yang sudah didaur ulang. */
export const ecoTier = (totalKg: number): EcoTier => {
  let tier = TIERS[0];
  for (const t of TIERS) {
    if (totalKg >= t.min) tier = t;
  }
  return tier;
};

/** Medali untuk peringkat 1–3, atau null. */
export const rankMedal = (rank: number): string | null =>
  rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
