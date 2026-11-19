import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="showman-footer position-relative pt-5 pb-4 mt-5">
      <div class="footer-ambient-glow"></div>

      <div class="container-fluid px-4 px-md-5 px-xl-5 position-relative z-2">
        <div class="row g-4 g-xl-5 justify-content-between mb-4">
          <!-- Cột 1: Giới thiệu nhà hát -->
          <div class="col-xl-4 col-lg-4 col-md-12 pe-lg-5 pe-xl-5 mb-4 mb-lg-0">
            <div class="d-flex align-items-center gap-3 mb-3">
              <div class="footer-emblem-box d-flex align-items-center justify-content-center">
                <img src="images/logo/logoNKTP.jpg" alt="Logo Nhạc kịch Thành phố" class="brand-logo" />
              </div>
              <h5 class="text-gold-gradient mb-0 fw-bold fs-4">NHẠC KỊCH THÀNH PHỐ</h5>
            </div>
            <p class="footer-desc mb-4">
              Khởi nguồn từ ý tưởng của Nhóm sinh viên Trường Đại học Kinh tế – Luật (ĐHQG-HCM) mong muốn mang đến trải nghiệm thưởng thức nhạc kịch trọn vẹn cho quý khán giả. Cùng với khát vọng lan tỏa và phát triển những giá trị tốt đẹp, những cống hiến tận tâm của các Nghệ sĩ đến cộng đồng yêu thích nhạc kịch và sân khấu...
            </p>
            <div class="d-flex gap-3 fs-5 mt-2">
              <a href="#" class="showman-social-btn" aria-label="Facebook"><i class="bi bi-facebook"></i></a>
              <a href="#" class="showman-social-btn" aria-label="Youtube"><i class="bi bi-youtube"></i></a>
              <a href="#" class="showman-social-btn" aria-label="Tiktok"><i class="bi bi-tiktok"></i></a>
              <a href="#" class="showman-social-btn" aria-label="Instagram"><i class="bi bi-instagram"></i></a>
            </div>
          </div>

          <!-- Cột 2: Điều hướng theo Sitemap Chuẩn Hóa -->
          <div class="col-xl-2 col-lg-2 col-md-4 col-sm-6">
            <h5 class="footer-heading text-gold-gradient">KHÁM PHÁ</h5>
            <ul class="list-unstyled d-flex flex-column gap-3 mb-0">
              <li><a routerLink="/musicals" class="text-decoration-none footer-link">Danh mục vở diễn</a></li>
              <li><a routerLink="/schedules" class="text-decoration-none footer-link">Lịch diễn nhà hát</a></li>
              <li><a routerLink="/artists" class="text-decoration-none footer-link">Gương mặt nghệ sĩ</a></li>
              <li><a routerLink="/news" class="text-decoration-none footer-link">Tin tức & Sự kiện</a></li>
              <li><a routerLink="/about" class="text-decoration-none footer-link">Về chúng tôi</a></li>
            </ul>
          </div>

          <!-- Cột 3: Điều khoản & Chính sách -->
          <div class="col-xl-3 col-lg-3 col-md-4 col-sm-6">
            <h5 class="footer-heading text-gold-gradient">ĐIỀU KHOẢN & CHÍNH SÁCH</h5>
            <ul class="list-unstyled d-flex flex-column gap-3 mb-0">
              <li><a routerLink="/policy" [queryParams]="{ tab: 'terms' }" class="text-decoration-none footer-link">1. Điều khoản và nội quy</a></li>
              <li><a routerLink="/policy" [queryParams]="{ tab: 'pricing' }" class="text-decoration-none footer-link">2. Chính sách giá dịch vụ</a></li>
              <li><a routerLink="/policy" [queryParams]="{ tab: 'payment' }" class="text-decoration-none footer-link">3. Chính sách thanh toán</a></li>
              <li><a routerLink="/policy" [queryParams]="{ tab: 'tickets' }" class="text-decoration-none footer-link">4. Chính sách hoàn huỷ vé</a></li>
              <li><a routerLink="/policy" [queryParams]="{ tab: 'privacy' }" class="text-decoration-none footer-link">5. Chính sách bảo mật</a></li>
            </ul>
          </div>

          <!-- Cột 4: Thông tin liên hệ -->
          <div class="col-xl-3 col-lg-3 col-md-4 col-sm-12">
            <h5 class="footer-heading text-gold-gradient">THÔNG TIN LIÊN HỆ</h5>
            <div class="d-flex flex-column gap-3 mb-3">
              <p class="mb-0 footer-contact-item">
                <i class="bi bi-geo-alt-fill text-gold me-2 fs-5"></i> Số 669 Đỗ Mười, khu phố 3, phường Linh Xuân, TP.HCM
              </p>
              <p class="mb-0 footer-contact-item">
                <i class="bi bi-telephone-fill text-gold me-2 fs-5"></i> Hotline: <strong class="text-white fs-5 fw-bold">09091010</strong>
              </p>
              <p class="mb-0 footer-contact-item">
                <i class="bi bi-envelope-fill text-gold me-2 fs-5"></i> E-mail: <span class="text-white">nhackichthanhpho&#64;gmail.com</span>
              </p>
            </div>

            <!-- Logo Bộ Công Thương -->
            <div class="mt-3 pt-2">
              <a href="http://online.gov.vn" target="_blank" rel="noopener noreferrer" class="d-inline-block bct-badge" title="Đã thông báo Bộ Công Thương">
                <img src="images/logo/bo-cong-thuong-logo.png" alt="Đã thông báo Bộ Công Thương" class="bct-logo" />
              </a>
            </div>
          </div>
        </div>

        <hr class="border-light opacity-25 my-4">

        <div class="text-center text-white small opacity-85 pt-1">
          <span class="fs-6">&copy; 2026 Nhạc kịch Thành phố. All rights reserved.</span>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .showman-footer {
      background: linear-gradient(180deg, #5C0C1E 0%, #420815 35%, #2B050E 70%, #180308 100%);
      border-top: 2px solid rgba(245, 158, 11, 0.65) !important;
      box-shadow: 0 -12px 45px rgba(225, 29, 72, 0.35);
    }
    .footer-ambient-glow {
      position: absolute;
      top: -50px;
      left: 50%;
      transform: translateX(-50%);
      width: 900px;
      height: 160px;
      background: radial-gradient(ellipse, rgba(244, 63, 94, 0.5) 0%, rgba(190, 18, 60, 0.35) 45%, rgba(245, 158, 11, 0.2) 70%, transparent 90%);
      pointer-events: none;
      filter: blur(40px);
    }
    .footer-emblem-box {
      width: 48px;
      height: 48px;
      min-width: 48px;
      border-radius: 12px;
      background: radial-gradient(circle, rgba(190, 18, 60, 0.45) 0%, rgba(7, 10, 18, 0.95) 100%);
      border: 1.5px solid rgba(245, 158, 11, 0.6);
      box-shadow: 0 0 14px rgba(245, 158, 11, 0.35);
      overflow: hidden;
    }
    .brand-logo {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .footer-heading {
      background: linear-gradient(135deg, #FFFFFF 0%, #FDE68A 35%, #F59E0B 75%, #D97706 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: inline-block;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 1.35rem;
      letter-spacing: 1.2px;
      margin-bottom: 1.35rem;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7));
    }
    .footer-desc {
      color: #FFFFFF !important;
      line-height: 1.75;
      font-size: 0.95rem;
      text-align: justify;
      text-justify: inter-word;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    }
    .footer-link {
      color: #FFFFFF !important;
      opacity: 0.92;
      font-size: 0.95rem;
      transition: all 0.25s ease;
      display: inline-block;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }
    .footer-link:hover {
      color: #FDE68A !important;
      opacity: 1;
      text-shadow: 0 0 12px rgba(245, 158, 11, 0.85);
      transform: translateX(4px);
    }
    .footer-contact-item {
      font-size: 0.95rem;
      line-height: 1.7;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }
    .showman-social-btn {
      width: 42px;
      height: 42px;
      font-size: 1.2rem;
      border-radius: 10px;
      background: rgba(0, 0, 0, 0.4);
      border: 1.5px solid rgba(245, 158, 11, 0.55);
      color: #FFFFFF;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.25s ease;
      text-decoration: none;
    }
    .showman-social-btn:hover {
      background: linear-gradient(135deg, #BE123C 0%, #F59E0B 100%);
      color: #FFFFFF;
      border-color: #F59E0B;
      box-shadow: 0 0 16px rgba(245, 158, 11, 0.8);
      transform: translateY(-3px);
    }
    .bct-badge {
      display: inline-block;
      transition: all 0.25s ease;
    }
    .bct-logo {
      height: 48px;
      max-width: 155px;
      width: auto;
      object-fit: contain;
      filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.45));
      transition: all 0.25s ease;
    }
    .bct-badge:hover .bct-logo {
      transform: translateY(-2px);
      filter: drop-shadow(0 4px 12px rgba(245, 158, 11, 0.5));
    }
    .tracking-wider {
      letter-spacing: 1.5px;
    }
  `]
})
export class FooterComponent {}
