/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/home/home.component.ts
 * Chức năng: Homepage Component với Hero Banner Slider,
 * Lịch diễn nổi bật (@for, @if), và Gương mặt nghệ sĩ tiêu biểu.
 * ============================================================
 */

import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MusicalService } from '../../services/musical.service';
import { Musical, Schedule, Artist } from '../../models/musical.model';

type FeaturedMusical = Musical & { isDemo?: boolean };

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private readonly musicalService = inject(MusicalService);

  @ViewChild('featuredMusicalsTrack')
  private featuredMusicalsTrack?: ElementRef<HTMLDivElement>;

  // Angular Signals quản lý trạng thái
  musicals = signal<FeaturedMusical[]>([]);
  schedules = signal<Schedule[]>([]);
  artists = signal<Artist[]>([]);
  isLoading = signal<boolean>(true);

  // Quản lý chỉ số Slide Hero Banner đang hiển thị
  activeSlideIndex = signal<number>(0);

  // Các vở đang diễn được nạp động vào Hero Banner.
  heroSlides: any[] = [];

  ngOnInit(): void {
    this.loadData();
    this.startHeroSlider();
  }

  getMinPrice(musical: Musical): number {
    if (!musical.ticketPrices || musical.ticketPrices.length === 0) return 450000;
    return Math.min(...musical.ticketPrices.map(t => t.price || 0));
  }

  formatGenre(genre: any): string {
    if (Array.isArray(genre)) return genre.join(' • ');
    return String(genre || '');
  }

  getUpcomingSchedules(): Schedule[] {
    const getPerformanceTime = (schedule: Schedule): number =>
      schedule.performanceDate instanceof Date
        ? schedule.performanceDate.getTime()
        : Date.parse(schedule.performanceDate);
    const now = Date.now();

    return this.schedules()
      .filter(schedule =>
        schedule.status === 'available' &&
        schedule.bookedSeats < schedule.totalSeats &&
        getPerformanceTime(schedule) >= now
      )
      .sort((a, b) => getPerformanceTime(a) - getPerformanceTime(b))
      .slice(0, 4);
  }

  /**
   * Tải dữ liệu đồng thời từ API Backend
   */
  loadData(): void {
    this.isLoading.set(true);

    // 1. Tải danh sách vở nhạc kịch
    this.musicalService.getMusicals().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.musicals.set(data);

          // Hiển thị lần lượt tất cả các vở đang diễn trên Hero Banner.
          this.heroSlides = data.filter(m => m.status === 'now_showing').map(m => ({
            title: m.title,
            subtitle: m.subtitle || (m.synopsis ? m.synopsis.slice(0, 100) + '...' : ''),
            slug: m.slug,
            director: m.director,
            time: `${m.duration} Phút | Khán phòng Grand A`,
            posterUrl: m.posterUrl,
            bgImage: m.posterUrl || m.bannerUrl,
            badge: 'Đang Diễn'
          }));
          this.activeSlideIndex.set(0);
        } else {
          this.musicals.set([]);
          this.heroSlides = [];
          this.activeSlideIndex.set(0);
        }
      }
    });

    // 2. Tải danh sách lịch diễn
    this.musicalService.getSchedules().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.schedules.set(data);
        } else {
          this.schedules.set([
            {
              _id: 'sch_lo-lem-chiec-giay-thuy-tinh',
              musicalSlug: 'lo-lem-chiec-giay-thuy-tinh',
              musicalTitle: 'Lọ Lem - Chiếc giày thủy tinh',
              performanceDate: '2026-11-20T19:30:00Z',
              time: '19:30',
              venue: 'Nhà Hát Thành Phố - Số 07 Lam Sơn, Q.1',
              hall: 'Khán phòng Grand A - Hoàng Gia',
              totalSeats: 110,
              bookedSeats: 35,
              status: 'available'
            },
            {
              _id: 'sch_loi-the-thu-9',
              musicalSlug: 'loi-the-thu-9',
              musicalTitle: 'Lời thề thứ 9',
              performanceDate: '2026-11-22T20:00:00Z',
              time: '20:00',
              venue: 'Nhà Hát Thành Phố - Số 07 Lam Sơn, Q.1',
              hall: 'Khán phòng Grand A - Hoàng Gia',
              totalSeats: 110,
              bookedSeats: 48,
              status: 'available'
            },
            {
              _id: 'sch_tuoi-tho-du-doi',
              musicalSlug: 'tuoi-tho-du-doi',
              musicalTitle: 'Tuổi thơ dữ dội',
              performanceDate: '2026-11-24T19:30:00Z',
              time: '19:30',
              venue: 'Nhà Hát Thành Phố - Số 07 Lam Sơn, Q.1',
              hall: 'Khán phòng Grand A - Hoàng Gia',
              totalSeats: 110,
              bookedSeats: 52,
              status: 'available'
            },
            {
              _id: 'sch_hon-truong-ba-da-hang-thit',
              musicalSlug: 'hon-truong-ba-da-hang-thit',
              musicalTitle: 'Hồn Trương Ba, Da Hàng Thịt',
              performanceDate: '2026-11-26T20:00:00Z',
              time: '20:00',
              venue: 'Nhà Hát Thành Phố - Số 07 Lam Sơn, Q.1',
              hall: 'Khán phòng Broadway Opera',
              totalSeats: 110,
              bookedSeats: 60,
              status: 'available'
            },
            {
              _id: 'sch_quan-khu-nam-dong',
              musicalSlug: 'quan-khu-nam-dong',
              musicalTitle: 'Quân khu Nam Đồng',
              performanceDate: '2026-11-28T19:30:00Z',
              time: '19:30',
              venue: 'Nhà Hát Thành Phố - Số 07 Lam Sơn, Q.1',
              hall: 'Khán phòng Grand A - Hoàng Gia',
              totalSeats: 110,
              bookedSeats: 40,
              status: 'available'
            },
            {
              _id: 'sch_giac-mo-cua-bom',
              musicalSlug: 'giac-mo-cua-bom',
              musicalTitle: 'Giấc mơ của Bờm',
              performanceDate: '2026-11-30T20:00:00Z',
              time: '20:00',
              venue: 'Nhà Hát Thành Phố - Số 07 Lam Sơn, Q.1',
              hall: 'Khán phòng Grand A - Hoàng Gia',
              totalSeats: 110,
              bookedSeats: 30,
              status: 'available'
            }
          ]);
        }
      }
    });

    // 3. Tải danh sách nghệ sĩ
    this.musicalService.getArtists().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.artists.set(data);
        } else {
          this.artists.set([
            {
              name: 'NSND Bạch Tuyết',
              role: 'Cố vấn Nghệ thuật Cấp cao',
              title: 'Tiến sĩ Nghệ thuật học',
              avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
              bio: 'Người nghệ sĩ huyền thoại của sân khấu kịch nghệ với tâm huyết đưa nhạc kịch Việt vươn tầm.'
            },
            {
              name: 'NSƯT Trần Minh Đức',
              role: 'Giám đốc Nghệ thuật & Tổng Đạo diễn',
              title: 'Đạo diễn Nhạc kịch Quốc tế',
              avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
              bio: 'Tốt nghiệp London, đạo diễn sáng tạo của "Bông Bóng Bay" và nhiều kiệt tác đương đại.'
            },
            {
              name: 'Đạo diễn Nguyễn Lê Hoàng',
              role: 'Giám đốc Âm nhạc & Dàn dựng Sân khấu',
              title: 'Nhạc sĩ / Chỉ huy Dàn nhạc',
              avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
              bio: 'Nhạc trưởng tài hoa với phong cách hòa âm phối khí Broadway sang trọng và đầy cảm xúc.'
            },
            {
              name: 'Nghệ sĩ Lan Phương',
              role: 'Diễn viên chính & Đào tạo Diễn xuất',
              title: 'Nữ Diễn viên Nhạc kịch Hàng đầu',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
              bio: 'Hóa thân trọn vẹn trong vai Mai Nhi - linh hồn xúc động của vở nhạc kịch "Bông Bóng Bay".'
            }
          ]);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  /**
   * Tự động chuyển đổi Slide Hero Banner định kỳ
   */
  startHeroSlider(): void {
    setInterval(() => {
      this.nextSlide();
    }, 6000);
  }

  nextSlide(): void {
    if (this.heroSlides.length === 0) return;
    const next = (this.activeSlideIndex() + 1) % this.heroSlides.length;
    this.activeSlideIndex.set(next);
  }

  prevSlide(): void {
    if (this.heroSlides.length === 0) return;
    const prev = (this.activeSlideIndex() - 1 + this.heroSlides.length) % this.heroSlides.length;
    this.activeSlideIndex.set(prev);
  }

  setSlide(index: number): void {
    this.activeSlideIndex.set(index);
  }

  scrollFeaturedMusicals(direction: -1 | 1): void {
    const track = this.featuredMusicalsTrack?.nativeElement;
    if (!track) return;

    track.scrollBy({
      left: direction * track.clientWidth * 0.8,
      behavior: 'smooth'
    });
  }

  scrollToSection(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Trạng thái quản lý Modal xác nhận ưu đãi
  isConsentModalOpen = signal<boolean>(false);
  openConsentModal(): void {
    const inputElement = document.getElementById('userEmailInput') as HTMLInputElement;
    if (inputElement && inputElement.value.trim() !== '') {
      this.isConsentModalOpen.set(true);
    } else {
      alert('Vui lòng nhập địa chỉ email của bạn trước khi nhận ưu đãi!');
      inputElement?.focus();
    }
  }

  closeConsentModal(): void {
    this.isConsentModalOpen.set(false);
  }

  confirmConsent(): void {
    this.isConsentModalOpen.set(false);
    alert('Đăng ký thành công! Chúng tôi sẽ sớm thông tin đến bạn các chương trình ưu đãi.');
    const inputElement = document.getElementById('userEmailInput') as HTMLInputElement;
    if (inputElement) inputElement.value = '';
  }
}
