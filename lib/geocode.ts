// Reverse geocoding via Nominatim (OpenStreetMap) — gratis, tanpa API key.
// Ubah koordinat (lat,lng) jadi nama daerah ringkas: "Kecamatan, Kabupaten, Provinsi".
// Granularitas mengikuti data OSM, jadi bisa bervariasi antar lokasi.

export interface AreaInfo {
  /** Ringkas, mis. "Sewon, Bantul, Yogyakarta" */
  label: string;
  /** Alamat lengkap dari OSM (buat tooltip/cadangan) */
  full: string;
}

type NominatimAddress = {
  village?: string;
  hamlet?: string;
  suburb?: string;
  neighbourhood?: string;
  town?: string;
  subdistrict?: string;
  city_district?: string;
  municipality?: string;
  county?: string;
  city?: string;
  regency?: string;
  state_district?: string;
  state?: string;
};

const strip = (s?: string): string =>
  (s || "")
    .replace(/^Kabupaten\s+/i, "")
    .replace(/^Kota\s+/i, "")
    .replace(/^Provinsi\s+/i, "")
    .replace(/^Daerah Istimewa\s+/i, "")
    .trim();

export async function reverseGeocode(lat: number, lng: number): Promise<AreaInfo | null> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
      `&lat=${lat}&lon=${lng}&zoom=13&addressdetails=1&accept-language=id`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = await res.json();
    const a: NominatimAddress = data.address || {};

    // Kecamatan (admin level 6) — pilih yang paling mendekati
    const kecamatan =
      a.subdistrict || a.city_district || a.municipality || a.town || a.suburb || a.village;
    // Kabupaten / Kota (admin level 5)
    const kabupaten = strip(a.county || a.city || a.regency || a.state_district);
    // Provinsi (admin level 4)
    const provinsi = strip(a.state);

    const parts = [kecamatan, kabupaten, provinsi]
      .map((p) => (p || "").trim())
      .filter(Boolean);
    // Buang duplikat berurutan (mis. kecamatan == kabupaten)
    const uniq = parts.filter((p, i) => parts.indexOf(p) === i);
    const label = uniq.slice(0, 3).join(", ");

    return {
      label: label || (data.display_name as string)?.split(",").slice(0, 3).join(",").trim() || "",
      full: (data.display_name as string) || "",
    };
  } catch {
    return null;
  }
}
