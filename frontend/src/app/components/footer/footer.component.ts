import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="showman-footer position-relative pt-4 pb-3 mt-4 border-top border-gold-glow">
      <div class="footer-ambient-glow"></div>

      <div class="container position-relative z-2">
        <div class="row g-4 mb-4">
          <!-- Cột 1: Giới thiệu nhà hát -->
          <div class="col-lg-4 col-md-6">
            <div class="d-flex align-items-center gap-2 mb-3">
              <span class="fs-2 text-gold-glow">🎭</span>
              <h5 class="text-gold-gradient mb-0 fw-bold fs-5">NHẠC KỊCH THÀNH PHỐ</h5>
            </div>
            <p class="text-secondary small leading-relaxed">
              Nhà hát Nhạc kịch Thành phố Hồ Chí Minh là thánh đường biểu diễn nghệ thuật đỉnh cao,
              tái hiện không gian tráng lệ, kỳ ảo của Broadway và những vở diễn huyền thoại lay động triệu con tim.
            </p>
            <div class="d-flex gap-3 fs-5 mt-3">
              <a href="#" class="showman-social-btn" aria-label="Facebook"><i class="bi bi-facebook"></i></a>
              <a href="#" class="showman-social-btn" aria-label="Youtube"><i class="bi bi-youtube"></i></a>
              <a href="#" class="showman-social-btn" aria-label="Tiktok"><i class="bi bi-tiktok"></i></a>
              <a href="#" class="showman-social-btn" aria-label="Instagram"><i class="bi bi-instagram"></i></a>
            </div>
          </div>

          <!-- Cột 2: Điều hướng theo Sitemap Chuẩn Hóa -->
          <div class="col-lg-2 col-md-6">
            <h6 class="text-gold fw-bold text-uppercase mb-3 tracking-wider">KHÁM PHÁ</h6>
            <ul class="list-unstyled text-secondary small d-flex flex-column gap-2 mb-0">
              <li><a routerLink="/musicals" class="text-decoration-none footer-link">Danh mục vở diễn</a></li>
              <li><a routerLink="/schedules" class="text-decoration-none footer-link">Lịch diễn nhà hát</a></li>
              <li><a routerLink="/artists" class="text-decoration-none footer-link">Gương mặt nghệ sĩ</a></li>
              <li><a routerLink="/news" class="text-decoration-none footer-link">Tin tức & Sự kiện</a></li>
              <li><a routerLink="/about" class="text-decoration-none footer-link">Về chúng tôi</a></li>
            </ul>
          </div>

          <!-- Cột 3: Điều khoản & Chính sách (Theo đúng yêu cầu nghiệp vụ) -->
          <div class="col-lg-3 col-md-6">
            <h6 class="text-gold fw-bold text-uppercase mb-3 tracking-wider">ĐIỀU KHOẢN & CHÍNH SÁCH</h6>
            <ul class="list-unstyled text-secondary small d-flex flex-column gap-2 mb-0">
              <li><a routerLink="/policy" [queryParams]="{ tab: 'privacy' }" class="text-decoration-none footer-link">1. Chính sách bảo mật</a></li>
              <li><a routerLink="/policy" [queryParams]="{ tab: 'pricing' }" class="text-decoration-none footer-link">2. Chính sách giá dịch vụ</a></li>
              <li><a routerLink="/policy" [queryParams]="{ tab: 'payment' }" class="text-decoration-none footer-link">3. Chính sách thanh toán</a></li>
              <li><a routerLink="/policy" [queryParams]="{ tab: 'terms' }" class="text-decoration-none footer-link">4. Điều khoản & Quy định sử dụng</a></li>
              <li><a routerLink="/policy" [queryParams]="{ tab: 'refund' }" class="text-decoration-none footer-link">5. Chính sách đổi/hủy vé & hoàn tiền</a></li>
            </ul>
          </div>

          <!-- Cột 4: Thông tin phòng vé & Hotline -->
          <div class="col-lg-3 col-md-6">
            <h6 class="text-gold fw-bold text-uppercase mb-3 tracking-wider">PHÒNG VÉ & HOTLINE</h6>
            <div class="text-secondary small d-flex flex-column gap-2">
              <p class="mb-1"><i class="bi bi-geo-alt-fill text-ruby-glow me-2"></i> Số 07 Công Trường Lam Sơn, Bến Nghé, Quận 1, TP.HCM</p>
              <p class="mb-1"><i class="bi bi-telephone-fill text-gold me-2"></i> Hotline: <strong class="text-white">1900 8888 - (028) 3829 9999</strong></p>
              <p class="mb-1"><i class="bi bi-envelope-fill text-gold me-2"></i> ve&#64;nhackichthanhpho.vn</p>
              <p class="mb-1"><i class="bi bi-clock-fill text-ruby-glow me-2"></i> Mở cửa phòng vé: 08:30 - 21:30 hàng ngày</p>
            </div>
          </div>
        </div>

        <hr class="border-secondary opacity-25 my-4">

        <div class="d-flex flex-column flex-md-row justify-content-between align-items-center text-muted small pt-2">
          <span>&copy; 2026 Nhạc Kịch Thành Phố (City Musical). All rights reserved.</span>
          <span class="mt-2 mt-md-0 text-gold-glow">
            <i class="bi bi-stars me-1"></i> "The Greatest Show on Earth" Theatrical Experience.
          </span>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .showman-footer {
      background: linear-gradient(180deg, #070A12 0%, #04060B 100%);
      border-top: 1.5px solid rgba(245, 158, 11, 0.28) !important;
    }
    .footer-ambient-glow {
      position: absolute;
      top: -50px;
      left: 50%;
      transform: translateX(-50%);
      width: 600px;
      height: 100px;
      background: radial-gradient(ellipse, rgba(190, 18, 60, 0.25) 0%, rgba(245, 158, 11, 0.12) 50%, transparent 80%);
      pointer-events: none;
      filter: blur(30px);
    }
    .footer-link {
      color: #94A3B8;
      transition: all 0.25s ease;
    }
    .footer-link:hover {
      color: #FDE68A;
      text-shadow: 0 0 10px rgba(245, 158, 11, 0.6);
      padding-left: 5px;
    }
    .showman-social-btn {
      width: 32px;
      height: 32px;
      font-size: 0.9rem;
      border-radius: 50%;
      background: rgba(14, 22, 41, 0.85);
      border: 1px solid rgba(245, 158, 11, 0.35);
      color: #FDE68A;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.25s ease;
      text-decoration: none;
    }
    .showman-social-btn:hover {
      background: linear-gradient(135deg, #BE123C 0%, #F59E0B 100%);
      color: #FFFFFF;
      box-shadow: 0 0 16px rgba(245, 158, 11, 0.7);
      transform: translateY(-3px);
    }
    .tracking-wider {
      letter-spacing: 1.5px;
    }
  `]
})
export class FooterComponent {}
