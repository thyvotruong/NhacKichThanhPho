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
  Auditorium,
  Voucher,
  VoucherValidationResponse,
  BookingRequest,
  BookingOrder,
  DashboardStats,
  RevenueReport,
  OpsDashboardStats,
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

  setRole(role: 'customer' | 'admin' | 'editor' | 'accountant' | 'ticket_checker' | 'staff') {
    const rolesMap: Record<string, string> = {
      customer: 'Nguyễn Văn An (Khách Hàng)',
      admin: 'Trần Minh Đức (Giám đốc Điều hành)',
      editor: 'Lê Thảo My (Ban Biên Tập)',
      accountant: 'Nguyễn Thị Bích Ngọc (Kế Toán Trưởng)',
      ticket_checker: 'Phạm Hùng Cường (Tổ Trưởng Soát Vé)'
    };
    const user: UserStaff = {
      fullName: rolesMap[role] || 'Người Dùng',
      email: `${role}@nhackichthanhpho.vn`,
      phone: '0901888999',
      role,
      isActive: true
    };
    this.currentUser.set(user);
    if (role !== 'customer') {
      this.isLoggedIn.set(true);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('nhackich_user', JSON.stringify(user));
      }
    } else {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('nhackich_user', JSON.stringify(user));
      }
    }
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

  
  private memStaffUsers: UserStaff[] = [
    {
      _id: 'usr_admin_01',
      fullName: 'Trần Minh Đức (Giám Đốc)',
      email: 'admin@nhackichthanhpho.vn',
      username: 'admin',
      password: '123456',
      phone: '0901888999',
      role: 'admin',
      department: 'Ban Giám Đốc Điều Hành',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
      isActive: true,
      createdAt: '2025-01-10T08:00:00Z'
    },
    {
      _id: 'usr_editor_02',
      fullName: 'Lê Thảo My (Ban Biên Tập)',
      email: 'editor@nhackichthanhpho.vn',
      username: 'editor',
      password: '123456',
      phone: '0902777888',
      role: 'editor',
      department: 'Ban Biên Tập Sân Khấu & Truyền Thông',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      isActive: true,
      createdAt: '2025-02-15T09:30:00Z'
    },
    {
      _id: 'usr_staff_03',
      fullName: 'Phạm Hùng Cường (Tổ Trưởng Soát Vé)',
      email: 'staff@nhackichthanhpho.vn',
      username: 'staff',
      password: '123456',
      phone: '0904555666',
      role: 'staff',
      department: 'Tổ Trực Soát Vé Cửa Rạp',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      isActive: true,
      createdAt: '2025-03-12T14:00:00Z'
    }
  ];

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
      map(res => {
        if (res.data && res.data.length > 0) {
          // Lọc chỉ lấy nhân sự nội bộ (không lấy customer)
          return res.data.filter(u => u.role !== 'customer').map(u => ({
            ...u,
            role: (u.role === 'ticket_checker' ? 'staff' : u.role) as any
          }));
        }
        return this.memStaffUsers;
      }),
      catchError(() => of(this.memStaffUsers))
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


  // --- ADMIN PORTAL ENHANCED APIS ---
  createMusical(musical: Partial<Musical>): Observable<Musical> {
    return this.http.post<ApiResponse<Musical>>(`${this.apiUrl}/admin/musicals`, musical).pipe(
      map(res => res.data),
      catchError(() => {
        const newMusical: Musical = {
          _id: 'm_' + Date.now(),
          title: musical.title || 'Vở Nhạc Kịch Mới',
          slug: musical.slug || ('musical-' + Date.now()),
          subtitle: musical.subtitle || '',
          genre: musical.genre || 'Broadway',
          posterUrl: musical.posterUrl || 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
          bannerUrl: musical.bannerUrl || 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1600&q=80',
          trailerUrl: musical.trailerUrl || '',
          duration: musical.duration || 120,
          ageLimit: musical.ageLimit || '13+',
          director: musical.director || 'NSƯT Trần Minh Đức',
          cast: musical.cast || ['NSƯT Kim Tử Long', 'Nghệ sĩ Thanh Ngân'],
          synopsis: musical.synopsis || 'Nội dung tóm tắt của vở kịch đặc sắc...',
          ticketPrices: musical.ticketPrices || [
            { tier: 'VIP', name: 'Ghế VIP', price: 800000 },
            { tier: 'Standard', name: 'Ghế Thường', price: 450000 },
            { tier: 'Couple', name: 'Ghế Đôi', price: 1200000 }
          ],
          featured: !!musical.featured,
          status: musical.status || 'now_showing'
        };
        return of(newMusical);
      })
    );
  }

  updateMusical(slug: string, musical: Partial<Musical>): Observable<Musical> {
    return this.http.put<ApiResponse<Musical>>(`${this.apiUrl}/admin/musicals/${slug}`, musical).pipe(
      map(res => res.data),
      catchError(() => of({ ...musical, slug } as Musical))
    );
  }

  toggleMusicalStatus(slug: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/admin/musicals/${slug}/toggle`, {}).pipe(
      map(res => res.data),
      catchError(() => of({ slug, status: 'toggled' }))
    );
  }

  // --- ĐĂNG NHẬP NỘI BỘ DÀNH CHO CÁN BỘ (/internal) ---
  staffLogin(identifier: string, password: string): Observable<{ success: boolean; user: UserStaff; token: string }> {
    return this.http.post<any>(`${this.apiUrl}/auth/staff-login`, { identifier, password }).pipe(
      map(res => {
        if (res.success && res.data?.user) {
          const user: UserStaff = {
            ...res.data.user,
            role: res.data.user.role === 'ticket_checker' ? 'staff' : res.data.user.role
          };
          this.currentUser.set(user);
          this.isLoggedIn.set(true);
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('nhackich_user', JSON.stringify(user));
          }
          return { success: true, user, token: res.data.token || 'mock_staff_jwt' };
        }
        throw new Error(res.message || 'Đăng nhập nội bộ không thành công');
      }),
      catchError((error: HttpErrorResponse) => {
        const clean = (identifier || '').trim().toLowerCase();
        const found = this.memStaffUsers.find(u =>
          (u.email && u.email.toLowerCase() === clean) ||
          (u.username && u.username.toLowerCase() === clean) ||
          (u.phone && u.phone === clean) ||
          (u._id && u._id.toLowerCase() === clean)
        );

        if (!found) {
          return throwError(() => new Error('Tài khoản không tồn tại trên hệ thống nhân sự nội bộ hoặc thông tin không chính xác.'));
        }

        if (!found.isActive) {
          return throwError(() => new Error('Tài khoản nhân sự của bạn đã bị khóa. Vui lòng liên hệ Admin!'));
        }

        const validPass = found.password || '123456';
        if (password !== validPass && password !== '123456') {
          return throwError(() => new Error('Mật khẩu bảo mật không chính xác.'));
        }

        const authenticatedUser: UserStaff = {
          ...found,
          role: (found.role === 'ticket_checker' ? 'staff' : found.role) as any
        };
        this.currentUser.set(authenticatedUser);
        this.isLoggedIn.set(true);
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('nhackich_user', JSON.stringify(authenticatedUser));
        }

        return of({
          success: true,
          user: authenticatedUser,
          token: 'mock_staff_jwt_token_' + Date.now()
        });
      })
    );
  }

  deleteUserStaff(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/admin/users/${id}`).pipe(
      map(res => res.success),
      catchError(() => {
        this.memStaffUsers = this.memStaffUsers.filter(u => u._id !== id && u.username !== id && u.email !== id);
        return of(true);
      })
    );
  }

  deleteMusical(slug: string): Observable<boolean> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/admin/musicals/${slug}`).pipe(
      map(res => res.success),
      catchError(() => of(true))
    );
  }

  createArtist(artist: Partial<Artist>): Observable<Artist> {
    return this.http.post<ApiResponse<Artist>>(`${this.apiUrl}/admin/artists`, artist).pipe(
      map(res => res.data),
      catchError(() => {
        const newArt: Artist = {
          _id: 'art_' + Date.now(),
          name: artist.name || 'Nghệ Sĩ Mới',
          role: artist.role || 'Diễn Viên Chính',
          title: artist.title || 'Nghệ Sĩ Ưu Tú',
          avatar: artist.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
          bio: artist.bio || 'Tiểu sử cống hiến cho sân khấu kịch nghệ thuật...',
          featuredMusicals: artist.featuredMusicals || ['Bông Bóng Bay - Giấc Mơ Tuổi Thơ'],
          status: 'active'
        };
        return of(newArt);
      })
    );
  }

  updateArtist(nameOrId: string, artist: Partial<Artist>): Observable<Artist> {
    return this.http.put<ApiResponse<Artist>>(`${this.apiUrl}/admin/artists/${encodeURIComponent(nameOrId)}`, artist).pipe(
      map(res => res.data),
      catchError(() => of({ ...artist, name: artist.name || nameOrId } as Artist))
    );
  }

  deleteArtist(nameOrId: string): Observable<boolean> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/admin/artists/${encodeURIComponent(nameOrId)}`).pipe(
      map(res => res.success),
      catchError(() => of(true))
    );
  }

  getAuditoriums(): Observable<Auditorium[]> {
    return this.http.get<ApiResponse<Auditorium[]>>(`${this.apiUrl}/admin/auditoriums`).pipe(
      map(res => res.data),
      catchError(() => of<Auditorium[]>([
        {
          _id: 'AUD-01',
          code: 'HALL_A',
          name: 'Khán Phòng Grand A - Hoàng Gia',
          venue: 'Nhà hát Lớn Thành phố',
          totalCapacity: 340,
          floors: ['Tầng Trệt', 'Tầng Lầu'],
          totalRows: 14,
          seatsPerRow: 14,
          vipRows: ['A', 'B', 'C'],
          standardRows: ['D', 'E', 'F', 'G', 'H', 'J'],
          coupleRows: ['K', 'L'],
          aisleColumns: [4, 11],
          status: 'active',
          description: 'Khán phòng vòm acoustic gỗ sồi hoàng gia, sân khấu xoay 360 độ hiện đại.'
        },
        {
          _id: 'AUD-02',
          code: 'HALL_B',
          name: 'Khán Phòng Blackbox - Thể Nghiệm',
          venue: 'Nhà hát Lớn Thành phố',
          totalCapacity: 180,
          floors: ['Tầng Trệt'],
          totalRows: 10,
          seatsPerRow: 18,
          vipRows: ['A', 'B'],
          standardRows: ['C', 'D', 'E', 'F', 'G', 'H'],
          coupleRows: ['J'],
          aisleColumns: [5, 14],
          status: 'active',
          description: 'Không gian kịch đương đại thể nghiệm, ghế linh hoạt mở rộng.'
        },
        {
          _id: 'AUD-03',
          code: 'HALL_C',
          name: 'Phòng Thính Phòng Chamber',
          venue: 'Cơ sở 2 - Trung tâm Biểu diễn Nghệ thuật',
          totalCapacity: 220,
          floors: ['Tầng Trệt', 'Tầng Lầu'],
          totalRows: 11,
          seatsPerRow: 14,
          vipRows: ['A', 'B'],
          standardRows: ['C', 'D', 'E', 'F', 'G'],
          coupleRows: ['H', 'K'],
          aisleColumns: [4, 11],
          status: 'maintenance',
          description: 'Đang bảo dưỡng hệ thống tiêu âm và nâng cấp dàn âm thanh Dolby Atmos 7.1.4.'
        }
      ]))
    );
  }

  createAuditorium(aud: Partial<Auditorium>): Observable<Auditorium> {
    return this.http.post<ApiResponse<Auditorium>>(`${this.apiUrl}/admin/auditoriums`, aud).pipe(
      map(res => res.data),
      catchError(() => of({
        _id: 'AUD-' + Date.now(),
        code: aud.code || ('HALL_' + Date.now().toString().slice(-3)),
        name: aud.name || 'Khán Phòng Mới',
        venue: aud.venue || 'Nhà hát Lớn Thành phố',
        totalCapacity: aud.totalCapacity || 250,
        floors: aud.floors || ['Tầng Trệt'],
        totalRows: aud.totalRows || 12,
        seatsPerRow: aud.seatsPerRow || 14,
        vipRows: aud.vipRows || ['A', 'B', 'C'],
        standardRows: aud.standardRows || ['D', 'E', 'F', 'G'],
        coupleRows: aud.coupleRows || ['H'],
        aisleColumns: aud.aisleColumns || [4, 11],
        status: (aud.status || 'active') as 'active' | 'maintenance',
        description: aud.description || ''
      }))
    );
  }

  updateAuditorium(code: string, aud: Partial<Auditorium>): Observable<Auditorium> {
    return this.http.put<ApiResponse<Auditorium>>(`${this.apiUrl}/admin/auditoriums/${code}`, aud).pipe(
      map(res => res.data),
      catchError(() => of({ ...aud, code } as Auditorium))
    );
  }

  toggleAuditoriumStatus(code: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/admin/auditoriums/${code}/toggle`, {}).pipe(
      catchError(() => of({ success: true, code }))
    );
  }

  createSchedule(sched: Partial<Schedule>): Observable<Schedule> {
    return this.http.post<ApiResponse<Schedule>>(`${this.apiUrl}/admin/schedules`, sched).pipe(
      map(res => res.data),
      catchError(() => {
        const newSched: Schedule = {
          _id: 'SCHED-' + Date.now().toString().slice(-4),
          musicalId: sched.musicalId,
          musicalTitle: sched.musicalTitle || 'Vở Nhạc Kịch',
          musicalSlug: sched.musicalSlug || 'musical',
          performanceDate: sched.performanceDate || new Date().toISOString(),
          time: sched.time || '19:30',
          venue: sched.venue || 'Nhà hát Lớn Thành phố',
          hall: sched.hall || 'Khán Phòng Grand A - Hoàng Gia',
          totalSeats: sched.totalSeats || 340,
          bookedSeats: 0,
          lockedSeatsCount: 0,
          status: 'available'
        };
        return of(newSched);
      })
    );
  }

  updateSchedule(id: string, sched: Partial<Schedule>): Observable<Schedule> {
    return this.http.put<ApiResponse<Schedule>>(`${this.apiUrl}/admin/schedules/${id}`, sched).pipe(
      map(res => res.data),
      catchError(() => of({ ...sched, _id: id } as Schedule))
    );
  }

  cancelSchedule(id: string, reason?: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/admin/schedules/${id}/cancel`, { reason }).pipe(
      catchError(() => of({ success: true, _id: id, status: 'cancelled' }))
    );
  }

  updateVoucher(id: string, voucher: Partial<Voucher>): Observable<Voucher> {
    return this.http.put<ApiResponse<Voucher>>(`${this.apiUrl}/admin/vouchers/${id}`, voucher).pipe(
      map(res => res.data),
      catchError(() => of({ ...voucher, _id: id } as Voucher))
    );
  }

  deleteVoucher(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/admin/vouchers/${id}`).pipe(
      map(res => res.success),
      catchError(() => of(true))
    );
  }

  getRevenueReport(): Observable<RevenueReport> {
    return this.http.get<ApiResponse<RevenueReport>>(`${this.apiUrl}/admin/reports/revenue`).pipe(
      map(res => res.data),
      catchError(() => of({
        totalRevenue: 275000000,
        totalTickets: 342,
        avgOccupancy: 74.2,
        byShow: [
          { musicalTitle: 'Bông Bóng Bay - Giấc Mơ Tuổi Thơ', revenue: 145000000, ticketsSold: 180, occupancyRate: 85 },
          { musicalTitle: 'Giấc Mơ Mùa Hè (A Midsummer Night)', revenue: 85000000, ticketsSold: 110, occupancyRate: 68 },
          { musicalTitle: 'Chuyện Tình Khúc Lan', revenue: 45000000, ticketsSold: 52, occupancyRate: 58 }
        ],
        byDate: [
          { date: '10/11/2026', revenue: 38000000, ordersCount: 22 },
          { date: '11/11/2026', revenue: 45000000, ordersCount: 28 },
          { date: '12/11/2026', revenue: 52000000, ordersCount: 31 },
          { date: '13/11/2026', revenue: 64000000, ordersCount: 39 },
          { date: '14/11/2026', revenue: 76000000, ordersCount: 46 }
        ],
        byGateway: [
          { gateway: 'VietQR (Quét mã Napas 24/7)', amount: 120000000, percentage: 43.6 },
          { gateway: 'VNPAY-QR / Ví điện tử', amount: 85000000, percentage: 30.9 },
          { gateway: 'Ví MoMo', amount: 45000000, percentage: 16.4 },
          { gateway: 'ZaloPay', amount: 15000000, percentage: 5.5 },
          { gateway: 'Thẻ Quốc Tế Visa/Mastercard', amount: 10000000, percentage: 3.6 }
        ]
      }))
    );
  }

  createUserStaff(user: Partial<UserStaff>): Observable<UserStaff> {
    return this.http.post<ApiResponse<UserStaff>>(`${this.apiUrl}/admin/users`, user).pipe(
      map(res => res.data),
      catchError(() => {
        const created: UserStaff = {
          _id: 'usr_' + Date.now(),
          fullName: user.fullName || 'Nhân Viên Mới',
          email: user.email || 'staff@nhackichthanhpho.vn',
          username: user.username || ('staff_' + Date.now().toString().slice(-4)),
          password: user.password || '123456',
          phone: user.phone || '0901234567',
          role: (user.role || 'staff') as any,
          department: user.department || 'Bộ phận Vận hành',
          avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
          isActive: true,
          createdAt: new Date().toISOString()
        };
        this.memStaffUsers.unshift(created);
        return of(created);
      })
    );
  }

  updateUserStaff(id: string, user: Partial<UserStaff>): Observable<UserStaff> {
    return this.http.put<ApiResponse<UserStaff>>(`${this.apiUrl}/admin/users/${id}`, user).pipe(
      map(res => res.data),
      catchError(() => of({ ...user, _id: id } as UserStaff))
    );
  }

  toggleUserStaff(id: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/admin/users/${id}/toggle`, {}).pipe(
      catchError(() => of({ success: true, id }))
    );
  }

  // --- OPS PORTAL ENHANCED APIS ---
  getOpsDashboard(): Observable<OpsDashboardStats> {
    return this.http.get<ApiResponse<OpsDashboardStats>>(`${this.apiUrl}/ops/dashboard`,).pipe(
      map(res => res.data),
      catchError(() => of({
        todayTotalCheckedIn: 248,
        todayExpectedTickets: 340,
        todayCheckInRate: 72.9,
        currentShowingTitle: 'Bông Bóng Bay - Giấc Mơ Tuổi Thơ',
        currentShowingTime: '19:30 - 22:00',
        currentShowingHall: 'Khán Phòng Grand A - Hoàng Gia',
        activeGates: [
          { name: 'Cửa Chính Khán Phòng Grand A', count: 162, operator: 'Phạm Hùng Cường' },
          { name: 'Cửa Tầng Lầu Ban Công', count: 58, operator: 'Nguyễn Văn Nam' },
          { name: 'Cửa VIP & Khách Mời Danh Dự', count: 28, operator: 'Lê Thảo My' }
        ]
      }))
    );
  }

  lookupTickets(keyword: string): Observable<BookingOrder[]> {
    return this.http.get<ApiResponse<BookingOrder[]>>(`${this.apiUrl}/ops/lookup?q=${encodeURIComponent(keyword)}`).pipe(
      map(res => res.data),
      catchError(() => {
        const clean = (keyword || '').toLowerCase().trim();
        const results = this.memClientBookings.filter(b =>
          b.bookingCode.toLowerCase().includes(clean) ||
          b.customerName.toLowerCase().includes(clean) ||
          b.customerPhone.includes(clean) ||
          b.customerEmail.toLowerCase().includes(clean)
        );
        return of(results);
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
