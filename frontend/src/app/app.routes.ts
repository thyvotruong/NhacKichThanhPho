/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR ROUTER
 * File: app.routes.ts
 * Chức năng: Định tuyến SPA với Lazy Loading cho 2 Phân Vùng Tách Biệt
 * Tuân thủ đúng chuẩn SITEMAP và PHÂN QUYỀN HIỂN THỊ (BA):
 * 1. WEBSITE KHÁCH HÀNG:
 *    - 1. Trang Chủ (/)
 *    - 2. Vở Kịch (/musicals, /musical/:slug)
 *    - 3. Lịch Diễn (/schedules)
 *    - 4. Đặt Vé & Thanh Toán (/booking, /seat-selection/:scheduleId, /checkout)
 *    - 5. Nghệ Sĩ (/artists)
 *    - 6. Tin Tức (/news)
 *    - 7. Tài Khoản (/account/login, /account/register, /account/profile, /account/my-tickets)
 *         * Vé của tôi chỉ hiển thị bên trong Tài khoản cá nhân khi ĐÃ ĐĂNG NHẬP (authGuard)
 *    - 8. Về Nhà Hát (/about)
 *    - 9. Chính Sách / Hỗ Trợ (/support, /policies)
 * 2. HỆ THỐNG NỘI BỘ (Tách biệt hoàn toàn):
 *    - Cổng Xác Thực Nội Bộ (/internal, /staff)
 *    - Quản Trị Hệ Thống (/admin)
 *    - Soát Vé Cửa Rạp (/ops)
 * ============================================================
 */

import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { AboutComponent } from './components/about/about.component';

export const routes: Routes = [
  // ==========================================
  // SITEMAP MỤC 1: TRANG CHỦ
  // ==========================================
  {
    path: '',
    loadComponent: () =>
      import('./components/home/home.component').then((m) => m.HomeComponent),
    title: 'Trang Chủ - Nhà Hát Nhạc Kịch Thành Phố'
  },

  // ==========================================
  // SITEMAP MỤC 2: VỞ KỊCH (DANH SÁCH & CHI TIẾT)
  // ==========================================
  {
    path: 'musicals',
    loadComponent: () =>
      import('./components/musical-list/musical-list.component').then((m) => m.MusicalListComponent),
    title: 'Danh Mục Vở Diễn - Nhạc Kịch Thành Phố'
  },
  {
    path: 'musical/:slug',
    loadComponent: () =>
      import('./components/musical-detail/musical-detail.component').then(
        (m) => m.MusicalDetailComponent
      ),
    title: 'Chi Tiết Vở Diễn & Đặt Vé - Nhạc Kịch Thành Phố'
  },

  // ==========================================
  // SITEMAP MỤC 3: LỊCH DIỄN
  // ==========================================
  {
    path: 'schedules',
    loadComponent: () =>
      import('./components/schedules/schedules.component').then((m) => m.SchedulesComponent),
    title: 'Lịch Biểu Diễn - Nhạc Kịch Thành Phố'
  },

  // ==========================================
  // SITEMAP MỤC 4: ĐẶT VÉ & THANH TOÁN
  // ==========================================
  {
    path: 'booking',
    redirectTo: 'musicals',
    pathMatch: 'full'
  },
  {
    path: 'seat-selection/:scheduleId',
    loadComponent: () =>
      import('./components/seat-selection/seat-selection.component').then(
        (m) => m.SeatSelectionComponent
      ),
    title: 'Sơ Đồ Ghế Ngồi & Giữ Chỗ - Nhạc Kịch Thành Phố'
  },
  {
    path: 'booking/seat-selection/:scheduleId',
    redirectTo: ({ params }) => `seat-selection/${params['scheduleId']}`
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./components/checkout/checkout.component').then(
        (m) => m.CheckoutComponent
      ),
    title: 'Thanh Toán Đặt Vé Trực Tuyến - Nhạc Kịch Thành Phố'
  },
  {
    path: 'booking/checkout',
    redirectTo: 'checkout'
  },

  // ==========================================
  // SITEMAP MỤC 5: NGHỆ SĨ
  // ==========================================
  {
    path: 'artists',
    loadComponent: () =>
      import('./components/artists/artists.component').then((m) => m.ArtistsComponent),
    title: 'Gương Mặt Nghệ Sĩ - Nhạc Kịch Thành Phố'
  },

  // ==========================================
  // SITEMAP MỤC 6: TIN TỨC
  // ==========================================
  {
    path: 'news',
    loadComponent: () =>
      import('./components/news/news.component').then((m) => m.NewsComponent),
    title: 'Tin Tức & Sự Kiện - Nhạc Kịch Thành Phố'
  },

  // ==========================================
  // SITEMAP MỤC 7: TÀI KHOẢN & PHÂN QUYỀN
  // ==========================================
  {
    path: 'account/login',
    loadComponent: () =>
      import('./components/auth/auth.component').then((m) => m.AuthComponent),
    data: { mode: 'login' },
    title: 'Đăng Nhập Khán Giả - Nhạc Kịch Thành Phố'
  },
  {
    path: 'account/register',
    loadComponent: () =>
      import('./components/auth/auth.component').then((m) => m.AuthComponent),
    data: { mode: 'register' },
    title: 'Đăng Ký Thành Viên - Nhạc Kịch Thành Phố'
  },
  {
    path: 'account/forgot-password',
    loadComponent: () =>
      import('./components/auth/auth.component').then((m) => m.AuthComponent),
    data: { mode: 'forgot' },
    title: 'Khôi Phục Mật Khẩu - Nhạc Kịch Thành Phố'
  },
  {
    path: 'auth',
    redirectTo: 'account/login'
  },
  // Tài khoản cá nhân: Thông tin, Đổi mật khẩu, và [Mục con] Vé của tôi
  // BẮT BUỘC ĐÃ ĐĂNG NHẬP MỚI ĐƯỢC XEM (authGuard bảo vệ)
  {
    path: 'account/profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/account/account.component').then((m) => m.AccountComponent),
    title: 'Tài Khoản Cá Nhân - Nhạc Kịch Thành Phố'
  },
  {
    path: 'account/my-tickets',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/account/account.component').then((m) => m.AccountComponent),
    title: 'Vé Của Tôi - Nhạc Kịch Thành Phố'
  },
  {
    path: 'account',
    redirectTo: 'account/profile',
    pathMatch: 'full'
  },
  // Chuyển hướng route cũ /my-tickets về /account/my-tickets (đã được bảo vệ bởi authGuard tại trang đích)
  {
    path: 'my-tickets',
    redirectTo: 'account/my-tickets'
  },

  // ==========================================
  // SITEMAP MỤC 8: VỀ CHÚNG TÔI (ABOUT US)
  // ==========================================
  {
    path: 'about',
    component: AboutComponent,
    title: 'Về Chúng Tôi - Nhà Hát Nhạc Kịch Thành Phố'
  },
  {
    path: 'about-us',
    redirectTo: 'about',
    pathMatch: 'full'
  },

  // ==========================================
  // SITEMAP MỤC 9: ĐIỀU KHOẢN & CHÍNH SÁCH (POLICY & TERMS)
  // ==========================================
  {
    path: 'policy',
    loadComponent: () =>
      import('./components/policy/policy.component').then((m) => m.PolicyComponent),
    title: 'Điều Khoản & Chính Sách - Nhạc Kịch Thành Phố'
  },
  {
    path: 'support',
    redirectTo: 'policy'
  },
  {
    path: 'policies',
    redirectTo: 'policy'
  },

  // ==========================================
  // PHÂN VÙNG 2: HỆ THỐNG NỘI BỘ (STAFF INTRANET)
  // Tách biệt hoàn toàn, không xuất hiện trên client website
  // ==========================================
  {
    path: 'internal',
    loadComponent: () =>
      import('./components/internal-gateway/internal-gateway.component').then(
        (m) => m.InternalGatewayComponent
      ),
    title: 'Cổng Xác Thực Nội Bộ - Nhà Hát Thành Phố'
  },
  {
    path: 'staff',
    redirectTo: 'internal'
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./components/admin/admin.component').then((m) => m.AdminComponent),
    title: 'Trung Tâm Quản Trị Hệ Thống - Nhạc Kịch Thành Phố'
  },
  {
    path: 'ops',
    loadComponent: () =>
      import('./components/ops-checkin/ops-checkin.component').then(
        (m) => m.OpsCheckinComponent
      ),
    title: 'Cổng Soát Vé & Check-in QR - Nhạc Kịch Thành Phố'
  },

  // Fallback Route
  {
    path: '**',
    redirectTo: ''
  }
];
