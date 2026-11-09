/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/staff-header/staff-header.component.ts
 * Chức năng: Thanh điều hướng nội bộ dành riêng cho Cán bộ & Nhân viên (Staff Intranet)
 * Hoàn toàn tách biệt khỏi website khách hàng.
 * ============================================================
 */

import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MusicalService } from '../../services/musical.service';

@Component({
  selector: 'app-staff-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="staff-header sticky-top">
      <div class="container-fluid px-lg-5">
        <div class="d-flex justify-content-between align-items-center py-2">
          <!-- Logo & Tiêu đề Phân hệ Nội Bộ -->
          <div class="d-flex align-items-center gap-3">
            <div class="staff-emblem d-flex align-items-center justify-content-center">
              <i class="bi bi-shield-lock-fill text-gold fs-5"></i>
            </div>
            <div>
              <div class="d-flex align-items-center gap-2">
                <span class="staff-brand-title text-gold-gradient fw-bold">NHÀ HÁT THÀNH PHỐ</span>
                <span class="badge staff-secure-badge">
                  <i class="bi bi-lock-fill text-gold me-1"></i> NỘI BỘ / INTRANET
                </span>
              </div>
              <div class="staff-brand-sub text-secondary">
                HỆ THỐNG QUẢN TRỊ & ĐIỀU HÀNH TẬP TRUNG (INTERNAL PORTAL)
              </div>
            </div>
          </div>

          <!-- Các phân hệ nội bộ -->
          <nav class="d-none d-md-flex align-items-center gap-2">
            <a
              routerLink="/admin"
              routerLinkActive="active"
              class="btn staff-nav-btn py-1 px-3 d-flex align-items-center gap-2"
            >
              <i class="bi bi-speedometer2 text-gold"></i>
              <span>Quản Trị Admin</span>
            </a>

            <a
              routerLink="/ops"
              routerLinkActive="active"
              class="btn staff-nav-btn py-1 px-3 d-flex align-items-center gap-2"
            >
              <i class="bi bi-upc-scan text-ruby-glow"></i>
              <span>Soát Vé Check-in (Ops)</span>
            </a>

            <a
              routerLink="/internal"
              class="btn staff-nav-btn py-1 px-3 d-flex align-items-center gap-2"
            >
              <i class="bi bi-grid-fill text-info"></i>
              <span>Cổng Đăng Nhập Nội Bộ</span>
            </a>
          </nav>

          <!-- Thông tin nhân sự & Nút Thoát -->
          <div class="d-flex align-items-center gap-3">
            <div class="staff-user-box d-flex align-items-center gap-2 px-3 py-1 rounded-pill">
              <div class="staff-avatar-circle">
                <i class="bi bi-person-fill text-gold"></i>
              </div>
              <div class="text-start d-none d-sm-block">
                <div class="text-white fw-bold small leading-tight">{{ currentUser().fullName }}</div>
                <div class="text-gold-subtle" style="font-size: 0.7rem;">
                  Vai trò: <strong class="text-gold text-uppercase">{{ currentUser().role }}</strong>
                </div>
              </div>
            </div>

            <!-- Nút xem trang Web Khách hàng -->
            <a
              routerLink="/"
              target="_blank"
              class="btn btn-sm btn-outline-secondary border-opacity-50 text-light py-1 px-2 d-flex align-items-center gap-1"
              title="Mở trang chủ khách hàng trong tab mới"
            >
              <i class="bi bi-box-arrow-up-right"></i>
              <span class="d-none d-lg-inline small">Xem Web Khách</span>
            </a>

            <!-- Nút Đăng xuất -->
            <button
              type="button"
              class="btn btn-sm btn-outline-danger py-1 px-2 d-flex align-items-center gap-1"
              (click)="onLogout()"
              title="Đăng xuất khỏi cổng nội bộ"
            >
              <i class="bi bi-box-arrow-right"></i>
              <span class="d-none d-lg-inline small">Thoát</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .staff-header {
      background: rgba(7, 10, 18, 0.98);
      border-bottom: 2px solid rgba(245, 158, 11, 0.4);
      backdrop-filter: blur(16px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.85);
      z-index: 1040;
    }
    .staff-emblem {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: radial-gradient(circle, rgba(190, 18, 60, 0.4) 0%, rgba(7, 10, 18, 0.95) 100%);
      border: 1px solid var(--showman-gold);
    }
    .staff-brand-title {
      font-size: 1.05rem;
      letter-spacing: 1px;
    }
    .staff-secure-badge {
      background: rgba(190, 18, 60, 0.25);
      color: #FDE68A;
      border: 1px solid rgba(245, 158, 11, 0.4);
      font-size: 0.68rem;
      padding: 0.2rem 0.5rem;
      border-radius: 999px;
      letter-spacing: 0.5px;
    }
    .staff-brand-sub {
      font-size: 0.65rem;
      letter-spacing: 1.5px;
      font-weight: 600;
    }
    .staff-nav-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #94A3B8;
      font-size: 0.82rem;
      font-weight: 600;
      border-radius: 999px;
      transition: all 0.25s ease;
    }
    .staff-nav-btn:hover {
      background: rgba(245, 158, 11, 0.15);
      color: var(--showman-gold);
      border-color: var(--showman-gold);
    }
    .staff-nav-btn.active {
      background: linear-gradient(135deg, var(--showman-gold) 0%, #D97706 100%);
      color: #070A12;
      border-color: var(--showman-gold);
      font-weight: 700;
      box-shadow: 0 0 12px rgba(245, 158, 11, 0.35);
    }
    .staff-user-box {
      background: rgba(14, 22, 41, 0.8);
      border: 1px solid rgba(245, 158, 11, 0.25);
    }
    .staff-avatar-circle {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid var(--showman-gold);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
    }
    .text-gold-subtle {
      color: #FDE68A;
    }
    .leading-tight {
      line-height: 1.2;
    }
  `]
})
export class StaffHeaderComponent {
  private readonly musicalService = inject(MusicalService);
  private readonly router = inject(Router);

  currentUser = this.musicalService.currentUser;

  onLogout(): void {
    this.musicalService.setRole('customer');
    this.router.navigate(['/internal']);
  }
}
