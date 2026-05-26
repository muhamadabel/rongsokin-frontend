// Format harga ke Rupiah
export const formatRupiah = (amount: number): string =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)

// Format jarak
export const formatDistance = (meters: number): string =>
  meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`

// Format tanggal Indonesia
export const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))

// Koordinat default Yogyakarta (fallback jika GPS tidak tersedia)
export const DEFAULT_COORDS = { lat: -7.7956, lng: 110.3695 }
