/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - APP ROOT COMPONENT
 * File: app.ts (hoặc app.component.ts)
 * Chức năng: Shell Component điều phối Layout:
 * - Layout Phía Khách Hàng (Customer Portal): Hiển thị Navbar & Footer khách hàng
 * - Layout Phía Nội Bộ (Internal Staff Portal): Tách biệt hoàn toàn, không hiển thị Navbar/Footer khách
 * ============================================================
 */

import { Component, HostListener, OnDestroy, inject, signal } from '@angular/core';
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
export class App implements OnDestroy {
  title = 'Nhạc Kịch Thành Phố';
  private readonly router = inject(Router);
  private readonly scrollElement = document.scrollingElement ?? document.documentElement;

  // Cờ nhận biết phân hệ nội bộ để ẩn Navbar & Footer khách hàng
  isInternalPortal = signal<boolean>(false);
  scrollbarVisible = false;
  scrollbarHeight = 180;
  scrollbarTop = 0;
  private dragStartY = 0;
  private dragStartScrollTop = 0;
  private isDraggingScrollbar = false;
  private contentResizeObserver?: ResizeObserver;

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

    if (typeof ResizeObserver !== 'undefined') {
      this.contentResizeObserver = new ResizeObserver(() => this.updateScrollbar());
      this.contentResizeObserver.observe(document.body);
    }

    queueMicrotask(() => this.updateScrollbar());
  }

  get scrollbarValue(): number {
    const trackRange = window.innerHeight - this.scrollbarHeight;
    return trackRange > 0 ? Math.round((this.scrollbarTop / trackRange) * 1000) : 0;
  }

  ngOnDestroy(): void {
    this.contentResizeObserver?.disconnect();
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  updateScrollbar(): void {
    const viewportHeight = window.innerHeight;
    const maxScroll = this.scrollElement.scrollHeight - viewportHeight;

    this.scrollbarVisible = maxScroll > 0;
    this.scrollbarHeight = Math.min(180, viewportHeight);
    this.scrollbarTop = maxScroll > 0
      ? (this.scrollElement.scrollTop / maxScroll) * (viewportHeight - this.scrollbarHeight)
      : 0;
  }

  startScrollbarDrag(event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingScrollbar = true;
    this.dragStartY = event.clientY;
    this.dragStartScrollTop = this.scrollElement.scrollTop;
  }

  @HostListener('document:pointermove', ['$event'])
  dragScrollbar(event: PointerEvent): void {
    if (!this.isDraggingScrollbar) {
      return;
    }

    const trackRange = window.innerHeight - this.scrollbarHeight;
    const maxScroll = this.scrollElement.scrollHeight - window.innerHeight;
    if (trackRange <= 0 || maxScroll <= 0) {
      return;
    }

    const scrollDelta = ((event.clientY - this.dragStartY) / trackRange) * maxScroll;
    this.scrollElement.scrollTop = this.dragStartScrollTop + scrollDelta;
  }

  @HostListener('document:pointerup')
  @HostListener('document:pointercancel')
  stopScrollbarDrag(): void {
    this.isDraggingScrollbar = false;
  }

  scrollFromTrack(event: PointerEvent): void {
    if (event.target !== event.currentTarget) {
      return;
    }

    const maxScroll = this.scrollElement.scrollHeight - window.innerHeight;
    const trackRange = window.innerHeight - this.scrollbarHeight;
    if (maxScroll <= 0 || trackRange <= 0) {
      return;
    }

    const requestedTop = event.clientY - this.scrollbarHeight / 2;
    this.scrollElement.scrollTop = (requestedTop / trackRange) * maxScroll;
  }

  handleScrollbarKeydown(event: KeyboardEvent): void {
    const maxScroll = this.scrollElement.scrollHeight - window.innerHeight;
    const pageStep = window.innerHeight * 0.9;

    switch (event.key) {
      case 'ArrowUp':
        this.scrollElement.scrollTop -= 40;
        break;
      case 'ArrowDown':
        this.scrollElement.scrollTop += 40;
        break;
      case 'PageUp':
        this.scrollElement.scrollTop -= pageStep;
        break;
      case 'PageDown':
        this.scrollElement.scrollTop += pageStep;
        break;
      case 'Home':
        this.scrollElement.scrollTop = 0;
        break;
      case 'End':
        this.scrollElement.scrollTop = maxScroll;
        break;
      default:
        return;
    }

    event.preventDefault();
  }
}
