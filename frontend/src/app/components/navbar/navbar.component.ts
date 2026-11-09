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
            <ul class="navbar-nav ms-auto align-items-xl-center gap-1 gap-xl-2">
              <!-- 1. TRANG CHỦ -->
              <li class="nav-item">
                <a
                  class="nav-link nav-link-showman text-uppercase fw-bold"
                  routerLink="/"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{ exact: true }"
                >
                  <i class="bi bi-stars text-gold me-1"></i> TRANG CHỦ
                </a>
              </li>

              <!-- 2. VỞ KỊCH -->
              <li class="nav-item">
                <a
                  class="nav-link nav-link-showman text-uppercase fw-bold"
                  routerLink="/musicals"
                  routerLinkActive="active"
                >
                  <i class="bi bi-film text-ruby-glow me-1"></i> VỞ DIỄN
                </a>
              </li>

              <!-- 3. LỊCH DIỄN -->
              <li class="nav-item">
                <a
                  class="nav-link nav-link-showman text-uppercase fw-bold"
                  routerLink="/schedules"
                  routerLinkActive="active"
                >
                  <i class="bi bi-calendar-event text-gold me-1"></i> LỊCH DIỄN
                </a>
              </li>

              <!-- 4. NGHỆ SĨ -->
              <li class="nav-item">
                <a
                  class="nav-link nav-link-showman text-uppercase fw-bold"
                  routerLink="/artists"
                  routerLinkActive="active"
                >
                  <i class="bi bi-person-heart text-ruby-glow me-1"></i> NGHỆ SĨ
                </a>
              </li>

              <!-- 5. TIN TỨC -->
              <li class="nav-item">
                <a
                  class="nav-link nav-link-showman text-uppercase fw-bold"
                  routerLink="/news"
                  routerLinkActive="active"
                >
                  <i class="bi bi-newspaper text-gold me-1"></i> TIN TỨC
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
                  <i class="bi bi-building text-ruby-glow me-1"></i> VỀ CHÚNG TÔI
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
                  <i class="bi bi-shield-check text-gold me-1"></i> CHÍNH SÁCH
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
                <!-- ĐÃ ĐĂNG NHẬP: Hiển thị menu Dropdown Tài Khoản Cá Nhân & [Mục con] Vé của tôi -->
                <li class="nav-item dropdown ms-xl-2">
                  <a
                    class="nav-link nav-link-showman dropdown-toggle text-uppercase fw-bold d-inline-flex align-items-center gap-2"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <div class="nav-user-circle">
                      <i class="bi bi-person-fill text-gold"></i>
                    </div>
                    <span class="text-white text-truncate max-w-150">{{ musicalService.currentUser()?.fullName || 'Khách Hàng' }}</span>
                  </a>
                  <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end border-gold-glow shadow-2xl p-2 animate-dropdown">
                    <!-- Header người dùng trong menu -->
                    <li class="px-3 py-2 border-bottom border-secondary border-opacity-25 mb-1">
                      <div class="fw-bold text-gold small">{{ musicalService.currentUser()?.fullName || 'Khách Hàng' }}</div>
                      <div class="text-secondary extra-small">{{ musicalService.currentUser()?.email || '' }}</div>
                      <span class="badge badge-showman-gold rounded-pill extra-small mt-1">SHOWMAN VIP</span>
                    </li>

                    <!-- 1. Thông tin tài khoản -->
                    <li>
                      <a class="dropdown-item py-2 rounded-2" routerLink="/account/profile" [queryParams]="{ tab: 'profile' }">
                        <i class="bi bi-person-badge text-gold me-2"></i>
                        <span>Thông tin tài khoản</span>
                      </a>
                    </li>

                    <!-- 2. [MỤC CON] VÉ CỦA TÔI (Chỉ xuất hiện khi đã đăng nhập) -->
                    <li>
                      <a class="dropdown-item py-2 rounded-2 d-flex justify-content-between align-items-center" routerLink="/account/my-tickets">
                        <div>
                          <i class="bi bi-ticket-perforated-fill text-gold me-2"></i>
                          <span class="fw-bold text-white">[Mục con] Vé của tôi</span>
                        </div>
                        <span class="badge bg-danger rounded-pill extra-small">Mới</span>
                      </a>
                    </li>

                    <!-- 3. Đổi mật khẩu -->
                    <li>
                      <a class="dropdown-item py-2 rounded-2" routerLink="/account/profile" [queryParams]="{ tab: 'security' }">
                        <i class="bi bi-shield-lock text-gold me-2"></i>
                        <span>Đổi mật khẩu</span>
                      </a>
                    </li>

                    <li><hr class="dropdown-divider border-secondary border-opacity-25 my-1"></li>

                    <!-- 4. Đăng xuất -->
                    <li>
                      <button class="dropdown-item py-2 rounded-2 text-danger" (click)="onLogout()">
                        <i class="bi bi-box-arrow-right me-2"></i>
                        <span>Đăng xuất</span>
                      </button>
                    </li>
                  </ul>
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
    .dropdown-item {
      font-size: 0.82rem;
      font-weight: 600;
      color: #CBD5E1;
      transition: all 0.2s ease;
    }
    .dropdown-item:hover, .dropdown-item.active {
      background: rgba(245, 158, 11, 0.15);
      color: var(--showman-gold);
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
