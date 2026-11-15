/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/staff-header/staff-header.component.ts
 * Chức năng: Thanh điều hướng nội bộ tinh gọn dành riêng cho Cán bộ & Nhân viên (Staff Intranet)
 * Thiết kế chuẩn Enterprise: Tối ưu không gian làm việc, loại bỏ banner trùng lặp
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
      <nav class="navbar navbar-expand-xl py-2">
        <div class="container-fluid px-3 px-lg-4 px-xl-5">
          <div class="d-flex align-items-center">
            <div class="showman-emblem-box d-flex align-items-center justify-content-center">
              <span class="showman-icon">🎭</span>
            </div>
            <span class="staff-brand-title fw-bold text-gold-gradient ms-3">NHẠC KỊCH THÀNH PHỐ</span>
          </div>

          <button
            class="navbar-toggler border-gold"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#staffNavigation"
            aria-controls="staffNavigation"
            aria-expanded="false"
            aria-label="Mở menu quản trị"
          >
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="staffNavigation">
            <nav class="staff-nav ms-xl-auto" aria-label="Điều hướng nội bộ">
              @if (currentUser().role === 'admin') {
                <a routerLink="/admin" routerLinkActive="active" class="staff-nav-link">Quản trị</a>
                <a routerLink="/ops" routerLinkActive="active" class="staff-nav-link">Soát vé</a>
              } @else if (currentUser().role === 'editor') {
                <a routerLink="/admin/musicals" routerLinkActive="active" class="staff-nav-link">Biên tập sân khấu</a>
              } @else {
                <a routerLink="/ops" routerLinkActive="active" class="staff-nav-link">Soát vé</a>
              }
              <a routerLink="/internal" class="staff-nav-link">Cổng nội bộ</a>
            </nav>

            <div class="staff-account-actions d-flex align-items-center gap-3 ms-xl-4">
              <div class="staff-user-box d-none d-sm-block">
                <div class="text-white fw-bold">{{ currentUser().fullName }}</div>
                <div class="staff-user-role">
                  {{ currentUser().role === 'admin' ? 'Quản trị viên' : (currentUser().role === 'editor' ? 'Biên tập viên' : 'Nhân viên soát vé') }}
                </div>
              </div>

              <div class="dropdown">
                <button
                  class="btn staff-action-btn dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  title="Đổi vai trò nhanh để kiểm thử giao diện"
                >
                  Đổi vai trò
                </button>
                <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end staff-dropdown">
                  <li><h6 class="dropdown-header text-gold">Giả lập phân quyền</h6></li>
                  <li><button class="dropdown-item" (click)="onSwitchRole('admin')">Giám Đốc (Admin)</button></li>
                  <li><button class="dropdown-item" (click)="onSwitchRole('editor')">Biên Tập Viên (Editor)</button></li>
                  <li><button class="dropdown-item" (click)="onSwitchRole('staff')">Nhân Viên Soát Vé (Staff)</button></li>
                  <li><hr class="dropdown-divider border-secondary border-opacity-25"></li>
                  <li><button class="dropdown-item" (click)="onSwitchRole('customer')">Khách Hàng (Customer)</button></li>
                </ul>
              </div>

              <a routerLink="/" target="_blank" class="staff-nav-link">Trang khách</a>
              <button type="button" class="staff-logout-btn" (click)="onLogout()">Đăng xuất</button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  `,
  styles: [`
    .staff-header {
      background: rgba(7, 10, 18, 0.95);
      border-bottom: 1.5px solid rgba(245, 158, 11, 0.32);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8), 0 1px 0 rgba(245, 158, 11, 0.18);
      z-index: 1040;
    }
    .staff-brand-title {
      font-size: 1.02rem;
      letter-spacing: 0.8px;
      line-height: 1.2;
    }
    .staff-nav {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    .staff-nav-link {
      position: relative;
      display: inline-flex;
      align-items: center;
      min-height: 42px;
      color: #CBD5E1;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 700;
      letter-spacing: 0.35px;
      transition: color 0.2s ease;
    }
    .staff-nav-link::after {
      position: absolute;
      right: 0;
      bottom: 3px;
      left: 0;
      height: 2px;
      background: linear-gradient(90deg, #BE123C, #F59E0B);
      content: '';
      transform: scaleX(0);
      transform-origin: center;
      transition: transform 0.2s ease;
    }
    .staff-nav-link:hover,
    .staff-nav-link.active {
      color: #FDE68A;
    }
    .staff-nav-link:hover::after,
    .staff-nav-link.active::after {
      transform: scaleX(1);
    }
    .staff-user-box {
      line-height: 1.3;
    }
    .staff-user-role {
      color: #FDE68A;
      font-size: 0.85rem;
    }
    .staff-action-btn,
    .staff-logout-btn {
      min-height: 42px;
      padding: 0.5rem 0.85rem;
      border: 1px solid rgba(245, 158, 11, 0.35);
      border-radius: 0.65rem;
      background: rgba(245, 158, 11, 0.08);
      color: #FDE68A;
      font-size: 0.9rem;
      font-weight: 700;
      text-decoration: none;
      white-space: nowrap;
      transition: background 0.2s ease, border-color 0.2s ease;
    }
    .staff-action-btn:hover,
    .staff-logout-btn:hover {
      border-color: rgba(245, 158, 11, 0.65);
      background: rgba(245, 158, 11, 0.16);
      color: #fff;
    }
    .staff-logout-btn {
      border-color: rgba(203, 213, 225, 0.2);
      background: transparent;
      color: #CBD5E1;
    }
    .staff-dropdown {
      min-width: 240px;
      margin-top: 0.5rem !important;
      border: 1px solid rgba(245, 158, 11, 0.28);
      border-radius: 0.85rem;
      background: rgba(14, 22, 41, 0.98);
      box-shadow: 0 14px 36px rgba(0, 0, 0, 0.55);
    }
    .staff-dropdown .dropdown-item {
      min-height: 42px;
      display: flex;
      align-items: center;
      color: #CBD5E1;
      font-size: 0.95rem;
    }
    .staff-dropdown .dropdown-item:hover {
      background: rgba(245, 158, 11, 0.12);
      color: #FDE68A;
    }
    .navbar-toggler {
      background: rgba(245, 158, 11, 0.12);
      border-color: rgba(245, 158, 11, 0.45);
    }
    .navbar-toggler-icon {
      filter: invert(1);
    }
    @media (max-width: 1199.98px) {
      .staff-nav {
        align-items: stretch;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.75rem 0;
      }
      .staff-nav-link {
        min-height: 44px;
        padding: 0 0.25rem;
      }
      .staff-nav-link::after {
        right: auto;
        width: 3rem;
      }
      .staff-account-actions {
        flex-wrap: wrap;
        margin: 0 !important;
        padding: 0.75rem 0;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }
    }
  `]
})
export class StaffHeaderComponent {
  private readonly musicalService = inject(MusicalService);
  private readonly router = inject(Router);

  currentUser = this.musicalService.currentUser;

  onSwitchRole(role: 'admin' | 'editor' | 'accountant' | 'ticket_checker' | 'staff' | 'customer'): void {
    this.musicalService.setRole(role);
    if (role === 'editor') {
      this.router.navigate(['/admin', 'musicals']);
    } else if (role === 'staff' || role === 'ticket_checker') {
      this.router.navigate(['/ops', 'check-in']);
    } else if (role === 'admin') {
      this.router.navigate(['/admin', 'dashboard']);
    } else if (role === 'customer') {
      this.router.navigate(['/account']);
    }
  }

  onLogout(): void {
    this.musicalService.logout();
    this.router.navigate(['/internal']);
  }
}
