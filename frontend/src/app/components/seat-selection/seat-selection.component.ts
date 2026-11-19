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
import { SeatMapComponent } from '../seat-map/seat-map.component';

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, SeatMapComponent],
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

  // Danh sách ghế khách đang chọn
  selectedSeats = signal<Seat[]>([]);
  selectedSeatCodes = computed(() => this.selectedSeats().map(seat => seat.seatCode));

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
      next: (res: any) => {
        this.scheduleInfo.set(res);
        if (res && res.seats && res.seats.length > 0) {
          this.seats.set(res.seats);
        } else {
          this.seats.set(this.generateFallbackSeats(scheduleId));
        }
      },
      error: () => {
        const fallback = this.resolveScheduleFallback(scheduleId);
        this.scheduleInfo.set(fallback);
        this.seats.set(this.generateFallbackSeats(scheduleId));
      }
    });
  }

  private resolveScheduleFallback(scheduleId: string): any {
    const idLower = (scheduleId || '').toLowerCase();
    const lookup: Record<string, { title: string; slug: string; time: string; hall: string }> = {
      'loi-the-thu-9': {
        title: 'Lời Thề Thứ 9',
        slug: 'loi-the-thu-9',
        time: '20:00',
        hall: 'Khán phòng Grand A - Hoàng Gia'
      },
      'lo-lem': {
        title: 'Lọ Lem - Chiếc Giày Thủy Tinh',
        slug: 'lo-lem-chiec-giay-thuy-tinh',
        time: '19:30',
        hall: 'Khán phòng Grand A - Hoàng Gia'
      },
      'hon-truong-ba': {
        title: 'Hồn Trương Ba, Da Hàng Thịt',
        slug: 'hon-truong-ba-da-hang-thit',
        time: '20:00',
        hall: 'Khán phòng Broadway Opera'
      },
      'tuoi-tho-du-doi': {
        title: 'Tuổi Thơ Dữ Dội',
        slug: 'tuoi-tho-du-doi',
        time: '19:30',
        hall: 'Khán phòng Grand A - Hoàng Gia'
      },
      'giac-mo-cua-bom': {
        title: 'Giấc Mơ Của Bờm',
        slug: 'giac-mo-cua-bom',
        time: '20:00',
        hall: 'Khán phòng Broadway Opera'
      },
      'quan-khu-nam-dong': {
        title: 'Quân Khu Nam Đồng',
        slug: 'quan-khu-nam-dong',
        time: '19:30',
        hall: 'Khán phòng Grand A - Hoàng Gia'
      }
    };

    const matched = Object.entries(lookup).find(([k]) => idLower.includes(k));
    const info = matched ? matched[1] : lookup['loi-the-thu-9'];

    let perfDate = '2026-11-20T19:30:00+07:00';
    const dateMatch = idLower.match(/(\d{4})(\d{2})(\d{2})/);
    if (dateMatch) {
      perfDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T${info.time}:00+07:00`;
    }

    return {
      scheduleId,
      musicalTitle: info.title,
      musicalSlug: info.slug,
      performanceDate: perfDate,
      time: info.time,
      hall: info.hall,
      venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1'
    };
  }

private generateFallbackSeats(scheduleId: string): any[] {
  const generated: any[] = [];
  const stallVipRows = ['A', 'B', 'C'];
  const stallStdRows = ['D', 'E', 'F', 'G'];
  const balconyRows = ['J', 'K', 'L', 'M', 'N', 'P'];

  // 1. TẦNG TRỆT - VIP (Hàng A, B, C: 12 ghế/hàng)
  stallVipRows.forEach(row => {
    for (let num = 1; num <= 12; num++) {
      let status = 'available';
      let lockedReason = null;
      let lockedBy = null;

      if (row === 'A' && (num === 1 || num === 2)) {
        status = 'locked';
        lockedReason = 'Khách mời danh dự / Ngoại giao';
        lockedBy = 'Admin Trưởng Ban';
      } else if (row === 'A' && num === 12) {
        status = 'locked';
        lockedReason = 'Kỹ thuật âm thanh sân khấu';
        lockedBy = 'Admin Kỹ Thuật';
      } else if (row === 'B' && (num === 5 || num === 6)) {
        status = 'booked';
      }

      generated.push({
        scheduleId,
        seatCode: `${row}${num < 10 ? '0' + num : num}`,
        floor: 'Tầng Trệt',
        row,
        number: num,
        type: 'VIP',
        price: 800000,
        status,
        lockedReason,
        lockedBy
      });
    }
  });

  // 2. TẦNG TRỆT - Standard (Hàng D, E, F, G: 14 ghế/hàng)
  stallStdRows.forEach(row => {
    for (let num = 1; num <= 14; num++) {
      let status = 'available';
      if (row === 'D' && (num === 7 || num === 8)) {
        status = 'booked';
      }
      generated.push({
        scheduleId,
        seatCode: `${row}${num < 10 ? '0' + num : num}`,
        floor: 'Tầng Trệt',
        row,
        number: num,
        type: 'Standard',
        price: 450000,
        status
      });
    }
  });

  // 3. TẦNG TRỆT - Ghế Đôi Sweetbox (Hàng H: 6 ghế đôi H-CP01 - H-CP06)
  for (let num = 1; num <= 6; num++) {
    generated.push({
      scheduleId,
      seatCode: `H-CP0${num}`,
      floor: 'Tầng Trệt',
      row: 'H',
      number: num,
      type: 'Couple',
      price: 1200000,
      status: 'available'
    });
  }

  // 4. TẦNG LẦU - Standard (Hàng J, K, L, M, N, P: 14 ghế/hàng)
  balconyRows.forEach(row => {
    for (let num = 1; num <= 14; num++) {
      generated.push({
        scheduleId,
        seatCode: `${row}${num < 10 ? '0' + num : num}`,
        floor: 'Tầng Lầu',
        row,
        number: num,
        type: 'Standard',
        price: 450000, // Đồng bộ chuẩn 450.000 đ
        status: 'available'
      });
    }
  });

  return generated;
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

    const info = this.scheduleInfo() || this.resolveScheduleFallback(this.scheduleId());

    // Lưu vào sessionStorage để Checkout Funnel nhận
    sessionStorage.setItem('city_musical_checkout', JSON.stringify({
      scheduleId: this.scheduleId(),
      musicalSlug: info.musicalSlug || 'loi-the-thu-9',
      musicalTitle: info.musicalTitle || 'Lời Thề Thứ 9',
      performanceDate: info.performanceDate,
      performanceTime: info.time || '20:00',
      hall: info.hall || 'Khán phòng Grand A - Hoàng Gia',
      seats: bookedSeats,
      totalPrice: this.totalSeatPrice()
    }));

    this.router.navigate(['/checkout']);
  }
}
