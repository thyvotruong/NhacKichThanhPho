/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/internal-gateway/internal-gateway.component.ts
 * Chức năng: Cổng Đăng Nhập & Truy Cập Nội Bộ Riêng Biệt (Staff Gateway)
 * Tách biệt hoàn toàn khỏi trang website phía khách hàng.
 * ============================================================
 */

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MusicalService } from '../../services/musical.service';

@Component({
  selector: 'app-internal-gateway',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './internal-gateway.component.html',
  styleUrls: ['./internal-gateway.component.css']
})
export class InternalGatewayComponent {
  private readonly musicalService = inject(MusicalService);
  private readonly router = inject(Router);

  currentUser = this.musicalService.currentUser;

  selectedRole = signal<'admin' | 'ticket_checker' | 'accountant' | 'editor'>('admin');
  accessPin = signal<string>('123456');
  targetModule = signal<'admin' | 'ops'>('admin');
  errorMessage = signal<string | null>(null);

  staffProfiles = [
    {
      role: 'admin' as const,
      name: 'Trần Minh Đức',
      title: 'Giám Đốc Điều Hành',
      icon: 'bi-shield-shaded',
      color: 'gold',
      target: 'admin' as const,
      description: 'Toàn quyền Dashboard, Khóa ghế nội bộ, Quản lý đơn, Hoàn tiền, RBAC'
    },
    {
      role: 'ticket_checker' as const,
      name: 'Phạm Hùng Cường',
      title: 'Tổ Trưởng Soát Vé',
      icon: 'bi-upc-scan',
      color: 'ruby',
      target: 'ops' as const,
      description: 'Quét mã QR soát vé tại cửa rạp, kiểm tra vé hợp lệ / vé trùng'
    },
    {
      role: 'accountant' as const,
      name: 'Nguyễn Thị Bích Ngọc',
      title: 'Kế Toán Trưởng',
      icon: 'bi-cash-coin',
      color: 'emerald',
      target: 'admin' as const,
      description: 'Báo cáo doanh thu, đối soát tài chính với cổng VietQR, VNPAY, MoMo'
    },
    {
      role: 'editor' as const,
      name: 'Lê Thảo My',
      title: 'Ban Biên Tập Sân Khấu',
      icon: 'bi-pencil-square',
      color: 'sapphire',
      target: 'admin' as const,
      description: 'Quản lý danh mục vở nhạc kịch, lịch diễn và thông tin nghệ sĩ'
    }
  ];

  selectStaff(staff: typeof this.staffProfiles[0]): void {
    this.selectedRole.set(staff.role);
    this.targetModule.set(staff.target);
    this.errorMessage.set(null);
  }

  onAuthenticate(): void {
    if (!this.accessPin()) {
      this.errorMessage.set('Vui lòng nhập mã PIN bảo mật nhân viên');
      return;
    }

    // Thiết lập vai trò tương ứng trong service
    this.musicalService.setRole(this.selectedRole());

    // Chuyển hướng đến phân hệ tương ứng
    if (this.targetModule() === 'ops') {
      this.router.navigate(['/ops']);
    } else {
      this.router.navigate(['/admin']);
    }
  }
}
