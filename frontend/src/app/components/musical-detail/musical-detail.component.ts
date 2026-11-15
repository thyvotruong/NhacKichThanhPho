/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/musical-detail/musical-detail.component.ts
 * Chức năng: Hiển thị chi tiết Vở Diễn, chọn ngày/giờ và điều hướng chọn ghế.
 * ============================================================
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MusicalService } from '../../services/musical.service';
import { Musical, Schedule } from '../../models/musical.model';

interface ScheduleDayOption {
  dateKey: string;
  date: Date;
  schedules: Schedule[];
}

@Component({
  selector: 'app-musical-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './musical-detail.component.html',
  styleUrls: ['./musical-detail.component.css']
})
export class MusicalDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly musicalService = inject(MusicalService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly trailerUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    'https://www.youtube.com/embed/KzhS5r5l54g?autoplay=1'
  );

  // Angular Signals quản lý trạng thái giao diện
  slug = signal<string>('');
  musical = signal<Musical | null>(null);
  schedules = signal<Schedule[]>([]);
  isLoading = signal<boolean>(true);
  showTrailerModal = signal<boolean>(false);
  selectedDateKey = signal<string | null>(null);

  private readonly mockScheduleTimes = ['15:00', '19:30', '20:00'];
  private readonly scheduleEndDate = new Date(2026, 10, 30);

  scheduleDays = computed(() => this.groupSchedulesByDate(this.schedules()));
  visibleScheduleDays = computed(() => this.scheduleDays().slice(0, 4));
  selectedDateSchedules = computed(() =>
    this.scheduleDays().find(day => day.dateKey === this.selectedDateKey())?.schedules ?? []
  );

  ngOnInit(): void {
    // Lắng nghe tham số slug động từ URL (/musical/:slug)
    this.route.paramMap.subscribe((params) => {
      const slugParam = params.get('slug');
      if (slugParam) {
        this.slug.set(slugParam);
        this.loadMusicalDetail(slugParam);
      }
    });
  }

  /**
   * Tải thông tin chi tiết vở nhạc kịch từ Service
   */
  loadMusicalDetail(slug: string): void {
    this.isLoading.set(true);
    this.selectedDateKey.set(null);

    this.musicalService.getMusicalBySlug(slug).subscribe({
      next: (data) => {
        this.musical.set(data);
        this.schedules.set(this.createScheduleOptions(data, data.schedules ?? []));
        this.isLoading.set(false);
      },
      error: () => {
        this.loadStaticFallback(slug);
      }
    });
  }

  selectDate(dateKey: string): void {
    this.selectedDateKey.set(dateKey);
  }

  isToday(dateKey: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.formatDateKey(today) === dateKey;
  }

  openTrailer(): void {
    this.showTrailerModal.set(true);
  }

  closeTrailer(): void {
    this.showTrailerModal.set(false);
  }

  private createScheduleOptions(musical: Musical, apiSchedules: Schedule[]): Schedule[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDateKey = this.formatDateKey(today);
    const endDateKey = this.formatDateKey(this.scheduleEndDate);
    const schedulesByDate = new Map<string, Schedule[]>();

    for (const schedule of apiSchedules) {
      const dateKey = this.toDateKey(schedule.performanceDate);
      if (!dateKey || dateKey < firstDateKey || dateKey > endDateKey) {
        continue;
      }

      const daySchedules = schedulesByDate.get(dateKey) ?? [];
      daySchedules.push(schedule);
      schedulesByDate.set(dateKey, daySchedules);
    }

    const scheduleOptions: Schedule[] = [];
    for (const date = new Date(today); date <= this.scheduleEndDate; date.setDate(date.getDate() + 1)) {
      const day = new Date(date);
      const dateKey = this.formatDateKey(day);
      const apiDaySchedules = schedulesByDate.get(dateKey);

      if (apiDaySchedules?.length) {
        scheduleOptions.push(...apiDaySchedules.sort((a, b) => a.time.localeCompare(b.time)));
      } else {
        scheduleOptions.push(
          ...this.mockScheduleTimes.map(time => this.createMockSchedule(musical, day, dateKey, time))
        );
      }
    }

    return scheduleOptions;
  }

  private createMockSchedule(musical: Musical, date: Date, dateKey: string, time: string): Schedule {
    const [hours, minutes] = time.split(':').map(Number);
    const dateId = dateKey.replace(/-/g, '');

    return {
      _id: `mock_${musical.slug}_${dateId}_${time.replace(':', '')}`,
      musicalId: musical._id,
      musicalTitle: musical.title,
      musicalSlug: musical.slug,
      performanceDate: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes),
      time,
      venue: 'Nhà Hát Thành Phố',
      hall: 'Khán phòng chính',
      totalSeats: 120,
      bookedSeats: 0,
      status: 'available'
    };
  }

  private groupSchedulesByDate(schedules: Schedule[]): ScheduleDayOption[] {
    const grouped = new Map<string, Schedule[]>();
    for (const schedule of schedules) {
      const dateKey = this.toDateKey(schedule.performanceDate);
      if (!dateKey) {
        continue;
      }

      const daySchedules = grouped.get(dateKey) ?? [];
      daySchedules.push(schedule);
      grouped.set(dateKey, daySchedules);
    }

    return [...grouped.entries()]
      .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
      .map(([dateKey, daySchedules]) => ({
        dateKey,
        date: new Date(`${dateKey}T12:00:00`),
        schedules: daySchedules.sort((a, b) => a.time.localeCompare(b.time))
      }));
  }

  private toDateKey(value: string | Date): string | null {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : this.formatDateKey(date);
  }

  private formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Dữ liệu Fallback dự phòng trong trường hợp offline
   */
  private loadStaticFallback(slug: string): void {
    if (slug === 'giac-mo-mua-he') {
      const fallbackMusical: Musical = {
        title: 'Giấc Mơ Mùa Hè',
        slug: 'giac-mo-mua-he',
        subtitle: 'Bản tình ca Broadway rực rỡ và lãng mạn bậc nhất',
        genre: 'Lãng Mạn',
        status: 'now_showing',
        posterUrl: 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&w=800&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1920&q=80',
        duration: 135,
        director: 'Đạo diễn Nguyễn Lê Hoàng',
        cast: ['Hoàng Dũng', 'Bùi Lan Hương', 'Trung Quân', 'Dàn nhạc Giao hưởng Sài Gòn'],
        synopsis: 'Lấy cảm hứng từ những bản tình ca bất hủ mang phong vị Broadway cổ điển, "Giấc Mơ Mùa Hè" dẫn dắt khán giả vào chuyến hành trình tìm kiếm ánh sáng nghệ thuật và tình yêu định mệnh của đôi nghệ sĩ trẻ...',
        ticketPrices: [
          { tier: 'VIP', name: 'Hạng VIP Kim Cương', price: 950000, description: 'Hàng ghế VIP danh dự, chụp ảnh lưu niệm cùng nghệ sĩ' },
          { tier: 'Standard', name: 'Hạng Tiêu Chuẩn', price: 500000, description: 'Vị trí ghế ngồi êm ái khu vực trung tâm' },
          { tier: 'Eco', name: 'Hạng Phổ Thông', price: 300000, description: 'Ghế ngồi tầng 2 thoáng đãng' }
        ]
      };
      this.musical.set(fallbackMusical);
      this.schedules.set(this.createScheduleOptions(fallbackMusical, []));
    } else {
      const fallbackMusical: Musical = {
        title: 'Bông Bóng Bay',
        slug: 'bong-bong-bay',
        subtitle: 'Bản trường ca thanh xuân rực rỡ và những ước mơ bay bổng',
        genre: 'Broadway',
        status: 'now_showing',
        posterUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1920&q=80',
        duration: 120,
        director: 'NSƯT Trần Minh Đức',
        cast: ['Lan Phương', 'Quang Tuấn', 'Khả Như', 'Huỳnh Lập', 'Vũ đoàn Nhà Hát'],
        synopsis: 'Vở nhạc kịch Bông Bóng Bay là câu chuyện hoài niệm đong đầy cảm xúc về tuổi thanh xuân rực rỡ, nơi những đứa trẻ lớn lên cùng những quả bóng bay chở đầy hoài bão giữa lòng Sài Gòn. Giữa những thăng trầm thị thành, tình bạn và ước mơ thuở ban đầu vẫn vẹn nguyên...',
        ticketPrices: [
          { tier: 'VIP', name: 'Hạng VIP Hoàng Gia', price: 800000, description: 'Vị trí trung tâm A-C, tặng đồ uống và kỷ yếu' },
          { tier: 'Standard', name: 'Hạng Tiêu Chuẩn', price: 450000, description: 'Khu vực tầng trệt D-L, âm thanh chuẩn quốc tế' },
          { tier: 'Eco', name: 'Hạng Phổ Thông', price: 250000, description: 'Tầng lầu ban công tầm nhìn bao quát' }
        ]
      };
      this.musical.set(fallbackMusical);
      this.schedules.set(this.createScheduleOptions(fallbackMusical, []));
    }

    this.isLoading.set(false);
  }
}
