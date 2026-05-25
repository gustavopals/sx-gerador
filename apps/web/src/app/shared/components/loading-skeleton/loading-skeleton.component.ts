import { Component, computed, input } from '@angular/core';

export type SxgSkeletonVariant = 'cards' | 'table' | 'detail';

@Component({
  selector: 'sxg-loading-skeleton',
  templateUrl: './loading-skeleton.component.html',
  styleUrl: './loading-skeleton.component.scss',
})
export class LoadingSkeletonComponent {
  readonly variant = input<SxgSkeletonVariant>('cards');
  readonly rows = input(4);
  readonly items = computed(() => Array.from({ length: Math.max(1, this.rows()) }));
}
