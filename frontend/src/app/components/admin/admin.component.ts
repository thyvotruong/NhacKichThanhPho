/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/admin/admin.component.ts
 * Chức năng: Cổng Quản Trị Hệ Thống (Admin Portal) với RBAC:
 * - Executive Dashboard (Doanh thu, Tỷ lệ lấp đầy, Cổng thanh toán)
 * - Khóa ghế nội bộ (Crucial Seat Lock flow với lý do, real-time sync)
 * - Quản lý đơn hàng & Xử lý hoàn tiền
 * - Quản lý mã giảm giá Voucher
 * - Báo cáo đối soát giao dịch tài chính (Reconciliation Report)
 * - Quản lý nhân sự & Phân quyền RBAC
 * ============================================================
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MusicalService } from '../../services/musical.service';
import { StaffHeaderComponent } from '../staff-header/staff-header.component';
import {
  DashboardStats,
  Schedule,
  Seat,
  BookingOrder,
  Voucher,
  ReconciliationRecord,
  UserStaff
} from '../../models/musical.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DecimalPipe, DatePipe, StaffHeaderComponent],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  private readonly musicalService = inject(MusicalService);
  private readonly fb = inject(FormBuilder);

  // Người dùng & phân quyền RBAC
  currentUser = this.musicalService.currentUser;

  // Active Tab
  activeTab = signal<'dashboard' | 'seat-lock' | 'orders' | 'vouchers' | 'reconciliation' | 'staff'>('dashboard');

  // Dữ liệu Dashboard
  stats = signal<DashboardStats | null>(null);
  isLoadingStats = signal<boolean>(true);

  // Dữ liệu Khóa ghế nội bộ
  schedules = signal<Schedule[]>([]);
  selectedScheduleId = signal<string>('');
  currentSchedule = signal<Schedule | null>(null);
  selectedSeatsForLock = signal<string[]>([]);
  lockReason = signal<string>('Báo chí / Truyền thông');
  customLockReason = signal<string>('');
  isLockingSeats = signal<boolean>(false);
  seatActionMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  // Dữ liệu Đơn hàng
  orders = signal<BookingOrder[]>([]);
  orderSearchKeyword = signal<string>('');
  orderStatusFilter = signal<string>('ALL');
  isLoadingOrders = signal<boolean>(false);
  selectedOrderForRefund = signal<BookingOrder | null>(null);
  refundReasonInput = signal<string>('Khách hàng yêu cầu hủy qua tổng đài hỗ trợ');

  // Dữ liệu Vouchers
  vouchers = signal<Voucher[]>([]);
  showCreateVoucherModal = signal<boolean>(false);
  voucherForm!: FormGroup;

  // Dữ liệu Đối soát tài chính
  reconciliations = signal<ReconciliationRecord[]>([]);
  showExportSuccess = signal<boolean>(false);

  // Dữ liệu Nhân sự RBAC
  staffUsers = signal<UserStaff[]>([]);

  ngOnInit(): void {
    this.initVoucherForm();
    this.loadDashboardStats();
    this.loadSchedules();
    this.loadOrders();
    this.loadVouchers();
    this.loadReconciliations();
    this.loadStaffUsers();
  }

  setTab(tab: 'dashboard' | 'seat-lock' | 'orders' | 'vouchers' | 'reconciliation' | 'staff'): void {
    this.activeTab.set(tab);
    if (tab === 'dashboard') this.loadDashboardStats();
    if (tab === 'orders') this.loadOrders();
    if (tab === 'vouchers') this.loadVouchers();
    if (tab === 'reconciliation') this.loadReconciliations();
    if (tab === 'staff') this.loadStaffUsers();
  }

  // --- 1. DASHBOARD ---
  loadDashboardStats(): void {
    this.isLoadingStats.set(true);
    this.musicalService.getAdminDashboard().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoadingStats.set(false);
      },
      error: () => this.isLoadingStats.set(false)
    });
  }

  // --- 2. KHÓA GHẾ NỘI BỘ (CRUCIAL FLOW) ---
  loadSchedules(): void {
    this.musicalService.getSchedules().subscribe({
      next: (schs) => {
        this.schedules.set(schs);
        if (schs.length > 0) {
          this.selectSchedule(schs[0]._id);
        }
      }
    });
  }

  selectSchedule(schId: string): void {
    this.selectedScheduleId.set(schId);
    this.selectedSeatsForLock.set([]);
    this.seatActionMessage.set(null);
    this.musicalService.getScheduleSeats(schId).subscribe({
      next: (data) => {
        const found = this.schedules().find(s => s._id === schId);
        if (found) {
          const updated = { ...found, seats: data.seats };
          this.currentSchedule.set(updated);
        }
      }
    });
  }

  toggleSeatSelection(seat: Seat): void {
    // Không cho chọn ghế đã bán
    if (seat.status === 'booked') return;

    const currentList = this.selectedSeatsForLock();
    if (currentList.includes(seat.seatCode)) {
      this.selectedSeatsForLock.set(currentList.filter(c => c !== seat.seatCode));
    } else {
      this.selectedSeatsForLock.set([...currentList, seat.seatCode]);
    }
  }

  isSeatSelected(code: string): boolean {
    return this.selectedSeatsForLock().includes(code);
  }

  onExecuteLockSeats(): void {
    const codes = this.selectedSeatsForLock();
    const schId = this.selectedScheduleId();
    if (codes.length === 0 || !schId) return;

    const reason = this.lockReason() === 'Khác' ? (this.customLockReason() || 'Ghế nội bộ đặc biệt') : this.lockReason();
    const lockedBy = this.currentUser().fullName;

    this.isLockingSeats.set(true);
    this.seatActionMessage.set(null);

    this.musicalService.lockSeats(schId, codes, reason, lockedBy).subscribe({
      next: (res) => {
        this.isLockingSeats.set(false);
        this.seatActionMessage.set({
          type: 'success',
          text: `Đã khóa thành công ${codes.length} ghế (${codes.join(', ')}) với lý do: "${reason}". Đồng bộ thành công sang khách hàng!`
        });
        this.selectedSeatsForLock.set([]);
        this.selectSchedule(schId);
      },
      error: (err) => {
        this.isLockingSeats.set(false);
        this.seatActionMessage.set({
          type: 'error',
          text: err.message || 'Lỗi khi thực hiện khóa ghế'
        });
      }
    });
  }

  onExecuteUnlockSeats(): void {
    const codes = this.selectedSeatsForLock();
    const schId = this.selectedScheduleId();
    if (codes.length === 0 || !schId) return;

    this.isLockingSeats.set(true);
    this.seatActionMessage.set(null);

    this.musicalService.unlockSeats(schId, codes).subscribe({
      next: (res) => {
        this.isLockingSeats.set(false);
        this.seatActionMessage.set({
          type: 'success',
          text: `Đã mở khóa ${codes.length} ghế (${codes.join(', ')}). Ghế hiện đã sẵn sàng để khách hàng đặt mua!`
        });
        this.selectedSeatsForLock.set([]);
        this.selectSchedule(schId);
      },
      error: (err) => {
        this.isLockingSeats.set(false);
        this.seatActionMessage.set({
          type: 'error',
          text: err.message || 'Lỗi khi mở khóa ghế'
        });
      }
    });
  }

  // --- 3. QUẢN LÝ ĐƠN HÀNG & HOÀN TIỀN ---
  loadOrders(): void {
    this.isLoadingOrders.set(true);
    this.musicalService.getAdminOrders(this.orderSearchKeyword(), this.orderStatusFilter() === 'ALL' ? undefined : this.orderStatusFilter()).subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.isLoadingOrders.set(false);
      },
      error: () => this.isLoadingOrders.set(false)
    });
  }

  openRefundModal(order: BookingOrder): void {
    this.selectedOrderForRefund.set(order);
  }

  closeRefundModal(): void {
    this.selectedOrderForRefund.set(null);
  }

  executeRefund(): void {
    const order = this.selectedOrderForRefund();
    if (!order || !order._id) return;

    this.musicalService.refundOrder(order._id, this.refundReasonInput(), order.totalPrice).subscribe({
      next: (res) => {
        alert(`✅ Đã xử lý hoàn tiền cho đơn ${order.bookingCode}! Số tiền hoàn: ${order.totalPrice.toLocaleString('vi-VN')} đ.`);
        this.closeRefundModal();
        this.loadOrders();
      },
      error: (err) => {
        alert('Lỗi hoàn tiền: ' + err.message);
      }
    });
  }

  // --- 4. QUẢN LÝ VOUCHER ---
  initVoucherForm(): void {
    this.voucherForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(4)]],
      description: ['', [Validators.required]],
      discountType: ['PERCENT', [Validators.required]],
      discountValue: [15, [Validators.required, Validators.min(1)]],
      minOrderValue: [500000, [Validators.required, Validators.min(0)]],
      maxDiscountAmount: [200000],
      validUntil: ['2026-12-31', [Validators.required]]
    });
  }

  loadVouchers(): void {
    this.musicalService.getAdminVouchers().subscribe({
      next: (vouchers) => this.vouchers.set(vouchers)
    });
  }

  onToggleVoucher(v: Voucher): void {
    if (!v._id) return;
    this.musicalService.toggleVoucher(v._id).subscribe({
      next: () => {
        v.isActive = !v.isActive;
      }
    });
  }

  onSubmitNewVoucher(): void {
    if (this.voucherForm.invalid) {
      this.voucherForm.markAllAsTouched();
      return;
    }

    const payload = this.voucherForm.value;
    payload.code = payload.code.toUpperCase().trim();
    payload.isActive = true;

    this.musicalService.createVoucher(payload).subscribe({
      next: () => {
        alert(`✅ Đã tạo thành công voucher: ${payload.code}`);
        this.showCreateVoucherModal.set(false);
        this.voucherForm.reset({
          discountType: 'PERCENT',
          discountValue: 15,
          minOrderValue: 500000,
          validUntil: '2026-12-31'
        });
        this.loadVouchers();
      },
      error: (err) => alert('Lỗi tạo voucher: ' + err.message)
    });
  }

  // --- 5. ĐỐI SOÁT TÀI CHÍNH ---
  loadReconciliations(): void {
    this.musicalService.getReconciliations().subscribe({
      next: (recs) => this.reconciliations.set(recs)
    });
  }

  triggerExportReport(): void {
    this.showExportSuccess.set(true);
    setTimeout(() => this.showExportSuccess.set(false), 4000);
  }

  // --- 6. PHÂN QUYỀN RBAC ---
  loadStaffUsers(): void {
    this.musicalService.getUsers().subscribe({
      next: (users) => this.staffUsers.set(users)
    });
  }

  switchRole(role: 'customer' | 'admin' | 'editor' | 'accountant' | 'ticket_checker'): void {
    this.musicalService.setRole(role);
  }
}
