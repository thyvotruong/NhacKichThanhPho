/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR GUARD
 * File: guards/admin.guard.ts
 * Chức năng: Bảo vệ phân hệ Quản Trị Hệ Thống (/admin và /admin/:tab).
 * RBAC 3 CẤP ĐỘ:
 * 1. Admin ('admin'): Toàn quyền truy cập mọi phân hệ.
 * 2. Editor ('editor'): CHỈ được phép xem /admin/musicals, /admin/artists.
 *    Bị chặn tuyệt đối khỏi Doanh thu, Khán phòng, Sơ đồ ghế, Voucher, Báo cáo, Tài khoản.
 * 3. Staff ('staff'): Bị chặn khỏi Admin, tự động chuyển về /ops/check-in.
 * 4. Khách vãng lai / Khách hàng ('customer'): Bị chặn, chuyển về /internal.
 * ============================================================
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MusicalService } from '../services/musical.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const musicalService = inject(MusicalService);
  const router = inject(Router);

  const isLoggedIn = musicalService.isLoggedIn();
  const currentUser = musicalService.currentUser();
  const role = currentUser?.role;

  // 1. Khách vãng lai hoặc tài khoản khách hàng thông thường -> Chặn về /internal
  if (!isLoggedIn || !currentUser || role === 'customer') {
    return router.createUrlTree(['/internal'], {
      queryParams: {
        returnUrl: state.url,
        authMessage: 'Khu vực quản trị chỉ dành cho Cán bộ & Quản trị viên. Vui lòng đăng nhập tài khoản nội bộ!'
      }
    });
  }

  // 2. Nhân viên soát vé (staff) -> Bị chặn khỏi Admin, điều hướng sang /ops/check-in
  if (role === 'staff' || role === 'ticket_checker') {
    return router.createUrlTree(['/ops/check-in'], {
      queryParams: {
        authMessage: 'Tài khoản Nhân viên soát vé chỉ có quyền truy cập Cổng soát vé (/ops).'
      }
    });
  }

  // 3. Biên tập viên (editor) -> Chỉ được xem nội dung hiển thị (musicals, artists)
  if (role === 'editor') {
    const targetUrl = state.url.toLowerCase();
    const isAllowedTab = targetUrl.includes('/musicals') || targetUrl.includes('/artists') || targetUrl.includes('/news');
    if (isAllowedTab) {
      return true;
    }
    // Cố tình vào /admin, /admin/dashboard, /admin/accounts, /admin/reports... -> Chặn và đẩy về /admin/musicals
    return router.createUrlTree(['/admin/musicals'], {
      queryParams: {
        authMessage: 'Biên tập viên chỉ được phép quản trị nội dung Vở kịch và Nghệ sĩ.'
      }
    });
  }

  // 4. Admin (Quản trị viên tối cao) -> Toàn quyền truy cập mọi phân hệ
  if (role === 'admin') {
    return true;
  }

  return router.createUrlTree(['/internal']);
};
