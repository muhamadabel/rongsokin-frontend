// Format harga ke Rupiah
export const formatRupiah = (amount: number): string =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)

// Format jarak
export const formatDistance = (meters: number): string =>
  meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`

// Jarak garis lurus (meter) antara dua koordinat — Haversine
export const haversineMeters = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number => {
  const R = 6371000 // radius bumi (m)
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Format tanggal Indonesia
export const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))

// Koordinat default Yogyakarta (fallback jika GPS tidak tersedia)
export const DEFAULT_COORDS = { lat: -7.7956, lng: 110.3695 }

// Label satuan kategori
export const unitLabel = (unit?: string): string => {
  switch (unit) {
    case 'liter': return 'liter'
    case 'pcs': return 'pcs'
    default: return 'kg'
  }
}

// ── Order normalization helpers ─────────────────────────────────────────
// Mendukung schema baru (Order.items[]) DAN schema legacy (Order.categoryId tunggal)
// supaya FE tidak break selama BE belum migrasi ke OrderItem.
import type { Order, OrderItem } from '@/types'

export const getOrderItems = (order: Order): OrderItem[] => {
  if (order.items && order.items.length > 0) return order.items
  if (order.categoryId) {
    return [
      {
        id: order.id,
        orderId: order.id,
        categoryId: order.categoryId,
        estimatedWeight: order.estimatedWeight ?? 0,
        actualWeight: order.actualWeight,
        agreedPrice: order.agreedPrice,
        subtotal: order.totalPrice,
        category: order.category,
      },
    ]
  }
  return []
}

export const getOrderTotalEstWeight = (order: Order): number =>
  getOrderItems(order).reduce((s, i) => s + (i.estimatedWeight || 0), 0)

export const getOrderTotalActualWeight = (order: Order): number =>
  getOrderItems(order).reduce((s, i) => s + (i.actualWeight || 0), 0)

export const getOrderTotalPrice = (order: Order): number => {
  if (order.totalPrice != null) return order.totalPrice
  return getOrderItems(order).reduce(
    (s, i) => s + (i.subtotal ?? (i.actualWeight || 0) * (i.agreedPrice || 0)),
    0
  )
}

/** Label kategori untuk ringkasan: "Kardus" / "Kardus + Plastik" / "3 jenis" */
export const getOrderCategoryLabel = (order: Order): string => {
  const items = getOrderItems(order)
  if (items.length === 0) return 'Rongsokan'
  if (items.length === 1) return items[0].category?.name || 'Rongsokan'
  if (items.length === 2)
    return `${items[0].category?.name || '?'} + ${items[1].category?.name || '?'}`
  return `${items.length} jenis sampah`
}
