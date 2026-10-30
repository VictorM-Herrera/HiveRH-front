import { Component, input, output, signal } from '@angular/core';

export interface HiveCarouselItem {
  id: string;
  label: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-hive-carousel',
  templateUrl: './hive-carousel.html',
  styleUrl: './hive-carousel.css',
})
export class HiveCarousel {
  readonly items = input.required<readonly HiveCarouselItem[]>();
  readonly itemSelected = output<HiveCarouselItem>();
  readonly selectedIndex = signal(0);

  move(direction: -1 | 1): void {
    const count = this.items().length;
    if (count === 0) return;
    this.selectedIndex.update((index) => (index + direction + count) % count);
  }

  selectItem(index: number): void {
    if (index === this.selectedIndex()) {
      this.itemSelected.emit(this.items()[index]);
      return;
    }
    this.selectedIndex.set(index);
  }

  cardPosition(index: number): string {
    const selected = this.selectedIndex();
    const count = this.items().length;
    if (index === selected) return 'is-active';
    if (index === (selected + count - 1) % count) return 'is-previous';
    if (index === (selected + 1) % count) return 'is-next';
    return 'is-hidden';
  }
}
