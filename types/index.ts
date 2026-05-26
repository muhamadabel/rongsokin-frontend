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
  role: UserRole;
  avgRating: number;
  createdAt: string;
  collectorProfile?: CollectorProfile;
}

export interface CollectorProfile {
  id: string;
  userId: string;
  shopName: string;
  description?: string;
  radiusKm: number;
  isOpen: boolean;
  isPremium: boolean;
  priorityScore: number;
  catalogs?: CollectorCatalog[];
  user?: User;
}

export interface WasteCategory {
  id: string;
  name: string;
  iconUrl?: string;
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

export interface Order {
  id: string;
  customerId: string;
  collectorId?: string;
  categoryId: string;
  method: OrderMethod;
  photoUrl?: string;
  estimatedWeight: number;
  actualWeight?: number;
  agreedPrice?: number;
  totalPrice?: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  customer?: User;
  collector?: User;
  category?: WasteCategory;
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
