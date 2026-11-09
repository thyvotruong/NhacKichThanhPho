/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: models/musical.model.ts
 * Chức năng: TypeScript Interfaces & Types theo BA phân hệ
 * ============================================================
 */

export interface TicketTier {
  tier: 'VIP' | 'Standard' | 'Couple' | 'Eco';
  name: string;
  price: number;
  color?: string;
  description?: string;
}

export interface Musical {
  _id?: string;
  title: string;
  slug: string;
  subtitle?: string;
  genre: 'Broadway' | 'Cổ Điển' | 'Dân Gian Đương Đại' | 'Lãng Mạn' | 'Thiếu Nhi';
  posterUrl: string;
  bannerUrl: string;
  trailerUrl?: string;
  duration: number; // phút
  ageLimit?: string;
  director: string;
  cast: string[];
  synopsis: string;
  ticketPrices: TicketTier[];
  featured?: boolean;
  status: 'now_showing' | 'coming_soon' | 'archived';
  rating?: number;
  reviewCount?: number;
  schedules?: Schedule[];
}

export interface Seat {
  seatCode: string;
  floor: 'Tầng Trệt' | 'Tầng Lầu';
  row: string;
  number: number;
  type: 'VIP' | 'Standard' | 'Couple';
  price: number;
  status: 'available' | 'holding' | 'booked' | 'locked';
  holdingSessionId?: string | null;
  holdingExpiresAt?: string | null;
  lockedReason?: string | null;
  lockedBy?: string | null;
}

export interface Schedule {
  _id: string;
  musicalId?: string;
  musicalTitle: string;
  musicalSlug: string;
  performanceDate: string | Date;
  time: string;
  venue: string;
  hall: string;
  totalSeats: number;
  bookedSeats: number;
  lockedSeatsCount?: number;
  status: 'available' | 'sold_out' | 'cancelled';
  seats?: Seat[];
}

export interface Artist {
  name: string;
  role: string;
  title: string;
  avatar: string;
  bio: string;
}

export interface Voucher {
  _id?: string;
  code: string;
  description: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount?: number;
  validUntil: string | Date;
  isActive: boolean;
}

export interface VoucherValidationResponse {
  code: string;
  discountAmount: number;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
}

export interface BookedSeat {
  seatCode: string;
  floor: string;
  row: string;
  number: number;
  type: 'VIP' | 'Standard' | 'Couple';
  price: number;
}

export interface BookingRequest {
  musicalId?: string;
  musicalSlug: string;
  musicalTitle?: string;
  scheduleId: string;
  performanceDate?: string | Date;
  performanceTime?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  seats?: BookedSeat[];
  ticketTier?: string;
  quantity?: number;
  voucherCode?: string | null;
  paymentMethod?: 'VNPAY' | 'MOMO' | 'ZALOPAY' | 'VIETQR' | 'BANK_CARD' | string;
  notes?: string;
}

export interface BookingResponse {
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  musicalTitle: string;
  performanceDate: string;
  performanceTime: string;
  ticketTier: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
}

export interface BookingOrder {
  _id?: string;
  bookingCode: string;
  musicalSlug: string;
  musicalTitle: string;
  scheduleId: string;
  performanceDate: string | Date;
  performanceTime: string;
  venue: string;
  hall: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  seats: BookedSeat[];
  quantity: number;
  subtotal: number;
  voucherCode?: string | null;
  discountAmount: number;
  totalPrice: number;
  paymentMethod: string;
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
  bookingStatus: 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED';
  qrCodeData?: string;
  checkInInfo?: {
    checkedInAt?: string | null;
    checkedInBy?: string | null;
    gate?: string;
  };
  refundInfo?: {
    refundedAt?: string | null;
    refundAmount?: number;
    refundFee?: number;
    refundReason?: string | null;
  };
  createdAt?: string | Date;
}

export interface DashboardStats {
  totalRevenue: number;
  totalTicketsSold: number;
  totalOrders: number;
  occupancyRate: number;
  activeShowsCount: number;
  paymentBreakdown: {
    VIETQR: number;
    VNPAY: number;
    MOMO: number;
    ZALOPAY: number;
    BANK_CARD: number;
  };
}

export interface ReconciliationRecord {
  transactionId: string;
  bookingCode: string;
  gateway: string;
  systemAmount: number;
  gatewayAmount: number;
  fee: number;
  netAmount: number;
  status: 'MATCHED' | 'DISCREPANCY';
  transactionDate?: string | Date;
  notes?: string;
}

export interface UserStaff {
  _id?: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin' | 'editor' | 'accountant' | 'ticket_checker';
  avatar?: string;
  isActive: boolean;
}

export interface AuthLoginRequest {
  method: 'google' | 'phone' | 'email';
  identifier: string;
  password?: string;
  otp?: string;
}

export interface AuthRegisterRequest {
  method: 'google' | 'phone' | 'email';
  fullName: string;
  email?: string;
  phone?: string;
  password?: string;
}

export interface AuthResponse {
  user: UserStaff;
  token: string;
}

export interface CheckInResult {
  bookingCode: string;
  customerName: string;
  musicalTitle: string;
  performanceTime: string;
  hall: string;
  seats: string;
  quantity: number;
  checkedInAt: string | Date;
  checkedInBy: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
  code?: string;
  details?: any;
}
