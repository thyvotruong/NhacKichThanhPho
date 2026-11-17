/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/about/about.component.ts
 * Chức năng: Giới thiệu dự án, sứ mệnh, tầm nhìn và đội ngũ phát triển
 * ============================================================
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface KeyLeader {
  name: string;
  initials: string;
  image: string;
  imageFailed: boolean;
  role: string;
  bio: string;
  experience: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent {
  readonly keyLeaders: KeyLeader[] = [
    {
      name: 'Trương Võ Trường Thy',
      initials: 'TT',
      image: '/images/about/truong-thy.jpg',
      imageFailed: false,
      role: 'TRƯỞNG NHÓM & QUẢN LÝ DỰ ÁN (PROJECT LEAD)',
      bio: 'Định hướng sản phẩm, điều phối tiến độ và kiểm thử chất lượng để hệ thống vận hành ổn định, đồng bộ.',
      experience: 'Quản lý dự án & Điều phối hệ thống'
    },
    {
      name: 'Đinh Thùy Như',
      initials: 'ĐN',
      image: '/images/about/thuy-nhu.jpg',
      imageFailed: false,
      role: 'THIẾT KẾ GIAO DIỆN & TRẢI NGHIỆM (UI/UX DESIGNER)',
      bio: 'Xây dựng ngôn ngữ thiết kế sân khấu hiện đại, tối ưu tương tác và sơ đồ chọn ghế trực quan.',
      experience: 'Thiết kế UI/UX & thương hiệu'
    },
    {
      name: 'Nguyễn La Thanh Thảo',
      initials: 'NT',
      image: '/images/about/thanh-thao.jpg',
      imageFailed: false,
      role: 'PHÁT TRIỂN GIAO DIỆN & TƯƠNG TÁC (FRONTEND DEVELOPER)',
      bio: 'Phát triển giao diện và tương tác mượt mà, tối ưu trải nghiệm trên nhiều thiết bị.',
      experience: 'Phát triển giao diện & Trải nghiệm web'
    },
    {
      name: 'Bùi Ngọc Minh Vy',
      initials: 'MV',
      image: '/images/about/minh-vy.png',
      imageFailed: false,
      role: 'PHÁT TRIỂN HỆ THỐNG & DỮ LIỆU (BACKEND & CONTENT DEVELOPER)',
      bio: 'Xây dựng cơ sở dữ liệu, logic đặt vé thời gian thực và biên tập nội dung chính xác, giàu cảm xúc.',
      experience: 'Hệ thống dữ liệu & Quản trị nội dung'
    }
  ];

  readonly coreValues = [
    {
      title: 'Trải Nghiệm Mượt Mà',
      desc: 'Theo dõi sơ đồ rạp và hoàn tất đặt vé trên mọi thiết bị chỉ trong vài bước.'
    },
    {
      title: 'Đổi Mới & Sáng Tạo',
      desc: 'Ứng dụng tư duy thiết kế và công nghệ web hiện đại để làm mới cách tiếp cận sân khấu.'
    },
    {
      title: 'Khán Giả Là Trung Tâm',
      desc: 'Phát triển tính năng theo nhu cầu thực tế, ưu tiên sự thuận tiện và hài lòng của khán giả.'
    },
    {
      title: 'Minh Bạch & Tin Cậy',
      desc: 'Cung cấp lịch diễn, giá vé chính xác và bảo mật dữ liệu giao dịch.'
    }
  ];
}

export default AboutComponent;
