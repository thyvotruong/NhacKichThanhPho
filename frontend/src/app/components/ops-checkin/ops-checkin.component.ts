/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/ops-checkin/ops-checkin.component.ts
 * Chức năng: Cổng Soát Vé & Vận Hành Cửa Rạp Toàn Diện (Ops Portal):
 * 1. Dashboard Vận Hành (/ops/dashboard): Tổng vé quét trong ngày, suất đang diễn, tình trạng gates
 * 2. Soát Vé Real-time (/ops/check-in): Quét QR, nhập mã, hiển thị 3 màu trực quan (Hợp lệ, Trùng, Hủy)
 * 3. Tra Cứu Vé (/ops/lookup): Tìm kiếm nhanh theo Mã vé, SĐT, hỗ trợ check-in tại chỗ
 * ============================================================
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MusicalService } from '../../services/musical.service';
import { StaffHeaderComponent } from '../staff-header/staff-header.component';
import { CheckInResult, BookingOrder, OpsDashboardStats } from '../../models/musical.model';

export type OpsTab = 'dashboard' | 'check-in' | 'lookup';

@Component({
  selector: 'app-ops-checkin',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, StaffHeaderComponent],
  templateUrl: './ops-checkin.component.html',
  styleUrls: ['./ops-checkin.component.css']
})
export class OpsCheckinComponent implements OnInit {
  private readonly musicalService = inject(MusicalService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  currentUser = this.musicalService.currentUser;

  // Active Tab
  activeTab = signal<OpsTab>('dashboard');

  // --- 1. DASHBOARD VẬN HÀNH ---
  opsStats = signal<OpsDashboardStats | null>(null);
  isLoadingOpsStats = signal<boolean>(true);

  // --- 2. SOÁT VÉ CHECK-IN ---
  ticketCodeInput = signal<string>('');
  selectedGate = signal<string>('Cửa Chính Khán Phòng Grand A');
  isProcessing = signal<boolean>(false);

  // Kết quả soát vé (3 trạng thái: Hợp lệ, Trùng lặp, Không hợp lệ / Đã hủy)
  lastSuccessResult = signal<CheckInResult | null>(null);
  lastDuplicateWarning = signal<{ code: string; message: string; details?: any } | null>(null);
  lastInvalidError = signal<{ code: string; message: string; details?: any } | null>(null);

  // Lịch sử soát vé gần đây
  recentCheckins = signal<CheckInResult[]>([]);

  // Danh sách vé mẫu để test nhanh
  sampleBookings = signal<BookingOrder[]>([]);

  readonly gates = [
    'Cửa Chính Khán Phòng Grand A',
    'Cửa Tầng Lầu Ban Công',
    'Cửa VIP & Khách Mời Danh Dự'
  ];

  // --- 3. TRA CỨU VÉ (LOOKUP) ---
  lookupKeyword = signal<string>('');
  lookupResults = signal<BookingOrder[]>([]);
  isSearchingLookup = signal<boolean>(false);
  hasSearchedLookup = signal<boolean>(false);

  // Thông báo hành động nhanh
  toastMessage = signal<{ type: 'success' | 'warning' | 'danger'; text: string } | null>(null);

  ngOnInit(): void {
    if (this.currentUser().role === 'customer') {
      this.musicalService.setRole('ticket_checker');
    }

    this.loadOpsDashboard();
    this.loadSampleTickets();

    // Đồng bộ Tab theo URL param /ops/:tab
    this.route.paramMap.subscribe(params => {
      const tabParam = params.get('tab');
      if (tabParam) {
        if (tabParam === 'check-in' || tabParam === 'checkin') {
          this.setTab('check-in', false);
        } else if (tabParam === 'lookup') {
          this.setTab('lookup', false);
        } else {
          this.setTab('dashboard', false);
        }
      }
    });
  }

  setTab(tab: OpsTab, updateUrl = true): void {
    this.activeTab.set(tab);
    if (updateUrl) {
      this.router.navigate(['/ops', tab]);
    }
    if (tab === 'dashboard') {
      this.loadOpsDashboard();
    } else if (tab === 'lookup' && this.lookupResults().length === 0) {
      this.onSearchLookup();
    }
  }

  showToast(text: string, type: 'success' | 'warning' | 'danger' = 'success'): void {
    this.toastMessage.set({ text, type });
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }

  // --- 1. DASHBOARD ---
  loadOpsDashboard(): void {
    this.isLoadingOpsStats.set(true);
    this.musicalService.getOpsDashboard().subscribe({
      next: (data) => {
        this.opsStats.set(data);
        this.isLoadingOpsStats.set(false);
      },
      error: () => this.isLoadingOpsStats.set(false)
    });
  }

  // --- 2. CHECK-IN ---
  loadSampleTickets(): void {
    this.musicalService.getAdminOrders().subscribe({
      next: (orders) => {
        this.sampleBookings.set(orders.slice(0, 8));
      }
    });
  }

  useSampleCode(code: string): void {
    this.ticketCodeInput.set(code);
    this.clearResults();
  }

  clearResults(): void {
    this.lastSuccessResult.set(null);
    this.lastDuplicateWarning.set(null);
    this.lastInvalidError.set(null);
  }

  onExecuteCheckIn(): void {
    const code = this.ticketCodeInput().trim().toUpperCase();
    if (!code) {
      this.showToast('Vui lòng quét mã QR hoặc nhập mã vé', 'warning');
      return;
    }

    this.isProcessing.set(true);
    this.clearResults();

    const operator = this.currentUser().fullName || 'Tổ Trưởng Soát Vé';
    const gate = this.selectedGate();

    this.musicalService.checkInTicket(code, operator, gate).subscribe({
      next: (res) => {
        this.isProcessing.set(false);
        if (res.success && res.data) {
          // 🟢 1. VÉ HỢP LỆ (Xanh lá)
          this.lastSuccessResult.set(res.data);
          this.recentCheckins.update(list => [res.data, ...list]);
          this.loadSampleTickets();
          this.loadOpsDashboard();
          this.showToast(`✅ Check-in thành công: ${res.data.customerName} (${res.data.seats})`, 'success');
        }
      },
      error: (err) => {
        this.isProcessing.set(false);
        const codeErr = err.code || 'CHECK_IN_ERROR';

        if (codeErr === 'ALREADY_CHECKED_IN') {
          // 🟡 2. VÉ ĐÃ SỬ DÙNG (Cảnh báo trùng lặp - Vàng cam)
          this.lastDuplicateWarning.set({
            code: codeErr,
            message: err.message || 'Cảnh báo: Vé này đã được check-in trước đó!',
            details: err.details
          });
          this.showToast('⚠️ CẢNH BÁO: Vé đã quét trước đó!', 'warning');
        } else {
          // 🔴 3. VÉ ĐÃ HỦY / KHÔNG HỢP LỆ (Đỏ)
          this.lastInvalidError.set({
            code: codeErr,
            message: err.message || 'Mã vé không tồn tại hoặc đã bị hủy',
            details: err.details
          });
          this.showToast('❌ VÉ KHÔNG HỢP LỆ HOẶC ĐÃ HỦY!', 'danger');
        }
      }
    });
  }

  simulateQrScan(): void {
    // Ưu tiên chọn 1 vé hợp lệ CONFIRMED để test thành công
    const available = this.sampleBookings().find(b => b.bookingStatus === 'CONFIRMED');
    if (available) {
      this.ticketCodeInput.set(available.bookingCode);
      this.onExecuteCheckIn();
    } else if (this.sampleBookings().length > 0) {
      // Test cảnh báo trùng lặp
      this.ticketCodeInput.set(this.sampleBookings()[0].bookingCode);
      this.onExecuteCheckIn();
    } else {
      this.ticketCodeInput.set('NK-20261102-TEST1');
      this.onExecuteCheckIn();
    }
  }

  dismissAlert(): void {
    this.clearResults();
    this.ticketCodeInput.set('');
  }

  // --- 3. TRA CỨU VÉ (LOOKUP) ---
  onSearchLookup(): void {
    const kw = this.lookupKeyword().trim();
    this.isSearchingLookup.set(true);
    this.hasSearchedLookup.set(true);

    this.musicalService.lookupTickets(kw).subscribe({
      next: (data) => {
        this.lookupResults.set(data);
        this.isSearchingLookup.set(false);
      },
      error: () => this.isSearchingLookup.set(false)
    });
  }

  directCheckInFromLookup(order: BookingOrder): void {
    this.ticketCodeInput.set(order.bookingCode);
    this.setTab('check-in');
    this.onExecuteCheckIn();
  }
}
