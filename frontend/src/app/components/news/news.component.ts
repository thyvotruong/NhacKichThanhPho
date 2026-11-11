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
  url: string;   // link bài báo gốc
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
      title: '120 diễn viên ‘cháy’ hết mình với vở nhạc kịch về đời nghệ sĩ',
      category: 'HẬU TRƯỜNG',
      date: '2024-10-07',
      summary: 'Nhạc kịch “Sân khấu 24h” kể những nỗi niềm vui buồn, thăng hoa lẫn thất bại của người nghệ sĩ song sâu thẳm trong họ vẫn giữ ngọn lửa nghề âm ỉ cháy với nghệ thuật.',
      imageUrl: 'https://static-images.vnncdn.net/vps_images_publish/000001/000003/2024/10/7/batch-san-khau-24h-26-11377.jpg?width=0&s=Raszpet6-lvFXNPl_JVbFg',
      readTime: '2 phút đọc',
      url: 'https://vietnamnet.vn/120-dien-vien-chay-het-minh-voi-vo-nhac-kich-ve-doi-nghe-si-2329337.html'
    },
    {
      id: 'news-02',
      title: 'Nhạc kịch Rồi tôi sẽ lớn: Hàn gắn cha mẹ và con cái tuổi mới lớn',
      category: 'SỰ KIỆN',
      date: '2022-09-25',
      summary: 'Tối 24-9, Nhà hát Tuổi Trẻ vừa công diễn vở nhạc kịch Rồi tôi sẽ lớn, đạo diễn Lê Ánh Tuyết dựng từ kịch bản của anh Chánh Văn - chuyên gia giải đáp tâm lý cho lứa tuổi mới lớn nổi tiếng trên báo Hoa Học Trò',
      imageUrl: 'https://cdn.tuoitre.vn/thumb_w/730/2022/9/25/roi-toi-se-lon-1-1read-only-1664074444938854828385.jpg',
      readTime: '3 phút đọc',
      url: 'https://tuoitre.vn/nhac-kich-roi-toi-se-lon-han-gan-cha-me-va-con-cai-tuoi-moi-lon-20220925095642654.htm'
    },
    {
      id: 'news-03',
      title: 'Trần Lực: Sân khấu không bao giờ chết, chỉ các nghệ sĩ chết',
      category: 'PHỎNG VẤN',
      date: '2025-05-10',
      summary: 'Khán giả không bao giờ quay lưng với một thứ nghệ thuật hay. Có người nói sân khấu chết rồi; tôi lại cho rằng sân khấu không bao giờ chết, mà do các nghệ sĩ chết',
      imageUrl: 'https://cdn2.tuoitre.vn/thumb_w/730/471584752817336320/2025/5/10/base64-17468667898071039392631.jpeg',
      readTime: '5 phút đọc',
      url: 'https://tuoitre.vn/tran-luc-san-khau-khong-bao-gio-chet-chi-cac-nghe-si-chet-20250510154631789.htm'
    },
    {
      id: 'news-04',
      title: 'Trọn bộ kinh nghiệm khám phá và thưởng thức nghệ thuật từ A – Z',
      category: 'CẨM NANG',
      date: '2026-06-15',
      summary: 'Nếu bạn đang lên kế hoạch cho một buổi tối đắm chìm trong âm nhạc, ánh sáng và những vũ điệu say đắm, hãy cùng khám phá xem Nhà hát Thành phố Hồ Chí Minh có gì hay, lịch sử hình thành ra sao, và lưu lại những bí kíp tuyệt vời nhất để có một đêm thưởng thức nghệ thuật trọn vẹn!',
      imageUrl: 'https://cdn1.finhay.com.vn/wp-content/uploads/2026/06/15093854/thong-tin-ve-nha-hat-tp-hcm.png',
      readTime: '3 phút đọc',
      url: 'https://www.finhay.com.vn/nha-hat-thanh-pho-ho-chi-minh'
    }
  ]);
}