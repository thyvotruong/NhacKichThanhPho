/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/musical-list/musical-list.component.ts
 * Chức năng: Danh mục vở kịch với Tìm kiếm & Bộ lọc
 * ============================================================
 */

import { Component, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MusicalService } from '../../services/musical.service';
import { Musical } from '../../models/musical.model';

@Component({
  selector: 'app-musical-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DecimalPipe],
  templateUrl: './musical-list.component.html',
  styleUrls: ['./musical-list.component.css']
})
export class MusicalListComponent implements OnInit, OnDestroy {
  private readonly musicalService = inject(MusicalService);
  private sub?: Subscription;

  musicals = signal<Musical[]>([]);
  isLoading = signal<boolean>(true);
  visibleMusicals = computed(() => {
    const list = this.musicals();
    const st = (this.selectedStatus() || 'all').toLowerCase();
    if (st === 'all') {
      return list.filter(m => {
        const s = (m.status || '').toLowerCase();
        return s === 'now_showing' || s === 'coming_soon' || !s;
      });
    }
    return list.filter(m => (m.status || '').toLowerCase() === st);
  });
  nowShowingMusicals = computed(() => this.visibleMusicals().filter(m => (m.status || '').toLowerCase() === 'now_showing' || !m.status));
  comingSoonMusicals = computed(() => this.visibleMusicals().filter(m => (m.status || '').toLowerCase() === 'coming_soon'));

  // Bộ lọc
  searchKeyword = signal<string>('');
  selectedGenre = signal<string>('all');
  selectedStatus = signal<string>('all');

  readonly genres = [
    { value: 'all', label: 'Tất cả thể loại' },
    { value: 'Thiếu nhi', label: 'Thiếu nhi' },
    { value: 'Gia đình', label: 'Gia đình' },
    { value: 'Lịch sử', label: 'Lịch sử' },
    { value: 'Dân gian', label: 'Dân gian' },
    { value: 'Tâm lý', label: 'Tâm lý' },
    { value: 'Chính luận', label: 'Chính luận' },
    { value: 'Cổ tích', label: 'Cổ tích' },
    { value: 'Bi hài kịch', label: 'Bi hài kịch' }
  ];

  ngOnInit(): void {
    this.fetchMusicals();
    this.sub = this.musicalService.musicalsChanged$.subscribe(() => {
      this.fetchMusicals();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  getMinPrice(musical: Musical): number {
    if (!musical.ticketPrices || musical.ticketPrices.length === 0) return 450000;
    return Math.min(...musical.ticketPrices.map(t => t.price || 0));
  }

  formatGenre(genre: any): string {
    if (Array.isArray(genre)) return genre.join(' • ');
    return String(genre || '');
  }

  fetchMusicals(): void {
    this.isLoading.set(true);
    this.musicalService.getMusicals({
      search: this.searchKeyword(),
      genre: this.selectedGenre(),
      status: this.selectedStatus()
    }).subscribe({
      next: (data) => {
        this.musicals.set(data || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onSearch(): void {
    this.fetchMusicals();
  }

  setGenre(g: string): void {
    this.selectedGenre.set(g === 'Tất cả' ? 'all' : g);
    this.fetchMusicals();
  }

  setStatus(s: string): void {
    this.selectedStatus.set(s);
    this.fetchMusicals();
  }

  resetFilters(): void {
    this.searchKeyword.set('');
    this.selectedGenre.set('all');
    this.selectedStatus.set('all');
    this.fetchMusicals();
  }
}
