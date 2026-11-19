/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/my-tickets/my-tickets.component.ts
 * Chức năng: Quản lý vé cá nhân, lịch sử vé, xem và tải vé
 * ============================================================
 */

import { Component, HostListener, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import QRCode from 'qrcode';
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
  selectedDetailOrder = signal<BookingOrder | null>(null);
  downloadFeedback = signal<string | null>(null);
  downloadFailed = signal(false);
  ageLimit = signal<string | null>(null);
  ageLimitLoading = signal(false);
  ageLimitError = signal<string | null>(null);
  qrCodeImage = signal<string | null>(null);
  qrCodeLoading = signal(false);
  qrCodeError = signal<string | null>(null);

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
    if (!this.musicalService.isLoggedIn()) {
      this.router.navigate(['/account/login'], { queryParams: { returnUrl: '/account/my-tickets' } });
      return;
    }
    this.loadTickets();
  }

  loadTickets(): void {
    this.isLoading.set(true);
    const user = this.musicalService.currentUser();
    const email = user?.email || '84customer@nhackichthanhpho.vn';
    const phone = user?.phone || '0901888999';
    this.musicalService.getMyBookings(email, phone).subscribe({
      next: (data) => {
        this.bookings.set(data || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openDetailModal(order: BookingOrder): void {
    this.selectedDetailOrder.set(order);
    this.downloadFeedback.set(null);
    this.ageLimit.set(null);
    this.ageLimitError.set(null);
    this.ageLimitLoading.set(true);
    this.qrCodeImage.set(null);
    this.qrCodeError.set(null);
    this.qrCodeLoading.set(true);

    this.musicalService.getMusicalBySlug(order.musicalSlug).subscribe({
      next: musical => {
        if (this.selectedDetailOrder()?.bookingCode !== order.bookingCode) return;
        this.ageLimit.set(musical.ageLimit || null);
        this.ageLimitLoading.set(false);
        if (!musical.ageLimit) {
          this.ageLimitError.set('Chưa có thông tin độ tuổi cho vở diễn này.');
        }
      },
      error: error => {
        console.error('Không thể tải quy định độ tuổi của vở diễn:', error);
        if (this.selectedDetailOrder()?.bookingCode !== order.bookingCode) return;
        this.ageLimitLoading.set(false);
        this.ageLimitError.set('Không thể tải thông tin độ tuổi. Vui lòng thử mở lại vé.');
      }
    });

    QRCode.toDataURL(this.getQrPayload(order), {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 240,
      color: { dark: '#090D16', light: '#FFFFFF' }
    }).then(image => {
      if (this.selectedDetailOrder()?.bookingCode === order.bookingCode) {
        this.qrCodeImage.set(image);
        this.qrCodeLoading.set(false);
      }
    }).catch(error => {
      console.error('Không thể tạo mã QR cho vé:', error);
      if (this.selectedDetailOrder()?.bookingCode === order.bookingCode) {
        this.qrCodeLoading.set(false);
        this.qrCodeError.set('Không thể tạo mã QR. Vui lòng thử mở lại vé.');
      }
    });
  }

  closeDetailModal(): void {
    this.selectedDetailOrder.set(null);
  }

  @HostListener('document:keydown.escape')
  closeDetailModalOnEscape(): void {
    this.closeDetailModal();
  }

  formatPerformanceDate(date: string | Date): string {
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Ho_Chi_Minh'
    }).format(new Date(date));
  }

  async downloadTicket(order: BookingOrder): Promise<void> {
    this.downloadFeedback.set(null);
    this.downloadFailed.set(false);
    const ageLimit = this.ageLimit();
    const qrCodeImage = this.qrCodeImage();
    if (!ageLimit || !qrCodeImage) {
      this.downloadFailed.set(true);
      this.downloadFeedback.set('Chưa thể tải vé vì thiếu thông tin độ tuổi hoặc mã QR.');
      return;
    }

    try {
      const svg = this.createTicketSvg(order, ageLimit, qrCodeImage);
      const imageBlob = await this.renderSvgAsPng(svg);
      const url = URL.createObjectURL(imageBlob);
      const link = document.createElement('a');
      const safeCode = order.bookingCode.replace(/[^a-zA-Z0-9_-]/g, '_');
      link.href = url;
      link.download = `Ve_${safeCode || 'dien-tu'}.png`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.downloadFeedback.set('Đã tải vé PNG thành công.');
    } catch (error) {
      console.error('Không thể tải vé PNG:', error);
      this.downloadFailed.set(true);
      this.downloadFeedback.set('Không thể tạo ảnh vé. Vui lòng thử lại.');
    }
  }

  private getQrPayload(order: BookingOrder): string {
    return order.qrCodeData || JSON.stringify({
      code: order.bookingCode,
      show: order.musicalTitle,
      date: order.performanceDate,
      time: order.performanceTime,
      seats: order.seats.map(seat => seat.seatCode).join(', ')
    });
  }

  private createTicketSvg(order: BookingOrder, ageLimit: string, qrImage: string): string {
    const escapeXml = (value: string): string => value.replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;'
    })[character] || character);
    const wrapText = (value: string, maxLength: number): string[] => {
      const words = value.trim().split(/\s+/);
      const lines: string[] = [];
      let line = '';
      words.forEach(word => {
        const nextLine = line ? `${line} ${word}` : word;
        if (nextLine.length > maxLength && line) {
          lines.push(line);
          line = word;
        } else {
          line = nextLine;
        }
      });
      if (line) lines.push(line);
      return lines;
    };
    const seatTypeName: Record<string, string> = {
      Standard: 'Tiêu chuẩn',
      Couple: 'Cặp đôi'
    };
    const seatList = order.seats
      .map(seat => `${seat.seatCode} (${seatTypeName[seat.type] || seat.type})`)
      .join('  ·  ');
    const titleLines = wrapText(order.musicalTitle, 38);
    const seatLines = wrapText(seatList, 48);
    const titleY = 178;
    const dateY = titleY + titleLines.length * 48 + 16;
    const venueY = dateY + 48;
    const nameY = venueY + 48;
    const seatLabelY = nameY + 48;
    const seatStartY = seatLabelY + 36;
    const ageY = seatStartY + seatLines.length * 32 + 22;
    const reminderY = ageY + 44;
    const height = Math.max(570, reminderY + 55);
    const status = order.bookingStatus === 'CONFIRMED' ? 'CÒN HIỆU LỰC' : 'ĐÃ SOÁT VÉ';
    const seatsSvg = seatLines.map((line, index) =>
      `<text x="72" y="${seatStartY + index * 32}" class="body">${escapeXml(line)}</text>`
    ).join('');
    const titleSvg = titleLines.map((line, index) =>
      `<text x="72" y="${titleY + index * 48}" class="title">${escapeXml(line)}</text>`
    ).join('');
    const qrBase64 = qrImage.replace(/^data:image\/png;base64,/, '');

    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="${height}" viewBox="0 0 1200 ${height}">
      <defs>
        <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#151D31"/><stop offset="100%" stop-color="#080D18"/>
        </linearGradient>
        <style>
          text{font-family:Arial,sans-serif}
          .muted{fill:#AAB4C5;font-size:21px}
          .body{fill:#F8FAFC;font-size:25px}
          .title{fill:#FFF;font-size:38px;font-weight:700}
        </style>
      </defs>
      <rect width="1200" height="${height}" rx="28" fill="url(#background)"/>
      <rect x="2" y="2" width="1196" height="${height - 4}" rx="26" fill="none" stroke="#D4AF37" stroke-width="4"/>
      <text x="72" y="75" fill="#FDE68A" font-size="27" font-weight="700">NHÀ HÁT NHẠC KỊCH THÀNH PHỐ</text>
      <text x="72" y="112" class="muted" font-size="18">VÉ ĐIỆN TỬ</text>
      <rect x="865" y="52" width="263" height="48" rx="24" fill="${order.bookingStatus === 'CONFIRMED' ? '#087F5B' : '#9A6700'}"/>
      <text x="996" y="83" text-anchor="middle" fill="#FFF" font-size="19" font-weight="700">${status}</text>
      <line x1="72" y1="137" x2="1128" y2="137" stroke="#6B5524" stroke-width="2"/>
      ${titleSvg}
      <text x="72" y="${dateY}" fill="#FDE68A" font-size="27" font-weight="600">${escapeXml(this.formatPerformanceDate(order.performanceDate))} · ${escapeXml(order.performanceTime)}</text>
      <text x="72" y="${venueY}" class="body">${escapeXml(order.hall)} · ${escapeXml(order.venue || 'Nhạc kịch Thành phố - 669 Đỗ Mười, khu phố 3, Linh Xuân, TP.HCM')}</text>
      <text x="72" y="${nameY}" class="muted">Khán giả: <tspan fill="#F8FAFC">${escapeXml(order.customerName)}</tspan></text>
      <text x="72" y="${seatLabelY}" class="muted">MÃ VÉ: <tspan fill="#FDE68A" font-weight="700">${escapeXml(order.bookingCode)}</tspan></text>
      <text x="72" y="${seatLabelY + 32}" class="muted">GHẾ NGỒI</text>
      ${seatsSvg}
      <text x="72" y="${ageY}" fill="#FDE68A" font-size="22" font-weight="700">ĐỘ TUỔI: ${escapeXml(ageLimit)}</text>
      <text x="72" y="${reminderY}" class="muted">Vui lòng đến đúng giờ để thưởng thức trọn vẹn chương trình.</text>
      <line x1="830" y1="160" x2="830" y2="${height - 42}" stroke="#39445A" stroke-width="2"/>
      <rect x="880" y="186" width="230" height="230" rx="14" fill="#FFF"/>
      <image x="893" y="199" width="204" height="204" href="data:image/png;base64,${qrBase64}" xlink:href="data:image/png;base64,${qrBase64}"/>
      <text x="995" y="450" text-anchor="middle" class="muted" font-size="18">Quét mã tại cổng soát vé</text>
      <text x="995" y="485" text-anchor="middle" fill="#FDE68A" font-size="18" font-weight="700">${escapeXml(order.bookingCode)}</text>
    </svg>`;
  }

  private renderSvgAsPng(svg: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(svgUrl);
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Trình duyệt không hỗ trợ tạo ảnh vé.'));
          return;
        }
        context.drawImage(image, 0, 0);
        canvas.toBlob(blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Không thể chuyển vé thành ảnh PNG.'));
          }
        }, 'image/png');
      };
      image.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        reject(new Error('Không thể dựng ảnh vé.'));
      };
      image.src = svgUrl;
    });
  }
}
