/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/artists/artists.component.ts
 * Chức năng: Phân hệ Nghệ sĩ (/artists) - Sitemap Mục 5
 * Giới thiệu Ban giám đốc, NSƯT, Đạo diễn, Diễn viên nhạc kịch
 * ============================================================
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MusicalService } from '../../services/musical.service';
import { Artist } from '../../models/musical.model';

@Component({
  selector: 'app-artists',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './artists.component.html',
  styleUrls: ['./artists.component.css']
})
export class ArtistsComponent implements OnInit {
  private readonly musicalService = inject(MusicalService);

  artists = signal<Artist[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.musicalService.getArtists().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.artists.set(data);
        } else {
          this.artists.set(this.getMockArtists());
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.artists.set(this.getMockArtists());
        this.isLoading.set(false);
      }
    });
  }

  private getMockArtists(): Artist[] {
    return [
      {
        name: 'NSƯT Trần Minh Đức',
        role: 'Tổng Đạo Diễn Sân Khấu & Giám Đốc Nghệ Thuật',
        title: 'Nghệ sĩ Ưu tú',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
        bio: 'Hơn 25 năm cống hiến cho nghệ thuật nhạc kịch kinh điển và đương đại Việt Nam. Từng tu nghiệp tại Nhà hát Hoàng Gia London.'
      },
      {
        name: 'Nguyễn Lê Hoàng',
        role: 'Đạo Diễn Âm Nhạc & Nhạc Trưởng Trưởng',
        title: 'Nhạc sĩ / Giám đốc Âm nhạc',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
        bio: 'Tốt nghiệp thủ khoa Nhạc viện Tchaikovsky. Chỉ huy trưởng dàn nhạc giao hưởng thính phòng trong các siêu phẩm Broadway.'
      },
      {
        name: 'Lan Phương',
        role: 'Nghệ Sĩ Biểu Diễn Chính (Lead Vocal / Actress)',
        title: 'Ngôi sao Sân khấu',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=80',
        bio: 'Gương mặt vàng của làng kịch nghệ, gây xúc động mãnh liệt trong vai diễn chính của vở nhạc kịch kinh điển Bông Bóng Bay.'
      },
      {
        name: 'Quang Tuấn',
        role: 'Nghệ Sĩ Kịch Nói & Nhạc Kịch',
        title: 'Nam Chính Xuất Sắc Nhất 2025',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
        bio: 'Nam diễn viên tài năng với chất giọng baritone đầy nội lực, đảm nhiệm vai nam chính trong Giấc Mơ Mùa Hè.'
      },
      {
        name: 'Khả Như',
        role: 'Biên Đạo Múa & Diễn Viên Nhạc Kịch',
        title: 'Biên đạo Sáng tạo',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80',
        bio: 'Người thổi hồn vào những vũ điệu sân khấu sôi động, kết hợp nhuần nhuyễn giữa kỹ thuật Broadway và tinh hoa múa dân gian đương đại.'
      },
      {
        name: 'Huỳnh Lập',
        role: 'Cố Vấn Kịch Bản & Nghệ Sĩ Khách Mời Đặc Biệt',
        title: 'Đạo diễn / Biên kịch',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=500&q=80',
        bio: 'Đóng góp nhiều góc nhìn nhân văn hóm hỉnh cho kịch bản, mang lại tiếng cười sảng khoái và thông điệp sâu lắng cho khán giả.'
      }
    ];
  }
}
