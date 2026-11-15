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
 * 5. Chính sách vé không đổi trả (tickets)
 * Định dạng: Text và Bullet points trang nhã, không hình ảnh
 * ============================================================
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

export type PolicySection = 'privacy' | 'pricing' | 'payment' | 'terms' | 'tickets';

@Component({
  selector: 'app-policy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './policy.component.html',
  styleUrls: ['./policy.component.css']
})
export class PolicyComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  // Tab đang hoạt động
  activeSection = signal<PolicySection>('privacy');

  // Danh sách các mục chính sách theo đúng thứ tự yêu cầu
  readonly policyNavItems: { id: PolicySection; number: string; title: string }[] = [
    {
      id: 'privacy',
      number: '01',
      title: 'Chính sách bảo mật'
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
      id: 'terms',
      number: '04',
      title: 'Điều khoản & Quy định sử dụng'
    },
    {
      id: 'tickets',
      number: '05',
      title: 'Chính sách vé không đổi trả'
    }
  ];

  ngOnInit(): void {
    // Lắng nghe queryParams để nhảy trực tiếp tới mục mong muốn từ Footer
    this.route.queryParamMap.subscribe(params => {
      const tab = params.get('tab');
      if (tab === 'refund') {
        this.activeSection.set('tickets');
      } else if (tab && ['privacy', 'pricing', 'payment', 'terms', 'tickets'].includes(tab)) {
        this.activeSection.set(tab as PolicySection);
      }
    });

    // Hỗ trợ cả fragment anchor nếu có (#privacy, #pricing...)
    this.route.fragment.subscribe(fragment => {
      if (fragment === 'refund') {
        this.activeSection.set('tickets');
      } else if (fragment && ['privacy', 'pricing', 'payment', 'terms', 'tickets'].includes(fragment)) {
        this.activeSection.set(fragment as PolicySection);
      }
    });
  }

  setSection(section: PolicySection): void {
    this.activeSection.set(section);
  }
}
