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
import { forkJoin } from 'rxjs';
import { MusicalService } from '../../services/musical.service';
import { Musical, Schedule } from '../../models/musical.model';

export interface ScheduleWithGenre extends Schedule {
  genre?: string;
  posterUrl?: string;
  subtitle?: string;
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
    { id: 'Cổ tích', label: 'Cổ tích' },
    { id: 'Chính luận', label: 'Chính luận' },
    { id: 'Lịch sử', label: 'Lịch sử' },
    { id: 'Dân gian', label: 'Dân gian' },
    { id: 'Tâm lý', label: 'Tâm lý' },
    { id: 'Thiếu nhi', label: 'Thiếu nhi' },
    { id: 'Gia đình', label: 'Gia đình' }
  ];

  // 3. Bộ lọc theo khoảng thời gian (Date Range)
  startDate = signal<string>('');
  endDate = signal<string>('');

  // 4. Bộ lọc theo khung giờ (Multi-select Time Slots)
  selectedTimes = signal<string[]>([]);

  // Danh sách các khung giờ diễn phổ biến
  readonly availableTimeSlots: string[] = ['15:00', '19:30', '20:00'];

  // Bản đồ thể loại mặc định theo slug
  private readonly genreMap: Record<string, string> = {
    'lo-lem-chiec-giay-thuy-tinh': 'Cổ tích • Thiếu nhi • Gia đình',
    'loi-the-thu-9': 'Chính luận • Tâm lý',
    'tuoi-tho-du-doi': 'Lịch sử • Thiếu nhi • Gia đình',
    'hon-truong-ba-da-hang-thit': 'Dân gian • Tâm lý • Bi hài kịch',
    'quan-khu-nam-dong': 'Lịch sử • Tâm lý • Gia đình',
    'giac-mo-cua-bom': 'Dân gian • Thiếu nhi • Gia đình',
    'chu-be-nguoi-go-pinocchio': 'Cổ tích • Thiếu nhi • Gia đình',
    'noi-tinh-yeu-bat-dau': 'Tình cảm • Tâm lý'
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
        const itemGenre = String(s.genre || this.genreMap[s.musicalSlug] || '').toLowerCase();
        if (!itemGenre.includes(genre.toLowerCase())) {
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
    forkJoin({
      schedules: this.musicalService.getSchedules(),
      musicals: this.musicalService.getMusicals()
    }).subscribe({
      next: ({ schedules, musicals }) => {
        const scheduleList = schedules.length > 0 ? schedules : this.getMockSchedules();
        this.schedules.set(this.enrichSchedules(scheduleList, musicals));
        this.isLoading.set(false);
      },
      error: () => {
        this.schedules.set(this.enrichSchedules(this.getMockSchedules(), []));
        this.isLoading.set(false);
      }
    });
  }

  private enrichSchedules(schedules: Schedule[], musicals: Musical[]): ScheduleWithGenre[] {
    const musicalsBySlug = new Map(musicals.map(musical => [musical.slug, musical]));

    return schedules.map(schedule => {
      const musical = musicalsBySlug.get(schedule.musicalSlug);
      const rawGenre = musical?.genre || (schedule as any).genre || 'Kịch Nghệ';
      const formattedGenre = Array.isArray(rawGenre) ? rawGenre.join(' • ') : rawGenre;
      const posterUrl = musical?.posterUrl || (schedule as any).posterUrl || `/images/musicals/${schedule.musicalSlug.replace(/-/g, '_')}.jpg`;
      const subtitle = musical?.subtitle || musical?.synopsis || (schedule as any).subtitle;
      return {
        ...schedule,
        genre: formattedGenre,
        posterUrl,
        subtitle
      };
    });
  }

  availableSeatCount(schedule: ScheduleWithGenre): number {
    if (schedule.seats?.length) {
      return schedule.seats.filter(seat => seat.status === 'available').length;
    }

    return Math.max(0, schedule.totalSeats - schedule.bookedSeats - (schedule.lockedSeatsCount ?? 0));
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

  // Dữ liệu mẫu 20 suất diễn chuẩn rải đều phủ kín từ 18/11/2026 đến 30/11/2026
  private getMockSchedules(): ScheduleWithGenre[] {
    return [
      {
        _id: 'sch_lo-lem_20261118_1930',
        musicalTitle: 'Lọ Lem - Chiếc giày thủy tinh',
        musicalSlug: 'lo-lem-chiec-giay-thuy-tinh',
        genre: 'Cổ tích • Thiếu nhi • Gia đình',
        posterUrl: '/images/musicals/lo_lem_chiec_giay_thuy_tinh.jpg',
        subtitle: 'Câu chuyện cổ tích kinh điển qua sân khấu đa tầng, âm nhạc sôi động',
        performanceDate: '2026-11-18T19:30:00+07:00',
        time: '19:30',
        venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        totalSeats: 110,
        bookedSeats: 32,
        status: 'available'
      },
      {
        _id: 'sch_loi-the-thu-9_20261119_2000',
        musicalTitle: 'Lời thề thứ 9',
        musicalSlug: 'loi-the-thu-9',
        genre: 'Chính luận • Tâm lý',
        posterUrl: '/images/musicals/loi_the_thu_9.jpg',
        subtitle: 'Kiệt tác chính luận vượt thời gian của Lưu Quang Vũ với góc nhìn dí dỏm',
        performanceDate: '2026-11-19T20:00:00+07:00',
        time: '20:00',
        venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        totalSeats: 110,
        bookedSeats: 45,
        status: 'available'
      },
      {
        _id: 'sch_lo-lem-chiec-giay-thuy-tinh',
        musicalTitle: 'Lọ Lem - Chiếc giày thủy tinh',
        musicalSlug: 'lo-lem-chiec-giay-thuy-tinh',
        genre: 'Cổ tích • Thiếu nhi • Gia đình',
        posterUrl: '/images/musicals/lo_lem_chiec_giay_thuy_tinh.jpg',
        subtitle: 'Câu chuyện cổ tích kinh điển qua sân khấu đa tầng, âm nhạc sôi động',
        performanceDate: '2026-11-20T19:30:00+07:00',
        time: '19:30',
        venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        totalSeats: 110,
        bookedSeats: 62,
        status: 'available'
      },
      {
        _id: 'sch_giac-mo-cua-bom_20261120_2000',
        musicalTitle: 'Giấc mơ của Bờm',
        musicalSlug: 'giac-mo-cua-bom',
        genre: 'Dân gian • Thiếu nhi • Gia đình',
        posterUrl: '/images/musicals/giac_mo_cua_bom.jpg',
        subtitle: 'Góc nhìn mới mẻ từ tích truyện dân gian Thằng Bờm, âm nhạc dân gian đương đại',
        performanceDate: '2026-11-20T20:00:00+07:00',
        time: '20:00',
        venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1',
        hall: 'Khán phòng Broadway Opera',
        totalSeats: 110,
        bookedSeats: 40,
        status: 'available'
      },
      {
        _id: 'sch_lo-lem_20261121_1500',
        musicalTitle: 'Lọ Lem - Chiếc giày thủy tinh',
        musicalSlug: 'lo-lem-chiec-giay-thuy-tinh',
        genre: 'Cổ tích • Thiếu nhi • Gia đình',
        posterUrl: '/images/musicals/lo_lem_chiec_giay_thuy_tinh.jpg',
        subtitle: 'Suất diễn chiều Matinee gia đình với hiệu ứng nhiệm màu',
        performanceDate: '2026-11-21T15:00:00+07:00',
        time: '15:00',
        venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        totalSeats: 110,
        bookedSeats: 58,
        status: 'available'
      },
      {
        _id: 'sch_tuoi-tho-du-doi',
        musicalTitle: 'Tuổi thơ dữ dội',
        musicalSlug: 'tuoi-tho-du-doi',
        genre: 'Lịch sử • Thiếu nhi • Gia đình',
        posterUrl: '/images/musicals/tuoi_tho_du_doi.jpg',
        subtitle: 'Chuyển thể từ kiệt tác của nhà văn Phùng Quán, bản hùng ca về lòng dũng cảm',
        performanceDate: '2026-11-21T19:30:00+07:00',
        time: '19:30',
        venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        totalSeats: 110,
        bookedSeats: 70,
        status: 'available'
      },
      {
        _id: 'sch_giac-mo-cua-bom_20261122_1500',
        musicalTitle: 'Giấc mơ của Bờm',
        musicalSlug: 'giac-mo-cua-bom',
        genre: 'Dân gian • Thiếu nhi • Gia đình',
        posterUrl: '/images/musicals/giac_mo_cua_bom.jpg',
        subtitle: 'Suất diễn chiều cuối tuần ngập tràn tiếng cười thiếu nhi',
        performanceDate: '2026-11-22T15:00:00+07:00',
        time: '15:00',
        venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        totalSeats: 110,
        bookedSeats: 55,
        status: 'available'
      },
      {
        _id: 'sch_quan-khu-nam-dong',
        musicalTitle: 'Quân khu Nam Đồng',
        musicalSlug: 'quan-khu-nam-dong',
        genre: 'Lịch sử • Tâm lý • Gia đình',
        posterUrl: '/images/musicals/quan_khu_nam_dong.jpg',
        subtitle: 'Bức tranh tuổi thơ dữ dội, hóm hỉnh và ấm áp tình người tại khu gia binh',
        performanceDate: '2026-11-22T20:00:00+07:00',
        time: '20:00',
        venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1',
        hall: 'Khán phòng Broadway Opera',
        totalSeats: 110,
        bookedSeats: 48,
        status: 'available'
      },
      {
        _id: 'sch_hon-truong-ba-da-hang-thit',
        musicalTitle: 'Hồn Trương Ba, Da Hàng Thịt',
        musicalSlug: 'hon-truong-ba-da-hang-thit',
        genre: 'Dân gian • Tâm lý • Bi hài kịch',
        posterUrl: '/images/musicals/hon_truong_ba_da_hang_thit.jpg',
        subtitle: 'Kiệt tác sân khấu kinh điển dưới bàn tay dàn dựng của đạo diễn Anne Bouvier',
        performanceDate: '2026-11-23T19:30:00+07:00',
        time: '19:30',
        venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        totalSeats: 110,
        bookedSeats: 64,
        status: 'available'
      },
      {
        _id: 'sch_loi-the-thu-9',
        musicalTitle: 'Lời thề thứ 9',
        musicalSlug: 'loi-the-thu-9',
        genre: 'Chính luận • Tâm lý',
        posterUrl: '/images/musicals/loi_the_thu_9.jpg',
        subtitle: 'Kiệt tác chính luận vượt thời gian của Lưu Quang Vũ với góc nhìn dí dỏm',
        performanceDate: '2026-11-24T20:00:00+07:00',
        time: '20:00',
        venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        totalSeats: 110,
        bookedSeats: 52,
        status: 'available'
      },
      {
        _id: 'sch_giac-mo-cua-bom',
        musicalTitle: 'Giấc mơ của Bờm',
        musicalSlug: 'giac-mo-cua-bom',
        genre: 'Dân gian • Thiếu nhi • Gia đình',
        posterUrl: '/images/musicals/giac_mo_cua_bom.jpg',
        subtitle: 'Góc nhìn mới mẻ từ tích truyện dân gian Thằng Bờm, âm nhạc dân gian đương đại',
        performanceDate: '2026-11-25T19:30:00+07:00',
        time: '19:30',
        venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        totalSeats: 110,
        bookedSeats: 42,
        status: 'available'
      },
      {
        _id: 'sch_tuoi-tho-du-doi_20261126_1930',
        musicalTitle: 'Tuổi thơ dữ dội',
        musicalSlug: 'tuoi-tho-du-doi',
        genre: 'Lịch sử • Thiếu nhi • Gia đình',
        posterUrl: '/images/musicals/tuoi_tho_du_doi.jpg',
        subtitle: 'Chuyển thể từ kiệt tác của nhà văn Phùng Quán, bản hùng ca về lòng dũng cảm',
        performanceDate: '2026-11-26T19:30:00+07:00',
        time: '19:30',
        venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        totalSeats: 110,
        bookedSeats: 50,
        status: 'available'
      },
      {
        _id: 'sch_lo-lem_20261127_1930',
        musicalTitle: 'Lọ Lem - Chiếc giày thủy tinh',
        musicalSlug: 'lo-lem-chiec-giay-thuy-tinh',
        genre: 'Cổ tích • Thiếu nhi • Gia đình',
        posterUrl: '/images/musicals/lo_lem_chiec_giay_thuy_tinh.jpg',
        subtitle: 'Hành trình cảm xúc gắn kết cả gia đình cùng phép màu cổ tích',
        performanceDate: '2026-11-27T19:30:00+07:00',
        time: '19:30',
        venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        totalSeats: 110,
        bookedSeats: 66,
        status: 'available'
      },
      {
        _id: 'sch_hon-truong-ba_20261127_2000',
        musicalTitle: 'Hồn Trương Ba, Da Hàng Thịt',
        musicalSlug: 'hon-truong-ba-da-hang-thit',
        genre: 'Dân gian • Tâm lý • Bi hài kịch',
        posterUrl: '/images/musicals/hon_truong_ba_da_hang_thit.jpg',
        subtitle: 'Cuộc giằng co nghiệt ngã giữa linh hồn thanh cao và thể xác trần tục',
        performanceDate: '2026-11-27T20:00:00+07:00',
        time: '20:00',
        venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1',
        hall: 'Khán phòng Broadway Opera',
        totalSeats: 110,
        bookedSeats: 54,
        status: 'available'
      },
      {
        _id: 'sch_giac-mo-cua-bom_20261128_1500',
        musicalTitle: 'Giấc mơ của Bờm',
        musicalSlug: 'giac-mo-cua-bom',
        genre: 'Dân gian • Thiếu nhi • Gia đình',
        posterUrl: '/images/musicals/giac_mo_cua_bom.jpg',
        subtitle: 'Suất diễn cuối tuần rực rỡ sắc màu văn hóa dân gian Việt',
        performanceDate: '2026-11-28T15:00:00+07:00',
        time: '15:00',
        venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        totalSeats: 110,
        bookedSeats: 48,
        status: 'available'
      },
      {
        _id: 'sch_quan-khu-nam-dong_20261128_1930',
        musicalTitle: 'Quân khu Nam Đồng',
        musicalSlug: 'quan-khu-nam-dong',
        genre: 'Lịch sử • Tâm lý • Gia đình',
        posterUrl: '/images/musicals/quan_khu_nam_dong.jpg',
        subtitle: 'Ký ức hào hùng và ấm áp của thế hệ thiếu niên thời hoa lửa',
        performanceDate: '2026-11-28T19:30:00+07:00',
        time: '19:30',
        venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        totalSeats: 110,
        bookedSeats: 60,
        status: 'available'
      },
      {
        _id: 'sch_tuoi-tho-du-doi_20261129_1500',
        musicalTitle: 'Tuổi thơ dữ dội',
        musicalSlug: 'tuoi-tho-du-doi',
        genre: 'Lịch sử • Thiếu nhi • Gia đình',
        posterUrl: '/images/musicals/tuoi_tho_du_doi.jpg',
        subtitle: 'Suất chiếu chiều Chủ Nhật tri ân khán giả và thanh thiếu niên',
        performanceDate: '2026-11-29T15:00:00+07:00',
        time: '15:00',
        venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        totalSeats: 110,
        bookedSeats: 58,
        status: 'available'
      },
      {
        _id: 'sch_lo-lem_20261129_1930',
        musicalTitle: 'Lọ Lem - Chiếc giày thủy tinh',
        musicalSlug: 'lo-lem-chiec-giay-thuy-tinh',
        genre: 'Cổ tích • Thiếu nhi • Gia đình',
        posterUrl: '/images/musicals/lo_lem_chiec_giay_thuy_tinh.jpg',
        subtitle: 'Đêm diễn tiền Gala đặc sắc tại Khán phòng Grand A',
        performanceDate: '2026-11-29T19:30:00+07:00',
        time: '19:30',
        venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        totalSeats: 110,
        bookedSeats: 72,
        status: 'available'
      },
      {
        _id: 'sch_loi-the-thu-9_20261130_1930',
        musicalTitle: 'Lời thề thứ 9',
        musicalSlug: 'loi-the-thu-9',
        genre: 'Chính luận • Tâm lý',
        posterUrl: '/images/musicals/loi_the_thu_9.jpg',
        subtitle: 'Suất diễn Gala Đặc Biệt chào mừng ngày 30/11/2026 tại Nhà Hát Lớn',
        performanceDate: '2026-11-30T19:30:00+07:00',
        time: '19:30',
        venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        totalSeats: 110,
        bookedSeats: 85,
        status: 'available'
      },
      {
        _id: 'sch_hon-truong-ba_20261130_2000',
        musicalTitle: 'Hồn Trương Ba, Da Hàng Thịt',
        musicalSlug: 'hon-truong-ba-da-hang-thit',
        genre: 'Dân gian • Tâm lý • Bi hài kịch',
        posterUrl: '/images/musicals/hon_truong_ba_da_hang_thit.jpg',
        subtitle: 'Suất diễn Gala Nghệ Thuật Đỉnh Cao ngày 30/11/2026',
        performanceDate: '2026-11-30T20:00:00+07:00',
        time: '20:00',
        venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1',
        hall: 'Khán phòng Broadway Opera',
        totalSeats: 110,
        bookedSeats: 80,
        status: 'available'
      }
    ];
  }
}
