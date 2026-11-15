/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/my-tickets/my-tickets.component.ts
 * Chức năng: Quản lý vé cá nhân, lịch sử vé, xem và tải E-ticket
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
  activeTab = signal<'UPCOMING' | 'USED'>('UPCOMING');
  isLoading = signal<boolean>(true);
  searchCode = signal<string>('');

  // Modal Chi tiết vé điện tử (E-Ticket) - BPMN 2.2.4 Bước 2
  selectedDetailOrder = signal<BookingOrder | null>(null);

  // Modal QR Code phóng to
  viewingQrOrder = signal<BookingOrder | null>(null);

  filteredBookings = computed(() => {
    const tab = this.activeTab();
    const query = this.searchCode().trim().toLowerCase();
    return this.bookings().filter(b => {
      const expectedStatus = tab === 'UPCOMING' ? 'CONFIRMED' : 'CHECKED_IN';
      if (b.bookingStatus !== expectedStatus) return false;
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
  }

  closeDetailModal(): void {
    this.selectedDetailOrder.set(null);
  }

  downloadTicket(order: BookingOrder): void {
    const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, character => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return entities[character];
    });
    const formattedDate = new Date(order.performanceDate).toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const seats = order.seats.map(seat =>
      `<li>${escapeHtml(seat.seatCode)} (${escapeHtml(seat.type)}) — ${new Intl.NumberFormat('vi-VN').format(seat.price)} đ</li>`
    ).join('');
    const status = order.bookingStatus === 'CONFIRMED'
      ? 'Chưa sử dụng'
      : order.bookingStatus === 'CHECKED_IN'
        ? 'Đã check-in'
        : 'Đã hủy';
    const ticketHtml = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Vé điện tử ${escapeHtml(order.bookingCode)}</title>
  <style>
    body{margin:0;padding:32px;background:#070a12;color:#f8fafc;font:16px/1.6 Arial,sans-serif}
    .ticket{max-width:760px;margin:auto;padding:32px;border:1px solid #f59e0b;border-radius:20px;background:#0e1629}
    header{display:flex;justify-content:space-between;gap:16px;padding-bottom:18px;border-bottom:1px solid #334155;color:#fde68a;font-weight:700}
    h1{margin:24px 0 4px;font-size:28px}
    .muted{color:#cbd5e1}
    .code{margin:24px 0;padding:16px;border:1px dashed #f59e0b;border-radius:12px;text-align:center}
    .code span{display:block;color:#cbd5e1;font-size:13px}
    .code strong{font:700 24px/1.5 monospace;color:#fde68a;letter-spacing:1px}
    .details{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .details div{padding:12px;background:#090d16;border-radius:8px}
    .details strong{display:block;color:#cbd5e1;font-size:13px}
    ul{padding-left:20px}
    .notice{margin-top:24px;padding-top:16px;border-top:1px solid #334155;color:#cbd5e1}
    @media(max-width:600px){body{padding:16px}.ticket{padding:20px}.details{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <main class="ticket">
    <header><span>NHÀ HÁT NHẠC KỊCH THÀNH PHỐ</span><span>VÉ ĐIỆN TỬ</span></header>
    <h1>${escapeHtml(order.musicalTitle)}</h1>
    <p class="muted">${escapeHtml(formattedDate)} • ${escapeHtml(order.performanceTime)}</p>
    <div class="code"><span>MÃ VÉ</span><strong>${escapeHtml(order.bookingCode)}</strong></div>
    <section class="details">
      <div><strong>Khách hàng</strong>${escapeHtml(order.customerName)}</div>
      <div><strong>Liên hệ</strong>${escapeHtml(order.customerPhone)} • ${escapeHtml(order.customerEmail)}</div>
      <div><strong>Địa điểm</strong>${escapeHtml(order.hall)} • ${escapeHtml(order.venue || 'Nhà hát Thành phố')}</div>
      <div><strong>Trạng thái</strong>${status}</div>
      <div><strong>Tổng thanh toán</strong>${new Intl.NumberFormat('vi-VN').format(order.totalPrice)} đ</div>
      <div><strong>Thanh toán</strong>${escapeHtml(order.paymentMethod)} (${escapeHtml(order.paymentStatus)})</div>
    </section>
    <h2>Ghế đã đặt</h2>
    <ul>${seats}</ul>
    <p class="notice">Vui lòng lưu vé điện tử và xuất trình mã vé khi đến nhà hát. Vé đã mua không hỗ trợ hủy hoặc hoàn tiền.</p>
  </main>
</body>
</html>`;
    const blob = new Blob([ticketHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeCode = order.bookingCode.replace(/[^a-zA-Z0-9_-]/g, '_');
    link.href = url;
    link.download = `${safeCode || 've-dien-tu'}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  openQrModal(order: BookingOrder): void {
    this.viewingQrOrder.set(order);
  }

  closeQrModal(): void {
    this.viewingQrOrder.set(null);
  }
}
