/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/ops-checkin/ops-checkin.component.ts
 * Chức năng: Cổng Soát Vé & Check-in Thời Gian Thực (Ops Portal)
 * - Quét mã QR E-ticket hoặc Nhập mã thủ công
 * - Phân loại Gate (Cửa chính, Ban công, Cửa VIP)
 * - Xác thực vé: Hợp lệ / Đã sử dụng (Duplicate) / Đã hủy
 * - Nhật ký soát vé thời gian thực tại rạp
 * ============================================================
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MusicalService } from '../../services/musical.service';
import { StaffHeaderComponent } from '../staff-header/staff-header.component';
import { CheckInResult, BookingOrder } from '../../models/musical.model';

@Component({
  selector: 'app-ops-checkin',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, StaffHeaderComponent],
  templateUrl: './ops-checkin.component.html',
  styleUrls: ['./ops-checkin.component.css']
})
export class OpsCheckinComponent implements OnInit {
  private readonly musicalService = inject(MusicalService);

  currentUser = this.musicalService.currentUser;

  // Trạng thái Form
  ticketCodeInput = signal<string>('');
  selectedGate = signal<string>('Cửa Chính Khán Phòng Grand A');
  isProcessing = signal<boolean>(false);

  // Kết quả soát vé
  lastSuccessResult = signal<CheckInResult | null>(null);
  lastErrorResult = signal<{ code: string; message: string; details?: any } | null>(null);

  // Lịch sử soát vé gần đây
  recentCheckins = signal<CheckInResult[]>([]);

  // Danh sách vé mẫu để test nhanh
  sampleBookings = signal<BookingOrder[]>([]);

  readonly gates = [
    'Cửa Chính Khán Phòng Grand A',
    'Cửa Tầng Lầu Ban Công',
    'Cửa VIP & Khách Mời Danh Dự'
  ];

  ngOnInit(): void {
    // Đảm bảo vai trò phù hợp
    if (this.currentUser().role === 'customer') {
      this.musicalService.setRole('ticket_checker');
    }
    this.loadSampleTickets();
  }

  loadSampleTickets(): void {
    this.musicalService.getAdminOrders().subscribe({
      next: (orders) => {
        this.sampleBookings.set(orders.slice(0, 6));
      }
    });
  }

  useSampleCode(code: string): void {
    this.ticketCodeInput.set(code);
    this.lastSuccessResult.set(null);
    this.lastErrorResult.set(null);
  }

  onExecuteCheckIn(): void {
    const code = this.ticketCodeInput().trim().toUpperCase();
    if (!code) return;

    this.isProcessing.set(true);
    this.lastSuccessResult.set(null);
    this.lastErrorResult.set(null);

    const operator = this.currentUser().fullName || 'Tổ Trưởng Soát Vé';
    const gate = this.selectedGate();

    this.musicalService.checkInTicket(code, operator, gate).subscribe({
      next: (res) => {
        this.isProcessing.set(false);
        if (res.success && res.data) {
          this.lastSuccessResult.set(res.data);
          // Đưa vào feed lịch sử soát vé
          this.recentCheckins.set([res.data, ...this.recentCheckins()]);
          this.loadSampleTickets();
        }
      },
      error: (err) => {
        this.isProcessing.set(false);
        this.lastErrorResult.set({
          code: err.code || 'CHECK_IN_ERROR',
          message: err.message || 'Lỗi khi kiểm tra mã vé',
          details: err.details
        });
      }
    });
  }

  simulateQrScan(): void {
    // Mô phỏng máy quét QR quang học vừa scan một vé
    const available = this.sampleBookings().find(b => b.bookingStatus === 'CONFIRMED');
    if (available) {
      this.ticketCodeInput.set(available.bookingCode);
      this.onExecuteCheckIn();
    } else if (this.sampleBookings().length > 0) {
      // Quét vé đã dùng để kiểm tra cảnh báo trùng
      this.ticketCodeInput.set(this.sampleBookings()[0].bookingCode);
      this.onExecuteCheckIn();
    } else {
      this.ticketCodeInput.set('NK-20261102-TEST1');
      this.onExecuteCheckIn();
    }
  }

  dismissAlert(): void {
    this.lastSuccessResult.set(null);
    this.lastErrorResult.set(null);
    this.ticketCodeInput.set('');
  }
}
