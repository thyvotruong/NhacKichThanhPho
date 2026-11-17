/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL SPA) - ANGULAR FRONTEND
 * File: components/musical-list/musical-list.component.ts
 * Chức năng: Danh mục vở kịch với Tìm kiếm, Lọc thể loại & Sắp xếp
 * ============================================================
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MusicalService } from '../../services/musical.service';
import { Musical } from '../../models/musical.model';

@Component({
  selector: 'app-musical-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DecimalPipe],
  templateUrl: './musical-list.component.html',
  styleUrls: ['./musical-list.component.css']
})
export class MusicalListComponent implements OnInit {
  private readonly musicalService = inject(MusicalService);

  musicals = signal<Musical[]>([]);
  isLoading = signal<boolean>(true);

  // Bộ lọc
  searchKeyword = signal<string>('');
  selectedGenre = signal<string>('all');
  selectedStatus = signal<string>('all');
  selectedSort = signal<string>('newest');

  readonly genres = ['Tất cả', 'Thiếu nhi', 'Gia đình', 'Lịch sử', 'Dân gian', 'Tâm lý', 'Chính luận', 'Cổ tích', 'Bi hài kịch'];

  ngOnInit(): void {
    this.fetchMusicals();
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
      genre: this.selectedGenre() === 'Tất cả' ? 'all' : this.selectedGenre(),
      status: this.selectedStatus(),
      sort: this.selectedSort()
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
    this.selectedGenre.set(g);
    this.fetchMusicals();
  }

  setStatus(s: string): void {
    this.selectedStatus.set(s);
    this.fetchMusicals();
  }

  setSort(sortType: string): void {
    this.selectedSort.set(sortType);
    this.fetchMusicals();
  }

  resetFilters(): void {
    this.searchKeyword.set('');
    this.selectedGenre.set('all');
    this.selectedStatus.set('all');
    this.selectedSort.set('newest');
    this.fetchMusicals();
  }
}
