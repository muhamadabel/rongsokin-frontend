export type UserRole = 'CUSTOMER' | 'COLLECTOR' | 'ADMIN';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'AWAITING_CONFIRMATION'
  | 'COMPLETED'
  | 'CANCELLED';

export type OrderMethod = 'PICKUP' | 'DROPOFF';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  avgRating: number;
  createdAt: string;
  /** Lokasi tersimpan: lat & lng dari PostGIS Point. Diharapkan BE return ini di /auth/me. */
  lat?: number;
  lng?: number;
  collectorProfile?: CollectorProfile;
}

export interface CollectorProfile {
  id: string;
  userId: string;
  shopName: string;
  description?: string;
  shopImageUrl?: string;
  radiusKm: number;
  isOpen: boolean;
  isPremium: boolean;
  priorityScore: number;
  /** Batas maks pesanan aktif yang bisa di-accept (default 5 di BE) */
  maxConcurrentOrders?: number;
  catalogs?: CollectorCatalog[];
  user?: User;
}

export type CategoryUnit = 'kg' | 'liter' | 'pcs';

export interface WasteCategory {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  /** null/undefined = kategori utama (induk); terisi = sub-item (anak) */
  parentId?: string | null;
  unit?: CategoryUnit;
  sortOrder?: number;
  /** Diisi FE saat membangun tree dari list flat */
  children?: WasteCategory[];
}

export interface CollectorCatalog {
  id: string;
  collectorId: string;
  categoryId: string;
  minPrice: number;
  maxPrice: number;
  isActive: boolean;
  category?: WasteCategory;
}

export interface OrderItem {
  id: string;
  orderId: string;
  categoryId: string;
  estimatedWeight: number;
  actualWeight?: number;
  agreedPrice?: number;
  /** Catatan opsional per kategori (mis. "Karton bersih, sudah dilipat") */
  notes?: string;
  /** Bisa di-compute FE: actualWeight × agreedPrice (BE tidak punya kolom ini di schema, tapi FE pakai) */
  subtotal?: number;
  category?: WasteCategory;
}

export interface Order {
  id: string;
  customerId: string;
  collectorId?: string;
  method: OrderMethod;
  photoUrl?: string;
  transactionProofUrl?: string;
  totalPrice?: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;

  /** Multi-category items (new schema) */
  items?: OrderItem[];

  /** Legacy single-category fields — present sampai BE migrate ke OrderItem */
  categoryId?: string;
  category?: WasteCategory;
  estimatedWeight?: number;
  actualWeight?: number;
  agreedPrice?: number;

  customer?: User;
  collector?: User;
  receipt?: Receipt;
}

export interface OrderCollector {
  id: string;
  orderId: string;
  collectorId: string;
  status: 'notified' | 'rejected' | 'accepted';
}

export interface Rating {
  id: string;
  orderId: string;
  raterId: string;
  rateeId: string;
  score: number;
  reviewText?: string;
  createdAt: string;
  rater?: User;
  ratee?: User;
}

export interface Receipt {
  id: string;
  orderId: string;
  issuedAt: string;
  detailsJson: {
    customer: string;
    collector: string;
    total: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  status: string;
}

// ── Admin ───────────────────────────────────────────────────────────────
export interface AdminWeeklyPoint {
  day: string;       // 'Senin', 'Selasa', ...
  date: string;      // ISO date
  weight: number;    // kg (sum actualWeight COMPLETED)
  amount: number;    // Rp  (sum totalPrice COMPLETED)
  count: number;     // jumlah order
}

export interface AdminStats {
  totalWeightKg: number;
  totalPayout: number;
  activeOrders: number;
  totalCustomers: number;
  totalCollectors: number;
  weeklyTransactions: AdminWeeklyPoint[];
}

export interface AdminOrdersResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
}
