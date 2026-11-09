/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/seat-selection/seat-selection.component.ts
 * Chức năng: Sơ đồ ghế trực quan, phân loại VIP/Thường/Đôi,
 * Giữ ghế tạm thời (Temporary Hold) kèm Countdown 8 phút
 * ============================================================
 */

import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MusicalService } from '../../services/musical.service';
import { Seat, Schedule, BookedSeat } from '../../models/musical.model';

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './seat-selection.component.html',
  styleUrls: ['./seat-selection.component.css']
})
export class SeatSelectionComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly musicalService = inject(MusicalService);

  scheduleId = signal<string>('');
  scheduleInfo = signal<any>(null);
  seats = signal<Seat[]>([]);
  activeFloor = signal<'Tầng Trệt' | 'Tầng Lầu'>('Tầng Trệt');

  // Danh sách ghế khách đang chọn
  selectedSeats = signal<Seat[]>([]);

  // Cảnh báo tính khả dụng của ghế (BPMN 2.2.3 Bước 6)
  seatWarning = signal<string | null>(null);

  // Đếm ngược 10 phút giữ ghế (600 giây - theo BPMN 2.2.3 Bước 6)
  holdSecondsLeft = signal<number>(600);
  isHoldingActive = signal<boolean>(false);
  private countdownInterval: any;

  // Tổng tiền tạm tính
  totalSeatPrice = computed(() => {
    return this.selectedSeats().reduce((sum, s) => sum + s.price, 0);
  });

  // Phân chia ghế theo hàng
  filteredSeatsByFloor = computed(() => {
    return this.seats().filter(s => s.floor === this.activeFloor());
  });

  uniqueRows = computed(() => {
    const rows = this.filteredSeatsByFloor().map(s => s.row);
    return Array.from(new Set(rows)).sort();
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('scheduleId');
      if (id) {
        // Bước 4 BPMN 2.2.3: Kiểm tra đăng nhập
        if (!this.musicalService.isLoggedIn()) {
          this.router.navigate(['/auth'], {
            queryParams: { returnUrl: `/seat-selection/${id}` }
          });
          return;
        }

        this.scheduleId.set(id);
        this.loadSeatMap(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.clearCountdown();
    // Giải phóng ghế nếu khách rời trang mà chưa thanh toán
    if (this.selectedSeats().length > 0 && this.isHoldingActive()) {
      const codes = this.selectedSeats().map(s => s.seatCode);
      this.musicalService.releaseSeats(this.scheduleId(), codes, this.musicalService.currentHoldSessionId()).subscribe();
    }
  }

  loadSeatMap(scheduleId: string): void {
    this.musicalService.getScheduleSeats(scheduleId).subscribe({
      next: (res) => {
        this.scheduleInfo.set(res);
        this.seats.set(res.seats || []);
      },
      error: () => {
        // Fallback dữ liệu tĩnh nếu backend chưa sẵn sàng
        this.scheduleInfo.set({
          scheduleId,
          musicalTitle: 'Bông Bóng Bay',
          performanceDate: '2026-11-15T19:30:00Z',
          time: '19:30',
          hall: 'Khán phòng Grand A'
        });
      }
    });
  }

  getSeatsInRow(row: string): Seat[] {
    return this.filteredSeatsByFloor()
      .filter(s => s.row === row)
      .sort((a, b) => a.number - b.number);
  }

  toggleSeat(seat: Seat): void {
    this.seatWarning.set(null);

    // Bước 6 BPMN 2.2.3: Kiểm tra tính khả dụng của ghế
    if (seat.status === 'booked') {
      this.seatWarning.set(`Ghế ${seat.seatCode} đã được bán. Vui lòng chọn ghế khác!`);
      return;
    }
    if (seat.status === 'locked') {
      this.seatWarning.set(`Ghế ${seat.seatCode} đang khóa nội bộ (${seat.lockedReason || 'Ban tổ chức'}). Không khả dụng!`);
      return;
    }
    if (seat.status === 'holding' && !this.isSelected(seat.seatCode)) {
      this.seatWarning.set(`Ghế ${seat.seatCode} đang được một khán giả khác giữ tạm thời trong 10 phút. Vui lòng chọn ghế khác!`);
      return;
    }

    const currentSelected = this.selectedSeats();
    const index = currentSelected.findIndex(s => s.seatCode === seat.seatCode);

    if (index > -1) {
      // Bỏ chọn
      const updated = [...currentSelected];
      updated.splice(index, 1);
      this.selectedSeats.set(updated);
      seat.status = 'available';

      if (updated.length === 0) {
        this.clearCountdown();
        this.isHoldingActive.set(false);
      }
    } else {
      // Tối đa 5 ghế mỗi lần đặt
      if (currentSelected.length >= 5) {
        this.seatWarning.set('Theo quy định phòng vé, mỗi lần đặt tối đa 5 ghế để tránh đầu cơ.');
        return;
      }

      this.selectedSeats.set([...currentSelected, seat]);
      seat.status = 'holding';

      // Kích hoạt Countdown 10 phút giữ ghế chống trùng lặp (BPMN 2.2.3 Bước 6)
      if (!this.isHoldingActive()) {
        this.startHoldCountdown();
      }
    }
  }

  isSelected(seatCode: string): boolean {
    return this.selectedSeats().some(s => s.seatCode === seatCode);
  }

  startHoldCountdown(): void {
    this.isHoldingActive.set(true);
    this.holdSecondsLeft.set(600); // 10 phút theo chuẩn BPMN 2.2.3

    // Gửi request giữ ghế lên backend
    const codes = this.selectedSeats().map(s => s.seatCode);
    this.musicalService.holdSeats(this.scheduleId(), codes, this.musicalService.currentHoldSessionId()).subscribe();

    this.clearCountdown();
    this.countdownInterval = setInterval(() => {
      const current = this.holdSecondsLeft();
      if (current <= 1) {
        this.clearCountdown();
        this.isHoldingActive.set(false);
        this.seatWarning.set('Thời gian 10 phút giữ ghế đã hết! Ghế của bạn đã được giải phóng để khán giả khác có thể chọn.');
        // Reset trạng thái ghế
        this.selectedSeats().forEach(s => s.status = 'available');
        this.selectedSeats.set([]);
      } else {
        this.holdSecondsLeft.set(current - 1);
      }
    }, 1000);
  }

  clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  proceedToCheckout(): void {
    if (this.selectedSeats().length === 0) {
      alert('Vui lòng chọn ít nhất 1 ghế trên sơ đồ!');
      return;
    }

    const bookedSeats: BookedSeat[] = this.selectedSeats().map(s => ({
      seatCode: s.seatCode,
      floor: s.floor,
      row: s.row,
      number: s.number,
      type: s.type,
      price: s.price
    }));

    // Lưu vào sessionStorage để Checkout Funnel nhận
    sessionStorage.setItem('city_musical_checkout', JSON.stringify({
      scheduleId: this.scheduleId(),
      musicalSlug: this.scheduleInfo()?.musicalSlug || 'bong-bong-bay',
      musicalTitle: this.scheduleInfo()?.musicalTitle || 'Bông Bóng Bay',
      performanceDate: this.scheduleInfo()?.performanceDate,
      performanceTime: this.scheduleInfo()?.time || '19:30',
      hall: this.scheduleInfo()?.hall || 'Khán phòng Grand A',
      seats: bookedSeats,
      totalPrice: this.totalSeatPrice()
    }));

    this.router.navigate(['/checkout']);
  }
}
