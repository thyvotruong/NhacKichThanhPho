/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/account/account.component.ts
 * Chức năng: Trung tâm Quản lý Tài Khoản Khán Giả (/account/profile)
 * Bao gồm các mục con:
 * 1. Thông tin cá nhân & Cập nhật hồ sơ
 * 2. Đổi mật khẩu bảo mật
 * 3. [Mục con] Vé của tôi (Lịch sử đặt vé, mã QR, in vé, hủy vé hoàn tiền)
 * BẮT BUỘC ĐÃ ĐĂNG NHẬP MỚI ĐƯỢC PHÉP TRUY CẬP (Bảo vệ bởi AuthGuard)
 * ============================================================
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MusicalService } from '../../services/musical.service';
import { MyTicketsComponent } from '../my-tickets/my-tickets.component';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MyTicketsComponent],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {
  readonly musicalService = inject(MusicalService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // Tab đang kích hoạt: 'profile' (Thông tin) | 'security' (Đổi mật khẩu) | 'tickets' (Vé của tôi)
  activeTab = signal<'profile' | 'security' | 'tickets'>('profile');

  // Thông báo lưu hồ sơ / mật khẩu
  profileMessage = signal<string | null>(null);
  securityMessage = signal<string | null>(null);
  securityError = signal<string | null>(null);

  // Forms
  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  ngOnInit(): void {
    // Khởi tạo form thông tin cá nhân từ User hiện tại
    const user = this.musicalService.currentUser();
    this.profileForm = this.fb.group({
      fullName: [user?.fullName || 'Khách Hàng', [Validators.required, Validators.minLength(2)]],
      email: [{ value: user?.email || 'khachhang@gmail.com', disabled: true }],
      phone: [user?.phone || '0909123456', [Validators.required, Validators.pattern(/^(0[3|5|7|8|9])[0-9]{8}$/)]],
      address: ['7 Lam Sơn, Bến Nghé, Quận 1, TP. Hồ Chí Minh'],
      gender: ['MALE']
    });

    // Form đổi mật khẩu
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });

    // Lắng nghe URL và QueryParams để chuyển tab phù hợp
    // Ví dụ: /account/my-tickets hoặc /account/profile?tab=tickets
    const path = this.route.snapshot.routeConfig?.path || '';
    if (path.includes('my-tickets')) {
      this.activeTab.set('tickets');
    }

    this.route.queryParamMap.subscribe(params => {
      const tab = params.get('tab');
      if (tab === 'tickets' || tab === 'my-tickets') {
        this.activeTab.set('tickets');
      } else if (tab === 'security') {
        this.activeTab.set('security');
      } else if (tab === 'profile' || tab === 'info') {
        this.activeTab.set('profile');
      }
    });
  }

  setTab(tab: 'profile' | 'security' | 'tickets'): void {
    this.activeTab.set(tab);
    this.profileMessage.set(null);
    this.securityMessage.set(null);
    this.securityError.set(null);
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileMessage.set('Vui lòng kiểm tra lại họ tên và số điện thoại hợp lệ.');
      return;
    }

    const val = this.profileForm.getRawValue();
    const updated = {
      ...this.musicalService.currentUser(),
      fullName: val.fullName,
      phone: val.phone
    };

    this.musicalService.currentUser.set(updated);
    try {
      localStorage.setItem('showman_user', JSON.stringify(updated));
    } catch {}

    this.profileMessage.set('🎉 Đã cập nhật thông tin tài khoản thành công!');
    setTimeout(() => this.profileMessage.set(null), 4000);
  }

  changePassword(): void {
    this.securityError.set(null);
    this.securityMessage.set(null);

    const val = this.passwordForm.value;
    if (!val.currentPassword) {
      this.securityError.set('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (!val.newPassword || val.newPassword.length < 6) {
      this.securityError.set('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (val.newPassword !== val.confirmPassword) {
      this.securityError.set('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }

    // Giả lập cập nhật mật khẩu thành công
    this.securityMessage.set('🎉 Đổi mật khẩu thành công! Hãy dùng mật khẩu mới cho lần đăng nhập tới.');
    this.passwordForm.reset();
    setTimeout(() => this.securityMessage.set(null), 4000);
  }

  onLogout(): void {
    this.musicalService.logout();
    this.router.navigate(['/account/login']);
  }
}
