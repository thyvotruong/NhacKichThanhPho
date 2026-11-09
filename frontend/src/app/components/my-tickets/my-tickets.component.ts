/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/my-tickets/my-tickets.component.ts
 * Chức năng: Quản lý vé cá nhân, lịch sử vé, xem chi tiết E-ticket,
 * in/tải vé điện tử và Hủy vé hoàn tiền tự động theo BPMN 2.2.4
 * ============================================================
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MusicalService } from '../../services/musical.service';
import { BookingOrder } from '../../models/musical.model';

@Component({
  selector: 'app-my-tickets',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, FormsModule],
  templateUrl: './my-tickets.component.html',
  styleUrls: ['./my-tickets.component.css']
})
export class MyTicketsComponent implements OnInit {
  readonly musicalService = inject(MusicalService);
  private readonly router = inject(Router);

  bookings = signal<BookingOrder[]>([]);
  activeTab = signal<'UPCOMING' | 'USED' | 'CANCELLED'>('UPCOMING');
  isLoading = signal<boolean>(true);
  searchCode = signal<string>('');

  // Modal Chi tiết vé điện tử (E-Ticket) - BPMN 2.2.4 Bước 2
  selectedDetailOrder = signal<BookingOrder | null>(null);

  // Modal hủy vé & Đánh giá chính sách thời gian - BPMN 2.2.4 Bước 3 Nhánh B
  cancellingOrder = signal<BookingOrder | null>(null);
  cancelReason = signal<string>('Bận lịch cá nhân đột xuất');
  isSubmittingCancel = signal<boolean>(false);
  cancelSuccessMessage = signal<string | null>(null);
  cancelErrorAlert = signal<string | null>(null);
  refundEstimate = signal<{ rate: number; refundAmount: number; fee: number; hoursRemaining: number } | null>(null);

  // Modal QR Code phóng to
  viewingQrOrder = signal<BookingOrder | null>(null);

  filteredBookings = computed(() => {
    const tab = this.activeTab();
    const query = this.searchCode().trim().toLowerCase();
    return this.bookings().filter(b => {
      let matchesTab = true;
      if (tab === 'UPCOMING') matchesTab = b.bookingStatus === 'CONFIRMED';
      else if (tab === 'USED') matchesTab = b.bookingStatus === 'CHECKED_IN';
      else if (tab === 'CANCELLED') matchesTab = b.bookingStatus === 'CANCELLED';

      if (!matchesTab) return false;
      if (!query) return true;
      return (
        b.bookingCode.toLowerCase().includes(query) ||
        b.musicalTitle.toLowerCase().includes(query) ||
        b.customerPhone.includes(query)
      );
    });
  });

  ngOnInit(): void {
    // BPMN 2.2.4 Bước 1: Kiểm tra đăng nhập
    if (!this.musicalService.isLoggedIn()) {
      this.router.navigate(['/account/login'], { queryParams: { returnUrl: '/account/my-tickets' } });
      return;
    }
    this.loadTickets();
  }

  loadTickets(): void {
    this.isLoading.set(true);
    this.musicalService.getMyBookings().subscribe({
      next: (data) => {
        this.bookings.set(data || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  // --- XEM CHI TIẾT VÉ (BPMN 2.2.4 Bước 2) ---
  openDetailModal(order: BookingOrder): void {
    this.selectedDetailOrder.set(order);
    this.cancelErrorAlert.set(null);
  }

  closeDetailModal(): void {
    this.selectedDetailOrder.set(null);
    this.cancelErrorAlert.set(null);
  }

  // --- NHÁNH A: TẢI / IN VÉ ĐIỆN TỬ (PDF/PRINT) ---
  printTicket(order?: BookingOrder): void {
    if (order && !this.selectedDetailOrder()) {
      this.selectedDetailOrder.set(order);
    }
    setTimeout(() => {
      window.print();
    }, 150);
  }

  // --- NHÁNH B: YÊU CẦU HỦY VÉ & HOÀN TIỀN TỰ ĐỘNG ---
  getRemainingHours(order: BookingOrder): number {
    try {
      const dateStr = typeof order.performanceDate === 'string'
        ? order.performanceDate.split('T')[0]
        : new Date(order.performanceDate).toISOString().split('T')[0];
      const timeStr = order.performanceTime || '20:00';
      const showDateTime = new Date(`${dateStr}T${timeStr}:00`);
      const now = new Date();
      return (showDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    } catch {
      return 48; // Giả định an toàn nếu parsing lỗi
    }
  }

  openCancelModal(order: BookingOrder): void {
    this.cancelErrorAlert.set(null);
    this.cancelSuccessMessage.set(null);

    // Đánh giá điều kiện thời gian theo BPMN 2.2.4 Bước 3 Nhánh B
    const diffHours = this.getRemainingHours(order);

    if (diffHours < 12) {
      // Cổng quyết định: KHÔNG HỢP LỆ (< 12h)
      this.cancelErrorAlert.set(
        'Suất diễn diễn ra trong vòng 12 giờ tới, theo quy định nhà hát không thể hủy vé.'
      );
      // Hiển thị modal thông báo lỗi hoặc giữ ở màn hình chi tiết
      return;
    }

    // Cổng quyết định: HỢP LỆ (>= 12h) -> Tính toán số tiền hoàn
    let rate = 0.9;
    if (diffHours < 24) {
      rate = 0.7; // 12h - 24h: 70%
    } // > 24h: 90%

    const refundAmount = Math.round(order.totalPrice * rate);
    const fee = order.totalPrice - refundAmount;

    this.refundEstimate.set({
      rate: rate * 100,
      refundAmount,
      fee,
      hoursRemaining: Math.round(diffHours)
    });

    this.cancellingOrder.set(order);
  }

  closeCancelModal(): void {
    this.cancellingOrder.set(null);
    this.cancelSuccessMessage.set(null);
    this.cancelErrorAlert.set(null);
    this.refundEstimate.set(null);
  }

  confirmCancelBooking(): void {
    const order = this.cancellingOrder();
    if (!order) return;

    this.isSubmittingCancel.set(true);
    this.musicalService.cancelBooking(order.bookingCode, this.cancelReason()).subscribe({
      next: (res) => {
        this.isSubmittingCancel.set(false);
        const refundAmt = this.refundEstimate()?.refundAmount.toLocaleString('vi-VN') || '';
        this.cancelSuccessMessage.set(
          `Hủy vé thành công! Bạn được hoàn ${refundAmt} đ về tài khoản. Hệ thống đã gửi email xác nhận hủy vé & hóa đơn hoàn tiền đến ${order.customerEmail}. Ghế đã được giải phóng về khán phòng.`
        );
        // Cập nhật lại danh sách vé
        this.loadTickets();
        // Cập nhật lại vé đang mở chi tiết nếu có
        if (this.selectedDetailOrder()?.bookingCode === order.bookingCode) {
          this.selectedDetailOrder.update(curr => curr ? { ...curr, bookingStatus: 'CANCELLED' } : null);
        }
      },
      error: (err) => {
        this.isSubmittingCancel.set(false);
        this.cancelErrorAlert.set(err.message || 'Không thể hủy vé theo quy định nhà hát');
      }
    });
  }

  openQrModal(order: BookingOrder): void {
    this.viewingQrOrder.set(order);
  }

  closeQrModal(): void {
    this.viewingQrOrder.set(null);
  }
}
