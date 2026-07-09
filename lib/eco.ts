// Helper perhitungan & gamifikasi dampak ekologis.
// Faktor CO2 konsisten dengan EcoImpactModal: 1 kg sampah daur ulang ~ mengurangi
// emisi berkendara motor sekitar 5 km.

export const CO2_KM_PER_KG = 5;

/** Estimasi km perjalanan motor yang emisinya tercegah dari `kg` sampah terdaur ulang. */
export const co2KmFromKg = (kg: number): number => kg * CO2_KM_PER_KG;

export interface EcoTier {
  label: string;
  emoji: string;
  /** Ambang minimum kg untuk tier ini */
  min: number;
  /** kg untuk naik ke tier berikutnya; null kalau sudah tertinggi */
  next: number | null;
}

const TIERS: EcoTier[] = [
  { label: "Pemula Hijau", emoji: "🌱", min: 0, next: 10 },
  { label: "Pejuang Daur Ulang", emoji: "♻️", min: 10, next: 50 },
  { label: "Pahlawan Lingkungan", emoji: "🌿", min: 50, next: 100 },
  { label: "Legenda Bumi", emoji: "🌍", min: 100, next: null },
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
