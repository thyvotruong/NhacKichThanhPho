/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/schedules/schedules.component.ts
 * Chức năng: Phân hệ Lịch diễn (/schedules) - Sitemap Mục 3
 * Bộ lọc thông minh mới:
 * 1. Tìm kiếm realtime theo tên vở (Search Input)
 * 2. Lọc theo thể loại nhạc kịch (Category Filter Dropdown)
 * 3. Lọc theo khoảng thời gian (Date Range: startDate -> endDate)
 * 4. Lọc theo khung giờ (Multi-select Time Slots: selectedTimes)
 * ============================================================
 */

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MusicalService } from '../../services/musical.service';
import { Schedule } from '../../models/musical.model';

export interface ScheduleWithGenre extends Schedule {
  genre?: string;
}

@Component({
  selector: 'app-schedules',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, FormsModule],
  templateUrl: './schedules.component.html',
  styleUrls: ['./schedules.component.css']
})
export class SchedulesComponent implements OnInit {
  private readonly musicalService = inject(MusicalService);

  schedules = signal<ScheduleWithGenre[]>([]);
  isLoading = signal<boolean>(true);

  // ==========================================
  // HỆ THỐNG BỘ LỌC MỚI THEO YÊU CẦU QUY HOẠCH
  // ==========================================

  // 1. Thanh tìm kiếm theo tên vở kịch
  searchQuery = signal<string>('');

  // 2. Bộ lọc theo thể loại (Category Dropdown)
  selectedGenre = signal<string>('all');

  // Danh mục thể loại nhạc kịch
  readonly genres: { id: string; label: string }[] = [
    { id: 'all', label: 'Tất cả thể loại' },
    { id: 'Broadway', label: 'Broadway' },
    { id: 'Kịch kinh điển', label: 'Kịch kinh điển' },
    { id: 'Lãng Mạn', label: 'Lãng Mạn' },
    { id: 'Dân Gian Đương Đại', label: 'Dân Gian Đương Đại' },
    { id: 'Thiếu Nhi', label: 'Thiếu Nhi' }
  ];

  // 3. Bộ lọc theo khoảng thời gian (Date Range)
  startDate = signal<string>('');
  endDate = signal<string>('');

  // 4. Bộ lọc theo khung giờ (Multi-select Time Slots)
  selectedTimes = signal<string[]>([]);

  // Danh sách các khung giờ diễn phổ biến
  readonly availableTimeSlots: string[] = ['09:30', '15:00', '19:00', '19:30', '20:00'];

  // Bản đồ thể loại mặc định theo slug
  private readonly genreMap: Record<string, string> = {
    'bong-bong-bay': 'Broadway',
    'giac-mo-mua-he': 'Lãng Mạn',
    'hon-truong-ba': 'Kịch kinh điển',
    'chuyen-co-xu-ky-dieu': 'Thiếu Nhi',
    'da-co-hoai-lang': 'Dân Gian Đương Đại'
  };

  // Cờ nhận biết đang có bộ lọc nào được áp dụng
  hasActiveFilters = computed(() => {
    return (
      this.searchQuery().trim() !== '' ||
      this.selectedGenre() !== 'all' ||
      this.startDate() !== '' ||
      this.endDate() !== '' ||
      this.selectedTimes().length > 0
    );
  });

  // ==========================================
  // LOGIC LỌC TỔNG HỢP (COMPUTED SIGNAL)
  // ==========================================
  filteredSchedules = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const genre = this.selectedGenre();
    const start = this.startDate();
    const end = this.endDate();
    const times = this.selectedTimes();

    return this.schedules().filter(s => {
      // 1. Lọc theo từ khóa tên vở
      if (query && !s.musicalTitle.toLowerCase().includes(query)) {
        return false;
      }

      // 2. Lọc theo thể loại
      if (genre !== 'all') {
        const itemGenre = (s.genre || this.genreMap[s.musicalSlug] || '').toLowerCase();
        if (itemGenre !== genre.toLowerCase()) {
          return false;
        }
      }

      // 3. Lọc theo khoảng ngày (startDate -> endDate)
      if (start || end) {
        try {
          const itemDate = new Date(s.performanceDate);
          const dateStr = itemDate.toISOString().split('T')[0];

          if (start && dateStr < start) {
            return false;
          }
          if (end && dateStr > end) {
            return false;
          }
        } catch {
          // Bỏ qua nếu ngày không hợp lệ
        }
      }

      // 4. Lọc theo khung giờ (Multi-select: Khớp bất kỳ khung giờ nào được tick chọn)
      if (times.length > 0) {
        if (!times.includes(s.time)) {
          return false;
        }
      }

      return true;
    });
  });

  ngOnInit(): void {
    this.loadSchedules();
  }

  loadSchedules(): void {
    this.isLoading.set(true);
    this.musicalService.getSchedules().subscribe({
      next: (data: Schedule[]) => {
        if (data && data.length > 0) {
          const enriched: ScheduleWithGenre[] = data.map(s => ({
            ...s,
            genre: (s as any).genre || this.genreMap[s.musicalSlug] || 'Broadway'
          }));
          this.schedules.set(enriched);
        } else {
          this.schedules.set(this.getMockSchedules());
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.schedules.set(this.getMockSchedules());
        this.isLoading.set(false);
      }
    });
  }

  // ==========================================
  // THAO TÁC BỘ LỌC
  // ==========================================

  // Toggle chọn / bỏ chọn một khung giờ (Multi-select)
  toggleTimeSlot(time: string): void {
    const current = this.selectedTimes();
    if (current.includes(time)) {
      this.selectedTimes.set(current.filter(t => t !== time));
    } else {
      this.selectedTimes.set([...current, time]);
    }
  }

  // Kiểm tra khung giờ có đang được tick hay không
  isTimeSelected(time: string): boolean {
    return this.selectedTimes().includes(time);
  }

  // Xóa trắng toàn bộ bộ lọc về mặc định
  resetAllFilters(): void {
    this.searchQuery.set('');
    this.selectedGenre.set('all');
    this.startDate.set('');
    this.endDate.set('');
    this.selectedTimes.set([]);
  }

  // Dữ liệu mẫu phong phú bao quát toàn bộ thể loại và khung giờ
  private getMockSchedules(): ScheduleWithGenre[] {
    const today = new Date();
    return [
      {
        _id: 'SCHED-01',
        musicalTitle: 'Bông Bóng Bay - Giấc Mơ Tuổi Thơ',
        musicalSlug: 'bong-bong-bay',
        genre: 'Broadway',
        performanceDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        time: '19:30',
        venue: 'Nhà hát Lớn Thành phố',
        hall: 'Khán phòng Hoàng Gia (Stalls & Grand Tier)',
        totalSeats: 120,
        bookedSeats: 48,
        status: 'available'
      },
      {
        _id: 'SCHED-02',
        musicalTitle: 'Bông Bóng Bay - Giấc Mơ Tuổi Thơ',
        musicalSlug: 'bong-bong-bay',
        genre: 'Broadway',
        performanceDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        time: '15:00',
        venue: 'Nhà hát Lớn Thành phố',
        hall: 'Khán phòng Hoàng Gia (Matinee)',
        totalSeats: 120,
        bookedSeats: 115,
        status: 'available'
      },
      {
        _id: 'SCHED-03',
        musicalTitle: 'Giấc Mơ Mùa Hè (A Midsummer Night)',
        musicalSlug: 'giac-mo-mua-he',
        genre: 'Lãng Mạn',
        performanceDate: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        time: '20:00',
        venue: 'Nhà hát Lớn Thành phố',
        hall: 'Khán phòng Broadway Opera Hall',
        totalSeats: 150,
        bookedSeats: 70,
        status: 'available'
      },
      {
        _id: 'SCHED-04',
        musicalTitle: 'Giấc Mơ Mùa Hè (A Midsummer Night)',
        musicalSlug: 'giac-mo-mua-he',
        genre: 'Lãng Mạn',
        performanceDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        time: '19:00',
        venue: 'Nhà hát Lớn Thành phố',
        hall: 'Khán phòng Broadway Opera Hall',
        totalSeats: 150,
        bookedSeats: 150,
        status: 'sold_out'
      },
      {
        _id: 'SCHED-05',
        musicalTitle: 'Hồn Trương Ba Da Hàng Thịt',
        musicalSlug: 'hon-truong-ba',
        genre: 'Kịch kinh điển',
        performanceDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        time: '19:30',
        venue: 'Nhà hát Lớn Thành phố',
        hall: 'Khán phòng Thể Nghiệm Hiện Đại',
        totalSeats: 100,
        bookedSeats: 32,
        status: 'available'
      },
      {
        _id: 'SCHED-06',
        musicalTitle: 'Chuyện Cổ Xứ Kỳ Diệu',
        musicalSlug: 'chuyen-co-xu-ky-dieu',
        genre: 'Thiếu Nhi',
        performanceDate: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        time: '09:30',
        venue: 'Nhà hát Lớn Thành phố',
        hall: 'Khán phòng Măng Non Tuổi Thơ',
        totalSeats: 90,
        bookedSeats: 45,
        status: 'available'
      },
      {
        _id: 'SCHED-07',
        musicalTitle: 'Dạ Cổ Hoài Lang',
        musicalSlug: 'da-co-hoai-lang',
        genre: 'Dân Gian Đương Đại',
        performanceDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        time: '20:00',
        venue: 'Nhà hát Lớn Thành phố',
        hall: 'Khán phòng Nghệ Thuật Truyền Thống',
        totalSeats: 110,
        bookedSeats: 88,
        status: 'available'
      }
    ];
  }
}
