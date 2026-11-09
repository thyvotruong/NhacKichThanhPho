/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/home/home.component.ts
 * Chức năng: Homepage Component với Hero Banner Slider,
 * Lịch diễn nổi bật (@for, @if), và Gương mặt nghệ sĩ tiêu biểu.
 * ============================================================
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MusicalService } from '../../services/musical.service';
import { Musical, Schedule, Artist } from '../../models/musical.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private readonly musicalService = inject(MusicalService);

  // Angular Signals quản lý trạng thái
  musicals = signal<Musical[]>([]);
  schedules = signal<Schedule[]>([]);
  artists = signal<Artist[]>([]);
  isLoading = signal<boolean>(true);

  // Quản lý chỉ số Slide Hero Banner đang hiển thị
  activeSlideIndex = signal<number>(0);

  // Danh sách các slide giới thiệu tiêu biểu
  readonly heroSlides = [
    {
      title: 'Bông Bóng Bay',
      subtitle: 'Bản trường ca thanh xuân rực rỡ và những ước mơ bay bổng',
      slug: 'bong-bong-bay',
      director: 'NSƯT Trần Minh Đức',
      time: '120 Phút | Khán phòng Grand A',
      bgImage: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1920&q=80',
      badge: 'Vở Diễn Khai Màn 2026'
    },
    {
      title: 'Giấc Mơ Mùa Hè',
      subtitle: 'Bản tình ca Broadway rực rỡ, lãng mạn và thăng hoa nghệ thuật',
      slug: 'giac-mo-mua-he',
      director: 'Đạo diễn Nguyễn Lê Hoàng',
      time: '135 Phút | Broadway Opera Hall',
      bgImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1920&q=80',
      badge: 'Siêu Phẩm Broadway Việt Nam'
    }
  ];

  ngOnInit(): void {
    this.loadData();
    this.startHeroSlider();
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
        } else {
          // Fallback dữ liệu nội bộ
          this.musicals.set([
            {
              title: 'Bông Bóng Bay',
              slug: 'bong-bong-bay',
              subtitle: 'Bản trường ca thanh xuân rực rỡ',
              genre: 'Broadway',
              status: 'now_showing',
              posterUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
              bannerUrl: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1920&q=80',
              duration: 120,
              director: 'NSƯT Trần Minh Đức',
              cast: ['Lan Phương', 'Quang Tuấn', 'Khả Như', 'Huỳnh Lập'],
              synopsis: 'Vở nhạc kịch Bông Bóng Bay là câu chuyện hoài niệm đong đầy yêu thương về tuổi thanh xuân...',
              ticketPrices: [
                { tier: 'VIP', name: 'VIP Hoàng Gia', price: 800000 },
                { tier: 'Standard', name: 'Tiêu Chuẩn', price: 450000 }
              ]
            },
            {
              title: 'Giấc Mơ Mùa Hè',
              slug: 'giac-mo-mua-he',
              subtitle: 'Bản tình ca Broadway lãng mạn bậc nhất',
              genre: 'Lãng Mạn',
              status: 'now_showing',
              posterUrl: 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&w=800&q=80',
              bannerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1920&q=80',
              duration: 135,
              director: 'Đạo diễn Nguyễn Lê Hoàng',
              cast: ['Hoàng Dũng', 'Bùi Lan Hương', 'Trung Quân'],
              synopsis: 'Bản tình ca Broadway lãng mạn đầy mê hoặc với những giai điệu kinh điển...',
              ticketPrices: [
                { tier: 'VIP', name: 'VIP Kim Cương', price: 950000 },
                { tier: 'Standard', name: 'Tiêu Chuẩn', price: 500000 }
              ]
            }
          ]);
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
              _id: 'sch_01',
              musicalSlug: 'bong-bong-bay',
              musicalTitle: 'Bông Bóng Bay',
              performanceDate: '2026-11-15T19:30:00Z',
              time: '19:30',
              venue: 'Nhà Hát Thành Phố - Số 07 Lam Sơn, Q.1',
              hall: 'Khán phòng Grand A',
              totalSeats: 450,
              bookedSeats: 210,
              status: 'available'
            },
            {
              _id: 'sch_02',
              musicalSlug: 'bong-bong-bay',
              musicalTitle: 'Bông Bóng Bay',
              performanceDate: '2026-11-20T20:00:00Z',
              time: '20:00',
              venue: 'Nhà Hát Thành Phố - Số 07 Lam Sơn, Q.1',
              hall: 'Khán phòng Grand A',
              totalSeats: 450,
              bookedSeats: 450,
              status: 'sold_out'
            },
            {
              _id: 'sch_03',
              musicalSlug: 'giac-mo-mua-he',
              musicalTitle: 'Giấc Mơ Mùa Hè',
              performanceDate: '2026-11-18T19:30:00Z',
              time: '19:30',
              venue: 'Nhà Hát Thành Phố - Số 07 Lam Sơn, Q.1',
              hall: 'Khán phòng Broadway Opera',
              totalSeats: 500,
              bookedSeats: 340,
              status: 'available'
            },
            {
              _id: 'sch_04',
              musicalSlug: 'giac-mo-mua-he',
              musicalTitle: 'Giấc Mơ Mùa Hè',
              performanceDate: '2026-11-25T19:30:00Z',
              time: '19:30',
              venue: 'Nhà Hát Thành Phố - Số 07 Lam Sơn, Q.1',
              hall: 'Khán phòng Broadway Opera',
              totalSeats: 500,
              bookedSeats: 500,
              status: 'sold_out'
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
    const next = (this.activeSlideIndex() + 1) % this.heroSlides.length;
    this.activeSlideIndex.set(next);
  }

  prevSlide(): void {
    const prev = (this.activeSlideIndex() - 1 + this.heroSlides.length) % this.heroSlides.length;
    this.activeSlideIndex.set(prev);
  }

  setSlide(index: number): void {
    this.activeSlideIndex.set(index);
  }

  scrollToSection(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
