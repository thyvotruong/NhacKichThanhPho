/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - APP ROOT COMPONENT
 * File: app.ts (hoặc app.component.ts)
 * Chức năng: Shell Component điều phối Layout:
 * - Layout Phía Khách Hàng (Customer Portal): Hiển thị Navbar & Footer khách hàng
 * - Layout Phía Nội Bộ (Internal Staff Portal): Tách biệt hoàn toàn, không hiển thị Navbar/Footer khách
 * ============================================================
 */

import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'Nhạc Kịch Thành Phố';
  private readonly router = inject(Router);

  // Cờ nhận biết phân hệ nội bộ để ẩn Navbar & Footer khách hàng
  isInternalPortal = signal<boolean>(false);

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects || event.url;
      const isInternal = url.startsWith('/admin') ||
                         url.startsWith('/ops') ||
                         url.startsWith('/internal') ||
                         url.startsWith('/staff');
      this.isInternalPortal.set(isInternal);
    });
  }
}
