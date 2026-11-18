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
              <img src="images/logo/logoNKTP.jpg" alt="Logo Nhạc kịch Thành phố" class="brand-logo" />
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
    .staff-header .navbar {
      padding-top: 0.7rem !important;
      padding-bottom: 0.7rem !important;
    }
    .staff-header {
      background: rgba(7, 10, 18, 0.96);
      border-bottom: 1.5px solid rgba(245, 158, 11, 0.35);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow: 0 4px 25px rgba(0, 0, 0, 0.8), 0 1px 0 rgba(245, 158, 11, 0.2);
      z-index: 1040;
    }
    .showman-emblem-box {
      width: 46px;
      height: 46px;
      border-radius: 10px;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(190, 18, 60, 0.2));
      border: 1px solid rgba(245, 158, 11, 0.5);
      overflow: hidden;
    }
    .brand-logo {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .shadow-gold {
      box-shadow: 0 0 15px rgba(245, 158, 11, 0.25);
    }
    .staff-brand-title {
      font-size: 1.18rem;
      letter-spacing: 0.8px;
      line-height: 1.45;
      padding: 0.08em 0 0.04em;
    }
    .staff-portal-badge {
      font-size: 0.7rem;
      letter-spacing: 1.2px;
      font-weight: 700;
      opacity: 0.85;
    }
    .staff-nav {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    .staff-nav-link {
      position: relative;
      display: inline-flex;
      align-items: center;
      min-height: 40px;
      color: #CBD5E1;
      text-decoration: none;
      font-size: 0.98rem;
      font-weight: 700;
      letter-spacing: 0.3px;
      transition: all 0.25s ease;
      padding: 0.35rem 0.35rem;
      background: transparent;
      border: none;
      border-radius: 0;
      cursor: pointer;
    }
    .staff-nav-link::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      width: 0%;
      height: 2px;
      background: linear-gradient(90deg, #BE123C, #F59E0B);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      transform: translateX(-50%);
      box-shadow: 0 0 8px #F59E0B;
      border-radius: 2px;
    }
    .staff-nav-link:hover,
    .staff-nav-link.active {
      color: #FDE68A !important;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      text-shadow: 0 0 10px rgba(245, 158, 11, 0.6);
    }
    .staff-nav-link:hover::after,
    .staff-nav-link.active::after {
      width: 100%;
    }
    .staff-user-box {
      padding: 0.3rem 0.8rem;
      background: rgba(14, 22, 41, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      line-height: 1.3;
    }
    .staff-user-name {
      font-size: 0.92rem;
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
    .staff-logout-btn {
      min-height: 38px;
      padding: 0.45rem 0.95rem;
      border-radius: 0.6rem;
      font-size: 0.92rem;
      font-weight: 600;
      white-space: nowrap;
      transition: all 0.2s ease;
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
        left: 0.75rem;
        transform: none;
      }
      .staff-nav-link:hover::after,
      .staff-nav-link.active::after {
        width: 3.5rem;
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

  onLogout(): void {
    this.musicalService.logout();
    this.router.navigate(['/internal']);
  }
}
