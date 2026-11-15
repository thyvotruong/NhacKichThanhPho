/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/internal-gateway/internal-gateway.component.ts
 * Chức năng: Cổng Đăng Nhập Nội Bộ Tiêu Chuẩn & Bảo Mật (/internal)
 * Không để lộ danh sách nhân sự công khai trên màn hình.
 * Xác thực theo 3 cấp độ vai trò (Admin, Editor, Staff).
 * ============================================================
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MusicalService } from '../../services/musical.service';

@Component({
  selector: 'app-internal-gateway',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './internal-gateway.component.html',
  styleUrls: ['./internal-gateway.component.css']
})
export class InternalGatewayComponent implements OnInit {
  private readonly musicalService = inject(MusicalService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Form Fields
  identifier = signal<string>('admin');
  password = signal<string>('123456');
  showPassword = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  // Thông báo lỗi & điều hướng
  errorMessage = signal<string | null>(null);
  returnUrl = signal<string | null>(null);

  ngOnInit(): void {
    // Đọc returnUrl và thông báo bảo mật từ Route Guard (nếu có)
    this.route.queryParamMap.subscribe(params => {
      const ret = params.get('returnUrl');
      if (ret) this.returnUrl.set(ret);

      const authMsg = params.get('authMessage');
      if (authMsg) this.errorMessage.set(authMsg);
    });

    // Nếu đã đăng nhập với vai trò nội bộ hợp lệ, tự động điều hướng đúng phân hệ
    if (this.musicalService.isLoggedIn()) {
      const user = this.musicalService.currentUser();
      if (user.role === 'admin') {
        this.router.navigateByUrl(this.returnUrl() || '/admin');
      } else if (user.role === 'editor') {
        this.router.navigateByUrl('/admin/musicals');
      } else if (user.role === 'staff' || user.role === 'ticket_checker') {
        this.router.navigateByUrl('/ops/check-in');
      }
    }
  }

  toggleShowPassword(): void {
    this.showPassword.update(v => !v);
  }

  fillQuickCredential(type: 'admin' | 'editor' | 'staff'): void {
    this.identifier.set(type);
    this.password.set('123456');
    this.errorMessage.set(null);
  }

  onSubmit(): void {
    const id = this.identifier().trim();
    const pass = this.password().trim();

    if (!id || !pass) {
      this.errorMessage.set('Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu bảo mật.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.musicalService.staffLogin(id, pass).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        const role = res.user.role;

        // Điều hướng thông minh theo đúng 3 cấp độ phân quyền (RBAC)
        if (role === 'admin') {
          const dest = this.returnUrl() && !this.returnUrl()!.includes('/ops') ? this.returnUrl()! : '/admin';
          this.router.navigateByUrl(dest);
        } else if (role === 'editor') {
          this.router.navigateByUrl('/admin/musicals');
        } else if (role === 'staff' || role === 'ticket_checker') {
          this.router.navigateByUrl('/ops/check-in');
        } else {
          this.router.navigateByUrl('/account/profile');
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.message || 'Tài khoản hoặc Mật khẩu không chính xác.');
      }
    });
  }
}
