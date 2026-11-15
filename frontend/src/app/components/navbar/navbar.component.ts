/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/navbar/navbar.component.ts
 * Chức năng: Thanh điều hướng chuẩn hóa theo Sitemap & Phân quyền BA:
 * - BỎ mục "Vé của tôi" khỏi menu chính.
 * - Mục "Vé của tôi" chuyển vào mục con trong Tài khoản cá nhân,
 *   chỉ hiển thị khi đã đăng nhập (Authenticated).
 * - Menu chính gồm 7 mục công khai:
 *   Trang chủ, Vở diễn, Lịch diễn, Nghệ sĩ, Tin tức, Về nhà hát, Hỗ trợ.
 * ============================================================
 */

import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MusicalService } from '../../services/musical.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="sticky-top showman-header shadow-lg">
      <nav class="navbar navbar-expand-xl py-2">
        <div class="container-fluid px-lg-4 px-xl-5">
          <!-- Logo thương hiệu phong cách The Greatest Showman -->
          <a class="navbar-brand d-flex align-items-center gap-3" routerLink="/">
            <div class="showman-emblem-box d-flex align-items-center justify-content-center">
              <span class="showman-icon">🎭</span>
            </div>
            <div class="d-flex flex-column">
              <span class="brand-name fw-bold text-gold-gradient">NHẠC KỊCH THÀNH PHỐ</span>
            </div>
          </a>

          <!-- Nút Mobile Toggler -->
          <button
            class="navbar-toggler border-gold"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#theaterNavbar"
            aria-controls="theaterNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span class="navbar-toggler-icon"></span>
          </button>

          <!-- Danh sách Menu Khách Hàng (Sitemap Chuẩn Hóa - Đã loại bỏ "Vé của tôi" khỏi menu chung) -->
          <div class="collapse navbar-collapse" id="theaterNavbar">
            <ul class="navbar-nav ms-auto align-items-xl-center gap-1 gap-xl-4">
              <!-- 1. TRANG CHỦ -->
              <li class="nav-item">
                <a
                  class="nav-link nav-link-showman text-uppercase fw-bold"
                  routerLink="/"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{ exact: true }"
                >
                  TRANG CHỦ
                </a>
              </li>

              <!-- 2. VỞ KỊCH -->
              <li class="nav-item">
                <a
                  class="nav-link nav-link-showman text-uppercase fw-bold"
                  routerLink="/musicals"
                  routerLinkActive="active"
                >
                  VỞ DIỄN
                </a>
              </li>

              <!-- 3. LỊCH DIỄN -->
              <li class="nav-item">
                <a
                  class="nav-link nav-link-showman text-uppercase fw-bold"
                  routerLink="/schedules"
                  routerLinkActive="active"
                >
                  LỊCH DIỄN
                </a>
              </li>

              <!-- 4. NGHỆ SĨ -->
              <li class="nav-item">
                <a
                  class="nav-link nav-link-showman text-uppercase fw-bold"
                  routerLink="/artists"
                  routerLinkActive="active"
                >
                  NGHỆ SĨ
                </a>
              </li>

              <!-- 5. TIN TỨC -->
              <li class="nav-item">
                <a
                  class="nav-link nav-link-showman text-uppercase fw-bold"
                  routerLink="/news"
                  routerLinkActive="active"
                >
                  TIN TỨC
                </a>
              </li>

              <!-- 6. VỀ CHÚNG TÔI -->
              <li class="nav-item">
                <a
                  class="nav-link nav-link-showman text-uppercase fw-bold"
                  [routerLink]="['/about']"
                  routerLinkActive="active"
                  (click)="onNavigate('/about')"
                >
                  VỀ CHÚNG TÔI
                </a>
              </li>

              <!-- 7. CHÍNH SÁCH -->
              <li class="nav-item">
                <a
                  class="nav-link nav-link-showman text-uppercase fw-bold"
                  [routerLink]="['/policy']"
                  routerLinkActive="active"
                  (click)="onNavigate('/policy')"
                >
                  CHÍNH SÁCH
                </a>
              </li>

              <!-- PHÂN QUYỀN HIỂN THỊ TÀI KHOẢN (AUTHENTICATION) -->
              @if (!musicalService.isLoggedIn()) {
                <!-- CHƯA ĐĂNG NHẬP: Hiển thị nút Đăng Nhập -->
                <li class="nav-item ms-xl-2">
                  <a
                    routerLink="/account/login"
                    class="btn btn-sm btn-outline-warning text-white rounded-pill px-3 py-2 fw-bold d-inline-flex align-items-center gap-1 border-gold-glow"
                  >
                    <i class="bi bi-person-fill text-gold"></i>
                    <span>ĐĂNG NHẬP</span>
                  </a>
                </li>
              } @else {
                <!-- ĐÃ ĐĂNG NHẬP: Hiển thị menu Tài khoản của tôi -->
                <li class="nav-item dropdown ms-xl-2">
                  <div class="d-flex align-items-center">
                    <a
                      class="nav-link nav-link-showman text-uppercase fw-bold d-inline-flex align-items-center gap-2"
                      routerLink="/account/profile"
                      [queryParams]="{ tab: 'profile' }"
                      routerLinkActive="active"
                    >
                      <div class="nav-user-circle">
                        <i class="bi bi-person-fill text-gold"></i>
                      </div>
                      <span class="text-white">TÀI KHOẢN CỦA TÔI</span>
                    </a>
                    <button
                      type="button"
                      class="btn nav-account-menu-toggle dropdown-toggle"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      aria-label="Mở menu tài khoản"
                    ></button>
                    <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end nav-account-dropdown border-gold-glow shadow-2xl p-2 animate-dropdown">
                      <!-- Header người dùng trong menu -->
                      <li class="nav-account-dropdown-header px-3 py-2 border-bottom border-secondary border-opacity-25 mb-1">
                        <div class="fw-bold text-white small">{{ musicalService.currentUser()?.fullName || 'Khách Hàng' }}</div>
                        <div class="text-secondary extra-small">{{ musicalService.currentUser()?.email || '' }}</div>
                      </li>

                      <!-- Hồ sơ cá nhân -->
                      <li>
                        <a class="dropdown-item py-2 rounded-2" routerLink="/account/profile" [queryParams]="{ tab: 'profile' }">
                          <i class="bi bi-person-badge text-gold me-2"></i>
                          <span>Hồ sơ cá nhân</span>
                        </a>
                      </li>

                      <!-- Vé của tôi -->
                      <li>
                        <a class="dropdown-item py-2 rounded-2" routerLink="/account/my-tickets">
                          <i class="bi bi-ticket-perforated-fill text-gold me-2"></i>
                          <span>Vé của tôi</span>
                        </a>
                      </li>

                      <!-- Đổi mật khẩu -->
                      <li>
                        <a class="dropdown-item py-2 rounded-2" routerLink="/account/profile" [queryParams]="{ tab: 'security' }">
                          <i class="bi bi-shield-lock text-gold me-2"></i>
                          <span>Đổi mật khẩu</span>
                        </a>
                      </li>

                      <li><hr class="dropdown-divider border-secondary border-opacity-25 my-1"></li>

                      <!-- Đăng xuất -->
                      <li>
                        <button class="dropdown-item py-2 rounded-2 text-danger" (click)="onLogout()">
                          <i class="bi bi-box-arrow-right me-2"></i>
                          <span>Đăng xuất</span>
                        </button>
                      </li>
                    </ul>
                  </div>
                </li>
              }
            </ul>
          </div>
        </div>
      </nav>
    </header>
  `,
  styles: [`
    .showman-header {
      background: rgba(7, 10, 18, 0.95);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      border-bottom: 1.5px solid rgba(245, 158, 11, 0.32);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8), 0 1px 0 rgba(245, 158, 11, 0.18);
    }
    .showman-emblem-box {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: radial-gradient(circle, rgba(190, 18, 60, 0.35) 0%, rgba(7, 10, 18, 0.95) 100%);
      border: 1.5px solid rgba(245, 158, 11, 0.5);
      box-shadow: 0 0 14px rgba(245, 158, 11, 0.3);
    }
    .showman-icon {
      font-size: 1.25rem;
      filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.75));
    }
    .brand-name {
      font-size: 1.02rem;
      letter-spacing: 0.8px;
      line-height: 1.2;
    }
    .brand-sub {
      font-size: 0.58rem;
      letter-spacing: 1.5px;
      font-weight: 700;
    }
    .nav-link-showman {
      color: #CBD5E1 !important;
      font-size: 0.775rem;
      letter-spacing: 0.5px;
      padding: 0.35rem 0.35rem !important;
      position: relative;
      transition: all 0.25s ease;
      cursor: pointer;
    }
    .nav-link-showman::after {
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
    }
    .nav-link-showman:hover,
    .nav-link-showman.active {
      color: #FDE68A !important;
      text-shadow: 0 0 10px rgba(245, 158, 11, 0.6);
    }
    .nav-link-showman:hover::after,
    .nav-link-showman.active::after {
      width: 100%;
    }
    .nav-user-circle {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(245, 158, 11, 0.2);
      border: 1px solid var(--showman-gold);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
    }
    .nav-account-menu-toggle {
      color: #CBD5E1;
      padding: 0.35rem 0.25rem;
      border: 0;
    }
    .nav-account-menu-toggle:hover,
    .nav-account-menu-toggle:focus-visible {
      color: #FDE68A;
    }
    .nav-account-menu-toggle:focus-visible {
      outline: 2px solid #F59E0B;
      outline-offset: 2px;
    }
    .tracking-wider {
      letter-spacing: 2px;
    }
    .navbar-toggler {
      background: rgba(245, 158, 11, 0.12);
      border-color: rgba(245, 158, 11, 0.45);
    }
    .navbar-toggler-icon {
      filter: invert(1);
    }
    .dropdown-menu-dark {
      background: rgba(14, 22, 41, 0.98);
      backdrop-filter: blur(16px);
      min-width: 260px;
    }
    .nav-account-dropdown {
      width: 19rem;
      max-width: calc(100vw - 1.5rem);
      margin-top: 0.5rem !important;
      border: 1px solid rgba(245, 158, 11, 0.4) !important;
      border-radius: 0.85rem;
      box-shadow: 0 14px 36px rgba(0, 0, 0, 0.55), 0 0 18px rgba(245, 158, 11, 0.08);
    }
    .nav-account-dropdown-header {
      padding-top: 0.75rem !important;
      padding-bottom: 0.75rem !important;
      overflow-wrap: anywhere;
    }
    .nav-account-dropdown .text-secondary {
      color: #CBD5E1 !important;
    }
    .dropdown-item {
      font-size: 0.82rem;
      font-weight: 600;
      color: #CBD5E1;
      transition: all 0.2s ease;
    }
    .nav-account-dropdown .dropdown-item {
      display: flex;
      align-items: center;
      min-height: 42px;
      padding-right: 0.75rem;
      padding-left: 0.75rem;
    }
    .nav-account-dropdown .dropdown-item i {
      width: 1rem;
      text-align: center;
    }
    .dropdown-item:hover, .dropdown-item.active {
      background: rgba(245, 158, 11, 0.15);
      color: var(--showman-gold);
    }
    .nav-account-dropdown .dropdown-item:focus-visible {
      outline: 2px solid #F59E0B;
      outline-offset: -2px;
    }
    .max-w-150 {
      max-width: 150px;
    }
    .extra-small {
      font-size: 0.72rem;
    }
    .animate-dropdown {
      animation: fadeInDropdown 0.2s ease-out;
    }
    @keyframes fadeInDropdown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class NavbarComponent {
  readonly musicalService = inject(MusicalService);
  private readonly router = inject(Router);

  onNavigate(path: string): void {
    this.router.navigateByUrl(path).catch(() => {
      window.location.href = path;
    });
  }

  onLogout(): void {
    this.musicalService.logout();
    this.router.navigate(['/account/login']);
  }
}
