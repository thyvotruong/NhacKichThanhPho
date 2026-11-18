/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/musical-detail/musical-detail.component.ts
 * Chức năng: Hiển thị chi tiết Vở Diễn, chọn ngày/giờ và điều hướng chọn ghế.
 * ============================================================
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
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

  // Angular Signals quản lý trạng thái giao diện
  slug = signal<string>('');
  musical = signal<Musical | null>(null);
  schedules = signal<Schedule[]>([]);
  isLoading = signal<boolean>(true);
  showTrailerModal = signal<boolean>(false);
  selectedDateKey = signal<string | null>(null);
  isSubmittingNotification = signal<boolean>(false);
  notificationMessage = signal<string>('');
  notificationError = signal<string>('');

  readonly trailerUrl = computed<SafeResourceUrl>(() => {
    const raw = this.musical()?.trailerUrl || 'https://www.youtube.com/embed/RclpGv8673s';
    const embedUrl = raw.includes('?') ? `${raw}&autoplay=1` : `${raw}?autoplay=1`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  });

  formatGenre(genre: any): string {
    if (Array.isArray(genre)) return genre.join(' • ');
    return String(genre || '');
  }

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
    this.notificationMessage.set('');
    this.notificationError.set('');

    this.musicalService.getMusicalBySlug(slug).subscribe({
      next: (data) => {
        this.musical.set(data);
        this.schedules.set(
          data.status === 'coming_soon'
            ? []
            : this.createScheduleOptions(data, data.schedules ?? [])
        );
        this.isLoading.set(false);
      },
      error: () => {
        this.loadStaticFallback(slug);
      }
    });
  }

  subscribeToScheduleNotifications(event: Event, email: string): void {
    event.preventDefault();
    const musical = this.musical();
    const cleanEmail = email.trim();

    if (!musical || musical.status !== 'coming_soon' || this.isSubmittingNotification()) return;
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      this.notificationError.set('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    this.isSubmittingNotification.set(true);
    this.notificationMessage.set('');
    this.notificationError.set('');
    const source = 'coming_soon_musical';
    this.musicalService.subscribeNewsletter(cleanEmail, source, musical.title).subscribe({
      next: (response) => {
        this.notificationMessage.set(response.message);
        this.isSubmittingNotification.set(false);
        const input = document.getElementById('scheduleNotificationEmail') as HTMLInputElement;
        if (input) input.value = '';
      },
      error: (error: HttpErrorResponse) => {
        this.notificationError.set(error.error?.message || 'Không thể đăng ký nhận thông báo lúc này.');
        this.isSubmittingNotification.set(false);
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
   * Dữ liệu Fallback dự phòng đọc trực tiếp từ static JSON file
   */
  private loadStaticFallback(slug: string): void {
    fetch('/musicals.json')
      .then(res => res.json())
      .then((musicals: Musical[]) => {
        const found = (musicals || []).find(m => m.slug === slug || m._id === slug) || musicals[0];
        if (found) {
          this.musical.set(found);
          this.schedules.set(
            found.status === 'coming_soon'
              ? []
              : this.createScheduleOptions(found, [])
          );
        }
        this.isLoading.set(false);
      })
      .catch(() => {
        this.isLoading.set(false);
      });
  }
}
