/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/home/home.component.ts
 * Chức năng: Homepage Component với Hero Banner Slider,
 * Lịch diễn nổi bật (@for, @if), và Gương mặt nghệ sĩ tiêu biểu.
 * ============================================================
 */

import { Component, ElementRef, OnInit, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { MusicalService } from '../../services/musical.service';
import { Musical, Schedule, Artist } from '../../models/musical.model';

type FeaturedMusical = Musical & { isDemo?: boolean };
type ScheduleCard = Schedule & { genre: string; posterUrl: string; subtitle?: string };

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly musicalService = inject(MusicalService);
  private subscriptions: Subscription[] = [];

  @ViewChild('featuredMusicalsTrack')
  private featuredMusicalsTrack?: ElementRef<HTMLDivElement>;

  @ViewChild('upcomingSchedulesTrack')
  private upcomingSchedulesTrack?: ElementRef<HTMLDivElement>;

  // Angular Signals quản lý trạng thái
  musicals = signal<FeaturedMusical[]>([]);
  schedules = signal<ScheduleCard[]>([]);
  artists = signal<Artist[]>([]);
  isLoading = signal<boolean>(true);

  // Quản lý chỉ số Slide Hero Banner đang hiển thị
  activeSlideIndex = signal<number>(0);

  // Các vở đang diễn được nạp động vào Hero Banner.
  heroSlides: any[] = [];

  ngOnInit(): void {
    this.loadData();
    this.startHeroSlider();
    this.subscriptions.push(
      this.musicalService.musicalsChanged$.subscribe(() => this.loadData()),
      this.musicalService.artistsChanged$.subscribe(() => this.loadData())
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  getMinPrice(musical: Musical): number {
    if (!musical.ticketPrices || musical.ticketPrices.length === 0) return 450000;
    return Math.min(...musical.ticketPrices.map(t => t.price || 0));
  }

  formatGenre(genre: any): string {
    if (Array.isArray(genre)) return genre.join(' • ');
    return String(genre || '');
  }

  getUpcomingSchedules(): ScheduleCard[] {
    const getPerformanceTime = (schedule: Schedule): number =>
      schedule.performanceDate instanceof Date
        ? schedule.performanceDate.getTime()
        : Date.parse(schedule.performanceDate);
    const now = Date.now();

    const upcomingSchedules = this.schedules()
      .filter(schedule =>
        schedule.status === 'available' &&
        this.availableSeatCount(schedule) > 0 &&
        Number.isFinite(getPerformanceTime(schedule)) &&
        getPerformanceTime(schedule) >= now
      )
      .sort((a, b) => getPerformanceTime(a) - getPerformanceTime(b))
    const nearestScheduleByMusical = new Map<string, ScheduleCard>();

    for (const schedule of upcomingSchedules) {
      if (!nearestScheduleByMusical.has(schedule.musicalSlug)) {
        nearestScheduleByMusical.set(schedule.musicalSlug, schedule);
      }
    }

    return Array.from(nearestScheduleByMusical.values()).slice(0, 5);
  }

  availableSeatCount(schedule: Schedule): number {
    if (schedule.seats?.length) {
      return schedule.seats.filter(seat => seat.status === 'available').length;
    }

    return Math.max(0, schedule.totalSeats - schedule.bookedSeats - (schedule.lockedSeatsCount ?? 0));
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

    // 2. Tải lịch diễn và thông tin vở để hiển thị cùng dữ liệu với trang /schedules.
    forkJoin({
      schedules: this.musicalService.getSchedules(),
      musicals: this.musicalService.getMusicals()
    }).subscribe({
      next: ({ schedules, musicals }) => {
        const musicalsBySlug = new Map(musicals.map(musical => [musical.slug, musical]));
        this.schedules.set(schedules.map(schedule => {
          const musical = musicalsBySlug.get(schedule.musicalSlug);
          return {
            ...schedule,
            genre: musical ? this.formatGenre(musical.genre) : 'Kịch Nghệ',
            posterUrl: musical?.posterUrl || `/images/musicals/${schedule.musicalSlug.replace(/-/g, '_')}.jpg`,
            subtitle: musical?.subtitle || musical?.synopsis
          };
        }));
      },
      error: () => this.schedules.set([])
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

  scrollUpcomingSchedules(direction: -1 | 1): void {
    const track = this.upcomingSchedulesTrack?.nativeElement;
    const firstCard = track?.querySelector<HTMLElement>('.upcoming-schedule-slide');
    if (!track || !firstCard) return;

    const gap = Number.parseFloat(getComputedStyle(track).gap) || 0;
    track.scrollBy({
      left: direction * (firstCard.offsetWidth + gap),
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
  vipEmail = signal<string>('');
  isSubmittingVip = signal<boolean>(false);
  vipAlert = signal<{ type: 'success' | 'danger'; text: string } | null>(null);

  openConsentModal(): void {
    const inputElement = document.getElementById('userEmailInput') as HTMLInputElement;
    const emailVal = inputElement ? inputElement.value.trim() : '';
    if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      alert('Vui lòng nhập địa chỉ email hợp lệ trước khi nhận ưu đãi!');
      inputElement?.focus();
      return;
    }
    this.vipEmail.set(emailVal);
    this.isConsentModalOpen.set(true);
  }

  closeConsentModal(): void {
    this.isConsentModalOpen.set(false);
  }

  confirmConsent(): void {
    const emailVal = this.vipEmail();
    if (!emailVal || this.isSubmittingVip()) return;

    this.isSubmittingVip.set(true);
    this.musicalService.subscribeNewsletter(emailVal, 'homepage_vip', '').subscribe({
      next: (res) => {
        this.isSubmittingVip.set(false);
        this.isConsentModalOpen.set(false);
        this.vipAlert.set({ type: 'success', text: res.message || 'Đăng ký nhận ưu đãi VIP thành công! Cảm ơn bạn.' });
        alert(res.message || 'Đăng ký nhận ưu đãi VIP thành công! Cảm ơn bạn.');
        const inputElement = document.getElementById('userEmailInput') as HTMLInputElement;
        if (inputElement) inputElement.value = '';
        this.vipEmail.set('');
        setTimeout(() => this.vipAlert.set(null), 5000);
      },
      error: (err) => {
        this.isSubmittingVip.set(false);
        this.isConsentModalOpen.set(false);
        const errMsg = err.error?.message || 'Không thể đăng ký nhận ưu đãi lúc này. Vui lòng thử lại sau!';
        this.vipAlert.set({ type: 'danger', text: errMsg });
        alert(errMsg);
        setTimeout(() => this.vipAlert.set(null), 5000);
      }
    });
  }
}
