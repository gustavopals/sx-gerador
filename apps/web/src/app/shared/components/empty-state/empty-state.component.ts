import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PoButtonModule } from '@po-ui/ng-components';

@Component({
  selector: 'sxg-empty-state',
  imports: [PoButtonModule, RouterLink],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  readonly icon = input('an an-folder-open');
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly actionLabel = input<string | null>(null);
  readonly actionIcon = input('an an-plus');
  readonly actionLink = input<unknown[] | string | null>(null);
  readonly action = output<void>();
}
