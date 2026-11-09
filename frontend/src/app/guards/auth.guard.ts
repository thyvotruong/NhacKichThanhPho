/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR GUARD
 * File: guards/auth.guard.ts
 * Chức năng: Bảo vệ phân vùng Tài khoản cá nhân & Vé của tôi.
 * Tự động điều hướng về /account/login kèm returnUrl nếu chưa đăng nhập.
 * ============================================================
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MusicalService } from '../services/musical.service';

export const authGuard: CanActivateFn = (route, state) => {
  const musicalService = inject(MusicalService);
  const router = inject(Router);

  if (musicalService.isLoggedIn()) {
    return true;
  }

  // Khách hàng chưa đăng nhập -> Chuyển hướng sang trang Đăng nhập kèm đường dẫn đích
  return router.createUrlTree(['/account/login'], {
    queryParams: { returnUrl: state.url }
  });
};
