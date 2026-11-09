/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/checkout/checkout.component.ts
 * Chức năng: Đặt vé & Thanh toán theo BPMN 2.2.3:
 * - Bước 4: Kiểm tra đăng nhập
 * - Bước 6: Giữ ghế 10 phút đếm ngược
 * - Bước 8-9: Kiểm tra mã khuyến mãi Voucher
 * - Bước 10-11: Chọn cổng (VNPay, MoMo, VietQR, ZaloPay) & Hiển thị mã QR
 * - Bước 12-13: Kiểm tra kết quả thanh toán & Thời gian giữ ghế
 * ============================================================
 */

import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MusicalService } from '../../services/musical.service';
import { BookedSeat, BookingOrder } from '../../models/musical.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly musicalService = inject(MusicalService);

  checkoutData = signal<any>(null);
  selectedSeats = signal<BookedSeat[]>([]);

  // Đếm ngược 10 phút giữ ghế (BPMN 2.2.3 Bước 6 & Bước 13)
  holdSecondsLeft = signal<number>(570);
  private holdInterval: any = null;

  // Form thông tin khách hàng
  customerForm!: FormGroup;

  // Mã giảm giá Voucher (BPMN 2.2.3 Bước 8 & 9)
  voucherCodeInput = signal<string>('');
  appliedVoucher = signal<any>(null);
  voucherError = signal<string | null>(null);

  // Cổng thanh toán được chọn (BPMN 2.2.3 Bước 10 & 11)
  selectedPayment = signal<'VIETQR' | 'VNPAY' | 'MOMO' | 'ZALOPAY' | 'BANK_CARD'>('VIETQR');

  // Modal hiển thị mã QR thanh toán
  showQrModal = signal<boolean>(false);

  // Cảnh báo thanh toán thất bại (BPMN 2.2.3 Bước 12 & 13)
  paymentFailureMessage = signal<string | null>(null);

  // Trạng thái xử lý
  isProcessing = signal<boolean>(false);
  successOrder = signal<BookingOrder | null>(null);

  subtotal = computed(() => {
    return this.selectedSeats().reduce((sum, s) => sum + s.price, 0);
  });

  discountAmount = computed(() => {
    return this.appliedVoucher() ? this.appliedVoucher().discountAmount : 0;
  });

  totalPrice = computed(() => {
    return Math.max(0, this.subtotal() - this.discountAmount());
  });

  ngOnInit(): void {
    // Bước 4 BPMN 2.2.3: Kiểm tra đăng nhập
    if (!this.musicalService.isLoggedIn()) {
      this.router.navigate(['/auth'], {
        queryParams: { returnUrl: '/checkout' }
      });
      return;
    }

    const raw = sessionStorage.getItem('city_musical_checkout');
    if (!raw) {
      this.router.navigate(['/']);
      return;
    }

    const data = JSON.parse(raw);
    this.checkoutData.set(data);
    this.selectedSeats.set(data.seats || []);

    const user = this.musicalService.currentUser();
    this.customerForm = this.fb.group({
      customerName: [user.fullName || '', [Validators.required, Validators.minLength(2)]],
      customerEmail: [user.email || '', [Validators.required, Validators.email]],
      customerPhone: [user.phone || '0909123456', [Validators.required, Validators.pattern(/^(0[3|5|7|8|9])[0-9]{8}$/)]],
      notes: ['']
    });

    // Bắt đầu đếm ngược thời gian giữ ghế
    this.startHoldTimer();
  }

  ngOnDestroy(): void {
    if (this.holdInterval) {
      clearInterval(this.holdInterval);
    }
  }

  private startHoldTimer(): void {
    if (this.holdInterval) clearInterval(this.holdInterval);
    this.holdInterval = setInterval(() => {
      const current = this.holdSecondsLeft();
      if (current <= 1) {
        clearInterval(this.holdInterval);
        this.holdSecondsLeft.set(0);
        // Bước 13 BPMN: Hết thời gian giữ ghế -> tự động hủy đơn và giải phóng ghế
        alert('Thời gian 10 phút giữ ghế đã hết hạn! Hệ thống đã giải phóng ghế và kết thúc giao dịch.');
        sessionStorage.removeItem('city_musical_checkout');
        this.router.navigate(['/musicals']);
      } else {
        this.holdSecondsLeft.set(current - 1);
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  get f() {
    return this.customerForm.controls;
  }

  // Bước 8 & 9 BPMN: Kiểm tra mã khuyến mãi
  applyVoucher(): void {
    const code = this.voucherCodeInput().trim().toUpperCase();
    if (!code) {
      this.voucherError.set('Vui lòng nhập mã khuyến mãi');
      return;
    }
    this.voucherError.set(null);

    this.musicalService.validateVoucher(code, this.subtotal()).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.appliedVoucher.set(res.data);
          this.voucherError.set(null);
        }
      },
      error: (err) => {
        // Bước 9: Mã không hợp lệ, yêu cầu nhập lại
        this.voucherError.set(err.message || 'Mã khuyến mãi không hợp lệ hoặc không đủ điều kiện');
        this.appliedVoucher.set(null);
      }
    });
  }

  removeVoucher(): void {
    this.appliedVoucher.set(null);
    this.voucherCodeInput.set('');
    this.voucherError.set(null);
  }

  // Bước 10 & 11: Khách hàng bấm Thanh toán -> Hệ thống mở Modal hiển thị mã QR cổng tương ứng
  onOpenPaymentModal(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    this.paymentFailureMessage.set(null);
    this.showQrModal.set(true);
  }

  closePaymentModal(): void {
    this.showQrModal.set(false);
  }

  // Bước 12: Thanh toán THÀNH CÔNG
  onConfirmSuccessPayment(): void {
    this.isProcessing.set(true);

    const formVal = this.customerForm.value;
    const data = this.checkoutData();

    const payload = {
      musicalSlug: data.musicalSlug,
      scheduleId: data.scheduleId,
      customerName: formVal.customerName,
      customerEmail: formVal.customerEmail,
      customerPhone: formVal.customerPhone,
      seats: this.selectedSeats(),
      voucherCode: this.appliedVoucher() ? this.appliedVoucher().code : null,
      paymentMethod: this.selectedPayment(),
      notes: formVal.notes
    };

    this.musicalService.createBooking(payload).subscribe({
      next: (res) => {
        this.isProcessing.set(false);
        this.showQrModal.set(false);
        if (res.success && res.data) {
          this.successOrder.set(res.data);
          sessionStorage.removeItem('city_musical_checkout');
        }
      },
      error: (err) => {
        this.isProcessing.set(false);
        this.onTriggerPaymentFailure(err.message || 'Lỗi xử lý kết quả thanh toán');
      }
    });
  }

  // Bước 12 & 13: Xử lý khi thanh toán THẤT BẠI
  onTriggerPaymentFailure(customMsg?: string): void {
    this.isProcessing.set(false);
    this.showQrModal.set(false);

    // Bước 13: Kiểm tra thời gian giữ ghế
    if (this.holdSecondsLeft() > 0) {
      this.paymentFailureMessage.set(
        customMsg || `Giao dịch qua cổng ${this.selectedPayment()} thất bại hoặc bị hủy bởi người dùng. Thời gian giữ ghế vẫn còn (${this.formatTime(this.holdSecondsLeft())}), vui lòng chọn lại phương thức thanh toán!`
      );
    } else {
      alert('Đã hết thời gian giữ ghế! Hệ thống giải phóng ghế và hủy đơn hàng.');
      sessionStorage.removeItem('city_musical_checkout');
      this.router.navigate(['/musicals']);
    }
  }

  printTicket(): void {
    window.print();
  }
}
