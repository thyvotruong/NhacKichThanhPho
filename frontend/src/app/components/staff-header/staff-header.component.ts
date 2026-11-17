/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/staff-header/staff-header.component.ts
 * Chức năng: Thanh điều hướng nội bộ tinh gọn dành riêng cho Cán bộ & Nhân viên (Staff Intranet)
 * Thiết kế chuẩn Enterprise: Tối giản, hiện đại, không lạm dụng icon (Clean UI)
 * ============================================================
 */

import { Component, computed, inject } from '@angular/core';
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
          <!-- Brand / Logo -->
          <div class="d-flex align-items-center">
            <div class="showman-emblem-box d-flex align-items-center justify-content-center shadow-gold">
              <span class="showman-icon">🎭</span>
            </div>
            <div class="ms-3 d-flex flex-column">
              <span class="staff-brand-title fw-bold text-gold-gradient">NHẠC KỊCH THÀNH PHỐ</span>
              <span class="staff-portal-badge text-gold-spark text-uppercase">Cổng Quản Trị Nội Bộ</span>
            </div>
          </div>

          <!-- Mobile Toggle -->
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

          <!-- Navigation Links (Clean, No Distracting Icons) -->
          <div class="collapse navbar-collapse" id="staffNavigation">
            <nav class="staff-nav ms-xl-auto" aria-label="Điều hướng nội bộ">
              @if (currentUser().role === 'admin') {
                <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact: false}" class="staff-nav-link">
                  Trung Tâm Quản Trị
                </a>
                <a routerLink="/ops" routerLinkActive="active" class="staff-nav-link">
                  Soát Vé Cửa Rạp
                </a>
              } @else if (currentUser().role === 'editor') {
                <a routerLink="/admin/musicals" routerLinkActive="active" class="staff-nav-link">
                  Biên Tập Vở Diễn
                </a>
                <a routerLink="/admin/artists" routerLinkActive="active" class="staff-nav-link">
                  Quản Lý Nghệ Sĩ
                </a>
              } @else {
                <a routerLink="/ops" routerLinkActive="active" class="staff-nav-link">
                  Soát Vé Cửa Rạp
                </a>
              }
            </nav>

            <!-- User Info & Actions -->
            <div class="staff-account-actions d-flex align-items-center gap-3 ms-xl-4">
              <!-- Staff User Profile -->
              <div class="staff-user-box d-none d-sm-flex flex-column text-end justify-content-center">
                <div class="staff-user-name fw-bold text-white">{{ cleanFullName() }}</div>
                <div class="staff-user-role-badge mt-0.5">
                  <span class="badge" [class.badge-admin]="currentUser().role === 'admin'" [class.badge-editor]="currentUser().role === 'editor'" [class.badge-staff]="currentUser().role === 'staff' || currentUser().role === 'ticket_checker'">
                    {{ currentUser().role === 'admin' ? 'Giám Đốc (Admin)' : (currentUser().role === 'editor' ? 'Biên Tập Viên' : 'Nhân Viên Soát Vé') }}
                  </span>
                </div>
              </div>

              <!-- Switch Role Dropdown (Clean, Only Internal Roles) -->
              <div class="dropdown">
                <button
                  class="btn staff-action-btn dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  title="Chuyển đổi vai trò nội bộ"
                >
                  Đổi vai trò
                </button>
                <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end staff-dropdown p-2 shadow-2xl">
                  <li>
                    <div class="dropdown-header text-gold-gradient fw-bold text-uppercase px-2 py-1.5 border-bottom border-gold-glow pb-2 mb-2">
                      Phân Quyền Nội Bộ
                    </div>
                  </li>
                  <li>
                    <button
                      class="dropdown-item role-item d-flex align-items-center justify-content-between p-2 rounded-2 mb-1"
                      [class.active-role]="currentUser().role === 'admin'"
                      (click)="onSwitchRole('admin')"
                    >
                      <div class="text-start">
                        <div class="fw-bold text-white">Giám Đốc (Admin)</div>
                        <div class="role-desc">Toàn quyền hệ thống & thống kê</div>
                      </div>
                      @if (currentUser().role === 'admin') {
                        <span class="badge bg-gold text-dark fw-bold ms-2">Đang chọn</span>
                      }
                    </button>
                  </li>
                  <li>
                    <button
                      class="dropdown-item role-item d-flex align-items-center justify-content-between p-2 rounded-2 mb-1"
                      [class.active-role]="currentUser().role === 'editor'"
                      (click)="onSwitchRole('editor')"
                    >
                      <div class="text-start">
                        <div class="fw-bold text-white">Biên Tập Viên (Editor)</div>
                        <div class="role-desc">Biên tập kịch, nghệ sĩ, tin tức</div>
                      </div>
                      @if (currentUser().role === 'editor') {
                        <span class="badge bg-gold text-dark fw-bold ms-2">Đang chọn</span>
                      }
                    </button>
                  </li>
                  <li>
                    <button
                      class="dropdown-item role-item d-flex align-items-center justify-content-between p-2 rounded-2"
                      [class.active-role]="currentUser().role === 'staff' || currentUser().role === 'ticket_checker'"
                      (click)="onSwitchRole('staff')"
                    >
                      <div class="text-start">
                        <div class="fw-bold text-white">Nhân Viên Soát Vé (Staff)</div>
                        <div class="role-desc">Quét mã QR & kiểm soát cửa rạp</div>
                      </div>
                      @if (currentUser().role === 'staff' || currentUser().role === 'ticket_checker') {
                        <span class="badge bg-gold text-dark fw-bold ms-2">Đang chọn</span>
                      }
                    </button>
                  </li>
                </ul>
              </div>

              <!-- Logout Button -->
              <button type="button" class="staff-logout-btn" (click)="onLogout()">
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  `,
  styles: [`
    .staff-header {
      background: rgba(7, 10, 18, 0.96);
      border-bottom: 1.5px solid rgba(245, 158, 11, 0.35);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow: 0 4px 25px rgba(0, 0, 0, 0.8), 0 1px 0 rgba(245, 158, 11, 0.2);
      z-index: 1040;
    }
    .showman-emblem-box {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(190, 18, 60, 0.2));
      border: 1px solid rgba(245, 158, 11, 0.5);
      font-size: 1.25rem;
    }
    .shadow-gold {
      box-shadow: 0 0 15px rgba(245, 158, 11, 0.25);
    }
    .staff-brand-title {
      font-size: 1.05rem;
      letter-spacing: 0.8px;
      line-height: 1.2;
    }
    .staff-portal-badge {
      font-size: 0.65rem;
      letter-spacing: 1.2px;
      font-weight: 700;
      opacity: 0.85;
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
      min-height: 40px;
      color: #CBD5E1;
      text-decoration: none;
      font-size: 0.92rem;
      font-weight: 600;
      letter-spacing: 0.3px;
      transition: all 0.2s ease;
      padding: 0.3rem 0.85rem;
      border-radius: 8px;
    }
    .staff-nav-link::after {
      position: absolute;
      right: 0.85rem;
      bottom: 2px;
      left: 0.85rem;
      height: 2px;
      background: linear-gradient(90deg, #BE123C, #F59E0B);
      content: '';
      transform: scaleX(0);
      transform-origin: center;
      transition: transform 0.2s ease;
      border-radius: 2px;
    }
    .staff-nav-link:hover {
      color: #FDE68A;
      background: rgba(245, 158, 11, 0.08);
    }
    .staff-nav-link.active {
      color: #FDE68A;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.35);
      box-shadow: 0 0 12px rgba(245, 158, 11, 0.2);
    }
    .staff-nav-link:hover::after,
    .staff-nav-link.active::after {
      transform: scaleX(1);
    }
    .staff-user-box {
      padding: 0.3rem 0.8rem;
      background: rgba(14, 22, 41, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      line-height: 1.3;
    }
    .staff-user-name {
      font-size: 0.88rem;
    }
    .staff-user-role-badge .badge {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
    }
    .badge-admin {
      background: rgba(245, 158, 11, 0.2);
      color: #FDE68A;
      border: 1px solid rgba(245, 158, 11, 0.4);
    }
    .badge-editor {
      background: rgba(6, 182, 212, 0.2);
      color: #67E8F9;
      border: 1px solid rgba(6, 182, 212, 0.4);
    }
    .badge-staff {
      background: rgba(34, 197, 94, 0.2);
      color: #86EFAC;
      border: 1px solid rgba(34, 197, 94, 0.4);
    }
    .staff-action-btn,
    .staff-logout-btn {
      min-height: 38px;
      padding: 0.45rem 0.95rem;
      border-radius: 0.6rem;
      font-size: 0.88rem;
      font-weight: 600;
      white-space: nowrap;
      transition: all 0.2s ease;
    }
    .staff-action-btn {
      border: 1.5px solid rgba(245, 158, 11, 0.4);
      background: rgba(245, 158, 11, 0.1);
      color: #FDE68A;
    }
    .staff-action-btn:hover {
      border-color: rgba(245, 158, 11, 0.8);
      background: rgba(245, 158, 11, 0.2);
      color: #FFFFFF;
      box-shadow: 0 0 15px rgba(245, 158, 11, 0.25);
    }
    .staff-logout-btn {
      border: 1px solid rgba(203, 213, 225, 0.25);
      background: rgba(14, 22, 41, 0.6);
      color: #CBD5E1;
    }
    .staff-logout-btn:hover {
      border-color: rgba(244, 63, 94, 0.6);
      background: rgba(244, 63, 94, 0.15);
      color: #FDA4AF;
      box-shadow: 0 0 12px rgba(244, 63, 94, 0.2);
    }
    .staff-dropdown {
      min-width: 270px;
      margin-top: 0.6rem !important;
      border: 1px solid rgba(245, 158, 11, 0.35);
      border-radius: 0.75rem;
      background: rgba(14, 22, 41, 0.98);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(20px);
    }
    .role-item {
      background: transparent;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .role-item:hover {
      background: rgba(245, 158, 11, 0.12);
    }
    .role-item.active-role {
      background: rgba(245, 158, 11, 0.18);
      border: 1px solid rgba(245, 158, 11, 0.4);
    }
    .role-desc {
      font-size: 0.75rem;
      color: #94A3B8;
      line-height: 1.2;
    }
    .border-gold-glow {
      border-color: rgba(245, 158, 11, 0.25) !important;
    }
    .bg-gold {
      background-color: #F59E0B !important;
    }
    .text-gold-spark {
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
        gap: 0.35rem;
        padding: 0.75rem 0;
      }
      .staff-nav-link {
        min-height: 42px;
        padding: 0.4rem 0.75rem;
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

  cleanFullName = computed(() => {
    const name = this.currentUser()?.fullName || '';
    return name.replace(/\s*\(.*?\)/g, '').trim();
  });

  onSwitchRole(role: 'admin' | 'editor' | 'staff'): void {
    this.musicalService.setRole(role);
    if (role === 'editor') {
      this.router.navigate(['/admin', 'musicals']);
    } else if (role === 'staff') {
      this.router.navigate(['/ops', 'check-in']);
    } else if (role === 'admin') {
      this.router.navigate(['/admin', 'dashboard']);
    }
  }

  onLogout(): void {
    this.musicalService.logout();
    this.router.navigate(['/internal']);
  }
}
