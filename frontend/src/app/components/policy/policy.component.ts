/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/policy/policy.component.ts
 * Chức năng: Trang "Chính sách & Điều khoản" (/policy)
 * Trình bày khoa học theo 5 mục quy chuẩn:
 * 1. Chính sách giá dịch vụ (pricing)
 * 2. Chính sách thanh toán (payment)
 * 3. Chính sách hoàn huỷ vé (tickets)
 * 4. Điều khoản và nội quy (terms)
 * 5. Chính sách bảo mật (privacy)
 * Định dạng: Text trắng sáng, tương phản cao, ưu tiên Bullet points
 * ============================================================
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

export type PolicySection = 'terms' | 'pricing' | 'payment' | 'tickets' | 'privacy';

@Component({
  selector: 'app-policy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './policy.component.html',
  styleUrls: ['./policy.component.css']
})
export class PolicyComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  // Tab đang hoạt động (mặc định tab 1: terms)
  activeSection = signal<PolicySection>('terms');

  // Danh sách các mục chính sách với Điều khoản & Nội quy đứng đầu tiên
  readonly policyNavItems: { id: PolicySection; number: string; title: string }[] = [
    {
      id: 'terms',
      number: '01',
      title: 'Điều khoản và nội quy'
    },
    {
      id: 'pricing',
      number: '02',
      title: 'Chính sách giá dịch vụ'
    },
    {
      id: 'payment',
      number: '03',
      title: 'Chính sách thanh toán'
    },
    {
      id: 'tickets',
      number: '04',
      title: 'Chính sách hoàn huỷ vé'
    },
    {
      id: 'privacy',
      number: '05',
      title: 'Chính sách bảo mật'
    }
  ];

  ngOnInit(): void {
    // Lắng nghe queryParams để nhảy trực tiếp tới mục mong muốn từ Footer
    this.route.queryParamMap.subscribe(params => {
      const tab = params.get('tab');
      if (tab === 'refund') {
        this.activeSection.set('tickets');
      } else if (tab && ['terms', 'pricing', 'payment', 'tickets', 'privacy'].includes(tab)) {
        this.activeSection.set(tab as PolicySection);
      }
    });

    // Hỗ trợ cả fragment anchor nếu có (#terms, #pricing...)
    this.route.fragment.subscribe(fragment => {
      if (fragment === 'refund') {
        this.activeSection.set('tickets');
      } else if (fragment && ['terms', 'pricing', 'payment', 'tickets', 'privacy'].includes(fragment)) {
        this.activeSection.set(fragment as PolicySection);
      }
    });
  }

  setSection(section: PolicySection): void {
    this.activeSection.set(section);
  }
}
