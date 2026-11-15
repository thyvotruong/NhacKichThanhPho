import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Seat } from '../../models/musical.model';

type SeatTypeSummary = {
  type: Seat['type'];
  label: string;
  sampleClass: string;
  minPrice: number;
  maxPrice: number;
};

const SEAT_TYPES: ReadonlyArray<Pick<SeatTypeSummary, 'type' | 'label' | 'sampleClass'>> = [
  { type: 'VIP', label: 'VIP', sampleClass: 'seat-vip' },
  { type: 'Standard', label: 'Thường', sampleClass: 'seat-standard' },
  { type: 'Couple', label: 'Ghế Đôi Sweetbox', sampleClass: 'seat-couple' }
];

@Component({
  selector: 'app-seat-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seat-map.component.html',
  styleUrls: ['./seat-map.component.css']
})
export class SeatMapComponent {
  readonly seats = input<Seat[]>([]);
  readonly selectedSeatCodes = input<string[]>([]);
  readonly allowLockedSelection = input(false);
  readonly seatClick = output<Seat>();

  readonly activeFloor = signal<Seat['floor']>('Tầng Trệt');

  readonly availableFloors = computed(() => [...new Set(this.seats().map(seat => seat.floor))]);

  readonly visibleFloor = computed(() => {
    const floors = this.availableFloors();
    return floors.includes(this.activeFloor()) ? this.activeFloor() : floors[0] ?? 'Tầng Trệt';
  });

  readonly visibleSeats = computed(() => this.seats().filter(seat => seat.floor === this.visibleFloor()));

  readonly uniqueRows = computed(() => [...new Set(this.visibleSeats().map(seat => seat.row))].sort());

  readonly seatTypeSummaries = computed<SeatTypeSummary[]>(() => {
    const seats = this.seats();

    return SEAT_TYPES.flatMap(type => {
      const prices = seats.filter(seat => seat.type === type.type).map(seat => seat.price);
      if (prices.length === 0) return [];

      return [{
        ...type,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices)
      }];
    });
  });

  getSeatsInRow(row: string): Seat[] {
    return this.visibleSeats()
      .filter(seat => seat.row === row)
      .sort((a, b) => a.number - b.number);
  }

  floorLabel(floor: Seat['floor']): string {
    return floor === 'Tầng Trệt' ? 'TẦNG TRỆT (STALLS)' : 'TẦNG LẦU (BALCONY)';
  }

  isSelected(seatCode: string): boolean {
    return this.selectedSeatCodes().includes(seatCode);
  }

  isDisabled(seat: Seat): boolean {
    return seat.status === 'booked' || (seat.status === 'locked' && !this.allowLockedSelection());
  }

  selectSeat(seat: Seat): void {
    if (!this.isDisabled(seat)) this.seatClick.emit(seat);
  }
}
