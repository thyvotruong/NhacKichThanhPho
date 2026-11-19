/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/admin/admin.component.ts
 * Chức năng: Cổng Quản Trị Hệ Thống (Admin Portal) Toàn Diện:
 * 1. Dashboard Tổng Quan (/admin/dashboard)
 * 2. Quản Lý Vở Kịch (/admin/musicals)
 * 3. Quản Lý Nghệ Sĩ (/admin/artists)
 * 4. Quản Lý Khán Phòng & Sơ Đồ Ghế (/admin/auditoriums)
 * 5. Quản Lý Lịch Diễn & Giá Vé (/admin/schedules)
 * 6. Khóa Ghế Nội Bộ (/admin/seat-locking)
 * 7. Quản Lý Đơn Hàng (/admin/orders)
 * 8. Quản Lý Mã Giảm Giá Voucher (/admin/discounts)
 * 9. Báo Cáo & Thống Kê Doanh Thu (/admin/reports)
 * 10. Quản Lý Tài Khoản Nhân Sự RBAC (/admin/accounts)
 * ============================================================
 */

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MusicalService } from '../../services/musical.service';
import { StaffHeaderComponent } from '../staff-header/staff-header.component';
import { SeatMapComponent } from '../seat-map/seat-map.component';
import {
  DashboardStats,
  Musical,
  Artist,
  Auditorium,
  Schedule,
  Seat,
  BookingOrder,
  Voucher,
  RevenueReport,
  ReconciliationRecord,
  UserStaff,
  AuditLogEntry
} from '../../models/musical.model';

export type AdminTab =
  | 'dashboard'
  | 'musicals'
  | 'artists'
  | 'auditoriums'
  | 'schedules'
  | 'seat-locking'
  | 'orders'
  | 'discounts'
  | 'reports'
  | 'accounts'
  | 'subscribers'
  | 'audit-logs';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DecimalPipe, DatePipe, StaffHeaderComponent, SeatMapComponent],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  private readonly musicalService = inject(MusicalService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // Người dùng & phân quyền RBAC
  currentUser = this.musicalService.currentUser;

  // Active Tab
  activeTab = signal<AdminTab>('dashboard');

  // Thông báo hành động chung
  toastMessage = signal<{ type: 'success' | 'danger' | 'info'; text: string } | null>(null);

  // --- 1. DASHBOARD ---
  stats = signal<DashboardStats | null>(null);
  isLoadingStats = signal<boolean>(true);
  revenueTrendPeriod = signal<'week' | 'month'>('week');
  revenueChartInstance: any = null;
  paymentChartInstance: any = null;

  topPerformingMusicals = computed(() => {
    const fromStats = this.stats()?.topMusicals;
    if (fromStats && fromStats.length > 0) {
      return fromStats.slice(0, 4);
    }

    const reportList = this.revenueReport()?.byShow || [];
    const allMusicals = this.musicals();

    if (reportList.length > 0) {
      return reportList.slice(0, 4).map(item => {
        const found = allMusicals.find(m =>
          m.title && item.musicalTitle && (
            m.title.toLowerCase().includes(item.musicalTitle.toLowerCase()) ||
            item.musicalTitle.toLowerCase().includes(m.title.toLowerCase())
          )
        );
        return {
          title: item.musicalTitle,
          genre: Array.isArray(found?.genre) ? found.genre.join(', ') : (found?.genre || 'Broadway'),
          revenue: item.revenue,
          ticketsSold: item.ticketsSold,
          occupancyRate: item.occupancyRate,
          posterUrl: found?.posterUrl || 'images/musicals/lo-lem.jpg',
          status: found?.status || 'now_showing'
        };
      });
    }

    if (allMusicals.length > 0) {
      return allMusicals.slice(0, 4).map((m, idx) => ({
        title: m.title,
        genre: Array.isArray(m.genre) ? m.genre.join(', ') : (m.genre || 'Broadway'),
        revenue: [168500000, 142800000, 126500000, 118400000][idx] || 95000000,
        ticketsSold: [286, 242, 215, 198][idx] || 170,
        occupancyRate: [94, 89, 86, 83][idx] || 80,
        posterUrl: m.posterUrl || 'images/musicals/lo-lem.jpg',
        status: m.status || 'now_showing'
      }));
    }

    return [
      {
        title: 'Lọ Lem - Chiếc Giày Thủy Tinh',
        genre: 'Broadway, Cổ tích',
        revenue: 168500000,
        ticketsSold: 286,
        occupancyRate: 94,
        posterUrl: 'images/musicals/lo-lem.jpg',
        status: 'now_showing'
      },
      {
        title: 'Hồn Trương Ba, Da Hàng Thịt',
        genre: 'Kịch dân gian, Broadway',
        revenue: 142800000,
        ticketsSold: 242,
        occupancyRate: 89,
        posterUrl: 'images/musicals/hon-truong-ba.jpg',
        status: 'now_showing'
      },
      {
        title: 'Tuổi Thơ Dữ Dội',
        genre: 'Lịch sử, Sử thi',
        revenue: 126500000,
        ticketsSold: 215,
        occupancyRate: 86,
        posterUrl: 'images/musicals/tuoi-tho-du-doi.jpg',
        status: 'now_showing'
      },
      {
        title: 'Giấc Mơ Của Bờm',
        genre: 'Hài hước, Gia đình',
        revenue: 118400000,
        ticketsSold: 198,
        occupancyRate: 83,
        posterUrl: 'images/musicals/giac-mo-bom.jpg',
        status: 'now_showing'
      }
    ];
  });

  recentSubscribers = computed(() => {
    const subs = this.subscribers();
    if (subs.length > 0) {
      return subs.slice(0, 4);
    }
    return [
      {
        _id: 'sub-1',
        email: 'leminh.broadway@gmail.com',
        source: 'coming_soon_musical',
        musicalTitle: 'Lọ Lem - Chiếc Giày Thủy Tinh',
        createdAt: new Date().toISOString()
      },
      {
        _id: 'sub-2',
        email: 'hoangyen.theatre@yahoo.com',
        source: 'homepage_vip',
        musicalTitle: '',
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
      },
      {
        _id: 'sub-3',
        email: 'phuongthao.art@gmail.com',
        source: 'coming_soon_musical',
        musicalTitle: 'Hồn Trương Ba, Da Hàng Thịt',
        createdAt: new Date(Date.now() - 3600000 * 7).toISOString()
      },
      {
        _id: 'sub-4',
        email: 'tranduc.vip@gmail.com',
        source: 'homepage_vip',
        musicalTitle: '',
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
      }
    ] as any[];
  });

  // --- 2. VỞ KỊCH (MUSICALS) ---
  musicals = signal<Musical[]>([]);
  musicalSearch = signal<string>('');
  musicalGenreFilter = signal<string>('ALL');
  selectedMusical = signal<Musical | null>(null);
  showMusicalModal = signal<boolean>(false);
  isEditingMusical = signal<boolean>(false);
  musicalForm!: FormGroup;

  // --- 3. NGHỆ SĨ (ARTISTS) ---
  artists = signal<Artist[]>([]);
  artistSearch = signal<string>('');
  selectedArtist = signal<Artist | null>(null);
  showArtistModal = signal<boolean>(false);
  isEditingArtist = signal<boolean>(false);
  artistForm!: FormGroup;

  // --- 4. KHÁN PHÒNG & SƠ ĐỒ GHẾ (AUDITORIUMS) ---
  auditoriums = signal<Auditorium[]>([]);
  selectedAuditorium = signal<Auditorium | null>(null);
  showAuditoriumModal = signal<boolean>(false);
  isEditingAuditorium = signal<boolean>(false);
  auditoriumForm!: FormGroup;

  // --- 5. LỊCH DIỄN & GIÁ VÉ (SCHEDULES) ---
  schedules = signal<Schedule[]>([]);
  scheduleSearch = signal<string>('');
  scheduleMusicalFilter = signal<string>('ALL');
  selectedSchedule = signal<Schedule | null>(null);
  showScheduleModal = signal<boolean>(false);
  isEditingSchedule = signal<boolean>(false);
  scheduleForm!: FormGroup;

  // --- 6. KHÓA GHẾ NỘI BỘ (SEAT-LOCKING) ---
  lockDateFilter = signal<string>('');
  lockTimeFilter = signal<string>('');
  selectedScheduleIdForLock = signal<string>('');
  lockableSchedules = computed(() => this.schedules().filter(schedule => schedule.status !== 'cancelled'));
  lockScheduleDates = computed(() =>
    [...new Set(this.lockableSchedules().map(schedule => this.getLockDateKey(schedule)).filter(Boolean))].sort()
  );
  lockScheduleTimes = computed(() => {
    const date = this.lockDateFilter();
    if (!date) return [];

    return [...new Set(
      this.lockableSchedules()
        .filter(schedule => this.getLockDateKey(schedule) === date)
        .map(schedule => schedule.time)
    )].sort();
  });
  lockScheduleOptions = computed(() => {
    const date = this.lockDateFilter();
    const time = this.lockTimeFilter();
    if (!date || !time) return [];

    return this.lockableSchedules().filter(schedule =>
      this.getLockDateKey(schedule) === date &&
      schedule.time === time
    );
  });
  currentScheduleForLock = signal<Schedule | null>(null);
  selectedSeatsForLock = signal<string[]>([]);
  lockReason = signal<string>('Báo chí / Truyền thông');
  customLockReason = signal<string>('');
  isLoadingSeatMap = signal<boolean>(false);
  isLockingSeats = signal<boolean>(false);
  seatActionMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- 7. ĐƠN HÀNG (ORDERS) ---
  orders = signal<BookingOrder[]>([]);
  orderSearchKeyword = signal<string>('');
  orderStatusFilter = signal<string>('ALL');
  isLoadingOrders = signal<boolean>(false);
  selectedOrder = signal<BookingOrder | null>(null);
  showOrderDetailModal = signal<boolean>(false);

  // --- 8. MÃ GIẢM GIÁ (DISCOUNTS) ---
  vouchers = signal<Voucher[]>([]);
  showVoucherModal = signal<boolean>(false);
  isEditingVoucher = signal<boolean>(false);
  voucherForm!: FormGroup;

  // --- 9. BÁO CÁO & THỐNG KÊ (REPORTS) ---
  revenueReport = signal<RevenueReport | null>(null);
  reconciliations = signal<ReconciliationRecord[]>([]);
  filteredReconciliations = computed(() => {
    const valid = ['VIETQR', 'VNPAY', 'MOMO', 'ZALOPAY'];
    return this.reconciliations().filter(r => valid.includes(r.gateway));
  });
  reportPeriod = signal<'week' | 'month' | 'quarter' | 'year'>('month');
  showExportSuccess = signal<boolean>(false);

  // --- 10. TÀI KHOẢN NHÂN SỰ RBAC (ACCOUNTS) ---
  staffUsers = signal<UserStaff[]>([]);
  showStaffModal = signal<boolean>(false);
  isEditingStaff = signal<boolean>(false);
  staffForm!: FormGroup;

  // --- 11. DS ĐĂNG KÝ NHẬN TIN / KHÁCH HÀNG TIỀM NĂNG (SUBSCRIBERS) ---
  subscribers = signal<any[]>([]);
  isLoadingSubscribers = signal<boolean>(false);
  subscriberSearch = signal<string>('');
  subscriberSourceFilter = signal<string>('all');
  subscriberMusicalFilter = signal<string>('all');

  availableSubscribedMusicals = computed(() => {
    const set = new Set<string>();
    this.subscribers().forEach(s => {
      if (s.musicalTitle && typeof s.musicalTitle === 'string' && s.musicalTitle.trim()) {
        set.add(s.musicalTitle.trim());
      }
    });
    this.musicals().forEach(m => {
      if (m.title && m.status === 'coming_soon') {
        set.add(m.title.trim());
      }
    });
    return Array.from(set).sort();
  });

  filteredSubscribers = computed(() => {
    const list = this.subscribers();
    const query = this.subscriberSearch().trim().toLowerCase();
    const srcFilter = this.subscriberSourceFilter();
    const musicalFilter = this.subscriberMusicalFilter();

    return list.filter(item => {
      // 1. Lọc theo nguồn đăng ký
      if (srcFilter === 'homepage' && !item.source?.includes('homepage')) return false;
      if (srcFilter === 'coming_soon' && !item.source?.includes('coming_soon')) return false;

      // 2. Lọc theo tên vở kịch quan tâm
      if (musicalFilter !== 'all') {
        if (musicalFilter === 'none') {
          if (item.musicalTitle && item.musicalTitle.trim() !== '') return false;
        } else {
          if ((item.musicalTitle || '').trim().toLowerCase() !== musicalFilter.trim().toLowerCase()) {
            return false;
          }
        }
      }

      // 3. Tìm kiếm từ khóa tự do
      if (!query) return true;
      const matchEmail = (item.email || '').toLowerCase().includes(query);
      const matchSource = (item.source || '').toLowerCase().includes(query);
      const matchTitle = (item.musicalTitle || '').toLowerCase().includes(query);
      return matchEmail || matchSource || matchTitle;
    });
  });

  // --- 11. NHẬT KÝ HOẠT ĐỘNG HỆ THỐNG (SYSTEM AUDIT LOG) ---
  auditLogs = signal<AuditLogEntry[]>([]);
  isAuditLogEnabled = signal<boolean>(true);
  isLoadingAuditLogs = signal<boolean>(false);
  isTogglingAuditLog = signal<boolean>(false);
  auditSearch = signal<string>('');
  auditCategoryFilter = signal<string>('ALL');
  auditStatusFilter = signal<string>('ALL');

  filteredAuditLogs = computed(() => {
    const list = this.auditLogs();
    const query = this.auditSearch().trim().toLowerCase();
    const category = this.auditCategoryFilter();
    const status = this.auditStatusFilter();

    return list.filter(item => {
      // 1. Lọc theo Phân hệ
      if (category !== 'ALL' && item.category !== category) {
        return false;
      }

      // 2. Lọc theo Trạng thái
      if (status !== 'ALL' && item.status !== status) {
        return false;
      }

      // 3. Tìm kiếm từ khóa tự do
      if (!query) return true;
      const descMatch = (item.description || '').toLowerCase().includes(query);
      const actionMatch = (item.action || '').toLowerCase().includes(query);
      const usernameMatch = (item.performer?.username || '').toLowerCase().includes(query);
      const fullNameMatch = (item.performer?.fullName || '').toLowerCase().includes(query);
      const ipMatch = (item.ipAddress || '').toLowerCase().includes(query);

      return descMatch || actionMatch || usernameMatch || fullNameMatch || ipMatch;
    });
  });

  ngOnInit(): void {
    this.initForms();
    this.loadAllInitialData();

    // Nếu người dùng có vai trò Editor thì mặc định vào tab musicals
    if (this.currentUser()?.role === 'editor') {
      this.activeTab.set('musicals');
    }

    // Đồng bộ Tab theo Route Param /admin/:tab
    this.route.paramMap.subscribe(params => {
      const tabParam = params.get('tab');
      if (tabParam) {
        const aliasMap: Record<string, AdminTab> = {
          dashboard: 'dashboard',
          musicals: 'musicals',
          artists: 'artists',
          auditoriums: 'auditoriums',
          schedules: 'schedules',
          'seat-locking': 'seat-locking',
          'seat-lock': 'seat-locking',
          orders: 'orders',
          discounts: 'discounts',
          vouchers: 'discounts',
          reports: 'reports',
          reconciliation: 'reports',
          accounts: 'accounts',
          staff: 'accounts',
          subscribers: 'subscribers',
          leads: 'subscribers',
          'customer-leads': 'subscribers',
          'audit-logs': 'audit-logs',
          audit: 'audit-logs',
          logs: 'audit-logs'
        };
        if (aliasMap[tabParam]) {
          let target = aliasMap[tabParam];
          if (this.currentUser()?.role === 'editor' && target !== 'musicals' && target !== 'artists') {
            target = 'musicals';
          }
          this.setTab(target, false);
        }
      }
    });

    if (this.activeTab() === 'dashboard') {
      setTimeout(() => this.renderDashboardCharts(), 400);
    }
  }

  // Khởi tạo các Reactive Forms
  private initForms(): void {
    this.musicalForm = this.fb.group({
      title: ['', Validators.required],
      slug: ['', Validators.required],
      subtitle: [''],
      genre: ['Broadway', Validators.required],
      posterUrl: ['', Validators.required],
      bannerUrl: [''],
      trailerUrl: [''],
      duration: [120, [Validators.required, Validators.min(1)]],
      ageLimit: ['13+'],
      director: ['', Validators.required],
      cast: [''],
      synopsis: ['', Validators.required],
      vipPrice: [800000, Validators.required],
      stdPrice: [450000, Validators.required],
      couplePrice: [1200000, Validators.required],
      featured: [false],
      status: ['now_showing', Validators.required]
    });

    this.artistForm = this.fb.group({
      name: ['', Validators.required],
      role: ['', Validators.required],
      avatar: ['', Validators.required],
      bio: ['', Validators.required],
      featuredMusicals: [''],
      status: ['active']
    });

    this.auditoriumForm = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      venue: ['Nhạc kịch Thành phố - 669 Đỗ Mười, khu phố 3, Linh Xuân, TP.HCM', Validators.required],
      totalCapacity: [340, [Validators.required, Validators.min(1)]],
      floors: ['Tầng Trệt, Tầng Lầu'],
      totalRows: [14, [Validators.required, Validators.min(1)]],
      seatsPerRow: [14, [Validators.required, Validators.min(1)]],
      vipRows: ['A, B, C'],
      standardRows: ['D, E, F, G, H, J'],
      coupleRows: ['K, L'],
      aisleColumns: ['4, 11'],
      status: ['active'],
      description: ['']
    });

    this.scheduleForm = this.fb.group({
      musicalSlug: ['', Validators.required],
      performanceDate: ['', Validators.required],
      time: ['19:30', Validators.required],
      hall: ['Khán Phòng Grand A - Hoàng Gia', Validators.required],
      venue: ['Nhạc kịch Thành phố - 669 Đỗ Mười, khu phố 3, Linh Xuân, TP.HCM'],
      totalSeats: [340],
      vipPrice: [800000],
      stdPrice: [450000],
      couplePrice: [1200000]
    });

    this.voucherForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      discountType: ['PERCENT', Validators.required],
      discountValue: [15, [Validators.required, Validators.min(1)]],
      minOrderValue: [500000, [Validators.required, Validators.min(0)]],
      maxDiscountAmount: [200000],
      usageLimit: [100, [Validators.required, Validators.min(1)]],
      validUntil: ['', Validators.required],
      isActive: [true]
    });

    this.staffForm = this.fb.group({
      fullName: ['', Validators.required],
      username: ['', Validators.required],
      password: ['123456', [Validators.required, Validators.minLength(6)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      role: ['staff', Validators.required],
      department: ['Tổ Trực Soát Vé Cửa Rạp'],
      avatar: [''],
      isActive: [true]
    });
  }

  // Tải dữ liệu toàn hệ thống
  loadAllInitialData(): void {
    if (this.currentUser()?.role === 'editor') {
      this.loadMusicals();
      this.loadArtists();
      return;
    }
    this.loadDashboardStats();
    this.loadMusicals();
    this.loadArtists();
    this.loadAuditoriums();
    this.loadSchedules();
    this.loadOrders();
    this.loadVouchers();
    this.loadReports();
    this.loadStaffUsers();
    this.loadSubscribers();
    if (this.currentUser()?.role === 'admin') {
      this.loadAuditLogs();
    }
  }

  setTab(tab: AdminTab, updateUrl = true): void {
    if (this.currentUser()?.role === 'editor' && tab !== 'musicals' && tab !== 'artists') {
      this.showToast('Tài khoản Biên tập viên chỉ có quyền quản lý Vở kịch và Nghệ sĩ.', 'info');
      tab = 'musicals';
    }
    if (tab === 'audit-logs' && this.currentUser()?.role !== 'admin') {
      this.showToast('Chỉ Quản trị viên tối cao (Admin) mới có quyền truy cập Nhật ký hoạt động hệ thống!', 'danger');
      tab = 'musicals';
    }
    this.activeTab.set(tab);
    if (updateUrl) {
      this.router.navigate(['/admin', tab]);
    }

    // Refresh theo tab khi người dùng click
    if (tab === 'dashboard') {
      this.loadDashboardStats();
      setTimeout(() => this.renderDashboardCharts(), 200);
    }
    if (tab === 'musicals') this.loadMusicals();
    if (tab === 'artists') this.loadArtists();
    if (tab === 'auditoriums') this.loadAuditoriums();
    if (tab === 'schedules') this.loadSchedules();
    if (tab === 'seat-locking') this.loadSchedules();
    if (tab === 'orders') this.loadOrders();
    if (tab === 'discounts') this.loadVouchers();
    if (tab === 'reports') this.loadReports();
    if (tab === 'accounts') this.loadStaffUsers();
    if (tab === 'subscribers') this.loadSubscribers();
    if (tab === 'audit-logs') this.loadAuditLogs();
  }

  showToast(text: string, type: 'success' | 'danger' | 'info' = 'success'): void {
    this.toastMessage.set({ text, type });
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }

  cleanStaffName(name: string): string {
    return (name || '').replace(/\s*\(.*?\)/g, '').trim();
  }

  switchRole(role: 'admin' | 'editor' | 'ticket_checker' | 'staff' | 'customer'): void {
    this.musicalService.setRole(role as any);
    this.showToast(`Đã chuyển đổi sang vai trò: ${role.toUpperCase()}`, 'info');
  }

  // --- 1. DASHBOARD ---
  loadDashboardStats(): void {
    this.isLoadingStats.set(true);
    this.musicalService.getAdminDashboard().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoadingStats.set(false);
        setTimeout(() => this.renderDashboardCharts(), 100);
      },
      error: () => this.isLoadingStats.set(false)
    });
    this.musicalService.getRevenueReport().subscribe({
      next: (data) => this.revenueReport.set(data)
    });
  }

  setRevenueTrendPeriod(period: 'week' | 'month'): void {
    this.revenueTrendPeriod.set(period);
    setTimeout(() => this.renderRevenueTrendChart(), 50);
  }

  renderDashboardCharts(): void {
    if (this.activeTab() !== 'dashboard') return;
    this.renderRevenueTrendChart();
    this.renderPaymentDonutChart();
  }

  renderRevenueTrendChart(): void {
    const canvas = document.getElementById('revenueTrendChart') as HTMLCanvasElement | null;
    if (!canvas) return;

    const chartLib = (window as any).Chart;
    if (!chartLib) return;

    if (this.revenueChartInstance) {
      try { this.revenueChartInstance.destroy(); } catch {}
      this.revenueChartInstance = null;
    }

    const isWeek = this.revenueTrendPeriod() === 'week';
    const trendStats = this.stats()?.revenueTrend;
    const labels = isWeek
      ? (trendStats?.week?.labels || ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'])
      : (trendStats?.month?.labels || ['Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11']);

    const data = isWeek
      ? (trendStats?.week?.data || [112, 135, 158, 165, 170, 185, 192])
      : (trendStats?.month?.data || [520, 580, 640, 690, 715, 740]);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
    gradient.addColorStop(0.65, 'rgba(190, 18, 60, 0.15)');
    gradient.addColorStop(1, 'rgba(7, 10, 18, 0.0)');

    try {
      this.revenueChartInstance = new chartLib(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Doanh thu (Triệu VNĐ)',
              data,
              fill: true,
              backgroundColor: gradient,
              borderColor: '#F59E0B',
              borderWidth: 2.5,
              tension: 0.38,
              pointBackgroundColor: '#FDE68A',
              pointBorderColor: '#B45309',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 7,
              pointHoverBackgroundColor: '#FFFFFF',
              pointHoverBorderColor: '#F59E0B'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(7, 10, 18, 0.95)',
              titleColor: '#FDE68A',
              bodyColor: '#FFFFFF',
              borderColor: 'rgba(245, 158, 11, 0.4)',
              borderWidth: 1,
              padding: 10,
              displayColors: false,
              callbacks: {
                label: (context: any) => ` Doanh thu: ${context.parsed.y} Triệu VNĐ (${(context.parsed.y * 1000000).toLocaleString('vi-VN')} ₫)`
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#94A3B8', font: { family: 'Montserrat', size: 11, weight: '600' } }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: {
                color: '#94A3B8',
                font: { family: 'Montserrat', size: 11 },
                callback: (value: any) => `${value} tr`
              }
            }
          }
        }
      });
    } catch (e) {
      console.warn('Chart.js revenue chart error:', e);
    }
  }

  renderPaymentDonutChart(): void {
    const canvas = document.getElementById('paymentDonutChart') as HTMLCanvasElement | null;
    if (!canvas) return;

    const chartLib = (window as any).Chart;
    if (!chartLib) return;

    if (this.paymentChartInstance) {
      try { this.paymentChartInstance.destroy(); } catch {}
      this.paymentChartInstance = null;
    }

    try {
      const pb = this.stats()?.paymentBreakdown;
      const vq = pb?.VIETQR || 325600000;
      const vn = pb?.VNPAY || 229400000;
      const mm = pb?.MOMO || 125800000;
      const zl = pb?.ZALOPAY || 59200000;
      const total = vq + vn + mm + zl;

      const pVq = total > 0 ? Math.round((vq / total) * 1000) / 10 : 44.0;
      const pVn = total > 0 ? Math.round((vn / total) * 1000) / 10 : 31.0;
      const pMm = total > 0 ? Math.round((mm / total) * 1000) / 10 : 17.0;
      const pZl = total > 0 ? Math.round((zl / total) * 1000) / 10 : 8.0;

      this.paymentChartInstance = new chartLib(canvas, {
        type: 'doughnut',
        data: {
          labels: [
            `VietQR (${pVq}%)`,
            `VNPAY (${pVn}%)`,
            `MoMo (${pMm}%)`,
            `ZaloPay (${pZl}%)`
          ],
          datasets: [
            {
              data: [pVq, pVn, pMm, pZl],
              backgroundColor: ['#059669', '#2563EB', '#BE123C', '#D97706'],
              borderColor: ['#064E3B', '#1E3A8A', '#881337', '#78350F'],
              borderWidth: 2,
              hoverOffset: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(7, 10, 18, 0.95)',
              titleColor: '#FDE68A',
              bodyColor: '#FFFFFF',
              borderColor: 'rgba(245, 158, 11, 0.4)',
              borderWidth: 1,
              callbacks: {
                label: (context: any) => ` ${context.label}: ${context.parsed}%`
              }
            }
          }
        }
      });
    } catch (e) {
      console.warn('Chart.js payment donut error:', e);
    }
  }

  // --- 2. MUSICALS ---
  loadMusicals(): void {
    this.musicalService.getMusicals().subscribe({
      next: (data) => this.musicals.set(data)
    });
  }

  filteredMusicals(): Musical[] {
    let list = this.musicals();
    const q = this.musicalSearch().toLowerCase().trim();
    if (q) {
      list = list.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.director.toLowerCase().includes(q) ||
        this.formatCast(m.cast).toLowerCase().includes(q)
      );
    }
    const g = this.musicalGenreFilter();
    if (g && g !== 'ALL') {
      const gLower = g.toLowerCase();
      list = list.filter(m => {
        if (Array.isArray(m.genre)) {
          return m.genre.some(item => item.toLowerCase().includes(gLower));
        }
        return String(m.genre || '').toLowerCase().includes(gLower);
      });
    }
    return list;
  }

  formatGenre(genre: string | string[]): string {
    if (Array.isArray(genre)) return genre.join(' • ');
    return genre || 'Kịch nghệ';
  }

  formatCast(cast: string | string[]): string {
    if (Array.isArray(cast)) return cast.join(', ');
    return cast || '';
  }

  getMinPrice(m: Musical): number {
    if (!m.ticketPrices || m.ticketPrices.length === 0) return 300000;
    const prices = m.ticketPrices.map(p => p.price).filter(p => typeof p === 'number' && p > 0);
    return prices.length > 0 ? Math.min(...prices) : 300000;
  }

  openCreateMusicalModal(): void {
    this.isEditingMusical.set(false);
    this.selectedMusical.set(null);
    this.musicalForm.reset({
      title: '',
      slug: '',
      subtitle: '',
      genre: 'Broadway',
      posterUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1600&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=AXCTMGYUg9A',
      duration: 120,
      ageLimit: '13+',
      director: 'NSƯT Trần Minh Đức',
      cast: 'NSƯT Kim Tử Long, Nghệ sĩ Thanh Ngân, Ca sĩ Tùng Dương',
      synopsis: 'Tác phẩm nhạc kịch công phu tái hiện không gian tráng lệ lay động cảm xúc.',
      vipPrice: 800000,
      stdPrice: 450000,
      couplePrice: 1200000,
      featured: true,
      status: 'now_showing'
    });
    this.showMusicalModal.set(true);
  }

  openEditMusicalModal(musical: Musical): void {
    this.isEditingMusical.set(true);
    this.selectedMusical.set(musical);
    this.musicalForm.patchValue({
      title: musical.title,
      slug: musical.slug,
      subtitle: musical.subtitle || '',
      genre: musical.genre,
      posterUrl: musical.posterUrl,
      bannerUrl: musical.bannerUrl,
      trailerUrl: musical.trailerUrl || '',
      duration: musical.duration,
      ageLimit: musical.ageLimit || '13+',
      director: musical.director,
      cast: Array.isArray(musical.cast) ? musical.cast.join(', ') : musical.cast,
      synopsis: musical.synopsis,
      vipPrice: musical.ticketPrices?.find(t => t.tier === 'VIP')?.price || 800000,
      stdPrice: musical.ticketPrices?.find(t => t.tier === 'Standard')?.price || 450000,
      couplePrice: musical.ticketPrices?.find(t => t.tier === 'Couple')?.price || 1200000,
      featured: !!musical.featured,
      status: musical.status
    });
    this.showMusicalModal.set(true);
  }

  saveMusical(): void {
    if (this.musicalForm.invalid) {
      this.showToast('Vui lòng điền đầy đủ các thông tin bắt buộc của vở diễn', 'danger');
      return;
    }

    const val = this.musicalForm.value;
    const castArray = typeof val.cast === 'string' ? val.cast.split(',').map((c: string) => c.trim()).filter(Boolean) : val.cast;
    const payload: Partial<Musical> = {
      title: val.title,
      slug: val.slug,
      subtitle: val.subtitle,
      genre: val.genre,
      posterUrl: val.posterUrl,
      bannerUrl: val.bannerUrl,
      trailerUrl: val.trailerUrl,
      duration: Number(val.duration),
      ageLimit: val.ageLimit,
      director: val.director,
      cast: castArray,
      synopsis: val.synopsis,
      ticketPrices: [
        { tier: 'VIP', name: 'Ghế VIP Hoàng Gia', price: Number(val.vipPrice) },
        { tier: 'Standard', name: 'Ghế Standard Tiêu Chuẩn', price: Number(val.stdPrice) },
        { tier: 'Couple', name: 'Ghế Đôi Uyên Ương', price: Number(val.couplePrice) }
      ],
      featured: !!val.featured,
      status: val.status
    };

    if (this.isEditingMusical() && this.selectedMusical()) {
      const oldSlug = this.selectedMusical()!.slug;
      const oldId = this.selectedMusical()!._id;
      this.musicalService.updateMusical(oldSlug, payload).subscribe({
        next: (updated) => {
          this.musicals.update(list => list.map(m => (m.slug === oldSlug || (oldId && m._id === oldId) || m.slug === updated.slug) ? { ...m, ...updated } : m));
          this.showMusicalModal.set(false);
          this.showToast(`Đã cập nhật thành công vở kịch "${val.title}"!`);
          this.loadMusicals();
        },
        error: (err) => {
          this.showToast('Lỗi khi cập nhật vở kịch: ' + (err?.error?.message || err?.message || 'Vui lòng thử lại'), 'danger');
        }
      });
    } else {
      this.musicalService.createMusical(payload).subscribe({
        next: (created) => {
          this.musicals.update(list => [created, ...list]);
          this.showMusicalModal.set(false);
          this.showToast(`Đã thêm thành công vở kịch mới: "${created.title}"!`);
          this.loadMusicals();
        },
        error: (err) => {
          this.showToast('Lỗi khi thêm vở kịch mới: ' + (err?.error?.message || err?.message || 'Vui lòng thử lại'), 'danger');
        }
      });
    }
  }

  toggleMusicalStatus(musical: Musical): void {
    let nextStatus: 'now_showing' | 'coming_soon' | 'archived';
    let label = '';
    if (musical.status === 'now_showing') {
      nextStatus = 'coming_soon';
      label = 'Sắp Chiếu';
    } else if (musical.status === 'coming_soon') {
      nextStatus = 'archived';
      label = 'Lưu Trữ';
    } else {
      nextStatus = 'now_showing';
      label = 'Đang Chiếu';
    }
    this.musicalService.updateMusical(musical.slug, { status: nextStatus }).subscribe({
      next: () => {
        musical.status = nextStatus;
        this.showToast(`Đã đổi trạng thái vở kịch "${musical.title}" sang: ${label}`);
        this.loadMusicals();
      },
      error: (err) => {
        this.showToast('Lỗi khi đổi trạng thái: ' + (err?.error?.message || err?.message || 'Vui lòng thử lại'), 'danger');
      }
    });
  }

  deleteMusical(musical: Musical): void {
    if (confirm(`Bạn có chắc chắn muốn xóa vở kịch "${musical.title}"?`)) {
      this.musicalService.deleteMusical(musical.slug).subscribe({
        next: () => {
          this.musicals.update(list => list.filter(m => m.slug !== musical.slug));
          this.showToast(`Đã xóa vở kịch "${musical.title}"`);
          this.loadMusicals();
        },
        error: (err) => {
          this.showToast('Lỗi khi xóa vở kịch: ' + (err?.error?.message || err?.message || 'Vui lòng thử lại'), 'danger');
        }
      });
    }
  }

  // --- TIỆN ÍCH QUẢN LÝ ẢNH & CLIPBOARD (2 TRONG 1: DÁN URL HOẶC UPLOAD TỪ THIẾT BỊ) ---
  onFileUpload(event: Event, formType: 'musical' | 'artist' | 'staff', fieldName: string): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.showToast('Vui lòng chọn định dạng file hình ảnh (JPG, PNG, WEBP, v.v.)', 'danger');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showToast('Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhẹ hơn để tối ưu tốc độ.', 'danger');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      if (formType === 'musical') {
        this.musicalForm.patchValue({ [fieldName]: base64Url });
        this.musicalForm.get(fieldName)?.markAsDirty();
      } else if (formType === 'artist') {
        this.artistForm.patchValue({ [fieldName]: base64Url });
        this.artistForm.get(fieldName)?.markAsDirty();
      } else if (formType === 'staff') {
        this.staffForm.patchValue({ [fieldName]: base64Url });
        this.staffForm.get(fieldName)?.markAsDirty();
      }
      this.showToast(`Đã tải lên ảnh "${file.name}" thành công!`);
      input.value = '';
    };
    reader.onerror = () => {
      this.showToast('Đã xảy ra lỗi khi đọc file hình ảnh từ thiết bị', 'danger');
    };
    reader.readAsDataURL(file);
  }

  async pasteClipboardToField(formType: 'musical' | 'artist' | 'staff', fieldName: string): Promise<void> {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          const cleanText = text.trim();
          if (formType === 'musical') {
            this.musicalForm.patchValue({ [fieldName]: cleanText });
            this.musicalForm.get(fieldName)?.markAsDirty();
          } else if (formType === 'artist') {
            this.artistForm.patchValue({ [fieldName]: cleanText });
            this.artistForm.get(fieldName)?.markAsDirty();
          } else if (formType === 'staff') {
            this.staffForm.patchValue({ [fieldName]: cleanText });
            this.staffForm.get(fieldName)?.markAsDirty();
          }
          this.showToast('Đã dán liên kết từ bộ nhớ tạm (Clipboard)!');
          return;
        }
      }
      this.showToast('Bộ nhớ tạm đang trống hoặc chưa cấp quyền. Vui lòng nhấn Ctrl+V hoặc nhấp chuột phải chọn "Dán".', 'info');
    } catch {
      this.showToast('Vui lòng nhấn phím Ctrl+V hoặc nhấp chuột phải chọn "Dán" vào ô nhập.', 'info');
    }
  }

  clearImageField(formType: 'musical' | 'artist' | 'staff', fieldName: string): void {
    if (formType === 'musical') {
      this.musicalForm.patchValue({ [fieldName]: '' });
      this.musicalForm.get(fieldName)?.markAsDirty();
    } else if (formType === 'artist') {
      this.artistForm.patchValue({ [fieldName]: '' });
      this.artistForm.get(fieldName)?.markAsDirty();
    } else if (formType === 'staff') {
      this.staffForm.patchValue({ [fieldName]: '' });
      this.staffForm.get(fieldName)?.markAsDirty();
    }
  }

  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=400&q=80';
    }
  }

  // --- 3. ARTISTS ---
  loadArtists(): void {
    this.musicalService.getArtists().subscribe({
      next: (data) => this.artists.set(data)
    });
  }

  filteredArtists(): Artist[] {
    let list = this.artists();
    const q = this.artistSearch().toLowerCase().trim();
    if (q) {
      list = list.filter(a => a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q));
    }
    return list;
  }

  openCreateArtistModal(): void {
    this.isEditingArtist.set(false);
    this.selectedArtist.set(null);
    this.artistForm.reset({
      name: '',
      role: 'Diễn Viên Chính',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      bio: 'Nhiều năm cống hiến cho sân khấu kịch hàn lâm và đoạt nhiều huy chương vàng sân khấu toàn quốc.',
      featuredMusicals: 'Bông Bóng Bay - Giấc Mơ Tuổi Thơ',
      status: 'active'
    });
    this.showArtistModal.set(true);
  }

  openEditArtistModal(artist: Artist): void {
    this.isEditingArtist.set(true);
    this.selectedArtist.set(artist);
    this.artistForm.patchValue({
      name: artist.name,
      role: artist.role,
      avatar: artist.avatar,
      bio: artist.bio,
      featuredMusicals: Array.isArray(artist.featuredMusicals) ? artist.featuredMusicals.join(', ') : '',
      status: artist.status || 'active'
    });
    this.showArtistModal.set(true);
  }

  saveArtist(): void {
    if (this.artistForm.invalid) {
      this.showToast('Vui lòng điền đầy đủ thông tin nghệ sĩ', 'danger');
      return;
    }
    const val = this.artistForm.value;
    const feats = typeof val.featuredMusicals === 'string' ? val.featuredMusicals.split(',').map((f: string) => f.trim()).filter(Boolean) : [];
    const payload: Partial<Artist> = {
      name: val.name,
      role: val.role,
      avatar: val.avatar,
      bio: val.bio,
      featuredMusicals: feats,
      status: val.status
    };

    const targetArtist = this.selectedArtist();
    if (this.isEditingArtist() && targetArtist) {
      const oldName = targetArtist.name;
      const oldId = targetArtist._id;
      const identifier = oldId || oldName;
      this.musicalService.updateArtist(identifier, payload).subscribe({
        next: (updated) => {
          this.artists.update(list => list.map(a => ((oldId && a._id === oldId) || a.name === oldName || a.name === updated.name) ? { ...a, ...updated } : a));
          this.showArtistModal.set(false);
          this.showToast(`Đã cập nhật hồ sơ nghệ sĩ: ${val.name}`);
          this.loadArtists();
        },
        error: (err) => {
          this.showToast('Lỗi khi cập nhật nghệ sĩ: ' + (err?.error?.message || err?.message || 'Vui lòng thử lại'), 'danger');
        }
      });
    } else {
      this.musicalService.createArtist(payload).subscribe({
        next: (created) => {
          this.artists.update(list => [created, ...list]);
          this.showArtistModal.set(false);
          this.showToast(`Đã thêm nghệ sĩ mới: ${created.name}`);
          this.loadArtists();
        },
        error: (err) => {
          this.showToast('Lỗi khi thêm nghệ sĩ: ' + (err?.error?.message || err?.message || 'Vui lòng thử lại'), 'danger');
        }
      });
    }
  }

  deleteArtist(artist: Artist): void {
    if (confirm(`Bạn có chắc muốn xóa nghệ sĩ "${artist.name}"?`)) {
      const identifier = artist._id || artist.name;
      this.musicalService.deleteArtist(identifier).subscribe({
        next: () => {
          this.artists.update(list => list.filter(a => a.name !== artist.name && (!artist._id || a._id !== artist._id)));
          this.showToast(`Đã xóa nghệ sĩ ${artist.name}`);
          this.loadArtists();
        },
        error: (err) => {
          this.showToast('Lỗi khi xóa nghệ sĩ: ' + (err?.error?.message || err?.message || 'Vui lòng thử lại'), 'danger');
        }
      });
    }
  }

  // --- 4. AUDITORIUMS ---
  loadAuditoriums(): void {
    this.musicalService.getAuditoriums().subscribe({
      next: (data) => {
        this.auditoriums.set(data);
        if (!this.selectedAuditorium() && data.length > 0) {
          this.selectedAuditorium.set(data[0]);
        }
      }
    });
  }

  openCreateAuditoriumModal(): void {
    this.isEditingAuditorium.set(false);
    this.auditoriumForm.reset({
      code: 'HALL_' + Math.floor(100 + Math.random() * 900),
      name: '',
      venue: 'Nhạc kịch Thành phố - 669 Đỗ Mười, khu phố 3, Linh Xuân, TP.HCM',
      totalCapacity: 320,
      floors: 'Tầng Trệt, Tầng Lầu',
      totalRows: 14,
      seatsPerRow: 14,
      vipRows: 'A, B, C',
      standardRows: 'D, E, F, G, J, K, L, M, N, P',
      coupleRows: 'H',
      aisleColumns: '4, 11',
      status: 'active',
      description: 'Khán phòng thiết kế âm học vòm hiện đại tiêu chuẩn châu Âu.'
    });
    this.showAuditoriumModal.set(true);
  }

  openEditAuditoriumModal(aud: Auditorium): void {
    this.isEditingAuditorium.set(true);
    this.auditoriumForm.patchValue({
      code: aud.code,
      name: aud.name,
      venue: aud.venue,
      totalCapacity: aud.totalCapacity,
      floors: aud.floors.join(', '),
      totalRows: aud.totalRows,
      seatsPerRow: aud.seatsPerRow,
      vipRows: aud.vipRows.join(', '),
      standardRows: aud.standardRows.join(', '),
      coupleRows: aud.coupleRows.join(', '),
      aisleColumns: aud.aisleColumns.join(', '),
      status: aud.status,
      description: aud.description || ''
    });
    this.showAuditoriumModal.set(true);
  }

  saveAuditorium(): void {
    if (this.auditoriumForm.invalid) {
      this.showToast('Vui lòng điền đúng và đủ thông tin cấu hình khán phòng', 'danger');
      return;
    }
    const val = this.auditoriumForm.value;
    const splitArr = (str: string) => typeof str === 'string' ? str.split(',').map(s => s.trim()).filter(Boolean) : [];
    const splitNums = (str: string) => typeof str === 'string' ? str.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n)) : [];

    const payload: Partial<Auditorium> = {
      code: val.code,
      name: val.name,
      venue: val.venue,
      totalCapacity: Number(val.totalCapacity),
      floors: splitArr(val.floors),
      totalRows: Number(val.totalRows),
      seatsPerRow: Number(val.seatsPerRow),
      vipRows: splitArr(val.vipRows),
      standardRows: splitArr(val.standardRows),
      coupleRows: splitArr(val.coupleRows),
      aisleColumns: splitNums(val.aisleColumns),
      status: val.status,
      description: val.description
    };

    if (this.isEditingAuditorium()) {
      this.musicalService.updateAuditorium(val.code, payload).subscribe({
        next: (updated) => {
          this.auditoriums.update(list => list.map(a => a.code === updated.code ? { ...a, ...updated } : a));
          this.selectedAuditorium.set(updated);
          this.showAuditoriumModal.set(false);
          this.showToast(`Đã cập nhật khán phòng: ${updated.name}`);
        }
      });
    } else {
      this.musicalService.createAuditorium(payload).subscribe({
        next: (created) => {
          this.auditoriums.update(list => [...list, created]);
          this.selectedAuditorium.set(created);
          this.showAuditoriumModal.set(false);
          this.showToast(`Đã thêm khán phòng mới: ${created.name}`);
        }
      });
    }
  }

  toggleAuditoriumStatus(aud: Auditorium): void {
    const nextStatus = aud.status === 'active' ? 'maintenance' : 'active';
    this.musicalService.updateAuditorium(aud.code, { status: nextStatus }).subscribe({
      next: () => {
        aud.status = nextStatus;
        this.showToast(`Đã đổi trạng thái "${aud.name}" sang: ${nextStatus === 'active' ? 'Sẵn sàng biểu diễn' : 'Đang bảo dưỡng'}`);
      }
    });
  }

  // Helper sinh preview các hàng ghế mô phỏng cho sơ đồ khán phòng chuẩn hóa
  getAuditoriumPreviewRows(): { row: string; type: string; floor: string; isCouple: boolean }[] {
    const aud = this.selectedAuditorium();
    if (!aud) return [];
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P'].slice(0, aud.totalRows);
    return rows.map(r => {
      let type = 'Standard';
      if (aud.vipRows.includes(r)) type = 'VIP';
      else if (aud.coupleRows.includes(r)) type = 'Couple';
      const floor = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].includes(r) ? 'Tầng Trệt' : 'Tầng Lầu';
      return { row: r, type, floor, isCouple: type === 'Couple' };
    });
  }

  getRowColList(row: string): number[] {
    if (['A', 'B', 'C'].includes(row)) {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    }
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  }

  // --- 5. SCHEDULES ---
  loadSchedules(): void {
    this.musicalService.getSchedules().subscribe({
      next: (data) => {
        this.schedules.set(data);
        const selectedSchedule = this.syncLockFiltersWithSchedules();
        if (selectedSchedule) {
          this.selectedSeatsForLock.set([]);
          this.loadSeatMapForLock(selectedSchedule._id);
        }
      }
    });
  }

  filteredSchedules(): Schedule[] {
    let list = this.schedules();
    const q = this.scheduleSearch().toLowerCase().trim();
    if (q) {
      list = list.filter(s => s.musicalTitle.toLowerCase().includes(q) || s.hall.toLowerCase().includes(q));
    }
    const m = this.scheduleMusicalFilter();
    if (m && m !== 'ALL') {
      list = list.filter(s => s.musicalSlug === m);
    }
    return list;
  }

  openCreateScheduleModal(): void {
    this.isEditingSchedule.set(false);
    this.selectedSchedule.set(null);
    const firstMusical = this.musicals()[0];
    this.scheduleForm.reset({
      musicalSlug: firstMusical ? firstMusical.slug : 'bong-bong-bay',
      performanceDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      time: '19:30',
      hall: 'Khán Phòng Grand A - Hoàng Gia',
      venue: 'Nhạc kịch Thành phố - 669 Đỗ Mười, khu phố 3, Linh Xuân, TP.HCM',
      totalSeats: 340,
      vipPrice: 800000,
      stdPrice: 450000,
      couplePrice: 1200000
    });
    this.showScheduleModal.set(true);
  }

  saveSchedule(): void {
    if (this.scheduleForm.invalid) {
      this.showToast('Vui lòng chọn vở diễn và nhập đầy đủ ngày giờ biểu diễn', 'danger');
      return;
    }
    const val = this.scheduleForm.value;
    const musical = this.musicals().find(m => m.slug === val.musicalSlug);
    const payload: Partial<Schedule> = {
      musicalSlug: val.musicalSlug,
      musicalTitle: musical ? musical.title : 'Vở Nhạc Kịch',
      performanceDate: val.performanceDate,
      time: val.time,
      hall: val.hall,
      venue: val.venue,
      totalSeats: Number(val.totalSeats)
    };

    this.musicalService.createSchedule(payload).subscribe({
      next: (created) => {
        this.schedules.update(list => [created, ...list]);
        this.showScheduleModal.set(false);
        this.showToast(`Đã tạo thành công suất diễn mới vào ngày ${new Date(created.performanceDate).toLocaleDateString('vi-VN')} lúc ${created.time}!`);
      }
    });
  }

  cancelSchedule(sched: Schedule): void {
    if (confirm(`Bạn có chắc chắn muốn hủy suất diễn "${sched.musicalTitle}" ngày ${new Date(sched.performanceDate).toLocaleDateString('vi-VN')}? Hệ thống sẽ ghi nhận trạng thái và thông báo khách hàng.`)) {
      this.musicalService.cancelSchedule(sched._id, 'Lý do kỹ thuật sân khấu').subscribe({
        next: () => {
          this.schedules.update(list => list.map(schedule =>
            schedule._id === sched._id ? { ...schedule, status: 'cancelled' } : schedule
          ));
          const selectedSchedule = this.syncLockFiltersWithSchedules();
          if (selectedSchedule) this.loadSeatMapForLock(selectedSchedule._id);
          this.showToast(`Đã hủy suất chiếu ${sched._id}`, 'info');
        }
      });
    }
  }

  // --- 6. SEAT-LOCKING ---
  getLockDateKey(schedule: Schedule): string {
    const date = new Date(schedule.performanceDate);
    if (Number.isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatLockDate(dateKey: string): string {
    const [year, month, day] = dateKey.split('-');
    return `${day}/${month}/${year}`;
  }

  getLockScheduleLabel(schedule: Schedule): string {
    const sameShowOptions = this.lockScheduleOptions().filter(
      option => option.musicalSlug === schedule.musicalSlug
    );
    if (sameShowOptions.length === 1) return schedule.musicalTitle;

    const sameHallOptions = sameShowOptions.filter(option => option.hall === schedule.hall);
    const hallLabel = `${schedule.musicalTitle} - ${schedule.hall}`;
    return sameHallOptions.length === 1 ? hallLabel : `${hallLabel} (${schedule._id})`;
  }

  onLockDateChange(dateKey: string): void {
    this.lockDateFilter.set(dateKey);
    this.lockTimeFilter.set('');
    this.resetLockScheduleSelection();
  }

  onLockTimeChange(time: string): void {
    this.lockTimeFilter.set(time);
    this.resetLockScheduleSelection();
  }

  private resetLockScheduleSelection(): void {
    this.selectedScheduleIdForLock.set('');
    this.selectedSeatsForLock.set([]);
    this.currentScheduleForLock.set(null);
    this.isLoadingSeatMap.set(false);
    this.seatActionMessage.set(null);
  }

  private syncLockFiltersWithSchedules(): Schedule | null {
    const selectedId = this.selectedScheduleIdForLock();
    const selectedSchedule = this.lockableSchedules().find(schedule => schedule._id === selectedId);

    if (selectedId && !selectedSchedule) this.resetLockScheduleSelection();

    if (selectedSchedule) {
      this.lockDateFilter.set(this.getLockDateKey(selectedSchedule));
      this.lockTimeFilter.set(selectedSchedule.time);
      return selectedSchedule;
    }

    if (this.lockDateFilter() && !this.lockScheduleDates().includes(this.lockDateFilter())) {
      this.lockDateFilter.set('');
      this.lockTimeFilter.set('');
      return null;
    }

    if (this.lockTimeFilter() && !this.lockScheduleTimes().includes(this.lockTimeFilter())) {
      this.lockTimeFilter.set('');
    }

    return null;
  }

  onSelectScheduleForLock(scheduleId: string): void {
    if (!scheduleId) {
      this.resetLockScheduleSelection();
      return;
    }

    const schedule = this.lockableSchedules().find(item => item._id === scheduleId);
    if (!schedule) return;

    this.lockDateFilter.set(this.getLockDateKey(schedule));
    this.lockTimeFilter.set(schedule.time);
    this.selectedScheduleIdForLock.set(scheduleId);
    this.selectedSeatsForLock.set([]);
    this.seatActionMessage.set(null);
    this.loadSeatMapForLock(scheduleId);
  }

  loadSeatMapForLock(scheduleId: string): void {
    if (!scheduleId) return;

    this.currentScheduleForLock.set(null);
    this.isLoadingSeatMap.set(true);
    this.musicalService.getScheduleSeats(scheduleId).subscribe({
      next: (data) => {
        if (this.selectedScheduleIdForLock() !== scheduleId) return;

        this.currentScheduleForLock.set({
          _id: data.scheduleId,
          musicalTitle: data.musicalTitle,
          musicalSlug: '',
          performanceDate: data.performanceDate,
          time: data.time,
          venue: 'Nhạc kịch Thành phố - 669 Đỗ Mười, khu phố 3, Linh Xuân, TP.HCM',
          hall: data.hall,
          totalSeats: data.seats.length,
          bookedSeats: data.seats.filter(s => s.status === 'booked').length,
          lockedSeatsCount: data.seats.filter(s => s.status === 'locked').length,
          status: 'available',
          seats: data.seats
        });
        this.isLoadingSeatMap.set(false);
      },
      error: (err) => {
        if (this.selectedScheduleIdForLock() !== scheduleId) return;

        this.isLoadingSeatMap.set(false);
        this.seatActionMessage.set({
          type: 'error',
          text: err.message || 'Không thể tải sơ đồ ghế cho suất diễn đã chọn.'
        });
      }
    });
  }

  toggleSeatSelectionForLock(seat: Seat): void {
    if (seat.status === 'booked') return;
    const list = [...this.selectedSeatsForLock()];
    const idx = list.indexOf(seat.seatCode);
    if (idx > -1) {
      list.splice(idx, 1);
    } else {
      list.push(seat.seatCode);
    }
    this.selectedSeatsForLock.set(list);
  }

  executeLockSeats(): void {
    const codes = this.selectedSeatsForLock();
    if (codes.length === 0) {
      this.seatActionMessage.set({ type: 'error', text: 'Vui lòng click chọn ít nhất 1 ghế trên sơ đồ' });
      return;
    }

    const reason = this.lockReason() === 'Khác' ? this.customLockReason() : this.lockReason();
    this.isLockingSeats.set(true);

    this.musicalService.lockSeats(this.selectedScheduleIdForLock(), codes, reason, this.currentUser().fullName).subscribe({
      next: (res) => {
        this.isLockingSeats.set(false);
        this.seatActionMessage.set({ type: 'success', text: `Khóa thành công ${codes.length} ghế nội bộ!` });
        this.selectedSeatsForLock.set([]);
        this.loadSeatMapForLock(this.selectedScheduleIdForLock());
        this.showToast(`Đã khóa thành công ${codes.length} ghế cho mục đích: ${reason}`);
      },
      error: (err) => {
        this.isLockingSeats.set(false);
        this.seatActionMessage.set({ type: 'error', text: err.message || 'Lỗi khi khóa ghế' });
      }
    });
  }

  executeUnlockSeats(): void {
    const codes = this.selectedSeatsForLock();
    if (codes.length === 0) {
      this.seatActionMessage.set({ type: 'error', text: 'Vui lòng click chọn ghế muốn mở khóa' });
      return;
    }

    this.isLockingSeats.set(true);
    this.musicalService.unlockSeats(this.selectedScheduleIdForLock(), codes).subscribe({
      next: () => {
        this.isLockingSeats.set(false);
        this.seatActionMessage.set({ type: 'success', text: `Đã mở khóa ${codes.length} ghế thành công!` });
        this.selectedSeatsForLock.set([]);
        this.loadSeatMapForLock(this.selectedScheduleIdForLock());
        this.showToast(`Đã mở khóa ${codes.length} ghế trở lại trạng thái sẵn sàng bán!`);
      },
      error: (err) => {
        this.isLockingSeats.set(false);
        this.seatActionMessage.set({ type: 'error', text: err.message || 'Lỗi khi mở khóa ghế' });
      }
    });
  }

  // --- 7. ORDERS ---
  loadOrders(): void {
    this.isLoadingOrders.set(true);
    this.musicalService.getAdminOrders().subscribe({
      next: (data) => {
        this.orders.set(data);
        this.isLoadingOrders.set(false);
      },
      error: () => this.isLoadingOrders.set(false)
    });
  }

  filteredOrders(): BookingOrder[] {
    let list = this.orders();
    const q = this.orderSearchKeyword().toLowerCase().trim();
    if (q) {
      list = list.filter(o =>
        o.bookingCode.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.customerEmail.toLowerCase().includes(q)
      );
    }
    const s = this.orderStatusFilter();
    if (s && s !== 'ALL') {
      if (s === 'CANCELLED') {
        list = list.filter(o => o.bookingStatus === 'CANCELLED');
      } else {
        list = list.filter(o => o.bookingStatus === s);
      }
    }
    return list;
  }

  viewOrderDetail(order: BookingOrder): void {
    this.selectedOrder.set(order);
    this.showOrderDetailModal.set(true);
  }

  // --- 8. VOUCHERS ---
  loadVouchers(): void {
    this.musicalService.getAdminVouchers().subscribe({
      next: (data) => this.vouchers.set(data)
    });
  }

  openCreateVoucherModal(): void {
    this.isEditingVoucher.set(false);
    this.voucherForm.reset({
      code: 'PROMO' + Math.floor(10 + Math.random() * 90),
      description: 'Giảm giá ưu đãi sự kiện biểu diễn đặc biệt',
      discountType: 'PERCENT',
      discountValue: 15,
      minOrderValue: 600000,
      maxDiscountAmount: 200000,
      usageLimit: 100,
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      isActive: true
    });
    this.showVoucherModal.set(true);
  }

  saveVoucher(): void {
    if (this.voucherForm.invalid) {
      this.showToast('Vui lòng nhập đầy đủ thông tin mã giảm giá', 'danger');
      return;
    }
    const val = this.voucherForm.value;
    const payload: Partial<Voucher> = {
      code: val.code.toUpperCase().trim(),
      description: val.description,
      discountType: val.discountType,
      discountValue: Number(val.discountValue),
      minOrderValue: Number(val.minOrderValue),
      maxDiscountAmount: Number(val.maxDiscountAmount || 0),
      usageLimit: Number(val.usageLimit),
      validUntil: val.validUntil,
      isActive: !!val.isActive
    };

    this.musicalService.createVoucher(payload).subscribe({
      next: (created) => {
        this.vouchers.update(list => [created.data || payload as Voucher, ...list]);
        this.showVoucherModal.set(false);
        this.showToast(`Đã tạo thành công voucher: ${payload.code}!`);
      },
      error: (err) => {
        this.showToast(err.message || 'Lỗi khi tạo voucher', 'danger');
      }
    });
  }

  toggleVoucherStatus(v: Voucher): void {
    this.musicalService.toggleVoucher(v._id || v.code).subscribe({
      next: () => {
        v.isActive = !v.isActive;
        this.showToast(`Đã ${v.isActive ? 'kích hoạt' : 'tạm dừng'} mã voucher: ${v.code}`);
      }
    });
  }

  deleteVoucher(v: Voucher): void {
    if (confirm(`Bạn có chắc muốn xóa mã voucher ${v.code}?`)) {
      this.musicalService.deleteVoucher(v._id || v.code).subscribe({
        next: () => {
          this.vouchers.update(list => list.filter(item => item.code !== v.code));
          this.showToast(`Đã xóa voucher ${v.code}`);
        }
      });
    }
  }

  // --- 9. REPORTS ---
  loadReports(): void {
    this.musicalService.getRevenueReport().subscribe({
      next: (data) => this.revenueReport.set(data)
    });
    this.musicalService.getReconciliations().subscribe({
      next: (data) => {
        const valid = ['VIETQR', 'VNPAY', 'MOMO', 'ZALOPAY'];
        this.reconciliations.set((data || []).filter(r => valid.includes(r.gateway)));
      }
    });
  }

  exportReport(): void {
    const list = this.filteredReconciliations();
    const filename = `Bao_Cao_Doi_Soat_Tai_Chinh_${new Date().toISOString().slice(0, 10)}.xlsx`;

    const exportRows = list.map((rec, index) => ({
      'STT': index + 1,
      'Mã Giao Dịch': rec.transactionId,
      'Mã Đơn Vé': rec.bookingCode,
      'Cổng Thanh Toán': rec.gateway === 'VIETQR' ? 'VietQR' : (rec.gateway === 'VNPAY' ? 'VNPAY' : (rec.gateway === 'MOMO' ? 'MoMo' : 'ZaloPay')),
      'Tiền Hệ Thống (VNĐ)': rec.systemAmount,
      'Cổng Báo Nhận (VNĐ)': rec.gatewayAmount,
      'Trạng Thái Đối Soát': rec.status === 'MATCHED' ? 'Khớp 100%' : 'Sai lệch'
    }));

    const xlsxLib = (window as any).XLSX;
    if (xlsxLib && xlsxLib.utils) {
      const worksheet = xlsxLib.utils.json_to_sheet(exportRows);
      worksheet['!cols'] = [
        { wch: 6 },
        { wch: 28 },
        { wch: 20 },
        { wch: 18 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 }
      ];
      const workbook = xlsxLib.utils.book_new();
      xlsxLib.utils.book_append_sheet(workbook, worksheet, 'Doi_Soat_Giao_Dich');
      xlsxLib.writeFile(workbook, filename);
      this.showToast(`Đã xuất báo cáo đối soát tài chính "${filename}" thành công!`, 'success');
    } else {
      const headers = ['STT', 'Mã Giao Dịch', 'Mã Đơn Vé', 'Cổng Thanh Toán', 'Tiền Hệ Thống (VNĐ)', 'Cổng Báo Nhận (VNĐ)', 'Trạng Thái Đối Soát'];
      const lines = [headers.join(',')];
      exportRows.forEach(r => {
        lines.push([
          r['STT'],
          `"${r['Mã Giao Dịch']}"`,
          `"${r['Mã Đơn Vé']}"`,
          `"${r['Cổng Thanh Toán']}"`,
          r['Tiền Hệ Thống (VNĐ)'],
          r['Cổng Báo Nhận (VNĐ)'],
          `"${r['Trạng Thái Đối Soát']}"`
        ].join(','));
      });
      const csvBlob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const csvUrl = URL.createObjectURL(csvBlob);
      const link = document.createElement('a');
      link.href = csvUrl;
      link.download = filename.replace('.xlsx', '.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(csvUrl);
      this.showToast('Đã tải xuống báo cáo đối soát giao dịch thành công!', 'success');
    }
  }

  // --- 10. ACCOUNTS RBAC ---
  loadStaffUsers(): void {
    this.musicalService.getUsers().subscribe({
      next: (data) => this.staffUsers.set(data)
    });
  }

  openCreateStaffModal(): void {
    this.isEditingStaff.set(false);
    this.staffForm.reset({
      fullName: '',
      username: '',
      password: '123456',
      email: '',
      phone: '',
      role: 'staff',
      department: 'Tổ Trực Soát Vé Cửa Rạp',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
      isActive: true
    });
    this.showStaffModal.set(true);
  }

  saveStaffUser(): void {
    if (this.staffForm.invalid) {
      this.showToast('Vui lòng điền đúng và đủ thông tin nhân sự (bao gồm username và mật khẩu >= 6 ký tự)', 'danger');
      return;
    }
    const val = this.staffForm.value;
    const payload: Partial<UserStaff> = {
      fullName: val.fullName,
      username: val.username,
      password: val.password,
      email: val.email,
      phone: val.phone,
      role: val.role,
      department: val.department,
      avatar: val.avatar,
      isActive: !!val.isActive
    };

    this.musicalService.createUserStaff(payload).subscribe({
      next: (created) => {
        this.staffUsers.update(list => [created, ...list]);
        this.showStaffModal.set(false);
        this.showToast(`Đã thêm tài khoản nhân sự: ${created.fullName} (${(created.role || '').toUpperCase()})`);
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Lỗi khi tạo tài khoản nhân sự', 'danger');
      }
    });
  }

  toggleStaffStatus(u: UserStaff): void {
    this.musicalService.toggleUserStaff(u._id || u.email).subscribe({
      next: () => {
        u.isActive = !u.isActive;
        this.showToast(`Đã ${u.isActive ? 'mở khóa' : 'khóa'} tài khoản của ${u.fullName}`);
      }
    });
  }

  deleteStaffUser(u: UserStaff): void {
    if (u.role === 'admin' && (u.email === 'admin@nhackichthanhpho.vn' || u.username === 'admin')) {
      this.showToast('Không thể xóa tài khoản Quản trị viên tối cao (Root Admin)', 'danger');
      return;
    }
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản nhân sự "${u.fullName}" (${u.username || u.email})?`)) {
      return;
    }
    const id = u._id || u.email;
    this.musicalService.deleteUserStaff(id).subscribe({
      next: () => {
        this.staffUsers.update(list => list.filter(item => (item._id || item.email) !== id));
        this.showToast(`Đã xóa tài khoản nhân sự: ${u.fullName}`);
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Lỗi khi xóa tài khoản', 'danger');
      }
    });
  }

  // ============================================================
  // 11. DS ĐĂNG KÝ NHẬN TIN & KHÁCH HÀNG TIỀM NĂNG (SUBSCRIBERS)
  // ============================================================
  loadSubscribers(): void {
    this.isLoadingSubscribers.set(true);
    this.musicalService.getSubscribers().subscribe({
      next: (res) => {
        this.subscribers.set(res.data || []);
        this.isLoadingSubscribers.set(false);
      },
      error: () => {
        this.isLoadingSubscribers.set(false);
      }
    });
  }

  deleteSubscriber(item: any): void {
    if (!confirm(`Bạn có chắc chắn muốn xóa email đăng ký "${item.email}" không?`)) {
      return;
    }
    const id = item._id;
    this.musicalService.deleteSubscriber(id).subscribe({
      next: () => {
        this.subscribers.update(list => list.filter(s => s._id !== id));
        this.showToast(`Đã xóa thành công đăng ký: ${item.email}`);
      },
      error: () => {
        this.showToast('Lỗi khi xóa đăng ký nhận tin.', 'danger');
      }
    });
  }

  formatSourceInfo(source: string, musicalTitle?: string): { badgeClass: string; label: string; icon: string } {
    if (!source) {
      return { badgeClass: 'badge-secondary', label: 'Chưa xác định', icon: 'bi-envelope' };
    }
    if (source === 'homepage_vip' || source.includes('homepage')) {
      return {
        badgeClass: 'badge-showman-gold',
        label: 'Trang chủ (Ưu đãi VIP)',
        icon: 'bi-gem'
      };
    }
    if (source.includes('coming_soon')) {
      return {
        badgeClass: 'badge-showman-ruby',
        label: 'Vở kịch sắp chiếu',
        icon: 'bi-bell-fill'
      };
    }
    return {
      badgeClass: 'badge-secondary',
      label: source,
      icon: 'bi-envelope-check'
    };
  }

  exportSubscribersToExcel(): void {
    const list = this.filteredSubscribers();
    if (!list || list.length === 0) {
      this.showToast('Không có dữ liệu đăng ký để xuất file Excel.', 'info');
      return;
    }

    const exportRows = list.map((item, index) => {
      const srcInfo = this.formatSourceInfo(item.source, item.musicalTitle);
      return {
        'STT': index + 1,
        'Địa chỉ Email': item.email,
        'Nguồn Đăng Ký': srcInfo.label,
        'Vở Kịch Quan Tâm': item.musicalTitle && item.musicalTitle.trim() ? item.musicalTitle : '-',
        'Thời Gian Đăng Ký': new Date(item.createdAt).toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      };
    });

    const filename = `DS_Dang_Ky_Nhan_Tin_${new Date().toISOString().slice(0, 10)}.xlsx`;

    const xlsxLib = (window as any).XLSX;
    if (xlsxLib && xlsxLib.utils) {
      const worksheet = xlsxLib.utils.json_to_sheet(exportRows);
      worksheet['!cols'] = [
        { wch: 6 },
        { wch: 32 },
        { wch: 35 },
        { wch: 35 },
        { wch: 22 }
      ];
      const workbook = xlsxLib.utils.book_new();
      xlsxLib.utils.book_append_sheet(workbook, worksheet, 'DS_Dang_Ky');
      xlsxLib.writeFile(workbook, filename);
      this.showToast(`Đã xuất file Excel "${filename}" thành công!`, 'success');
    } else {
      // Fallback CSV với UTF-8 BOM để Excel hiển thị tiếng Việt hoàn hảo
      const headers = ['STT', 'Địa chỉ Email', 'Nguồn Đăng Ký', 'Vở Kịch Quan Tâm', 'Thời Gian Đăng Ký'];
      const lines = [headers.join(',')];
      exportRows.forEach(r => {
        lines.push([
          r['STT'],
          `"${r['Địa chỉ Email']}"`,
          `"${r['Nguồn Đăng Ký']}"`,
          `"${r['Vở Kịch Quan Tâm']}"`,
          `"${r['Thời Gian Đăng Ký']}"`
        ].join(','));
      });
      const csvBlob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const csvUrl = URL.createObjectURL(csvBlob);
      const link = document.createElement('a');
      link.href = csvUrl;
      link.download = filename.replace('.xlsx', '.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(csvUrl);
      this.showToast('Đã xuất file dữ liệu thành công!', 'success');
    }
  }

  // ============================================================
  // --- 11. NHẬT KÝ HOẠT ĐỘNG HỆ THỐNG (SYSTEM AUDIT LOG) ---
  // ============================================================
  loadAuditLogs(): void {
    this.isLoadingAuditLogs.set(true);
    this.musicalService.getAuditLogs().subscribe({
      next: (res) => {
        this.auditLogs.set(res.data || []);
        if (typeof res.enabled === 'boolean') {
          this.isAuditLogEnabled.set(res.enabled);
        }
        this.isLoadingAuditLogs.set(false);
      },
      error: (err) => {
        console.warn('Lỗi tải Audit Log:', err);
        this.isLoadingAuditLogs.set(false);
      }
    });
  }

  toggleAuditLogSwitch(): void {
    const nextState = !this.isAuditLogEnabled();
    this.isTogglingAuditLog.set(true);
    this.musicalService.toggleAuditLog(nextState).subscribe({
      next: (res) => {
        this.isAuditLogEnabled.set(res.enabled);
        this.isTogglingAuditLog.set(false);
        this.loadAuditLogs();
      },
      error: () => {
        this.isAuditLogEnabled.set(nextState);
        this.isTogglingAuditLog.set(false);
      }
    });
  }

  clearAllAuditLogs(): void {
    if (!confirm('⚠️ BẠN CÓ CHẮC CHẮN MUỐN XÓA TOÀN BỘ NHẬT KÝ HOẠT ĐỘNG KHÔNG?\n\nThao tác này sẽ dọn sạch toàn bộ log hiện tại và chỉ ghi lại 1 log hành động xóa!')) {
      return;
    }
    this.musicalService.clearAuditLogs().subscribe({
      next: () => {
        this.loadAuditLogs();
      },
      error: (err) => {
        console.warn('Lỗi xóa Audit Log:', err);
      }
    });
  }

  getAuditCategoryBadge(category: string): { label: string; class: string; icon: string } {
    const cat = (category || '').toUpperCase();
    switch (cat) {
      case 'AUTH':
        return { label: 'Xác Thực / Đăng Nhập', class: 'bg-primary text-white', icon: 'bi-shield-lock' };
      case 'MUSICAL':
        return { label: 'Vở Kịch', class: 'bg-warning text-dark', icon: 'bi-film' };
      case 'ARTIST':
        return { label: 'Nghệ Sĩ', class: 'bg-info text-dark', icon: 'bi-person-badge' };
      case 'SEAT':
        return { label: 'Sơ Đồ Ghế', class: 'bg-danger text-white', icon: 'bi-grid-3x3' };
      case 'VOUCHER':
        return { label: 'Mã Giảm Giá', class: 'bg-success text-white', icon: 'bi-ticket-perforated' };
      case 'OPS':
        return { label: 'Vận Hành / Soát Vé', class: 'bg-purple text-white', icon: 'bi-qr-code-scan' };
      default:
        return { label: 'Hệ Thống', class: 'bg-secondary text-white', icon: 'bi-gear' };
    }
  }

  getAuditActionBadge(action: string): { label: string; class: string } {
    const act = (action || '').toUpperCase();
    if (act.includes('LOGIN')) {
      return { label: 'ĐĂNG NHẬP', class: 'badge bg-primary bg-opacity-25 text-info border border-info border-opacity-25' };
    }
    if (act.includes('CREATE')) {
      return { label: 'THÊM MỚI', class: 'badge bg-success bg-opacity-25 text-success border border-success border-opacity-25' };
    }
    if (act.includes('UPDATE')) {
      return { label: 'CẬP NHẬT', class: 'badge bg-warning bg-opacity-25 text-warning border border-warning border-opacity-25' };
    }
    if (act.includes('DELETE') || act.includes('CLEAR')) {
      return { label: 'XÓA BẢN GHI', class: 'badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25' };
    }
    if (act.includes('LOCK_SEATS')) {
      return { label: 'KHÓA GHẾ', class: 'badge bg-danger text-white' };
    }
    if (act.includes('UNLOCK_SEATS')) {
      return { label: 'MỞ KHÓA GHẾ', class: 'badge bg-success text-white' };
    }
    if (act.includes('CHECKIN')) {
      return { label: 'SOÁT VÉ QR', class: 'badge bg-info text-dark' };
    }
    if (act.includes('TOGGLE')) {
      return { label: 'BẬT/TẮT LOG', class: 'badge bg-secondary text-white' };
    }
    return { label: act, class: 'badge bg-secondary bg-opacity-25 text-light border border-secondary border-opacity-25' };
  }

  formatAuditMetadata(metadata?: Record<string, any>): string {
    if (!metadata) return '';
    const parts: string[] = [];
    if (metadata['ticketCode']) parts.push(`Mã vé: ${metadata['ticketCode']}`);
    if (metadata['slug']) parts.push(`Slug: ${metadata['slug']}`);
    if (metadata['title']) parts.push(`Vở: ${metadata['title']}`);
    if (metadata['voucherCode']) parts.push(`Voucher: ${metadata['voucherCode']}`);
    if (metadata['seatCodes'] && Array.isArray(metadata['seatCodes'])) parts.push(`Ghế: ${metadata['seatCodes'].join(', ')}`);
    if (metadata['artistName']) parts.push(`Nghệ sĩ: ${metadata['artistName']}`);
    return parts.join(' • ');
  }

  exportAuditLogsToExcel(): void {
    const list = this.filteredAuditLogs();
    if (!list || list.length === 0) {
      this.showToast('Không có dữ liệu nhật ký để xuất file.', 'info');
      return;
    }

    const exportRows = list.map((item, index) => {
      const catInfo = this.getAuditCategoryBadge(item.category);
      return {
        'STT': index + 1,
        'Thời Gian': new Date(item.createdAt).toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        'Phân Hệ': catInfo.label,
        'Hành Động': item.action,
        'Nội Dung Chi Tiết': item.description,
        'Người Thực Hiện': `${item.performer?.fullName || ''} (${item.performer?.username || ''})`,
        'Vai Trò': (item.performer?.role || '').toUpperCase(),
        'Địa Chỉ IP': item.ipAddress || '127.0.0.1',
        'Trạng Thái': item.status === 'SUCCESS' ? 'Thành công' : 'Thất bại'
      };
    });

    const filename = `Nhat_Ky_He_Thong_${new Date().toISOString().slice(0, 10)}.xlsx`;

    const xlsxLib = (window as any).XLSX;
    if (xlsxLib && xlsxLib.utils) {
      const worksheet = xlsxLib.utils.json_to_sheet(exportRows);
      worksheet['!cols'] = [
        { wch: 6 },
        { wch: 22 },
        { wch: 22 },
        { wch: 20 },
        { wch: 45 },
        { wch: 28 },
        { wch: 12 },
        { wch: 20 },
        { wch: 14 }
      ];
      const workbook = xlsxLib.utils.book_new();
      xlsxLib.utils.book_append_sheet(workbook, worksheet, 'Nhat_Ky_Audit');
      xlsxLib.writeFile(workbook, filename);
      this.showToast(`Đã xuất file Excel "${filename}" thành công!`, 'success');
    } else {
      const headers = ['STT', 'Thời Gian', 'Phân Hệ', 'Hành Động', 'Nội Dung Chi Tiết', 'Người Thực Hiện', 'Vai Trò', 'Địa Chỉ IP', 'Trạng Thái'];
      const lines = [headers.join(',')];
      exportRows.forEach(r => {
        lines.push([
          r['STT'],
          `"${r['Thời Gian']}"`,
          `"${r['Phân Hệ']}"`,
          `"${r['Hành Động']}"`,
          `"${r['Nội Dung Chi Tiết']}"`,
          `"${r['Người Thực Hiện']}"`,
          `"${r['Vai Trò']}"`,
          `"${r['Địa Chỉ IP']}"`,
          `"${r['Trạng Thái']}"`
        ].join(','));
      });
      const csvBlob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const csvUrl = URL.createObjectURL(csvBlob);
      const link = document.createElement('a');
      link.href = csvUrl;
      link.download = filename.replace('.xlsx', '.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(csvUrl);
      this.showToast('Đã xuất file dữ liệu nhật ký thành công!', 'success');
    }
  }
}
