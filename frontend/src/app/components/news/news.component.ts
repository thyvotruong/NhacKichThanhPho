/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/news/news.component.ts
 * Chức năng: Phân hệ Tin tức & Sự kiện (/news) - Sitemap Mục 6
 * ============================================================
 */

import { Component, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface NewsArticle {
  id: string;
  title: string;
  category: string;
  date: string;
  summary: string;
  imageUrl: string;
  readTime: string;
}

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css']
})
export class NewsComponent {
  articles = signal<NewsArticle[]>([
    {
      id: 'news-01',
      title: 'Hậu Trường Tập Luyện Siêu Phẩm "Bông Bóng Bay" Trước Giờ Khai Màn',
      category: 'HẬU TRƯỜNG',
      date: '2026-03-20',
      summary: 'Khám phá không khí tập luyện hăng say suốt 6 tháng qua của hơn 80 diễn viên, nhạc công và nghệ sĩ múa dưới sự chỉ đạo của NSƯT Trần Minh Đức.',
      imageUrl: 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&w=800&q=80',
      readTime: '4 phút đọc'
    },
    {
      id: 'news-02',
      title: 'Chính Thức Mở Bán Vé Mùa Nhạc Kịch Broadway Grand Season 2026',
      category: 'SỰ KIỆN',
      date: '2026-03-18',
      summary: 'Khán giả đặt vé sớm trên website được áp dụng mã voucher SHOWMAN20 giảm 20% cùng cơ hội chọn những vị trí ghế VIP trung tâm đẹp nhất khán phòng.',
      imageUrl: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=800&q=80',
      readTime: '3 phút đọc'
    },
    {
      id: 'news-03',
      title: 'Gặp Gỡ Đạo Diễn Âm Nhạc Nguyễn Lê Hoàng: Đưa Dàn Nhạc Giao Hưởng Lên Sân Khấu Nhạc Kịch',
      category: 'PHỎNG VẤN',
      date: '2026-03-15',
      summary: 'Chia sẻ tâm huyết về hành trình phối khí hơn 20 ca khúc kinh điển cho vở diễn Giấc Mơ Mùa Hè với sự hòa quyện giữa giao hưởng phương Tây và chất liệu Việt.',
      imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
      readTime: '5 phút đọc'
    },
    {
      id: 'news-04',
      title: 'Hướng Dẫn Quy Chuẩn Văn Hóa Đi Xem Nhạc Kịch Cho Khán Giả Lần Đầu Đến Nhà Hát',
      category: 'CẨM NANG',
      date: '2026-03-10',
      summary: 'Những lưu ý quan trọng về trang phục lịch sự, thời gian vào khán phòng trước giờ diễn 15 phút và quy định check-in mã QR qua cổng tự động.',
      imageUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
      readTime: '3 phút đọc'
    }
  ]);
}
