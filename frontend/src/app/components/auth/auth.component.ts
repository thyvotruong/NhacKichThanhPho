/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/auth/auth.component.ts
 * Chức năng: Quản lý Đăng Nhập, Đăng Ký & Quên Mật Khẩu theo chuẩn BPMN 2.2.2:
 * - 2.2.2.1 Đăng nhập (Google, SĐT OTP, Email) kèm kiểm tra tồn tại
 * - 2.2.2.2 Đăng ký (Google, SĐT, Email) kèm xác thực thông tin
 * - Quên mật khẩu & cấp mã xác thực OTP
 * - Hỗ trợ returnUrl để chuyển tiếp mượt mà sang Đặt vé hoặc Profile
 * ============================================================
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MusicalService } from '../../services/musical.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly musicalService = inject(MusicalService);

  // Tab hiện tại: 'login' | 'register' | 'forgot'
  activeTab = signal<'login' | 'register' | 'forgot'>('login');

  // Phương thức xác thực: 'email' | 'phone' | 'google'
  loginMethod = signal<'email' | 'phone' | 'google'>('email');
  registerMethod = signal<'email' | 'phone' | 'google'>('email');

  // Trạng thái gửi mã OTP (cho phương thức Phone hoặc Forgot Password)
  otpSent = signal<boolean>(false);
  otpCountdown = signal<number>(60);
  otpTimer: any = null;

  // URL quay lại sau khi đăng nhập thành công
  returnUrl = signal<string>('/account/profile');

  // Thông báo lỗi hoặc thành công
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);

  // Form Groups
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  forgotForm!: FormGroup;

  ngOnInit(): void {
    // Nếu người dùng đã đăng nhập, tự động chuyển về Profile hoặc returnUrl
    if (this.musicalService.isLoggedIn()) {
      const ret = this.route.snapshot.queryParamMap.get('returnUrl') || '/account/profile';
      this.router.navigateByUrl(ret);
      return;
    }

    // Đọc mode từ route data hoặc URL path
    const routeMode = this.route.snapshot.data['mode'];
    if (routeMode === 'register') {
      this.activeTab.set('register');
    } else if (routeMode === 'forgot') {
      this.activeTab.set('forgot');
    }

    // Đọc queryParams (ví dụ ?returnUrl=/account/profile&tab=register)
    this.route.queryParamMap.subscribe(params => {
      const ret = params.get('returnUrl');
      if (ret) this.returnUrl.set(ret);

      const tab = params.get('tab');
      if (tab === 'register') this.activeTab.set('register');
      else if (tab === 'forgot') this.activeTab.set('forgot');
      else if (tab === 'login') this.activeTab.set('login');
    });

    this.initForms();
  }

  private initForms(): void {
    // Form Đăng nhập
    this.loginForm = this.fb.group({
      email: ['khachhang@gmail.com', [Validators.required, Validators.email]],
      phone: ['0909123456', [Validators.required, Validators.pattern(/^(0[3|5|7|8|9])[0-9]{8}$/)]],
      password: ['123456', [Validators.required, Validators.minLength(6)]],
      otp: ['123456']
    });

    // Form Đăng ký
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^(0[3|5|7|8|9])[0-9]{8}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      agreeTerms: [true, [Validators.requiredTrue]]
    });

    // Form Quên mật khẩu
    this.forgotForm = this.fb.group({
      identifier: ['', [Validators.required]]
    });
  }

  switchTab(tab: 'login' | 'register' | 'forgot'): void {
    this.activeTab.set(tab);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  setLoginMethod(m: 'email' | 'phone' | 'google'): void {
    this.loginMethod.set(m);
    this.errorMessage.set(null);
  }

  setRegisterMethod(m: 'email' | 'phone' | 'google'): void {
    this.registerMethod.set(m);
    this.errorMessage.set(null);
  }

  sendOtp(): void {
    const phone = this.loginForm.get('phone')?.value;
    if (!phone || !/^(0[3|5|7|8|9])[0-9]{8}$/.test(phone)) {
      this.errorMessage.set('Vui lòng nhập đúng định dạng số điện thoại 10 chữ số');
      return;
    }

    this.otpSent.set(true);
    this.otpCountdown.set(60);
    this.errorMessage.set(null);
    this.successMessage.set(`Mã OTP đã được gửi về số ${phone}. (Mã thử nghiệm: 123456)`);

    if (this.otpTimer) clearInterval(this.otpTimer);
    this.otpTimer = setInterval(() => {
      const c = this.otpCountdown() - 1;
      this.otpCountdown.set(c);
      if (c <= 0) clearInterval(this.otpTimer);
    }, 1000);
  }

  // --- 2.2.2.1: THỰC HIỆN ĐĂNG NHẬP ---
  onLoginSubmit(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const m = this.loginMethod();
    let identifier = '';
    const formVal = this.loginForm.value;

    if (m === 'email') {
      if (this.loginForm.get('email')?.invalid || this.loginForm.get('password')?.invalid) {
        this.errorMessage.set('Vui lòng điền đúng Email và Mật khẩu (tối thiểu 6 ký tự)');
        return;
      }
      identifier = formVal.email;
    } else if (m === 'phone') {
      if (this.loginForm.get('phone')?.invalid) {
        this.errorMessage.set('Vui lòng nhập đúng số điện thoại (10 số)');
        return;
      }
      identifier = formVal.phone;
    } else if (m === 'google') {
      identifier = 'khachhang.google@gmail.com';
    }

    this.isSubmitting.set(true);

    this.musicalService.login({
      method: m,
      identifier,
      password: formVal.password,
      otp: formVal.otp
    }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.successMessage.set('🎉 Đăng nhập thành công! Đang chuyển hướng...');
        setTimeout(() => {
          this.router.navigateByUrl(this.returnUrl());
        }, 800);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        // Bước 7 BPMN 2.2.2.1: Tài khoản chưa tồn tại
        if (err.notFound) {
          this.errorMessage.set(err.message);
          // Hỗ trợ chuyển sang đăng ký với thông tin đã nhập
          if (m === 'email') this.registerForm.patchValue({ email: identifier });
          if (m === 'phone') this.registerForm.patchValue({ phone: identifier });
        } else {
          this.errorMessage.set(err.message || 'Đăng nhập không thành công, vui lòng thử lại');
        }
      }
    });
  }

  // Đăng nhập nhanh Google One-Tap Simulation
  loginWithGoogle(): void {
    this.loginMethod.set('google');
    this.isSubmitting.set(true);
    setTimeout(() => {
      this.musicalService.login({
        method: 'google',
        identifier: 'khachhang.google@gmail.com'
      }).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.successMessage.set('🎉 Đăng nhập Google thành công! Đang chuyển hướng...');
          setTimeout(() => this.router.navigateByUrl(this.returnUrl()), 800);
        },
        error: () => this.isSubmitting.set(false)
      });
    }, 600);
  }

  // --- 2.2.2.2: THỰC HIỆN ĐĂNG KÝ ---
  onRegisterSubmit(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const val = this.registerForm.value;

    // Kiểm tra hợp lệ các trường bắt buộc
    if (!val.fullName || val.fullName.length < 2) {
      this.errorMessage.set('Vui lòng nhập Họ và tên hợp lệ (tối thiểu 2 ký tự)');
      return;
    }
    if (this.registerForm.get('email')?.invalid) {
      this.errorMessage.set('Vui lòng nhập đúng định dạng Email');
      return;
    }
    if (this.registerForm.get('phone')?.invalid) {
      this.errorMessage.set('Số điện thoại không hợp lệ (yêu cầu 10 chữ số)');
      return;
    }
    if (this.registerForm.get('password')?.invalid) {
      this.errorMessage.set('Mật khẩu tối thiểu 6 ký tự');
      return;
    }
    if (val.password !== val.confirmPassword) {
      this.errorMessage.set('Mật khẩu xác nhận không khớp');
      return;
    }
    if (!val.agreeTerms) {
      this.errorMessage.set('Vui lòng tích đồng ý với Điều khoản & Quy định nhà hát');
      return;
    }

    this.isSubmitting.set(true);

    this.musicalService.register({
      method: this.registerMethod(),
      fullName: val.fullName,
      email: val.email,
      phone: val.phone,
      password: val.password
    }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.successMessage.set('🎉 Đăng ký thành công! Hệ thống đã tạo phiên làm việc.');
        setTimeout(() => {
          this.router.navigateByUrl(this.returnUrl());
        }, 1000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        // Bước 7 BPMN 2.2.2.2: Tài khoản đã tồn tại
        if (err.alreadyExists) {
          this.errorMessage.set(err.message);
        } else {
          this.errorMessage.set(err.message || 'Lỗi khi đăng ký tài khoản');
        }
      }
    });
  }

  registerWithGoogle(): void {
    this.registerMethod.set('google');
    this.isSubmitting.set(true);
    setTimeout(() => {
      this.musicalService.register({
        method: 'google',
        fullName: 'Khách Hàng Google',
        email: 'khachhang.google@gmail.com',
        phone: '0909888777'
      }).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.successMessage.set('🎉 Liên kết tài khoản Google thành công!');
          setTimeout(() => this.router.navigateByUrl(this.returnUrl()), 800);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          if (err.alreadyExists) {
            this.errorMessage.set('Tài khoản Google này đã tồn tại! Vui lòng chuyển sang Đăng nhập.');
            this.switchTab('login');
          } else {
            this.errorMessage.set(err.message || 'Lỗi liên kết Google');
          }
        }
      });
    }, 600);
  }

  // --- QUÊN MẬT KHẨU ---
  onForgotSubmit(): void {
    const id = this.forgotForm.get('identifier')?.value;
    if (!id || id.trim().length < 5) {
      this.errorMessage.set('Vui lòng nhập Email hoặc Số điện thoại đã đăng ký');
      return;
    }

    this.isSubmitting.set(true);
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.successMessage.set(`Đã gửi hướng dẫn khôi phục mật khẩu và mã OTP đến: ${id}. Vui lòng kiểm tra hộp thư hoặc tin nhắn SMS.`);
    }, 800);
  }
}
