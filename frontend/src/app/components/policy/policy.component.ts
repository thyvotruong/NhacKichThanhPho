/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/policy/policy.component.ts
 * Chức năng: Trang "Chính sách & Điều khoản" (/policy)
 * Trình bày đúng thứ tự 5 mục quy chuẩn:
 * 1. Chính sách bảo mật (privacy)
 * 2. Chính sách giá dịch vụ (pricing)
 * 3. Chính sách thanh toán (payment)
 * 4. Điều khoản & Quy định sử dụng (terms)
 * 5. Chính sách đổi/hủy vé & hoàn tiền (refund)
 * Định dạng: Text và Bullet points trang nhã, không hình ảnh
 * ============================================================
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

export type PolicySection = 'privacy' | 'pricing' | 'payment' | 'terms' | 'refund';

@Component({
  selector: 'app-policy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './policy.component.html',
  styleUrls: ['./policy.component.css']
})
export class PolicyComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  // Tab đang hoạt động
  activeSection = signal<PolicySection>('privacy');

  // Danh sách các mục chính sách theo đúng thứ tự yêu cầu
  readonly policyNavItems: { id: PolicySection; number: string; title: string; icon: string }[] = [
    {
      id: 'privacy',
      number: '01',
      title: 'Chính sách bảo mật',
      icon: 'bi-shield-lock-fill'
    },
    {
      id: 'pricing',
      number: '02',
      title: 'Chính sách giá dịch vụ',
      icon: 'bi-tag-fill'
    },
    {
      id: 'payment',
      number: '03',
      title: 'Chính sách thanh toán',
      icon: 'bi-credit-card-2-front-fill'
    },
    {
      id: 'terms',
      number: '04',
      title: 'Điều khoản & Quy định sử dụng',
      icon: 'bi-file-earmark-ruled-fill'
    },
    {
      id: 'refund',
      number: '05',
      title: 'Chính sách đổi/hủy vé & hoàn tiền',
      icon: 'bi-arrow-counterclockwise'
    }
  ];

  ngOnInit(): void {
    // Lắng nghe queryParams để nhảy trực tiếp tới mục mong muốn từ Footer
    this.route.queryParamMap.subscribe(params => {
      const tab = params.get('tab') as PolicySection;
      if (tab && ['privacy', 'pricing', 'payment', 'terms', 'refund'].includes(tab)) {
        this.activeSection.set(tab);
      }
    });

    // Hỗ trợ cả fragment anchor nếu có (#privacy, #pricing...)
    this.route.fragment.subscribe(fragment => {
      if (fragment && ['privacy', 'pricing', 'payment', 'terms', 'refund'].includes(fragment as PolicySection)) {
        this.activeSection.set(fragment as PolicySection);
      }
    });
  }

  setSection(section: PolicySection): void {
    this.activeSection.set(section);
  }
}
