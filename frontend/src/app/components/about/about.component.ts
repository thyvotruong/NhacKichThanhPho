/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/about/about.component.ts
 * Chức năng: Phân hệ Giới Thiệu "Về chúng tôi" (/about)
 * - Lịch sử hình thành nhà hát, Sứ mệnh, Tầm nhìn, Giá trị cốt lõi
 * - 4 Khung ảnh đại diện (Avatar cards) cho 4 nhân sự chủ chốt
 * ============================================================
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface KeyLeader {
  name: string;
  role: string;
  avatarUrl: string;
  bio: string;
  experience: string;
  badge: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent {
  // 4 Nhân sự chủ chốt của Nhà Hát Nhạc Kịch Thành Phố
  readonly keyLeaders: KeyLeader[] = [
    {
      name: 'NSƯT Trần Minh Đức',
      role: 'Giám Đốc Nghệ Thuật & Tổng Đạo Diễn',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      bio: 'Hơn 25 năm cống hiến cho sân khấu kịch nói và nhạc kịch hàn lâm, người định hình ngôn ngữ biểu diễn tráng lệ và dẫn dắt các vở diễn khai màn mùa diễn.',
      experience: '25+ năm kinh nghiệm • Đạo diễn của năm 2024',
      badge: 'Ban Giám Đốc Nghệ Thuật'
    },
    {
      name: 'Nhạc sĩ Lê Quang Vũ',
      role: 'Giám Đốc Âm Nhạc & Nhạc Trưởng',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      bio: 'Tốt nghiệp Nhạc viện Tchaikovsky, chỉ huy dàn nhạc giao hưởng trực tiếp với 45 nghệ sĩ biểu diễn live 100% trong từng đêm diễn.',
      experience: 'Chỉ huy trưởng Dàn nhạc Giao hưởng Sân khấu',
      badge: 'Ban Giám Đốc Âm Nhạc'
    },
    {
      name: 'Biên đạo Hoàng Yến Chi',
      role: 'Giám Đốc Sáng Tạo & Biên Đạo Múa',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      bio: 'Tu nghiệp chuyên sâu tại Broadway Dance Center (New York), người kiến tạo những đại cảnh vũ đạo bùng nổ, giàu nhịp điệu và cảm xúc thăng hoa.',
      experience: 'Biên đạo trưởng 12 vở nhạc kịch kinh điển',
      badge: 'Ban Sáng Tạo Nghệ Thuật'
    },
    {
      name: 'ThS. Nguyễn Quốc Thái',
      role: 'Giám Đốc Điều Hành & Trải Nghiệm Khán Giả',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
      bio: 'Chuyên gia quản trị nghệ thuật biểu diễn, tiên phong số hóa hệ thống vé điện tử QR Code không chạm và chuẩn hóa dịch vụ tiếp đón hoàng gia.',
      experience: 'Thạc sĩ Quản trị Nghệ thuật Sân khấu',
      badge: 'Ban Vận Hành & Khán Giả'
    }
  ];

  // Các giá trị cốt lõi
  readonly coreValues = [
    {
      icon: 'bi-gem',
      title: 'Đẳng Cấp Nghệ Thuật',
      desc: 'Mỗi tác phẩm là sự kết tinh hoàn mỹ giữa âm thanh giao hưởng trực tiếp, vũ đạo chuẩn mực và công nghệ sân khấu hiện đại.'
    },
    {
      icon: 'bi-fire',
      title: 'Đam Mê Sáng Tạo',
      desc: 'Không ngừng thử nghiệm và làm mới các tác phẩm kinh điển thế giới cùng những câu chuyện đậm đà bản sắc văn hóa Việt Nam.'
    },
    {
      icon: 'bi-heart-fill',
      title: 'Khán Giả Là Trung Tâm',
      desc: 'Tạo dựng không gian thưởng thức văn minh, dịch vụ tiếp đón hoàng gia và trải nghiệm nghệ thuật trọn vẹn cho từng vị khách.'
    },
    {
      icon: 'bi-shield-check',
      title: 'Chính Trực & Bản Quyền',
      desc: 'Tôn trọng bản quyền tác giả quốc tế, gìn giữ đạo đức nghề nghiệp và tính nguyên bản trong từng giai điệu, lời thoại.'
    }
  ];
}

export default AboutComponent;
