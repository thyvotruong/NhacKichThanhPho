/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR GUARD
 * File: guards/ops.guard.ts
 * Chức năng: Bảo vệ phân hệ Soát Vé & Vận Hành (/ops và /ops/:tab).
 * RBAC 3 CẤP ĐỘ:
 * 1. Staff ('staff') & Admin ('admin'): Được phép truy cập soát vé & tra cứu.
 * 2. Editor ('editor'): Bị chặn khỏi Ops, tự động chuyển về /admin/musicals.
 * 3. Khách vãng lai / Khách hàng ('customer'): Bị chặn, chuyển về /internal.
 * ============================================================
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MusicalService } from '../services/musical.service';

export const opsGuard: CanActivateFn = (route, state) => {
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
        authMessage: 'Cổng soát vé chỉ dành cho Nhân viên soát vé và Ban vận hành. Vui lòng đăng nhập nội bộ!'
      }
    });
  }

  // 2. Biên tập viên (editor) -> Bị chặn khỏi cổng soát vé, chuyển về /admin/musicals
  if (role === 'editor') {
    return router.createUrlTree(['/admin/musicals'], {
      queryParams: {
        authMessage: 'Biên tập viên không có thẩm quyền truy cập Cổng soát vé rạp.'
      }
    });
  }

  // 3. Nhân viên soát vé (staff) hoặc Admin -> Cho phép truy cập
  if (role === 'staff' || role === 'ticket_checker' || role === 'admin') {
    return true;
  }

  return router.createUrlTree(['/internal']);
};
