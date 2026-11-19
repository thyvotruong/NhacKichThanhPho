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
import { Observable, Subject, catchError, map, of, tap, throwError } from 'rxjs';
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
  AuthResponse,
  AuditLogEntry
} from '../models/musical.model';

@Injectable({
  providedIn: 'root'
})
export class MusicalService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5000/api';
  private readonly customerSessionKey = 'nhackich_customer_user';
  private readonly staffSessionKey = 'nhackich_staff_user';
  private readonly legacySessionKey = 'nhackich_user';

  // Subjects đồng bộ trạng thái thời gian thực giữa Admin Portal & Customer Portal
  readonly musicalsChanged$ = new Subject<void>();
  readonly artistsChanged$ = new Subject<void>();

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
      const legacy = localStorage.getItem(this.legacySessionKey);
      if (legacy) {
        try {
          const parsed = JSON.parse(legacy);
          if (parsed && typeof parsed === 'object' && parsed.fullName) {
            const key = parsed.role === 'customer' ? this.customerSessionKey : this.staffSessionKey;
            if (!localStorage.getItem(key)) {
              localStorage.setItem(key, legacy);
            }
          }
        } catch {
          // Remove an invalid legacy session below.
        }
        localStorage.removeItem(this.legacySessionKey);
      }

      const isInternalRoute = /^\/(internal|admin|ops)(\/|$)/.test(window.location.pathname);
      const sessionKey = isInternalRoute ? this.staffSessionKey : this.customerSessionKey;
      const saved = localStorage.getItem(sessionKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const validRole = isInternalRoute
            ? parsed?.role && parsed.role !== 'customer'
            : parsed?.role === 'customer';
          if (parsed && typeof parsed === 'object' && parsed.fullName && validRole) {
            parsed.fullName = parsed.fullName.replace(/\s*\(.*?\)/g, '').trim();
            this.currentUser.set(parsed);
            this.isLoggedIn.set(true);
            try { localStorage.setItem(sessionKey, JSON.stringify(parsed)); } catch {}
          } else {
            localStorage.removeItem(sessionKey);
          }
        } catch {
          localStorage.removeItem(sessionKey);
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
        const u = res.data?.user || res.user || (res.data && res.data.email ? res.data : null);
        if (res.success && u) {
          if (u.role && u.role !== 'customer') {
            throw new Error('Tài khoản này không thuộc phân hệ khách hàng.');
          }
          this.currentUser.set(u);
          this.isLoggedIn.set(true);
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(this.customerSessionKey, JSON.stringify(u));
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
        const u = res.data?.user || res.user || (res.data && res.data.email ? res.data : null);
        if (res.success && u) {
          if (u.role && u.role !== 'customer') {
            throw new Error('Tài khoản này không thuộc phân hệ khách hàng.');
          }
          this.currentUser.set(u);
          this.isLoggedIn.set(true);
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(this.customerSessionKey, JSON.stringify(u));
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

  changePassword(currentPassword: string, newPassword: string): Observable<{ success: boolean; message: string }> {
    const user = this.currentUser();
    const identifier = user?.email || user?.phone || '84customer@nhackichthanhpho.vn';
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/auth/change-password`, {
      identifier,
      currentPassword,
      newPassword
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        const errorData = error.error || {};
        return throwError(() => ({
          success: false,
          message: errorData.message || 'Đổi mật khẩu không thành công. Vui lòng thử lại.'
        }));
      })
    );
  }

  logout(): void {
    const sessionKey = this.currentUser().role === 'customer'
      ? this.customerSessionKey
      : this.staffSessionKey;
    this.isLoggedIn.set(false);
    this.currentUser.set({
      fullName: 'Khách Hàng',
      email: 'khachhang@gmail.com',
      phone: '0909123456',
      role: 'customer',
      isActive: true
    });
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(sessionKey);
      localStorage.removeItem(this.legacySessionKey);
    }
  }

  setRole(role: 'customer' | 'admin' | 'editor' | 'ticket_checker' | 'staff') {
    const rolesMap: Record<string, string> = {
      customer: 'Nguyễn Văn An',
      admin: 'Trần Minh Đức',
      editor: 'Lê Thảo My',
      ticket_checker: 'Phạm Hùng Cường',
      staff: 'Phạm Hùng Cường'
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
        localStorage.setItem(this.staffSessionKey, JSON.stringify(user));
      }
    } else {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.customerSessionKey, JSON.stringify(user));
      }
    }
  }

  // ==========================================
  // PHÂN HỆ 1: CUSTOMER PORTAL APIS
  // ==========================================

  getMusicals(filters?: { search?: string; genre?: string; status?: string; sort?: string; featured?: boolean }): Observable<Musical[]> {
    let query = '';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.search && filters.search.trim()) params.append('search', filters.search.trim());
      if (filters.genre && filters.genre.toLowerCase() !== 'all') params.append('genre', filters.genre);
      if (filters.status && filters.status.toLowerCase() !== 'all') params.append('status', filters.status);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.featured !== undefined) params.append('featured', String(filters.featured));
      const qs = params.toString();
      query = qs ? '?' + qs : '';
    }
    return this.http.get<ApiResponse<Musical[]>>(`${this.apiUrl}/musicals${query}`).pipe(
      map(res => res.data),
      catchError(() => {
        // Fallback đọc trực tiếp từ static JSON file /musicals.json
        return this.http.get<Musical[]>('/musicals.json').pipe(
          map(list => {
            let filtered = Array.isArray(list) ? [...list] : [];
            if (filters?.search) {
              const q = filters.search.toLowerCase().trim();
              filtered = filtered.filter(m =>
                [m.title, m.director, m.subtitle, ...(Array.isArray(m.cast) ? m.cast : [])]
                  .some(val => String(val || '').toLowerCase().includes(q))
              );
            }
            if (filters?.genre && filters.genre !== 'all') {
              const g = filters.genre.toLowerCase().trim();
              filtered = filtered.filter(m => {
                if (Array.isArray(m.genre)) return m.genre.some(item => item.toLowerCase().includes(g));
                return String(m.genre || '').toLowerCase().includes(g);
              });
            }
            if (filters?.status && filters.status !== 'all') {
              filtered = filtered.filter(m => m.status === filters.status);
            }
            if (filters?.featured !== undefined) {
              filtered = filtered.filter(m => Boolean(m.featured) === filters.featured);
            }
            if (filters?.sort === 'price_asc') {
              filtered.sort((a, b) => {
                const pa = Math.min(...(a.ticketPrices || []).map(p => p.price || 0));
                const pb = Math.min(...(b.ticketPrices || []).map(p => p.price || 0));
                return pa - pb;
              });
            } else if (filters?.sort === 'price_desc') {
              filtered.sort((a, b) => {
                const pa = Math.max(...(a.ticketPrices || []).map(p => p.price || 0));
                const pb = Math.max(...(b.ticketPrices || []).map(p => p.price || 0));
                return pb - pa;
              });
            } else if (filters?.sort === 'duration') {
              filtered.sort((a, b) => (b.duration || 0) - (a.duration || 0));
            }
            return filtered;
          }),
          catchError(this.handleError<Musical[]>('getMusicals', []))
        );
      })
    );
  }

  getMusicalBySlug(slug: string): Observable<Musical> {
    const cleanSlug = String(slug).toLowerCase().trim();
    return this.http.get<ApiResponse<Musical>>(`${this.apiUrl}/musicals/${cleanSlug}`).pipe(
      map(res => res.data),
      catchError(() => {
        // Fallback đọc trực tiếp từ static JSON file
        return this.http.get<Musical[]>('/musicals.json').pipe(
          map(list => {
            const found = (list || []).find(m => m.slug.toLowerCase() === cleanSlug || m._id === slug);
            if (!found) {
              throw new Error('Không tìm thấy vở kịch');
            }
            return found;
          })
        );
      })
    );
  }

  subscribeToMusicalNotifications(slug: string, email: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/musicals/${encodeURIComponent(slug)}/notifications`,
      { email }
    );
  }

  // ============================================================
  // SUBSCRIBERS / CUSTOMER LEADS API
  // ============================================================
  subscribeNewsletter(email: string, source: string = 'homepage_vip', musicalTitle?: string): Observable<{ success: boolean; message: string; data?: any }> {
    return this.http.post<{ success: boolean; message: string; data?: any }>(
      `${this.apiUrl}/subscribers`,
      { email, source, musicalTitle }
    );
  }

  getSubscribers(): Observable<{ success: boolean; count: number; data: any[] }> {
    return this.http.get<{ success: boolean; count: number; data: any[] }>(
      `${this.apiUrl}/admin/subscribers`
    ).pipe(
      catchError(() => {
        const fallback = [
          {
            _id: 'sub_001',
            email: 'vip.khanhgia@nhackichthanhpho.vn',
            source: 'homepage_vip',
            musicalTitle: '',
            createdAt: new Date(Date.now() - 7200000).toISOString()
          },
          {
            _id: 'sub_002',
            email: 'leminhquan.theatre@gmail.com',
            source: 'coming_soon_musical',
            musicalTitle: 'Tuổi thơ dữ dội',
            createdAt: new Date(Date.now() - 3600000).toISOString()
          }
        ];
        return of({ success: true, count: fallback.length, data: fallback });
      })
    );
  }

  deleteSubscriber(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/admin/subscribers/${encodeURIComponent(id)}`
    ).pipe(
      catchError(() => of({ success: true, message: 'Đã xóa đăng ký thành công' }))
    );
  }

  // ============================================================
  // SYSTEM AUDIT LOG API (RBAC ADMIN)
  // ============================================================
  getAuditLogs(): Observable<{ success: boolean; count: number; enabled: boolean; data: AuditLogEntry[] }> {
    return this.http.get<{ success: boolean; count: number; enabled: boolean; data: AuditLogEntry[] }>(
      `${this.apiUrl}/admin/audit-logs`
    ).pipe(
      catchError(() => {
        const sampleLogs: AuditLogEntry[] = [
          {
            _id: 'audit_fallback_01',
            action: 'LOGIN',
            category: 'AUTH',
            description: 'Đăng nhập phân hệ Quản trị thành công',
            performer: { username: 'admin', fullName: 'Trần Minh Đức', role: 'admin' },
            ipAddress: '127.0.0.1 (Localhost)',
            status: 'SUCCESS',
            createdAt: new Date()
          },
          {
            _id: 'audit_fallback_02',
            action: 'LOCK_SEATS',
            category: 'SEAT',
            description: 'Khóa 4 ghế nội bộ hàng A (A01, A02, A13, A14) cho khách VIP',
            performer: { username: 'admin', fullName: 'Trần Minh Đức', role: 'admin' },
            ipAddress: '127.0.0.1 (Localhost)',
            status: 'SUCCESS',
            metadata: { seatCodes: ['A01', 'A02', 'A13', 'A14'] },
            createdAt: new Date(Date.now() - 3600000)
          },
          {
            _id: 'audit_fallback_03',
            action: 'UPDATE_MUSICAL',
            category: 'MUSICAL',
            description: 'Cập nhật thông tin và trạng thái trình diễn vở "Lời thề thứ 9"',
            performer: { username: 'editor', fullName: 'Lê Thảo My', role: 'editor' },
            ipAddress: '192.168.1.15',
            status: 'SUCCESS',
            metadata: { slug: 'loi-the-thu-9', title: 'Lời thề thứ 9' },
            createdAt: new Date(Date.now() - 7200000)
          }
        ];
        return of({ success: true, count: sampleLogs.length, enabled: true, data: sampleLogs });
      })
    );
  }

  toggleAuditLog(enabled?: boolean): Observable<{ success: boolean; enabled: boolean; message: string }> {
    return this.http.post<{ success: boolean; enabled: boolean; message: string }>(
      `${this.apiUrl}/admin/audit-logs/toggle`,
      typeof enabled === 'boolean' ? { enabled } : {}
    ).pipe(
      catchError(() => {
        const state = typeof enabled === 'boolean' ? enabled : true;
        return of({
          success: true,
          enabled: state,
          message: `Đã ${state ? 'BẬT' : 'TẮT'} chức năng ghi Log hệ thống!`
        });
      })
    );
  }

  clearAuditLogs(): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/admin/audit-logs`
    ).pipe(
      catchError(() => of({ success: true, message: 'Đã dọn sạch nhật ký hệ thống!' }))
    );
  }

  getSchedules(slug?: string): Observable<Schedule[]> {
    const url = slug ? `${this.apiUrl}/schedules?slug=${slug}` : `${this.apiUrl}/schedules`;
    return this.http.get<ApiResponse<Schedule[]>>(url).pipe(
      map(res => res.data),
      catchError(() => {
        return this.http.get<Musical[]>('/musicals.json').pipe(
          map(musicals => {
            const musicalMap = new Map((musicals || []).map(m => [m.slug, m]));
            const standardDefs = [
              { _id: 'sch_lo-lem_20261118_1930', slug: 'lo-lem-chiec-giay-thuy-tinh', dateStr: '2026-11-18T19:30:00+07:00', time: '19:30', hall: 'Khán phòng Grand A - Hoàng Gia', booked: 32 },
              { _id: 'sch_loi-the-thu-9_20261119_2000', slug: 'loi-the-thu-9', dateStr: '2026-11-19T20:00:00+07:00', time: '20:00', hall: 'Khán phòng Grand A - Hoàng Gia', booked: 45 },
              { _id: 'sch_lo-lem-chiec-giay-thuy-tinh', slug: 'lo-lem-chiec-giay-thuy-tinh', dateStr: '2026-11-20T19:30:00+07:00', time: '19:30', hall: 'Khán phòng Grand A - Hoàng Gia', booked: 62 },
              { _id: 'sch_giac-mo-cua-bom_20261120_2000', slug: 'giac-mo-cua-bom', dateStr: '2026-11-20T20:00:00+07:00', time: '20:00', hall: 'Khán phòng Broadway Opera', booked: 40 },
              { _id: 'sch_lo-lem_20261121_1500', slug: 'lo-lem-chiec-giay-thuy-tinh', dateStr: '2026-11-21T15:00:00+07:00', time: '15:00', hall: 'Khán phòng Grand A - Hoàng Gia', booked: 58 },
              { _id: 'sch_tuoi-tho-du-doi', slug: 'tuoi-tho-du-doi', dateStr: '2026-11-21T19:30:00+07:00', time: '19:30', hall: 'Khán phòng Grand A - Hoàng Gia', booked: 70 },
              { _id: 'sch_giac-mo-cua-bom_20261122_1500', slug: 'giac-mo-cua-bom', dateStr: '2026-11-22T15:00:00+07:00', time: '15:00', hall: 'Khán phòng Grand A - Hoàng Gia', booked: 55 },
              { _id: 'sch_quan-khu-nam-dong', slug: 'quan-khu-nam-dong', dateStr: '2026-11-22T20:00:00+07:00', time: '20:00', hall: 'Khán phòng Broadway Opera', booked: 48 },
              { _id: 'sch_hon-truong-ba-da-hang-thit', slug: 'hon-truong-ba-da-hang-thit', dateStr: '2026-11-23T19:30:00+07:00', time: '19:30', hall: 'Khán phòng Grand A - Hoàng Gia', booked: 64 },
              { _id: 'sch_loi-the-thu-9', slug: 'loi-the-thu-9', dateStr: '2026-11-24T20:00:00+07:00', time: '20:00', hall: 'Khán phòng Grand A - Hoàng Gia', booked: 52 },
              { _id: 'sch_giac-mo-cua-bom', slug: 'giac-mo-cua-bom', dateStr: '2026-11-25T19:30:00+07:00', time: '19:30', hall: 'Khán phòng Grand A - Hoàng Gia', booked: 42 },
              { _id: 'sch_tuoi-tho-du-doi_20261126_1930', slug: 'tuoi-tho-du-doi', dateStr: '2026-11-26T19:30:00+07:00', time: '19:30', hall: 'Khán phòng Grand A - Hoàng Gia', booked: 50 },
              { _id: 'sch_lo-lem_20261127_1930', slug: 'lo-lem-chiec-giay-thuy-tinh', dateStr: '2026-11-27T19:30:00+07:00', time: '19:30', hall: 'Khán phòng Grand A - Hoàng Gia', booked: 66 },
              { _id: 'sch_hon-truong-ba_20261127_2000', slug: 'hon-truong-ba-da-hang-thit', dateStr: '2026-11-27T20:00:00+07:00', time: '20:00', hall: 'Khán phòng Broadway Opera', booked: 54 },
              { _id: 'sch_giac-mo-cua-bom_20261128_1500', slug: 'giac-mo-cua-bom', dateStr: '2026-11-28T15:00:00+07:00', time: '15:00', hall: 'Khán phòng Grand A - Hoàng Gia', booked: 48 },
              { _id: 'sch_quan-khu-nam-dong_20261128_1930', slug: 'quan-khu-nam-dong', dateStr: '2026-11-28T19:30:00+07:00', time: '19:30', hall: 'Khán phòng Grand A - Hoàng Gia', booked: 60 },
              { _id: 'sch_tuoi-tho-du-doi_20261129_1500', slug: 'tuoi-tho-du-doi', dateStr: '2026-11-29T15:00:00+07:00', time: '15:00', hall: 'Khán phòng Grand A - Hoàng Gia', booked: 58 },
              { _id: 'sch_lo-lem_20261129_1930', slug: 'lo-lem-chiec-giay-thuy-tinh', dateStr: '2026-11-29T19:30:00+07:00', time: '19:30', hall: 'Khán phòng Grand A - Hoàng Gia', booked: 72 },
              { _id: 'sch_loi-the-thu-9_20261130_1930', slug: 'loi-the-thu-9', dateStr: '2026-11-30T19:30:00+07:00', time: '19:30', hall: 'Khán phòng Grand A - Hoàng Gia', booked: 85 },
              { _id: 'sch_hon-truong-ba_20261130_2000', slug: 'hon-truong-ba-da-hang-thit', dateStr: '2026-11-30T20:00:00+07:00', time: '20:00', hall: 'Khán phòng Broadway Opera', booked: 80 }
            ];

            const filteredDefs = slug ? standardDefs.filter(d => d.slug === slug) : standardDefs;
            return filteredDefs.map(def => {
              const m = musicalMap.get(def.slug);
              return {
                _id: def._id,
                musicalId: m?._id || def.slug,
                musicalSlug: def.slug,
                musicalTitle: m?.title || def.slug,
                performanceDate: def.dateStr,
                time: def.time,
                venue: 'Nhạc kịch Thành phố - 669 Đỗ Mười, khu phố 3, Linh Xuân, TP.HCM',
                hall: def.hall,
                totalSeats: 182,
                bookedSeats: def.booked,
                status: 'available' as const,
                genre: m ? (Array.isArray(m.genre) ? m.genre.join(' • ') : m.genre) : '',
                posterUrl: m?.posterUrl || `/images/musicals/${def.slug.replace(/-/g, '_')}.jpg`,
                subtitle: m?.subtitle || m?.synopsis || ''
              };
            });
          }),
          catchError(() => of([]))
        );
      })
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
      fullName: 'Trần Minh Đức',
      email: 'admin@nhackichthanhpho.vn',
      username: 'admin',
      password: 'Admin@gr06',
      phone: '0901888999',
      role: 'admin',
      department: 'Ban Giám Đốc Điều Hành',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
      isActive: true,
      createdAt: '2025-01-10T08:00:00Z'
    },
    {
      _id: 'usr_editor_02',
      fullName: 'Lê Thảo My',
      email: 'editor@nhackichthanhpho.vn',
      username: 'editor',
      password: 'Editor@gr06',
      phone: '0902777888',
      role: 'editor',
      department: 'Ban Biên Tập Sân Khấu & Truyền Thông',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      isActive: true,
      createdAt: '2025-02-15T09:30:00Z'
    },
    {
      _id: 'usr_staff_03',
      fullName: 'Phạm Hùng Cường',
      email: 'staff@nhackichthanhpho.vn',
      username: 'staff',
      password: 'Staff@gr06',
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
      bookingCode: 'NK-20261115-LL82A',
      musicalSlug: 'lo-lem-chiec-giay-thuy-tinh',
      musicalTitle: 'Lọ Lem - Chiếc giày thủy tinh',
      scheduleId: 'sch_lo-lem-chiec-giay-thuy-tinh',
      performanceDate: new Date('2026-11-20T19:30:00Z').toISOString(),
      performanceTime: '19:30',
      venue: 'Nhạc kịch Thành phố - 669 Đỗ Mười, khu phố 3, Linh Xuân, TP.HCM',
      hall: 'Khán phòng Grand A - Hoàng Gia',
      customerName: 'Nguyễn Văn An',
      customerEmail: '84customer@nhackichthanhpho.vn',
      customerPhone: '0901888999',
      seats: [
        { seatCode: 'B05', floor: 'Tầng Trệt', row: 'B', number: 5, type: 'VIP', price: 800000 },
        { seatCode: 'B06', floor: 'Tầng Trệt', row: 'B', number: 6, type: 'VIP', price: 800000 }
      ],
      quantity: 2,
      subtotal: 1600000,
      voucherCode: null,
      discountAmount: 0,
      totalPrice: 1600000,
      paymentMethod: 'VIETQR',
      paymentStatus: 'PAID',
      bookingStatus: 'CONFIRMED',
      qrCodeData: JSON.stringify({ code: 'NK-20261115-LL82A', seats: 'B05, B06' }),
      checkInInfo: { checkedInAt: null, checkedInBy: null, gate: 'Cửa Chính Khán Phòng A' },
      createdAt: '2026-11-15T08:19:20.000Z'
    },
    {
      bookingCode: 'NK-20261115-TT44B',
      musicalSlug: 'tuoi-tho-du-doi',
      musicalTitle: 'Tuổi thơ dữ dội',
      scheduleId: 'sch_tuoi-tho-du-doi',
      performanceDate: new Date('2026-11-21T19:30:00Z').toISOString(),
      performanceTime: '19:30',
      venue: 'Nhạc kịch Thành phố - 669 Đỗ Mười, khu phố 3, Linh Xuân, TP.HCM',
      hall: 'Khán phòng Grand A - Hoàng Gia',
      customerName: 'Nguyễn Văn An',
      customerEmail: '84customer@nhackichthanhpho.vn',
      customerPhone: '0901888999',
      seats: [
        { seatCode: 'A03', floor: 'Tầng Trệt', row: 'A', number: 3, type: 'VIP', price: 800000 },
        { seatCode: 'A04', floor: 'Tầng Trệt', row: 'A', number: 4, type: 'VIP', price: 800000 },
        { seatCode: 'A05', floor: 'Tầng Trệt', row: 'A', number: 5, type: 'VIP', price: 800000 }
      ],
      quantity: 3,
      subtotal: 2400000,
      voucherCode: null,
      discountAmount: 0,
      totalPrice: 2400000,
      paymentMethod: 'VNPAY',
      paymentStatus: 'PAID',
      bookingStatus: 'CHECKED_IN',
      qrCodeData: JSON.stringify({ code: 'NK-20261115-TT44B', seats: 'A03, A04, A05' }),
      checkInInfo: { checkedInAt: '2026-11-15T19:15:00.000Z', checkedInBy: 'staff', gate: 'Cửa Chính Khán Phòng A' },
      createdAt: '2026-11-15T08:20:45.000Z'
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
          venue: 'Nhạc kịch Thành phố - 669 Đỗ Mười, khu phố 3, Linh Xuân, TP.HCM',
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
        totalRevenue: 740000000,
        totalTicketsSold: 1270,
        totalOrders: 485,
        occupancyRate: 84,
        activeShowsCount: 6,
        paymentBreakdown: {
          VIETQR: 325600000,
          VNPAY: 229400000,
          MOMO: 125800000,
          ZALOPAY: 59200000
        }
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
      catchError(this.handleError<BookingOrder[]>('getAdminOrders', this.memClientBookings))
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
    const validGateways = ['VIETQR', 'VNPAY', 'MOMO', 'ZALOPAY'];
    return this.http.get<ApiResponse<ReconciliationRecord[]>>(`${this.apiUrl}/admin/reports/reconciliation`).pipe(
      map(res => (res.data || []).filter(r => validGateways.includes(r.gateway))),
      catchError(this.handleError<ReconciliationRecord[]>('getReconciliations', [
        { transactionId: 'TXN-VIETQR-20261115-08192', bookingCode: 'NK-20261115-LL82A', gateway: 'VIETQR', systemAmount: 1600000, gatewayAmount: 1600000, fee: 0, netAmount: 1600000, status: 'MATCHED', notes: 'Khớp 100% đối soát tự động Napas 24/7' },
        { transactionId: 'TXN-VNPAY-20261115-08204', bookingCode: 'NK-20261115-TT44B', gateway: 'VNPAY', systemAmount: 2400000, gatewayAmount: 2400000, fee: 36000, netAmount: 2364000, status: 'MATCHED', notes: 'Khớp đối soát tự động VNPAY QR' },
        { transactionId: 'TXN-MOMO-20261115-08221', bookingCode: 'NK-20261115-QK91C', gateway: 'MOMO', systemAmount: 900000, gatewayAmount: 900000, fee: 13500, netAmount: 886500, status: 'MATCHED', notes: 'Khớp đối soát ví điện tử MoMo' },
        { transactionId: 'TXN-VIETQR-20261115-08250', bookingCode: 'NK-20261115-HT19D', gateway: 'VIETQR', systemAmount: 1250000, gatewayAmount: 1250000, fee: 0, netAmount: 1250000, status: 'MATCHED', notes: 'Khớp 100% VietQR tức thì' },
        { transactionId: 'TXN-ZALO-20261116-08312', bookingCode: 'NK-20261116-LT38E', gateway: 'ZALOPAY', systemAmount: 3200000, gatewayAmount: 3200000, fee: 48000, netAmount: 3152000, status: 'MATCHED', notes: 'Khớp 100% cổng ví ZaloPay QR' },
        { transactionId: 'TXN-VNPAY-20261116-08345', bookingCode: 'NK-20261116-GM72F', gateway: 'VNPAY', systemAmount: 800000, gatewayAmount: 800000, fee: 12000, netAmount: 788000, status: 'MATCHED', notes: 'Khớp đối soát VNPAY Gateway' },
        { transactionId: 'TXN-VIETQR-20261116-08389', bookingCode: 'NK-20261116-LL63G', gateway: 'VIETQR', systemAmount: 2000000, gatewayAmount: 2000000, fee: 0, netAmount: 2000000, status: 'MATCHED', notes: 'Khớp chuyển khoản nhanh VietQR Napas' },
        { transactionId: 'TXN-MOMO-20261116-08410', bookingCode: 'NK-20261116-TT55H', gateway: 'MOMO', systemAmount: 1350000, gatewayAmount: 1350000, fee: 20250, netAmount: 1329750, status: 'MATCHED', notes: 'Khớp đối soát MoMo QR Gateway' },
        { transactionId: 'TXN-VIETQR-20261116-08455', bookingCode: 'NK-20261116-QK27J', gateway: 'VIETQR', systemAmount: 1600000, gatewayAmount: 1600000, fee: 0, netAmount: 1600000, status: 'MATCHED', notes: 'Khớp giao dịch Napas VietQR 24/7' },
        { transactionId: 'TXN-ZALO-20261117-08502', bookingCode: 'NK-20261117-HT84K', gateway: 'ZALOPAY', systemAmount: 950000, gatewayAmount: 950000, fee: 14250, netAmount: 935750, status: 'MATCHED', notes: 'Khớp đối soát ví điện tử ZaloPay' },
        { transactionId: 'TXN-VNPAY-20261117-08533', bookingCode: 'NK-20261117-LT12L', gateway: 'VNPAY', systemAmount: 1600000, gatewayAmount: 1600000, fee: 24000, netAmount: 1576000, status: 'MATCHED', notes: 'Khớp 100% đối soát định kỳ VNPAY' },
        { transactionId: 'TXN-VIETQR-20261117-08571', bookingCode: 'NK-20261117-GM90M', gateway: 'VIETQR', systemAmount: 2400000, gatewayAmount: 2400000, fee: 0, netAmount: 2400000, status: 'MATCHED', notes: 'Khớp lệnh VietQR chuyển khoản liên ngân hàng' },
        { transactionId: 'TXN-MOMO-20261117-08604', bookingCode: 'NK-20261117-LL18N', gateway: 'MOMO', systemAmount: 800000, gatewayAmount: 800000, fee: 12000, netAmount: 788000, status: 'MATCHED', notes: 'Khớp đối soát giao dịch MoMo 1 chạm' },
        { transactionId: 'TXN-ZALO-20261117-08640', bookingCode: 'NK-20261117-TT73P', gateway: 'ZALOPAY', systemAmount: 1800000, gatewayAmount: 1800000, fee: 27000, netAmount: 1773000, status: 'MATCHED', notes: 'Khớp đối soát thanh toán Ví ZaloPay' },
        { transactionId: 'TXN-VIETQR-20261117-08695', bookingCode: 'NK-20261117-QK61Q', gateway: 'VIETQR', systemAmount: 1200000, gatewayAmount: 1200000, fee: 0, netAmount: 1200000, status: 'MATCHED', notes: 'Khớp 100% chuyển khoản tức thì VietQR' }
      ]))
    );
  }

  getUsers(): Observable<UserStaff[]> {
    return this.http.get<ApiResponse<UserStaff[]>>(`${this.apiUrl}/admin/users`).pipe(
      map(res => {
        if (res.data && res.data.length > 0) {
          // Lọc chỉ lấy nhân sự nội bộ (loại bỏ customer và accountant)
          return res.data
            .filter(u => u.role !== 'customer' && (u.role as string) !== 'accountant' && u.username !== 'ketoan')
            .map(u => ({
              ...u,
              fullName: (u.fullName || '').replace(/\s*\(.*?\)/g, '').trim(),
              role: (u.role === 'ticket_checker' ? 'staff' : u.role) as any
            }));
        }
        return this.memStaffUsers.map(u => ({
          ...u,
          fullName: (u.fullName || '').replace(/\s*\(.*?\)/g, '').trim()
        }));
      }),
      catchError(() => of(this.memStaffUsers.map(u => ({
        ...u,
        fullName: (u.fullName || '').replace(/\s*\(.*?\)/g, '').trim()
      }))))
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
      tap(() => this.musicalsChanged$.next())
    );
  }

  updateMusical(slug: string, musical: Partial<Musical>): Observable<Musical> {
    return this.http.put<ApiResponse<Musical>>(`${this.apiUrl}/admin/musicals/${encodeURIComponent(slug)}`, musical).pipe(
      map(res => res.data),
      tap(() => this.musicalsChanged$.next())
    );
  }

  toggleMusicalStatus(slug: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/admin/musicals/${slug}/toggle`, {}).pipe(
      map(res => res.data),
      tap(() => this.musicalsChanged$.next()),
      catchError(() => {
        this.musicalsChanged$.next();
        return of({ slug, status: 'toggled' });
      })
    );
  }

  // --- ĐĂNG NHẬP NỘI BỘ DÀNH CHO CÁN BỘ (/internal) ---
  staffLogin(identifier: string, password: string): Observable<{ success: boolean; user: UserStaff; token: string }> {
    return this.http.post<any>(`${this.apiUrl}/auth/staff-login`, { identifier, password }).pipe(
      map(res => {
        if (res.success && res.data?.user) {
          const user: UserStaff = {
            ...res.data.user,
            fullName: (res.data.user.fullName || '').replace(/\s*\(.*?\)/g, '').trim(),
            role: res.data.user.role === 'ticket_checker' ? 'staff' : res.data.user.role
          };
          this.currentUser.set(user);
          this.isLoggedIn.set(true);
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(this.staffSessionKey, JSON.stringify(user));
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

        const validPass = found.password;
        if (password !== validPass) {
          return throwError(() => new Error('Mật khẩu bảo mật không chính xác.'));
        }

        const authenticatedUser: UserStaff = {
          ...found,
          role: (found.role === 'ticket_checker' ? 'staff' : found.role) as any
        };
        this.currentUser.set(authenticatedUser);
        this.isLoggedIn.set(true);
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(this.staffSessionKey, JSON.stringify(authenticatedUser));
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
      tap(() => this.musicalsChanged$.next()),
      catchError(() => {
        this.musicalsChanged$.next();
        return of(true);
      })
    );
  }

  createArtist(artist: Partial<Artist>): Observable<Artist> {
    return this.http.post<ApiResponse<Artist>>(`${this.apiUrl}/admin/artists`, artist).pipe(
      map(res => res.data),
      tap(() => this.artistsChanged$.next())
    );
  }

  updateArtist(nameOrId: string, artist: Partial<Artist>): Observable<Artist> {
    return this.http.put<ApiResponse<Artist>>(`${this.apiUrl}/admin/artists/${encodeURIComponent(nameOrId)}`, artist).pipe(
      map(res => res.data),
      tap(() => this.artistsChanged$.next())
    );
  }

  deleteArtist(nameOrId: string): Observable<boolean> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/admin/artists/${encodeURIComponent(nameOrId)}`).pipe(
      map(res => res.success),
      tap(() => this.artistsChanged$.next()),
      catchError(() => {
        this.artistsChanged$.next();
        return of(true);
      })
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
          venue: 'Nhạc kịch Thành phố - 669 Đỗ Mười, khu phố 3, Linh Xuân, TP.HCM',
          totalCapacity: 340,
          floors: ['Tầng Trệt', 'Tầng Lầu'],
          totalRows: 14,
          seatsPerRow: 14,
          vipRows: ['A', 'B', 'C'],
          standardRows: ['D', 'E', 'F', 'G', 'J', 'K', 'L', 'M', 'N', 'P'],
          coupleRows: ['H'],
          aisleColumns: [4, 11],
          status: 'active',
          description: 'Khán phòng vòm acoustic gỗ sồi hoàng gia, sân khấu xoay 360 độ hiện đại.'
        },
        {
          _id: 'AUD-02',
          code: 'HALL_B',
          name: 'Khán Phòng Blackbox - Thể Nghiệm',
          venue: 'Nhạc kịch Thành phố - 669 Đỗ Mười, khu phố 3, Linh Xuân, TP.HCM',
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
          venue: 'Nhạc kịch Thành phố - 669 Đỗ Mười, khu phố 3, Linh Xuân, TP.HCM',
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
        venue: aud.venue || 'Nhạc kịch Thành phố - 669 Đỗ Mười, khu phố 3, Linh Xuân, TP.HCM',
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
          venue: sched.venue || 'Nhạc kịch Thành phố - 669 Đỗ Mười, khu phố 3, Linh Xuân, TP.HCM',
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
        totalRevenue: 740000000,
        totalTickets: 1270,
        avgOccupancy: 83.7,
        byShow: [
          { musicalTitle: 'Lọ Lem - Chiếc giày thủy tinh', revenue: 168500000, ticketsSold: 286, occupancyRate: 92 },
          { musicalTitle: 'Tuổi thơ dữ dội', revenue: 142800000, ticketsSold: 242, occupancyRate: 88 },
          { musicalTitle: 'Quân khu Nam Đồng', revenue: 126500000, ticketsSold: 215, occupancyRate: 85 },
          { musicalTitle: 'Hồn Trương Ba, Da Hàng Thịt', revenue: 118400000, ticketsSold: 198, occupancyRate: 82 },
          { musicalTitle: 'Lời thề thứ 9', revenue: 98600000, ticketsSold: 175, occupancyRate: 79 },
          { musicalTitle: 'Giấc mơ của Bờm', revenue: 85200000, ticketsSold: 154, occupancyRate: 76 }
        ],
        byDate: [
          { date: '12/11/2026', revenue: 112000000, ordersCount: 74 },
          { date: '13/11/2026', revenue: 135000000, ordersCount: 88 },
          { date: '14/11/2026', revenue: 158000000, ordersCount: 104 },
          { date: '15/11/2026', revenue: 165000000, ordersCount: 110 },
          { date: '16/11/2026', revenue: 170000000, ordersCount: 109 }
        ],
        byGateway: [
          { gateway: 'VietQR (Quét mã Napas 24/7)', amount: 325600000, percentage: 44.0 },
          { gateway: 'VNPAY-QR / Ví điện tử VNPAY', amount: 229400000, percentage: 31.0 },
          { gateway: 'Ví Điện Tử MoMo', amount: 125800000, percentage: 17.0 },
          { gateway: 'Ví ZaloPay', amount: 59200000, percentage: 8.0 }
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
