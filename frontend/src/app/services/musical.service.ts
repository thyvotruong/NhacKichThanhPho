/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: services/musical.service.ts
 * Chức năng: Angular Service kết nối HttpClient cho 3 Phân Hệ:
 * 1. Customer Portal
 * 2. Admin Portal (RBAC, Khóa ghế nội bộ, Đối soát)
 * 3. Ops Portal (Soát vé & Check-in thời gian thực)
 * ============================================================
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import {
  Musical,
  Schedule,
  Seat,
  Artist,
  Voucher,
  VoucherValidationResponse,
  BookingRequest,
  BookingOrder,
  DashboardStats,
  ReconciliationRecord,
  UserStaff,
  CheckInResult,
  ApiResponse,
  AuthLoginRequest,
  AuthRegisterRequest,
  AuthResponse
} from '../models/musical.model';

@Injectable({
  providedIn: 'root'
})
export class MusicalService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5000/api';

  // Trạng thái xác thực đăng nhập khách hàng (BPMN 2.2.2)
  isLoggedIn = signal<boolean>(false);

  // Quản lý thông tin đăng nhập của người dùng & nhân sự RBAC
  currentUser = signal<UserStaff>({
    fullName: 'Khách Hàng',
    email: 'khachhang@gmail.com',
    phone: '0909123456',
    role: 'customer',
    isActive: true
  });

  // Giỏ ghế đang chọn và countdown giữ ghế
  currentHoldSessionId = signal<string>('sess_' + Math.random().toString(36).substring(2, 9));

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('nhackich_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object' && parsed.fullName) {
            this.currentUser.set(parsed);
            this.isLoggedIn.set(true);
          } else {
            localStorage.removeItem('nhackich_user');
          }
        } catch (e) {
          localStorage.removeItem('nhackich_user');
        }
      }
    }
  }

  // ==========================================
  // XÁC THỰC TÀI KHOẢN (BPMN 2.2.2)
  // ==========================================

  checkUserExists(identifier: string): Observable<{ success: boolean; exists: boolean }> {
    return this.http.post<{ success: boolean; exists: boolean }>(`${this.apiUrl}/auth/check-user`, { identifier }).pipe(
      catchError(() => {
        // Fallback kiểm tra
        const exists = identifier.includes('khachhang') || identifier.includes('0909123456');
        return of({ success: true, exists });
      })
    );
  }

  login(req: AuthLoginRequest): Observable<{ success: boolean; user: UserStaff; token: string; message: string; notFound?: boolean }> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, req).pipe(
      map(res => {
        if (res.success && res.data?.user) {
          this.currentUser.set(res.data.user);
          this.isLoggedIn.set(true);
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('nhackich_user', JSON.stringify(res.data.user));
          }
        }
        return res;
      }),
      catchError((error: HttpErrorResponse) => {
        const errorData = error.error || {};
        return throwError(() => ({
          success: false,
          notFound: errorData.notFound || false,
          message: errorData.message || 'Đăng nhập không thành công'
        }));
      })
    );
  }

  register(req: AuthRegisterRequest): Observable<{ success: boolean; user: UserStaff; token: string; message: string; alreadyExists?: boolean }> {
    return this.http.post<any>(`${this.apiUrl}/auth/register`, req).pipe(
      map(res => {
        if (res.success && res.data?.user) {
          this.currentUser.set(res.data.user);
          this.isLoggedIn.set(true);
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('nhackich_user', JSON.stringify(res.data.user));
          }
        }
        return res;
      }),
      catchError((error: HttpErrorResponse) => {
        const errorData = error.error || {};
        return throwError(() => ({
          success: false,
          alreadyExists: errorData.alreadyExists || false,
          message: errorData.message || 'Đăng ký không thành công'
        }));
      })
    );
  }

  resetPassword(req: { identifier: string; otp: string; newPassword: string }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/auth/reset-password`, req).pipe(
      catchError((error: HttpErrorResponse) => {
        const errorData = error.error || {};
        return throwError(() => ({
          success: false,
          message: errorData.message || 'Không thể cập nhật mật khẩu'
        }));
      })
    );
  }

  logout(): void {
    this.isLoggedIn.set(false);
    this.currentUser.set({
      fullName: 'Khách Hàng',
      email: 'khachhang@gmail.com',
      phone: '0909123456',
      role: 'customer',
      isActive: true
    });
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('nhackich_user');
    }
  }

  setRole(role: 'customer' | 'admin' | 'editor' | 'accountant' | 'ticket_checker') {
    const rolesMap: Record<string, string> = {
      customer: 'Nguyễn Văn An (Khách Hàng)',
      admin: 'Trần Minh Đức (Giám đốc Điều hành)',
      editor: 'Lê Thảo My (Ban Biên Tập)',
      accountant: 'Nguyễn Thị Bích Ngọc (Kế Toán Trưởng)',
      ticket_checker: 'Phạm Hùng Cường (Tổ Trưởng Soát Vé)'
    };
    this.currentUser.set({
      fullName: rolesMap[role] || 'Người Dùng',
      email: `${role}@nhackichthanhpho.vn`,
      phone: '0901888999',
      role,
      isActive: true
    });
  }

  // ==========================================
  // PHÂN HỆ 1: CUSTOMER PORTAL APIS
  // ==========================================

  getMusicals(filters?: { search?: string; genre?: string; status?: string; sort?: string }): Observable<Musical[]> {
    let query = '';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.genre) params.append('genre', filters.genre);
      if (filters.status) params.append('status', filters.status);
      if (filters.sort) params.append('sort', filters.sort);
      query = '?' + params.toString();
    }
    return this.http.get<ApiResponse<Musical[]>>(`${this.apiUrl}/musicals${query}`).pipe(
      map(res => res.data),
      catchError(this.handleError<Musical[]>('getMusicals', []))
    );
  }

  getMusicalBySlug(slug: string): Observable<Musical> {
    return this.http.get<ApiResponse<Musical>>(`${this.apiUrl}/musicals/${slug}`).pipe(
      map(res => res.data),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => new Error(error.error?.message || 'Không tìm thấy vở kịch'));
      })
    );
  }

  getSchedules(slug?: string): Observable<Schedule[]> {
    const url = slug ? `${this.apiUrl}/schedules?slug=${slug}` : `${this.apiUrl}/schedules`;
    return this.http.get<ApiResponse<Schedule[]>>(url).pipe(
      map(res => res.data),
      catchError(this.handleError<Schedule[]>('getSchedules', []))
    );
  }

  getScheduleSeats(scheduleId: string): Observable<{ scheduleId: string; musicalTitle: string; performanceDate: string; time: string; hall: string; seats: Seat[] }> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/schedules/${scheduleId}/seats`).pipe(
      map(res => res.data),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => new Error(error.error?.message || 'Không thể tải sơ đồ ghế'));
      })
    );
  }

  holdSeats(scheduleId: string, seatCodes: string[], sessionId: string): Observable<{ success: boolean; message: string; expiresAt: Date; holdDurationSeconds: number }> {
    return this.http.post<any>(`${this.apiUrl}/schedules/${scheduleId}/hold-seats`, { seatCodes, sessionId }).pipe(
      catchError((error: HttpErrorResponse) => {
        const msg = error.error?.message || 'Không thể giữ ghế do đã có người chọn';
        return throwError(() => new Error(msg));
      })
    );
  }

  releaseSeats(scheduleId: string, seatCodes: string[], sessionId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/schedules/${scheduleId}/release-seats`, { seatCodes, sessionId }).pipe(
      catchError(this.handleError('releaseSeats', {}))
    );
  }

  private memClientBookings: BookingOrder[] = [
    {
      bookingCode: 'BK-84920',
      musicalSlug: 'bong-bong-bay',
      musicalTitle: 'Bông Bóng Bay - Giấc Mơ Tuổi Thơ',
      scheduleId: 'SCHED-01',
      performanceDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      performanceTime: '19:30',
      venue: 'Nhà hát Lớn Thành phố',
      hall: 'Khán phòng Hoàng Gia (Stalls & Grand Tier)',
      customerName: 'Nguyễn Văn An',
      customerEmail: 'khachhang@gmail.com',
      customerPhone: '0909123456',
      seats: [
        { seatCode: 'B05', floor: 'Tầng Trệt', row: 'B', number: 5, type: 'VIP', price: 800000 },
        { seatCode: 'B06', floor: 'Tầng Trệt', row: 'B', number: 6, type: 'VIP', price: 800000 }
      ],
      quantity: 2,
      subtotal: 1600000,
      voucherCode: 'SHOWMAN20',
      discountAmount: 250000,
      totalPrice: 1350000,
      paymentMethod: 'VIETQR',
      paymentStatus: 'PAID',
      bookingStatus: 'CONFIRMED',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      bookingCode: 'BK-99124',
      musicalSlug: 'giac-mo-mua-he',
      musicalTitle: 'Giấc Mơ Mùa Hè (A Midsummer Night)',
      scheduleId: 'SCHED-02',
      performanceDate: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // Còn 5 giờ (< 12h) để test BPMN 2.2.4 lỗi hủy vé
      performanceTime: '19:00',
      venue: 'Nhà hát Lớn Thành phố',
      hall: 'Khán phòng Hoàng Gia (Stalls)',
      customerName: 'Nguyễn Văn An',
      customerEmail: 'khachhang@gmail.com',
      customerPhone: '0909123456',
      seats: [
        { seatCode: 'A08', floor: 'Tầng Trệt', row: 'A', number: 8, type: 'VIP', price: 850000 }
      ],
      quantity: 1,
      subtotal: 850000,
      discountAmount: 0,
      totalPrice: 850000,
      paymentMethod: 'VNPAY',
      paymentStatus: 'PAID',
      bookingStatus: 'CONFIRMED',
      createdAt: new Date().toISOString()
    },
    {
      bookingCode: 'BK-12093',
      musicalSlug: 'giac-mo-mua-he',
      musicalTitle: 'Giấc Mơ Mùa Hè (A Midsummer Night)',
      scheduleId: 'SCHED-02',
      performanceDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      performanceTime: '20:00',
      venue: 'Nhà hát Lớn Thành phố',
      hall: 'Khán phòng Hoàng Gia (Stalls)',
      customerName: 'Nguyễn Văn An',
      customerEmail: 'khachhang@gmail.com',
      customerPhone: '0909123456',
      seats: [
        { seatCode: 'C03', floor: 'Tầng Trệt', row: 'C', number: 3, type: 'Standard', price: 450000 }
      ],
      quantity: 1,
      subtotal: 450000,
      discountAmount: 0,
      totalPrice: 450000,
      paymentMethod: 'MOMO',
      paymentStatus: 'PAID',
      bookingStatus: 'CHECKED_IN',
      checkInInfo: {
        checkedInAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        checkedInBy: 'Trần Minh Tuấn (Soát vé Cửa 1)',
        gate: 'Cửa 1 - Tầng Trệt'
      },
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      bookingCode: 'BK-33910',
      musicalSlug: 'bong-bong-bay',
      musicalTitle: 'Bông Bóng Bay - Giấc Mơ Tuổi Thơ',
      scheduleId: 'SCHED-01',
      performanceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      performanceTime: '19:30',
      venue: 'Nhà hát Lớn Thành phố',
      hall: 'Khán phòng Hoàng Gia',
      customerName: 'Nguyễn Văn An',
      customerEmail: 'khachhang@gmail.com',
      customerPhone: '0909123456',
      seats: [
        { seatCode: 'D01', floor: 'Tầng Trệt', row: 'D', number: 1, type: 'Standard', price: 450000 }
      ],
      quantity: 1,
      subtotal: 450000,
      discountAmount: 0,
      totalPrice: 450000,
      paymentMethod: 'ZALOPAY',
      paymentStatus: 'REFUNDED',
      bookingStatus: 'CANCELLED',
      refundInfo: {
        refundedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        refundAmount: 405000,
        refundFee: 45000,
        refundReason: 'Khách hàng bận công tác đột xuất'
      },
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  validateVoucher(code: string, subtotal: number): Observable<ApiResponse<VoucherValidationResponse>> {
    return this.http.post<ApiResponse<VoucherValidationResponse>>(`${this.apiUrl}/vouchers/validate`, { code, subtotal }).pipe(
      catchError((error: HttpErrorResponse) => {
        const c = (code || '').toUpperCase().trim();
        if (c === 'SHOWMAN20') {
          if (subtotal < 800000) {
            return throwError(() => new Error('Đơn hàng tối thiểu 800.000 đ để dùng mã SHOWMAN20'));
          }
          const discountAmount = Math.min(250000, Math.round(subtotal * 0.2));
          return of({
            success: true,
            message: 'Áp dụng thành công mã SHOWMAN20 (-20%)',
            data: {
              code: 'SHOWMAN20',
              discountAmount,
              discountType: 'PERCENT' as const,
              discountValue: 20
            }
          });
        }
        if (c === 'TRIAN10') {
          const discountAmount = Math.round(subtotal * 0.1);
          return of({
            success: true,
            message: 'Áp dụng thành công mã TRIAN10 (-10%)',
            data: {
              code: 'TRIAN10',
              discountAmount,
              discountType: 'PERCENT' as const,
              discountValue: 10
            }
          });
        }
        return throwError(() => new Error(error.error?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn'));
      })
    );
  }

  createBooking(payload: BookingRequest): Observable<ApiResponse<BookingOrder>> {
    return this.http.post<ApiResponse<BookingOrder>>(`${this.apiUrl}/bookings`, payload).pipe(
      catchError((error: HttpErrorResponse) => {
        // Fallback local booking order creation
        const newCode = 'BK-' + Math.floor(10000 + Math.random() * 90000);
        const subtotal = payload.seats?.reduce((sum, s) => sum + s.price, 0) || 500000;
        const discountAmount = payload.voucherCode === 'SHOWMAN20' ? Math.min(250000, Math.round(subtotal * 0.2)) : 0;
        const createdOrder: BookingOrder = {
          bookingCode: newCode,
          musicalSlug: payload.musicalSlug,
          musicalTitle: payload.musicalTitle || 'Vở Nhạc Kịch Thành Phố',
          scheduleId: payload.scheduleId,
          performanceDate: payload.performanceDate || new Date().toISOString(),
          performanceTime: payload.performanceTime || '19:30',
          venue: 'Nhà hát Lớn Thành phố',
          hall: 'Khán phòng Hoàng Gia (Stalls & Grand Tier)',
          customerName: payload.customerName,
          customerEmail: payload.customerEmail,
          customerPhone: payload.customerPhone,
          seats: payload.seats || [],
          quantity: payload.seats?.length || 1,
          subtotal,
          voucherCode: payload.voucherCode,
          discountAmount,
          totalPrice: Math.max(0, subtotal - discountAmount),
          paymentMethod: payload.paymentMethod || 'VIETQR',
          paymentStatus: 'PAID',
          bookingStatus: 'CONFIRMED',
          createdAt: new Date().toISOString()
        };
        this.memClientBookings.unshift(createdOrder);
        return of({
          success: true,
          message: 'Đặt vé thành công!',
          data: createdOrder
        });
      })
    );
  }

  getMyBookings(email?: string, phone?: string): Observable<BookingOrder[]> {
    let query = '';
    if (email) query += `?email=${encodeURIComponent(email)}`;
    if (phone) query += (query ? '&' : '?') + `phone=${encodeURIComponent(phone)}`;
    return this.http.get<ApiResponse<BookingOrder[]>>(`${this.apiUrl}/bookings/my-bookings${query}`).pipe(
      map(res => {
        if (res.data && res.data.length > 0) return res.data;
        return this.memClientBookings;
      }),
      catchError(() => of(this.memClientBookings))
    );
  }

  cancelBooking(bookingCode: string, reason: string): Observable<ApiResponse<BookingOrder>> {
    return this.http.post<ApiResponse<BookingOrder>>(`${this.apiUrl}/bookings/${bookingCode}/cancel`, { reason }).pipe(
      catchError((error: HttpErrorResponse) => {
        const found = this.memClientBookings.find(b => b.bookingCode === bookingCode);
        if (found) {
          const showTime = new Date(found.performanceDate).getTime();
          const diffHours = (showTime - Date.now()) / (1000 * 60 * 60);
          if (diffHours < 12) {
            return throwError(() => new Error('Suất diễn diễn ra trong vòng 12 giờ tới, theo quy định nhà hát không thể hủy vé.'));
          }
          const rate = diffHours >= 24 ? 0.9 : 0.7;
          const refundAmount = Math.round(found.totalPrice * rate);
          const refundFee = found.totalPrice - refundAmount;
          found.bookingStatus = 'CANCELLED';
          found.paymentStatus = 'REFUNDED';
          found.refundInfo = {
            refundedAt: new Date().toISOString(),
            refundAmount,
            refundFee,
            refundReason: reason
          };
          return of({
            success: true,
            message: `Hủy vé thành công! Bạn được hoàn ${refundAmount.toLocaleString('vi-VN')} đ (phí hủy: ${refundFee.toLocaleString('vi-VN')} đ).`,
            data: found
          });
        }
        return throwError(() => new Error(error.error?.message || 'Không thể hủy vé'));
      })
    );
  }

  getArtists(): Observable<Artist[]> {
    return this.http.get<ApiResponse<Artist[]>>(`${this.apiUrl}/artists`).pipe(
      map(res => res.data),
      catchError(this.handleError<Artist[]>('getArtists', []))
    );
  }

  // ==========================================
  // PHÂN HỆ 2: ADMIN PORTAL APIS (RBAC)
  // ==========================================

  getAdminDashboard(): Observable<DashboardStats> {
    return this.http.get<ApiResponse<DashboardStats>>(`${this.apiUrl}/admin/dashboard`).pipe(
      map(res => res.data),
      catchError(this.handleError<DashboardStats>('getAdminDashboard', {
        totalRevenue: 275000000,
        totalTicketsSold: 342,
        totalOrders: 156,
        occupancyRate: 74,
        activeShowsCount: 3,
        paymentBreakdown: { VIETQR: 120000000, VNPAY: 85000000, MOMO: 45000000, ZALOPAY: 15000000, BANK_CARD: 10000000 }
      }))
    );
  }

  lockSeats(scheduleId: string, seatCodes: string[], reason: string, lockedBy: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/seats/lock`, { scheduleId, seatCodes, reason, lockedBy }).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => new Error(error.error?.message || 'Không thể khóa ghế nội bộ'));
      })
    );
  }

  unlockSeats(scheduleId: string, seatCodes: string[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/seats/unlock`, { scheduleId, seatCodes }).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => new Error(error.error?.message || 'Không thể mở khóa ghế'));
      })
    );
  }

  getAdminOrders(search?: string, status?: string): Observable<BookingOrder[]> {
    let q = '';
    if (search) q += `?search=${encodeURIComponent(search)}`;
    if (status) q += (q ? '&' : '?') + `status=${status}`;
    return this.http.get<ApiResponse<BookingOrder[]>>(`${this.apiUrl}/admin/orders${q}`).pipe(
      map(res => res.data),
      catchError(this.handleError<BookingOrder[]>('getAdminOrders', []))
    );
  }

  refundOrder(id: string, reason: string, refundAmount?: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/orders/${id}/refund`, { reason, refundAmount }).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => new Error(error.error?.message || 'Lỗi khi hoàn tiền'));
      })
    );
  }

  getAdminVouchers(): Observable<Voucher[]> {
    return this.http.get<ApiResponse<Voucher[]>>(`${this.apiUrl}/admin/vouchers`).pipe(
      map(res => res.data),
      catchError(this.handleError<Voucher[]>('getAdminVouchers', []))
    );
  }

  createVoucher(voucher: Partial<Voucher>): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/vouchers`, voucher).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => new Error(error.error?.message || 'Lỗi khi tạo voucher'));
      })
    );
  }

  toggleVoucher(id: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/admin/vouchers/${id}/toggle`, {}).pipe(
      catchError(this.handleError('toggleVoucher', {}))
    );
  }

  getReconciliations(): Observable<ReconciliationRecord[]> {
    return this.http.get<ApiResponse<ReconciliationRecord[]>>(`${this.apiUrl}/admin/reports/reconciliation`).pipe(
      map(res => res.data),
      catchError(this.handleError<ReconciliationRecord[]>('getReconciliations', []))
    );
  }

  getUsers(): Observable<UserStaff[]> {
    return this.http.get<ApiResponse<UserStaff[]>>(`${this.apiUrl}/admin/users`).pipe(
      map(res => res.data),
      catchError(this.handleError<UserStaff[]>('getUsers', []))
    );
  }

  // ==========================================
  // PHÂN HỆ 3: OPS PORTAL APIS (CHECK-IN)
  // ==========================================

  checkInTicket(ticketCode: string, operatorName: string, gate?: string): Observable<ApiResponse<CheckInResult>> {
    return this.http.post<ApiResponse<CheckInResult>>(`${this.apiUrl}/ops/check-in`, { ticketCode, operatorName, gate }).pipe(
      catchError((error: HttpErrorResponse) => {
        const errorData = error.error || {};
        return throwError(() => ({
          code: errorData.code || 'CHECK_IN_ERROR',
          message: errorData.message || 'Mã vé không hợp lệ hoặc đã sử dụng',
          details: errorData.data
        }));
      })
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.warn(`[MusicalService] ${operation} cảnh báo:`, error.message);
      return of(result as T);
    };
  }
}
